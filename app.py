from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import date, timedelta

app = Flask(__name__)
CORS(app)

# ──────────────────────────────────────────────
#  CONSTANTS
# ──────────────────────────────────────────────

MAX_HOURS_PER_SUBJECT_PER_DAY = 2.5  # fatigue cap
CRASH_MODE_THRESHOLD = 3             # days left to trigger crash mode
CRASH_MODE_BOOST = 1.3               # 30% more hours in crash mode

# ──────────────────────────────────────────────
#  HELPER FUNCTIONS
# ──────────────────────────────────────────────

def days_between(start: date, end: date) -> int:
    return (end - start).days


def calculate_priority(difficulty: int, days_left: int) -> float:
    """
    Priority Formula:
    priority = difficulty × (1 / days_left)
    Closer exam + harder subject = higher priority
    """
    if days_left <= 0:
        return 0
    return difficulty * (1 / days_left)


def apply_mood(hours: float, mood: str) -> float:
    """
    Mood-based hour adjustment.
    Tired → 60% of planned
    Normal → 100%
    Focused → 130%
    """
    mood_multipliers = {
        "tired": 0.6,
        "normal": 1.0,
        "focused": 1.3,
    }
    return round(hours * mood_multipliers.get(mood.lower(), 1.0), 2)


def is_crash_mode(days_left: int) -> bool:
    return days_left <= CRASH_MODE_THRESHOLD


# ──────────────────────────────────────────────
#  LEVEL 1 — SMARTER ALGORITHM
# ──────────────────────────────────────────────

def distribute_hours_smart(subjects: list, total_days: int, revision_buffer: int, days_left: int) -> list:
    """
    Smart distribution with:
    - Priority formula (difficulty × 1/days_left)
    - Fatigue cap (max 2.5h per subject per day)
    - Hard subjects first, easy subjects last
    """
    effective_days = max(1, total_days - revision_buffer)

    # Step 1 — Calculate priority for each subject
    for subject in subjects:
        subject["priority"] = calculate_priority(subject["difficulty"], days_left)

    # Step 2 — Total priority weight
    total_priority = sum(s["priority"] for s in subjects)

    result = []
    for subject in subjects:
        if total_priority == 0:
            weight_ratio = 1 / len(subjects)
        else:
            weight_ratio = subject["priority"] / total_priority

        # Raw daily hours based on priority
        raw_daily = weight_ratio * subject["hours_per_day"]

        # Apply fatigue cap
        daily_hours = round(min(raw_daily, MAX_HOURS_PER_SUBJECT_PER_DAY), 2)

        total_hours = round(daily_hours * effective_days, 2)

        result.append({
            **subject,
            "daily_hours": daily_hours,
            "revision_daily_hours": round(daily_hours * 1.2, 2),
            "total_hours": total_hours,
        })

    # Step 3 — Sort: hardest subject first, easiest last
    result.sort(key=lambda x: x["difficulty"], reverse=True)

    return result


def redistribute_missed_hours(missed_hours: float, subject_name: str, days_remaining: int, current_plan: dict) -> dict:
    """
    Adaptive Rescheduling:
    If user missed hours today, spread them across remaining days.
    """
    if days_remaining <= 0 or missed_hours <= 0:
        return current_plan

    extra_per_day = round(missed_hours / days_remaining, 2)
    today = date.today()

    for i in range(1, days_remaining + 1):
        future_day = (today + timedelta(days=i)).isoformat()
        if future_day in current_plan:
            for session in current_plan[future_day]:
                if session["subject"] == subject_name:
                    session["hours"] = round(session["hours"] + extra_per_day, 2)
                    session["rescheduled"] = True

    return current_plan


# ──────────────────────────────────────────────
#  MAIN PLAN GENERATOR
# ──────────────────────────────────────────────

def generate_plan(exams: list, mood: str = "normal") -> dict:
    """
    Generates a full day-by-day study plan for all exams.
    Includes: priority formula, fatigue cap, crash mode, mood adjustment.
    """
    today = date.today()
    plan = {}

    for exam in exams:
        exam_date = date.fromisoformat(exam["date"])
        total_days = days_between(today, exam_date)

        if total_days <= 0:
            continue

        revision_buffer = exam.get("revision_buffer", 2)
        crash = is_crash_mode(total_days)

        distributed = distribute_hours_smart(
            exam["subjects"], total_days, revision_buffer, total_days
        )

        for i in range(total_days):
            current_day = today + timedelta(days=i)
            key = current_day.isoformat()
            is_revision = i >= (total_days - revision_buffer)

            if key not in plan:
                plan[key] = []

            for sub in distributed:
                base_hours = sub["revision_daily_hours"] if is_revision else sub["daily_hours"]

                # Apply crash mode boost
                if crash:
                    base_hours = round(base_hours * CRASH_MODE_BOOST, 2)

                # Apply mood adjustment
                final_hours = apply_mood(base_hours, mood)

                plan[key].append({
                    "subject": sub["name"],
                    "exam": exam["name"],
                    "hours": final_hours,
                    "type": "revision" if is_revision else "study",
                    "color": sub.get("color", "#7c6af7"),
                    "priority": round(sub["priority"], 3),
                    "crash_mode": crash,
                    "mood": mood,
                    "rescheduled": False,
                })

    return dict(sorted(plan.items()))


# ──────────────────────────────────────────────
#  API ROUTES
# ──────────────────────────────────────────────

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Study Planner API v2.0 is running ✅",
        "features": [
            "Priority-based scheduling",
            "Fatigue-aware hour capping",
            "Adaptive rescheduling",
            "Crash mode",
            "Mood-based adjustment"
        ]
    })


@app.route("/generate-plan", methods=["POST"])
def api_generate_plan():
    """
    POST body:
    {
        "mood": "normal",
        "exams": [
            {
                "name": "Math Final",
                "date": "2026-04-15",
                "revision_buffer": 2,
                "subjects": [
                    {
                        "name": "Calculus",
                        "difficulty": 4,
                        "hours_per_day": 2,
                        "color": "#7c6af7"
                    }
                ]
            }
        ]
    }
    """
    data = request.get_json()

    if not data or "exams" not in data:
        return jsonify({"error": "Missing 'exams' in request body"}), 400

    mood = data.get("mood", "normal")
    exams = data["exams"]

    if not isinstance(exams, list) or len(exams) == 0:
        return jsonify({"error": "'exams' must be a non-empty list"}), 400

    plan = generate_plan(exams, mood)

    return jsonify({
        "success": True,
        "mood": mood,
        "total_days_planned": len(plan),
        "plan": plan
    })


@app.route("/reschedule", methods=["POST"])
def api_reschedule():
    """
    Call when user reports missed hours.
    POST body:
    {
        "subject": "Calculus",
        "missed_hours": 1.5,
        "days_remaining": 10,
        "current_plan": { ...existing plan dict... }
    }
    """
    data = request.get_json()

    required = ["subject", "missed_hours", "days_remaining", "current_plan"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    updated_plan = redistribute_missed_hours(
        missed_hours=data["missed_hours"],
        subject_name=data["subject"],
        days_remaining=data["days_remaining"],
        current_plan=data["current_plan"]
    )

    return jsonify({
        "success": True,
        "message": f"Redistributed {data['missed_hours']}h of {data['subject']} across {data['days_remaining']} days",
        "updated_plan": updated_plan
    })


@app.route("/summary", methods=["POST"])
def api_summary():
    """
    Returns total planned hours per subject + priority scores.
    """
    data = request.get_json()

    if not data or "exams" not in data:
        return jsonify({"error": "Missing 'exams'"}), 400

    summary = {}

    for exam in data["exams"]:
        exam_date = date.fromisoformat(exam["date"])
        total_days = days_between(date.today(), exam_date)

        if total_days <= 0:
            continue

        distributed = distribute_hours_smart(
            exam["subjects"], total_days,
            exam.get("revision_buffer", 2), total_days
        )

        for sub in distributed:
            name = sub["name"]
            if name not in summary:
                summary[name] = {"total_hours": 0, "priority": 0}
            summary[name]["total_hours"] += sub["total_hours"]
            summary[name]["priority"] = round(sub["priority"], 3)

    return jsonify({"success": True, "summary": summary})


@app.route("/crash-check", methods=["POST"])
def api_crash_check():
    """
    Check if any exam is in crash mode (3 days or less left).
    POST body: { "exams": [...] }
    """
    data = request.get_json()
    results = []

    for exam in data.get("exams", []):
        exam_date = date.fromisoformat(exam["date"])
        days_left = days_between(date.today(), exam_date)
        results.append({
            "exam": exam["name"],
            "days_left": days_left,
            "crash_mode": is_crash_mode(days_left)
        })

    return jsonify({"success": True, "exams": results})


# ──────────────────────────────────────────────
#  RUN
# ──────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5000)


# ──────────────────────────────────────────────
#  LEVEL 2 — DATA SCIENCE ROUTES
#  (import performance module)
# ──────────────────────────────────────────────

from performance import (
    log_session,
    get_dashboard_data,
    get_subject_analytics,
    get_daily_analytics,
    get_full_recommendations,
    get_streak_info,
    get_weak_subjects,
    calculate_points,
    get_level,
)


@app.route("/log-session", methods=["POST"])
def api_log_session():
    """
    Log a completed study session.
    POST body:
    {
        "subject": "Calculus",
        "exam": "Math Final",
        "planned_hours": 2.0,
        "completed_hours": 1.5,
        "self_rating": 3,
        "session_type": "study",
        "streak": 5
    }
    """
    data = request.get_json()

    required = ["subject", "exam", "planned_hours", "completed_hours", "self_rating"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 400

    session = log_session(
        subject=data["subject"],
        exam=data["exam"],
        planned_hours=data["planned_hours"],
        completed_hours=data["completed_hours"],
        self_rating=data["self_rating"],
    )

    # Calculate points for this session
    streak = get_streak_info()
    points = calculate_points(
        completed_hours=data["completed_hours"],
        planned_hours=data["planned_hours"],
        self_rating=data["self_rating"],
        session_type=data.get("session_type", "study"),
        streak=streak["current"],
    )

    return jsonify({
        "success": True,
        "session_logged": session,
        "points": points,
        "streak": streak,
    })


@app.route("/dashboard", methods=["GET"])
def api_dashboard():
    """
    Returns all dashboard data:
    - Subject analytics
    - 7-day chart data
    - Streak
    - Weak subjects
    - Points + level
    """
    dashboard = get_dashboard_data()
    return jsonify({"success": True, "dashboard": dashboard})


@app.route("/recommend", methods=["POST"])
def api_recommend():
    """
    Get AI-adjusted hour recommendations for today's sessions.
    POST body:
    {
        "sessions": [
            {"subject": "Calculus", "hours": 2.0},
            {"subject": "Algebra", "hours": 1.0}
        ]
    }
    """
    data = request.get_json()

    if not data or "sessions" not in data:
        return jsonify({"error": "Missing 'sessions'"}), 400

    recommendations = get_full_recommendations(data["sessions"])

    return jsonify({
        "success": True,
        "recommendations": recommendations
    })


@app.route("/analytics", methods=["GET"])
def api_analytics():
    """Returns subject-wise performance analytics."""
    subject = request.args.get("subject", None)
    analytics = get_subject_analytics(subject)
    return jsonify({"success": True, "analytics": analytics})


@app.route("/weak-subjects", methods=["GET"])
def api_weak_subjects():
    """Returns subjects flagged as weak areas."""
    weak = get_weak_subjects()
    return jsonify({"success": True, "weak_subjects": weak})

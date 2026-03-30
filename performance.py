import json
import os
from datetime import date, timedelta
from collections import defaultdict

# ──────────────────────────────────────────────
#  STORAGE — Simple JSON file as our database
#  (will upgrade to SQLite/Supabase later)
# ──────────────────────────────────────────────

DATA_FILE = "performance_data.json"


def load_data() -> dict:
    """Load all performance data from file."""
    if not os.path.exists(DATA_FILE):
        return {"sessions": [], "subject_weights": {}, "streaks": {}}
    with open(DATA_FILE, "r") as f:
        return json.load(f)


def save_data(data: dict):
    """Save all performance data to file."""
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


# ──────────────────────────────────────────────
#  PERFORMANCE TRACKER
# ──────────────────────────────────────────────

def log_session(subject: str, exam: str, planned_hours: float, completed_hours: float, self_rating: int):
    """
    Log a completed study session.

    Parameters:
    - subject: subject name
    - exam: exam name
    - planned_hours: what was planned
    - completed_hours: what user actually did
    - self_rating: user rates themselves 1-5
    """
    data = load_data()

    session = {
        "date": date.today().isoformat(),
        "subject": subject,
        "exam": exam,
        "planned_hours": planned_hours,
        "completed_hours": completed_hours,
        "self_rating": self_rating,
        "completion_rate": round(completed_hours / planned_hours, 2) if planned_hours > 0 else 0,
    }

    data["sessions"].append(session)

    # Update streak
    _update_streak(data, completed_hours)

    # Update adaptive weights based on performance
    _update_subject_weight(data, subject, session["completion_rate"], self_rating)

    save_data(data)
    return session


def _update_streak(data: dict, completed_hours: float):
    """Update study streak based on today's completion."""
    today = date.today().isoformat()
    yesterday = (date.today() - timedelta(days=1)).isoformat()

    streaks = data.get("streaks", {})
    current_streak = streaks.get("current", 0)
    last_study_date = streaks.get("last_study_date", "")

    if completed_hours > 0:
        if last_study_date == yesterday:
            current_streak += 1
        elif last_study_date != today:
            current_streak = 1

        streaks["current"] = current_streak
        streaks["last_study_date"] = today
        streaks["best"] = max(streaks.get("best", 0), current_streak)
    else:
        # Missed today — reset streak
        if last_study_date != today:
            streaks["current"] = 0

    data["streaks"] = streaks


def _update_subject_weight(data: dict, subject: str, completion_rate: float, self_rating: int):
    """
    Adaptive Weight Update:
    - If completion_rate < 0.6 → subject is hard → increase weight by 20%
    - If self_rating < 3 → weak area → flag and increase weight
    - If doing well → slightly reduce weight (no need to over-study)
    """
    weights = data.get("subject_weights", {})

    if subject not in weights:
        weights[subject] = {
            "multiplier": 1.0,
            "weak_area": False,
            "sessions_count": 0,
            "avg_completion": 1.0,
            "avg_rating": 3.0,
        }

    w = weights[subject]
    w["sessions_count"] += 1

    # Rolling average
    n = w["sessions_count"]
    w["avg_completion"] = round(((w["avg_completion"] * (n - 1)) + completion_rate) / n, 2)
    w["avg_rating"] = round(((w["avg_rating"] * (n - 1)) + self_rating) / n, 2)

    # Adjust multiplier
    if completion_rate < 0.6 or self_rating < 3:
        # Struggling → increase hours by 20%
        w["multiplier"] = min(2.0, round(w["multiplier"] * 1.2, 2))
        w["weak_area"] = True
    elif completion_rate >= 0.9 and self_rating >= 4:
        # Doing great → slightly reduce
        w["multiplier"] = max(0.8, round(w["multiplier"] * 0.95, 2))
        w["weak_area"] = False

    weights[subject] = w
    data["subject_weights"] = weights


# ──────────────────────────────────────────────
#  ANALYTICS
# ──────────────────────────────────────────────

def get_subject_analytics(subject: str = None) -> dict:
    """
    Returns performance analytics per subject.
    If subject is None, returns all subjects.
    """
    data = load_data()
    sessions = data.get("sessions", [])

    # Group sessions by subject
    subject_data = defaultdict(list)
    for s in sessions:
        subject_data[s["subject"]].append(s)

    if subject:
        subject_data = {subject: subject_data.get(subject, [])}

    analytics = {}
    for subj, sessions_list in subject_data.items():
        if not sessions_list:
            continue

        total_planned = sum(s["planned_hours"] for s in sessions_list)
        total_completed = sum(s["completed_hours"] for s in sessions_list)
        avg_completion = round(total_completed / total_planned, 2) if total_planned > 0 else 0
        avg_rating = round(sum(s["self_rating"] for s in sessions_list) / len(sessions_list), 1)

        analytics[subj] = {
            "total_planned_hours": round(total_planned, 2),
            "total_completed_hours": round(total_completed, 2),
            "avg_completion_rate": avg_completion,
            "avg_self_rating": avg_rating,
            "sessions_count": len(sessions_list),
            "weak_area": data["subject_weights"].get(subj, {}).get("weak_area", False),
            "weight_multiplier": data["subject_weights"].get(subj, {}).get("multiplier", 1.0),
        }

    return analytics


def get_daily_analytics(days: int = 7) -> list:
    """
    Returns day-by-day planned vs completed hours for the last N days.
    Used for line chart in dashboard.
    """
    data = load_data()
    sessions = data.get("sessions", [])

    today = date.today()
    result = []

    for i in range(days - 1, -1, -1):
        day = (today - timedelta(days=i)).isoformat()
        day_sessions = [s for s in sessions if s["date"] == day]

        planned = round(sum(s["planned_hours"] for s in day_sessions), 2)
        completed = round(sum(s["completed_hours"] for s in day_sessions), 2)

        result.append({
            "date": day,
            "planned": planned,
            "completed": completed,
            "completion_rate": round(completed / planned, 2) if planned > 0 else 0,
        })

    return result


def get_streak_info() -> dict:
    """Returns current and best streak."""
    data = load_data()
    return data.get("streaks", {"current": 0, "best": 0, "last_study_date": ""})


def get_weak_subjects() -> list:
    """Returns list of subjects flagged as weak areas."""
    data = load_data()
    weights = data.get("subject_weights", {})
    return [subj for subj, info in weights.items() if info.get("weak_area", False)]


# ──────────────────────────────────────────────
#  ML RECOMMENDATION (Rule-based → upgradeable to ML)
# ──────────────────────────────────────────────

def recommend_daily_hours(subject: str, originally_planned: float) -> dict:
    """
    Recommends adjusted hours for today based on:
    - User's past consistency (avg completion rate)
    - Subject weight multiplier (struggling → more hours)
    - Recent 7-day average

    This is rule-based now — easily upgradeable to
    LinearRegression once we have enough data points.
    """
    data = load_data()
    sessions = data.get("sessions", [])
    weights = data.get("subject_weights", {})

    # Filter sessions for this subject
    subject_sessions = [s for s in sessions if s["subject"] == subject]

    if not subject_sessions:
        # No history — return original plan
        return {
            "subject": subject,
            "originally_planned": originally_planned,
            "recommended_hours": originally_planned,
            "reason": "No history yet — using original plan",
            "confidence": "low",
        }

    # Last 7 days average completed hours
    today = date.today()
    recent = [
        s for s in subject_sessions
        if (today - date.fromisoformat(s["date"])).days <= 7
    ]

    avg_completed = (
        sum(s["completed_hours"] for s in recent) / len(recent)
        if recent else originally_planned
    )

    avg_completion_rate = (
        sum(s["completion_rate"] for s in recent) / len(recent)
        if recent else 1.0
    )

    # Get adaptive weight multiplier
    multiplier = weights.get(subject, {}).get("multiplier", 1.0)
    weak_area = weights.get(subject, {}).get("weak_area", False)

    # Recommendation logic
    if avg_completion_rate < 0.6:
        # User consistently not finishing — reduce to what they can handle
        recommended = round(avg_completed * multiplier, 2)
        reason = f"You've been completing ~{int(avg_completion_rate*100)}% — adjusted to a reachable target"
        confidence = "high"
    elif weak_area:
        # Weak subject — push a bit more
        recommended = round(originally_planned * multiplier, 2)
        reason = f"Weak area detected — increased hours to build strength"
        confidence = "high"
    elif avg_completion_rate >= 0.9:
        # Consistent — can handle original or slightly more
        recommended = round(originally_planned * 1.05, 2)
        reason = "Great consistency! Slightly increased target"
        confidence = "medium"
    else:
        recommended = originally_planned
        reason = "On track — keeping original plan"
        confidence = "medium"

    # Never recommend more than 4 hours per subject per day
    recommended = min(recommended, 4.0)

    return {
        "subject": subject,
        "originally_planned": originally_planned,
        "recommended_hours": recommended,
        "avg_completion_rate_7d": round(avg_completion_rate, 2),
        "weak_area": weak_area,
        "weight_multiplier": multiplier,
        "reason": reason,
        "confidence": confidence,
    }


def get_full_recommendations(plan_today: list) -> list:
    """
    Takes today's plan sessions and returns
    AI-adjusted recommendations for each session.
    """
    recommendations = []
    for session in plan_today:
        rec = recommend_daily_hours(session["subject"], session["hours"])
        recommendations.append(rec)
    return recommendations


# ──────────────────────────────────────────────
#  GAMIFICATION
# ──────────────────────────────────────────────

POINTS_CONFIG = {
    "complete_session": 10,
    "streak_7_days": 50,
    "finish_revision_day": 20,
    "perfect_rating": 15,
}

LEVELS = [
    (0, 100, "Beginner 📚"),
    (101, 300, "Consistent 💪"),
    (301, 600, "Dedicated 🔥"),
    (601, float("inf"), "Study Master 🏆"),
]


def calculate_points(completed_hours: float, planned_hours: float, self_rating: int, session_type: str, streak: int) -> dict:
    """Calculate points earned for a session."""
    points = 0
    breakdown = []

    # Base points for completing session
    if completed_hours >= planned_hours * 0.8:
        points += POINTS_CONFIG["complete_session"]
        breakdown.append(f"+{POINTS_CONFIG['complete_session']} session completed")

    # Bonus for revision day
    if session_type == "revision":
        points += POINTS_CONFIG["finish_revision_day"]
        breakdown.append(f"+{POINTS_CONFIG['finish_revision_day']} revision day")

    # Bonus for perfect rating
    if self_rating == 5:
        points += POINTS_CONFIG["perfect_rating"]
        breakdown.append(f"+{POINTS_CONFIG['perfect_rating']} perfect rating")

    # Streak bonus
    if streak > 0 and streak % 7 == 0:
        points += POINTS_CONFIG["streak_7_days"]
        breakdown.append(f"+{POINTS_CONFIG['streak_7_days']} 7-day streak bonus!")

    return {"points_earned": points, "breakdown": breakdown}


def get_level(total_points: int) -> str:
    """Return user's current level based on total points."""
    for min_pts, max_pts, level_name in LEVELS:
        if min_pts <= total_points <= max_pts:
            return level_name
    return "Study Master 🏆"


# ──────────────────────────────────────────────
#  FULL DASHBOARD DATA
# ──────────────────────────────────────────────

def get_dashboard_data() -> dict:
    """
    Returns everything needed for the dashboard:
    - Subject analytics
    - Daily chart data (7 days)
    - Streak info
    - Weak subjects
    - Total points + level
    """
    data = load_data()
    sessions = data.get("sessions", [])

    total_points = sum(s.get("points_earned", 0) for s in sessions)
    streak = get_streak_info()

    return {
        "subject_analytics": get_subject_analytics(),
        "daily_chart": get_daily_analytics(7),
        "streak": streak,
        "weak_subjects": get_weak_subjects(),
        "total_points": total_points,
        "level": get_level(total_points),
        "total_sessions": len(sessions),
        "total_completed_hours": round(sum(s["completed_hours"] for s in sessions), 2),
    }

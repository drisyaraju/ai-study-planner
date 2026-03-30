import { useState, useEffect } from "react";

const COLORS = {
  bg: "#0d0d14",
  surface: "#13101f",
  card: "#1a1428",
  border: "#2d1f45",
  accent: "#c084fc",
  accentHover: "#d8b4fe",
  pink: "#f472b6",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
  text: "#f0e8ff",
  muted: "#9d7ec0",
  gradientA: "#c084fc",
  gradientB: "#f472b6",
};

const MOTIVATIONAL_QUOTES = [
  "The secret of getting ahead is getting started. 🚀",
  "Small steps every day lead to big results. 💪",
  "You don't have to be great to start, but you have to start to be great. ✨",
  "Study hard in silence, let success make the noise. 🔥",
  "Every expert was once a beginner. Keep going! 🌟",
];

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function daysBetween(d1, d2) {
  return Math.ceil((new Date(d2) - new Date(d1)) / 86400000);
}

function distributeHours(subjects, totalDays, revisionBuffer) {
  const effectiveDays = Math.max(1, totalDays - revisionBuffer);
  const totalWeight = subjects.reduce((s, sub) => s + sub.difficulty, 0);
  return subjects.map((sub) => ({
    ...sub,
    dailyHours: Math.max(0.5, ((sub.difficulty / totalWeight) * sub.hoursPerDay * effectiveDays) / effectiveDays),
    totalHours: Math.round((sub.difficulty / totalWeight) * sub.hoursPerDay * effectiveDays * 10) / 10,
  }));
}

function generatePlan(exams) {
  const today = getTodayStr();
  const plan = {};
  exams.forEach((exam) => {
    const days = daysBetween(today, exam.date);
    if (days <= 0) return;
    const distributed = distributeHours(exam.subjects, days, exam.revisionBuffer);
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      if (!plan[key]) plan[key] = [];
      const isRevision = i >= days - exam.revisionBuffer;
      distributed.forEach((sub) => {
        plan[key].push({
          subject: sub.name,
          exam: exam.name,
          hours: isRevision ? sub.dailyHours * 1.2 : sub.dailyHours,
          type: isRevision ? "revision" : "study",
          color: sub.color,
        });
      });
    }
  });
  return Object.fromEntries(Object.entries(plan).sort(([a], [b]) => a.localeCompare(b)));
}

const SUBJECT_COLORS = ["#c084fc", "#f472b6", "#fb923c", "#34d399", "#38bdf8", "#facc15", "#a78bfa", "#f87171"];

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
}

function loadFromStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) { return fallback; }
}

// ── PLAN VIEWER (shared between current and past plans) ──
function PlanViewer({ plan, label }) {
  const [selectedDay, setSelectedDay] = useState(() => {
    const today = getTodayStr();
    const days = Object.keys(plan);
    return days.includes(today) ? today : days[0] || null;
  });

  const planDays = Object.keys(plan);
  const selectedTasks = selectedDay ? plan[selectedDay] || [] : [];
  const totalHoursDay = selectedTasks.reduce((s, t) => s + t.hours, 0).toFixed(1);

  if (planDays.length === 0) {
    return (
      <div style={{ color: COLORS.muted, textAlign: "center", padding: 40, fontSize: 13 }}>
        No sessions in this plan.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "calc(100vh - 130px)" }}>
      {/* Sidebar */}
      <div style={{ width: 200, borderRight: `1px solid ${COLORS.border}`, padding: 16, overflowY: "auto", flexShrink: 0, background: "#0f0b1a" }}>
        <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 12, letterSpacing: 1 }}>SCHEDULE</div>
        {planDays.map((day) => {
          const d = new Date(day + "T00:00:00");
          const isToday = day === getTodayStr();
          const hrs = (plan[day] || []).reduce((s, t) => s + t.hours, 0).toFixed(1);
          return (
            <button key={day}
              className={`day-btn ${selectedDay === day ? "active" : ""} ${isToday ? "today" : ""}`}
              onClick={() => setSelectedDay(day)}>
              <div style={{ fontWeight: 500 }}>{d.toLocaleDateString("en", { month: "short", day: "numeric" })}</div>
              <div style={{ fontSize: 10, opacity: 0.7 }}>{hrs}h · {(plan[day] || []).length} sessions</div>
              {isToday && <div style={{ fontSize: 9, color: COLORS.green, marginTop: 2 }}>TODAY</div>}
            </button>
          );
        })}
      </div>

      {/* Day Detail */}
      <div style={{ flex: 1, padding: "28px 36px", overflowY: "auto" }}>
        {selectedDay && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
              <div>
                <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontStyle: "italic", background: `linear-gradient(135deg, ${COLORS.gradientA}, ${COLORS.gradientB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {new Date(selectedDay + "T00:00:00").toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}
                </h2>
                <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>{totalHoursDay} total hours · {selectedTasks.length} sessions planned</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 32, fontWeight: 700, background: `linear-gradient(135deg, ${COLORS.gradientA}, ${COLORS.gradientB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  {totalHoursDay}
                </div>
                <div style={{ fontSize: 10, color: COLORS.muted }}>HOURS</div>
              </div>
            </div>

            {selectedTasks.length === 0 && <div style={{ color: COLORS.muted, fontSize: 13 }}>No sessions for this day.</div>}

            {selectedTasks.map((task, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 14 }} className="fade-in">
                <div style={{ width: 3, background: task.color, borderRadius: 2, alignSelf: "stretch", flexShrink: 0 }} />
                <div style={{ flex: 1, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "14px 18px", transition: "border-color 0.2s, transform 0.2s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = task.color; e.currentTarget.style.transform = "translateX(4px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.transform = "translateX(0)"; }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{task.subject}</div>
                      <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 3 }}>for: {task.exam}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: task.color }}>{task.hours.toFixed(1)}h</div>
                      <span className="tag" style={{
                        background: task.type === "revision" ? COLORS.amber + "22" : COLORS.accent + "22",
                        color: task.type === "revision" ? COLORS.amber : COLORS.accent,
                        border: `1px solid ${task.type === "revision" ? COLORS.amber : COLORS.accent}44`,
                        marginTop: 4, display: "block",
                      }}>{task.type}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, height: 3, background: COLORS.border, borderRadius: 2 }}>
                    <div style={{ height: "100%", width: `${Math.min(100, (task.hours / 4) * 100)}%`, background: task.color, borderRadius: 2, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export default function StudyPlanner() {
  const [view, setView] = useState("setup"); // setup | plan | history
  const [exams, setExams] = useState(() => loadFromStorage("sp_exams", []));
  const [plan, setPlan] = useState(() => loadFromStorage("sp_plan", {}));
  const [pastPlans, setPastPlans] = useState(() => loadFromStorage("sp_past_plans", []));
  const [selectedPast, setSelectedPast] = useState(null);
  const [newExam, setNewExam] = useState({ name: "", date: "", revisionBuffer: 2 });
  const [addingExam, setAddingExam] = useState(false);
  const [quote] = useState(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => { saveToStorage("sp_exams", exams); }, [exams]);
  useEffect(() => { saveToStorage("sp_plan", plan); }, [plan]);
  useEffect(() => { saveToStorage("sp_past_plans", pastPlans); }, [pastPlans]);

  const handleGeneratePlan = () => {
    const newPlan = generatePlan(exams);
    setPlan(newPlan);

    // Save snapshot to past plans
    const snapshot = {
      id: Date.now(),
      createdAt: new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
      exams: exams.map(e => e.name),
      totalDays: Object.keys(newPlan).length,
      plan: newPlan,
    };
    setPastPlans(prev => [snapshot, ...prev].slice(0, 20)); // keep last 20

    setView("plan");
    setSavedMsg("✓ Plan saved!");
    setTimeout(() => setSavedMsg(""), 2500);
  };

  const deletePastPlan = (id) => {
    setPastPlans(prev => prev.filter(p => p.id !== id));
    if (selectedPast?.id === id) setSelectedPast(null);
  };

  const clearAll = () => {
    if (window.confirm("Clear all exams, plans and history? This cannot be undone.")) {
      setExams([]); setPlan({}); setPastPlans([]); setSelectedPast(null);
      localStorage.removeItem("sp_exams");
      localStorage.removeItem("sp_plan");
      localStorage.removeItem("sp_past_plans");
      setView("setup");
    }
  };

  const addSubjectToExam = (examId) => {
    setExams(prev => prev.map(e => e.id === examId ? {
      ...e, subjects: [...e.subjects, { name: "", difficulty: 3, hoursPerDay: 1, color: SUBJECT_COLORS[e.subjects.length % SUBJECT_COLORS.length] }]
    } : e));
  };

  const updateSubject = (examId, idx, field, val) => {
    setExams(prev => prev.map(e => e.id === examId ? {
      ...e, subjects: e.subjects.map((s, i) => i === idx ? { ...s, [field]: field === "name" ? val : Number(val) } : s)
    } : e));
  };

  const removeSubject = (examId, idx) => {
    setExams(prev => prev.map(e => e.id === examId ? { ...e, subjects: e.subjects.filter((_, i) => i !== idx) } : e));
  };

  const updateExam = (id, field, val) => {
    setExams(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  const removeExam = (id) => setExams(prev => prev.filter(e => e.id !== id));

  const confirmAddExam = () => {
    if (!newExam.name || !newExam.date) return;
    setExams(prev => [...prev, { id: Date.now(), ...newExam, revisionBuffer: Number(newExam.revisionBuffer), subjects: [] }]);
    setNewExam({ name: "", date: "", revisionBuffer: 2 });
    setAddingExam(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, color: COLORS.text, fontFamily: "'DM Mono', 'Courier New', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 2px; }
        .btn { cursor: pointer; border: none; border-radius: 8px; font-family: inherit; font-size: 12px; transition: all 0.2s; }
        .btn-primary { background: linear-gradient(135deg, ${COLORS.gradientA}, ${COLORS.gradientB}); color: white; padding: 8px 18px; font-weight: 600; }
        .btn-primary:hover { opacity: 0.88; transform: translateY(-1px); }
        .btn-ghost { background: transparent; color: ${COLORS.muted}; padding: 6px 12px; border: 1px solid ${COLORS.border}; border-radius: 8px; cursor: pointer; font-family: inherit; font-size: 12px; transition: all 0.15s; }
        .btn-ghost:hover { border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
        .btn-danger { background: transparent; color: ${COLORS.red}; padding: 4px 8px; border: 1px solid transparent; border-radius: 6px; cursor: pointer; font-family: inherit; font-size: 12px; }
        .btn-danger:hover { border-color: ${COLORS.red}; }
        input { background: ${COLORS.surface}; border: 1px solid ${COLORS.border}; color: ${COLORS.text}; border-radius: 8px; padding: 7px 10px; font-family: inherit; font-size: 12px; outline: none; transition: border-color 0.15s; }
        input:focus { border-color: ${COLORS.accent}; }
        input::placeholder { color: ${COLORS.muted}; }
        .day-btn { cursor: pointer; padding: 8px 10px; border-radius: 8px; background: transparent; border: 1px solid ${COLORS.border}; font-family: inherit; font-size: 11px; color: ${COLORS.muted}; transition: all 0.15s; text-align: left; width: 100%; margin-bottom: 6px; }
        .day-btn:hover { border-color: ${COLORS.accent}; color: ${COLORS.text}; }
        .day-btn.active { background: linear-gradient(135deg, ${COLORS.gradientA}22, ${COLORS.gradientB}22); border-color: ${COLORS.accent}; color: ${COLORS.accent}; }
        .day-btn.today { border-color: ${COLORS.green}; }
        .tag { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 10px; font-weight: 600; }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .quote-box { background: linear-gradient(135deg, ${COLORS.gradientA}18, ${COLORS.gradientB}10); border: 1px solid ${COLORS.gradientA}44; border-radius: 12px; padding: 14px 20px; margin-bottom: 24px; font-size: 13px; color: ${COLORS.accentHover}; font-style: italic; }
        .nav-btn { cursor: pointer; padding: 7px 16px; border-radius: 8px; font-family: inherit; font-size: 11px; letter-spacing: 0.5px; border: 1px solid transparent; transition: all 0.15s; background: transparent; }
        .nav-btn.active { background: ${COLORS.accent}22; border-color: ${COLORS.accent}44; color: ${COLORS.accent}; }
        .nav-btn:not(.active) { color: ${COLORS.muted}; }
        .nav-btn:not(.active):hover { color: ${COLORS.text}; border-color: ${COLORS.border}; }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${COLORS.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f0b1a" }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 700, background: `linear-gradient(135deg, ${COLORS.gradientA}, ${COLORS.gradientB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            study_planner
          </h1>
          <p style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>AI-based time-distribution algorithm</p>
        </div>

        {/* Nav tabs */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {savedMsg && <span style={{ fontSize: 11, color: COLORS.green, marginRight: 8 }}>{savedMsg}</span>}
          <button className={`nav-btn ${view === "setup" ? "active" : ""}`} onClick={() => setView("setup")}>SETUP</button>
          <button className={`nav-btn ${view === "plan" ? "active" : ""}`} onClick={() => setView("plan")}>CURRENT PLAN</button>
          <button className={`nav-btn ${view === "history" ? "active" : ""}`} onClick={() => { setView("history"); setSelectedPast(null); }}>
            PAST PLANS {pastPlans.length > 0 && <span style={{ background: COLORS.accent, color: "white", borderRadius: 20, padding: "1px 7px", fontSize: 9, marginLeft: 4 }}>{pastPlans.length}</span>}
          </button>
          <button className="btn btn-primary" onClick={handleGeneratePlan} style={{ marginLeft: 8 }}>GENERATE & SAVE →</button>
          <button className="btn-danger" onClick={clearAll} title="Clear all data" style={{ fontSize: 16 }}>🗑</button>
        </div>
      </div>

      {/* SETUP VIEW */}
      {view === "setup" && (
        <div style={{ maxWidth: 800, margin: "32px auto", padding: "0 24px" }} className="fade-in">
          <div className="quote-box">✨ {quote}</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontStyle: "italic" }}>Your Exams</h2>
            <button className="btn-ghost" onClick={() => setAddingExam(true)}>+ Add Exam</button>
          </div>

          {addingExam && (
            <div style={{ background: COLORS.card, border: `1px solid ${COLORS.accent}55`, borderRadius: 12, padding: 18, marginBottom: 16 }} className="fade-in">
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, letterSpacing: 1 }}>EXAM NAME</div>
                  <input placeholder="e.g. Physics Final" value={newExam.name} onChange={(e) => setNewExam({ ...newExam, name: e.target.value })} style={{ width: 200 }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, letterSpacing: 1 }}>EXAM DATE</div>
                  <input type="date" value={newExam.date} onChange={(e) => setNewExam({ ...newExam, date: e.target.value })} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 4, letterSpacing: 1 }}>REVISION BUFFER (days)</div>
                  <input type="number" min={0} max={7} value={newExam.revisionBuffer} onChange={(e) => setNewExam({ ...newExam, revisionBuffer: e.target.value })} style={{ width: 80 }} />
                </div>
                <button className="btn btn-primary" onClick={confirmAddExam}>Add</button>
                <button className="btn-ghost" onClick={() => setAddingExam(false)}>Cancel</button>
              </div>
            </div>
          )}

          {exams.length === 0 && (
            <div style={{ color: COLORS.muted, textAlign: "center", padding: 56, fontSize: 13, border: `1px dashed ${COLORS.border}`, borderRadius: 14 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
              No exams added yet.<br />
              <span style={{ fontSize: 11 }}>Click "+ Add Exam" to get started.</span>
            </div>
          )}

          {exams.map((exam) => {
            const daysLeft = daysBetween(getTodayStr(), exam.date);
            return (
              <div key={exam.id} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 20, marginBottom: 14 }} className="fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <input value={exam.name} onChange={(e) => updateExam(exam.id, "name", e.target.value)} style={{ fontSize: 14, fontWeight: 500, width: 220 }} placeholder="Exam name" />
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: COLORS.muted }}>DATE</span>
                      <input type="date" value={exam.date} onChange={(e) => updateExam(exam.id, "date", e.target.value)} />
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 10, color: COLORS.muted }}>BUFFER</span>
                      <input type="number" min={0} max={7} value={exam.revisionBuffer} onChange={(e) => updateExam(exam.id, "revisionBuffer", Number(e.target.value))} style={{ width: 60 }} />
                    </div>
                    <span className="tag" style={{ background: daysLeft > 7 ? COLORS.green + "22" : COLORS.red + "22", color: daysLeft > 7 ? COLORS.green : COLORS.red, border: `1px solid ${daysLeft > 7 ? COLORS.green : COLORS.red}44` }}>
                      {daysLeft > 0 ? `${daysLeft}d left` : "PAST"}
                    </span>
                  </div>
                  <button className="btn-danger" onClick={() => removeExam(exam.id)}>✕</button>
                </div>
                <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 10, letterSpacing: 1 }}>SUBJECTS</div>
                  {exam.subjects.map((sub, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: sub.color, flexShrink: 0 }} />
                      <input placeholder="Subject name..." value={sub.name} onChange={(e) => updateSubject(exam.id, idx, "name", e.target.value)} style={{ width: 170 }} />
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: COLORS.muted }}>DIFFICULTY</span>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button key={n} onClick={() => updateSubject(exam.id, idx, "difficulty", n)}
                            style={{ width: 22, height: 22, borderRadius: 5, border: "none", cursor: "pointer", fontSize: 9, background: n <= sub.difficulty ? `linear-gradient(135deg, ${COLORS.gradientA}, ${COLORS.gradientB})` : COLORS.border, color: "white", transition: "all 0.15s" }}>{n}</button>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 10, color: COLORS.muted }}>HRS/DAY</span>
                        <input type="number" min={0.5} max={8} step={0.5} value={sub.hoursPerDay} onChange={(e) => updateSubject(exam.id, idx, "hoursPerDay", e.target.value)} style={{ width: 65 }} />
                      </div>
                      <button className="btn-danger" onClick={() => removeSubject(exam.id, idx)}>✕</button>
                    </div>
                  ))}
                  <button className="btn-ghost" onClick={() => addSubjectToExam(exam.id)} style={{ marginTop: 4, fontSize: 11 }}>+ Add Subject</button>
                </div>
              </div>
            );
          })}

          {exams.length > 0 && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button className="btn btn-primary" onClick={handleGeneratePlan} style={{ padding: "12px 32px", fontSize: 13 }}>
                GENERATE & SAVE PLAN →
              </button>
            </div>
          )}
        </div>
      )}

      {/* CURRENT PLAN VIEW */}
      {view === "plan" && (
        <div className="fade-in">
          {Object.keys(plan).length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.muted }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
              <div style={{ fontSize: 14, color: COLORS.text, marginBottom: 8 }}>No plan generated yet!</div>
              <div style={{ fontSize: 12 }}>Go to Setup, add your exams and click "GENERATE & SAVE PLAN".</div>
            </div>
          ) : (
            <PlanViewer plan={plan} label="Current Plan" />
          )}
        </div>
      )}

      {/* PAST PLANS VIEW */}
      {view === "history" && (
        <div style={{ display: "flex", height: "calc(100vh - 65px)" }} className="fade-in">

          {/* Past plans list */}
          <div style={{ width: 260, borderRight: `1px solid ${COLORS.border}`, padding: 16, overflowY: "auto", flexShrink: 0, background: "#0f0b1a" }}>
            <div style={{ fontSize: 10, color: COLORS.muted, marginBottom: 14, letterSpacing: 1 }}>PAST TIMETABLES</div>

            {pastPlans.length === 0 ? (
              <div style={{ fontSize: 11, color: COLORS.muted, textAlign: "center", marginTop: 20 }}>
                No past plans yet.<br />Generate a plan to save it here!
              </div>
            ) : (
              pastPlans.map((p) => (
                <div key={p.id}
                  onClick={() => setSelectedPast(p)}
                  style={{
                    padding: "12px 14px", borderRadius: 10, marginBottom: 8, cursor: "pointer",
                    background: selectedPast?.id === p.id ? COLORS.accent + "18" : COLORS.card,
                    border: `1px solid ${selectedPast?.id === p.id ? COLORS.accent : COLORS.border}`,
                    transition: "all 0.15s",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text, marginBottom: 4 }}>
                        {p.exams.join(", ").slice(0, 28)}{p.exams.join(", ").length > 28 ? "…" : ""}
                      </div>
                      <div style={{ fontSize: 10, color: COLORS.muted }}>{p.createdAt}</div>
                      <div style={{ fontSize: 10, color: COLORS.accent, marginTop: 3 }}>{p.totalDays} days planned</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deletePastPlan(p.id); }}
                      style={{ background: "transparent", border: "none", color: COLORS.red, cursor: "pointer", fontSize: 12, padding: "2px 4px" }}>✕</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Selected past plan viewer */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {!selectedPast ? (
              <div style={{ textAlign: "center", padding: 80, color: COLORS.muted }}>
                <div style={{ fontSize: 40, marginBottom: 16 }}>📂</div>
                <div style={{ fontSize: 14, color: COLORS.text, marginBottom: 8 }}>Select a past timetable</div>
                <div style={{ fontSize: 12 }}>Click any plan on the left to view it.</div>
              </div>
            ) : (
              <div>
                <div style={{ padding: "16px 28px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", gap: 12, background: "#0f0b1a" }}>
                  <div style={{ fontSize: 18, }}>📂</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedPast.exams.join(", ")}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>Generated on {selectedPast.createdAt} · {selectedPast.totalDays} days</div>
                  </div>
                </div>
                <PlanViewer plan={selectedPast.plan} label={selectedPast.createdAt} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
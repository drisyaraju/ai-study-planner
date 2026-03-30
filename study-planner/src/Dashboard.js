import { useState } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const C = {
  bg: "#0d0d14",
  surface: "#13101f",
  card: "#1a1428",
  border: "#2d1f45",
  accent: "#c084fc",
  pink: "#f472b6",
  green: "#34d399",
  amber: "#fbbf24",
  red: "#f87171",
  blue: "#38bdf8",
  text: "#f0e8ff",
  muted: "#9d7ec0",
  gradientA: "#c084fc",
  gradientB: "#f472b6",
};

const SUBJECT_COLORS = ["#c084fc", "#f472b6", "#fb923c", "#34d399", "#38bdf8", "#facc15"];

const EMPTY_DASHBOARD = {
  streak: { current: 0, best: 0 },
  total_points: 0,
  level: "Beginner 📚",
  total_sessions: 0,
  total_completed_hours: 0,
  weak_subjects: [],
  subject_analytics: {},
  daily_chart: [],
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
      <div style={{ color: C.muted, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: <strong>{p.value}h</strong></div>
      ))}
    </div>
  );
};

const StatCard = ({ label, value, sub, color, icon }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "18px 20px", flex: 1, minWidth: 130, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: -10, right: -10, fontSize: 48, opacity: 0.06 }}>{icon}</div>
    <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 8 }}>{label}</div>
    <div style={{ fontSize: 26, fontWeight: 700, color: color || C.text, fontFamily: "'Fraunces', serif" }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{sub}</div>}
  </div>
);

const ProgressBar = ({ value, color, height = 6 }) => (
  <div style={{ background: C.border, borderRadius: 99, height, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, value * 100)}%`, height: "100%", background: color, borderRadius: 99, transition: "width 1s ease" }} />
  </div>
);

const LogSessionModal = ({ onClose, onLog }) => {
  const [form, setForm] = useState({ subject: "", exam: "", planned_hours: 2, completed_hours: 2, self_rating: 3, session_type: "study" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000b", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, width: 420, boxShadow: "0 20px 60px #0008" }}>
        <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 18, marginBottom: 20, background: `linear-gradient(135deg, ${C.gradientA}, ${C.gradientB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Log Today's Session
        </h3>
        {[["Subject", "subject"], ["Exam", "exam"]].map(([label, key]) => (
          <div key={key} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 5, letterSpacing: 1 }}>{label.toUpperCase()}</div>
            <input value={form[key]} onChange={e => set(key, e.target.value)} placeholder={`Enter ${label.toLowerCase()}...`}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontSize: 13, outline: "none" }} />
          </div>
        ))}
        <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
          {[["Planned (hrs)", "planned_hours"], ["Completed (hrs)", "completed_hours"]].map(([label, key]) => (
            <div key={key} style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.muted, marginBottom: 5, letterSpacing: 1 }}>{label.toUpperCase()}</div>
              <input type="number" min={0} max={12} step={0.5} value={form[key]} onChange={e => set(key, Number(e.target.value))}
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, color: C.text, borderRadius: 8, padding: "8px 12px", fontFamily: "inherit", fontSize: 13, outline: "none" }} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: C.muted, marginBottom: 8, letterSpacing: 1 }}>SELF RATING</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => set("self_rating", n)}
                style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: n <= form.self_rating ? `linear-gradient(135deg, ${C.gradientA}, ${C.gradientB})` : C.border,
                  color: "white", transition: "all 0.15s" }}>{n}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>Cancel</button>
          <button onClick={() => { onLog(form); onClose(); }}
            style={{ flex: 2, padding: "10px 0", borderRadius: 8, border: "none", background: `linear-gradient(135deg, ${C.gradientA}, ${C.gradientB})`, color: "white", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>
            Log Session ✓
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [showLog, setShowLog] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sessions, setSessions] = useState([]); // ← starts empty

  // Build dashboard data from logged sessions
  const buildDashboard = () => {
    if (sessions.length === 0) return EMPTY_DASHBOARD;

    // Subject analytics
    const subjectMap = {};
    sessions.forEach(s => {
      if (!subjectMap[s.subject]) {
        subjectMap[s.subject] = { total_planned: 0, total_completed: 0, ratings: [], sessions_count: 0 };
      }
      subjectMap[s.subject].total_planned += s.planned_hours;
      subjectMap[s.subject].total_completed += s.completed_hours;
      subjectMap[s.subject].ratings.push(s.self_rating);
      subjectMap[s.subject].sessions_count += 1;
    });

    const subject_analytics = {};
    Object.entries(subjectMap).forEach(([name, info]) => {
      const avg_completion = info.total_completed / info.total_planned;
      const avg_rating = info.ratings.reduce((a, b) => a + b, 0) / info.ratings.length;
      subject_analytics[name] = {
        total_planned_hours: Math.round(info.total_planned * 10) / 10,
        total_completed_hours: Math.round(info.total_completed * 10) / 10,
        avg_completion_rate: Math.round(avg_completion * 100) / 100,
        avg_self_rating: Math.round(avg_rating * 10) / 10,
        sessions_count: info.sessions_count,
        weak_area: avg_completion < 0.6 || avg_rating < 3,
      };
    });

    // Daily chart (last 7 days)
    const dailyMap = {};
    sessions.forEach(s => {
      if (!dailyMap[s.date]) dailyMap[s.date] = { planned: 0, completed: 0 };
      dailyMap[s.date].planned += s.planned_hours;
      dailyMap[s.date].completed += s.completed_hours;
    });
    const daily_chart = Object.entries(dailyMap).map(([date, v]) => ({
      date: new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" }),
      planned: Math.round(v.planned * 10) / 10,
      completed: Math.round(v.completed * 10) / 10,
    }));

    // Points
    const total_points = sessions.length * 10;
    const total_completed_hours = sessions.reduce((s, x) => s + x.completed_hours, 0);
    const weak_subjects = Object.entries(subject_analytics).filter(([, v]) => v.weak_area).map(([k]) => k);

    // Level
    let level = "Beginner 📚";
    if (total_points > 600) level = "Study Master 🏆";
    else if (total_points > 300) level = "Dedicated 🔥";
    else if (total_points > 100) level = "Consistent 💪";

    return {
      streak: { current: sessions.length, best: sessions.length },
      total_points,
      level,
      total_sessions: sessions.length,
      total_completed_hours: Math.round(total_completed_hours * 10) / 10,
      weak_subjects,
      subject_analytics,
      daily_chart,
    };
  };

  const handleLog = (form) => {
    setSessions(prev => [...prev, { ...form, date: new Date().toISOString().split("T")[0] }]);
  };

  const data = buildDashboard();
  const subjects = Object.entries(data.subject_analytics);

  const pieData = subjects.map(([name, info], i) => ({
    name,
    value: info.total_planned_hours,
    color: SUBJECT_COLORS[i % SUBJECT_COLORS.length],
  }));

  const barData = subjects.map(([name, info]) => ({
    name: name.length > 10 ? name.slice(0, 10) + "…" : name,
    completion: Math.round(info.avg_completion_rate * 100),
  }));

  const tabs = ["overview", "subjects", "history"];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: ${C.border}; }
        .tab { cursor: pointer; padding: 7px 18px; border-radius: 6px; font-size: 11px; letter-spacing: 1px; border: none; font-family: inherit; transition: all 0.15s; }
        .fade { animation: fadeUp 0.4s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {showLog && <LogSessionModal onClose={() => setShowLog(false)} onLog={handleLog} />}

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f0b1a" }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, background: `linear-gradient(135deg, ${C.gradientA}, ${C.gradientB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            study_dashboard
          </h1>
          <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>performance · analytics · recommendations</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ background: C.accent + "22", border: `1px solid ${C.accent}44`, borderRadius: 20, padding: "4px 14px", fontSize: 11, color: C.accent }}>
            {data.level}
          </div>
          <button onClick={() => setShowLog(true)}
            style={{ background: `linear-gradient(135deg, ${C.gradientA}, ${C.gradientB})`, color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 11, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
            + Log Session
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: "14px 28px 0", borderBottom: `1px solid ${C.border}`, display: "flex", gap: 4, background: "#0f0b1a" }}>
        {tabs.map(t => (
          <button key={t} className="tab" onClick={() => setActiveTab(t)}
            style={{ background: activeTab === t ? C.accent + "22" : "transparent", color: activeTab === t ? C.accent : C.muted, border: activeTab === t ? `1px solid ${C.accent}44` : "1px solid transparent" }}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ padding: "24px 28px", maxWidth: 1100, margin: "0 auto" }}>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="fade">
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              <StatCard label="CURRENT STREAK" value={`${data.streak.current}d`} sub={`Best: ${data.streak.best} days`} color={C.green} icon="🔥" />
              <StatCard label="TOTAL POINTS" value={data.total_points} sub="Keep going!" color={C.accent} icon="⭐" />
              <StatCard label="HOURS STUDIED" value={`${data.total_completed_hours}h`} sub={`${data.total_sessions} sessions`} color={C.pink} icon="📚" />
              <StatCard label="WEAK SUBJECTS" value={data.weak_subjects.length} sub={data.weak_subjects.join(", ") || "None! Great job 🎉"} color={data.weak_subjects.length > 0 ? C.red : C.green} icon="⚠️" />
            </div>

            {/* Empty state */}
            {sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, border: `1px dashed ${C.border}`, borderRadius: 16, color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
                <div style={{ fontSize: 14, marginBottom: 8, color: C.text }}>No data yet!</div>
                <div style={{ fontSize: 12 }}>Click "+ Log Session" to record your first study session.</div>
                <div style={{ fontSize: 12, marginTop: 6 }}>Your charts and analytics will appear here.</div>
              </div>
            ) : (
              <>
                {/* Line Chart */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 16 }}>7-DAY STUDY TREND — PLANNED vs COMPLETED</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={data.daily_chart}>
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: C.muted }} axisLine={false} tickLine={false} unit="h" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="planned" stroke={C.border} strokeWidth={2} dot={false} name="Planned" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="completed" stroke={C.accent} strokeWidth={2.5} dot={{ fill: C.accent, r: 3 }} name="Completed" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie + Bar */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 16 }}>SUBJECT HOUR DISTRIBUTION</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `${v}h`} contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {pieData.map((d, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10, color: C.muted }}>
                          <div style={{ width: 6, height: 6, borderRadius: "50%", background: d.color }} />
                          {d.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ fontSize: 11, color: C.muted, letterSpacing: 1, marginBottom: 16 }}>COMPLETION % BY SUBJECT</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={barData} barSize={14}>
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: C.muted }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
                        <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11 }} formatter={(v) => `${v}%`} />
                        <Bar dataKey="completion" radius={[4, 4, 0, 0]} name="Completion">
                          {barData.map((_, i) => <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* SUBJECTS */}
        {activeTab === "subjects" && (
          <div className="fade">
            {subjects.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, border: `1px dashed ${C.border}`, borderRadius: 16, color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>📖</div>
                <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>No subjects tracked yet!</div>
                <div style={{ fontSize: 12 }}>Log a session to see subject analytics here.</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {subjects.map(([name, info], i) => (
                  <div key={name} style={{ background: C.card, border: `1px solid ${info.weak_area ? C.red + "44" : C.border}`, borderRadius: 14, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
                      </div>
                      {info.weak_area && (
                        <span style={{ fontSize: 9, background: C.red + "22", color: C.red, border: `1px solid ${C.red}44`, borderRadius: 20, padding: "2px 8px" }}>WEAK AREA</span>
                      )}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 5 }}>
                        <span>COMPLETION RATE</span>
                        <span style={{ color: info.avg_completion_rate >= 0.8 ? C.green : info.avg_completion_rate >= 0.6 ? C.amber : C.red }}>
                          {Math.round(info.avg_completion_rate * 100)}%
                        </span>
                      </div>
                      <ProgressBar value={info.avg_completion_rate} color={info.avg_completion_rate >= 0.8 ? C.green : info.avg_completion_rate >= 0.6 ? C.amber : C.red} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 5 }}>
                        <span>AVG SELF RATING</span>
                        <span>{info.avg_self_rating.toFixed(1)} / 5</span>
                      </div>
                      <ProgressBar value={info.avg_self_rating / 5} color={C.accent} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted }}>
                      <span>{info.total_completed_hours}h / {info.total_planned_hours}h studied</span>
                      <span>{info.sessions_count} sessions</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* HISTORY */}
        {activeTab === "history" && (
          <div className="fade">
            {sessions.length === 0 ? (
              <div style={{ textAlign: "center", padding: 60, border: `1px dashed ${C.border}`, borderRadius: 16, color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>🗂️</div>
                <div style={{ fontSize: 14, color: C.text, marginBottom: 8 }}>No sessions logged yet!</div>
                <div style={{ fontSize: 12 }}>Click "+ Log Session" to record your first session.</div>
              </div>
            ) : (
              [...sessions].reverse().map((s, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{s.subject} <span style={{ color: C.muted, fontWeight: 400, fontSize: 11 }}>for {s.exam}</span></div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{s.date} · {s.session_type}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 13 }}>{s.completed_hours}h <span style={{ color: C.muted }}>/ {s.planned_hours}h</span></div>
                    <div style={{ fontSize: 10, color: C.accent, marginTop: 3 }}>Rating: {s.self_rating}/5</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

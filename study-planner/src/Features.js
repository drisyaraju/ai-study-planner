import { useState, useEffect, useRef, useCallback } from "react";

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

const LEVELS = [
  { min: 0, max: 100, name: "Beginner", icon: "📚", color: "#9d7ec0" },
  { min: 101, max: 300, name: "Consistent", icon: "💪", color: "#38bdf8" },
  { min: 301, max: 600, name: "Dedicated", icon: "🔥", color: "#fbbf24" },
  { min: 601, max: Infinity, name: "Study Master", icon: "🏆", color: "#ffd700" },
];

const MOODS = [
  { key: "tired", label: "Tired", emoji: "😴", color: "#9d7ec0", multiplier: 0.6, desc: "60% of planned hours" },
  { key: "normal", label: "Normal", emoji: "😊", color: "#34d399", multiplier: 1.0, desc: "100% of planned hours" },
  { key: "focused", label: "Focused", emoji: "🧠", color: "#c084fc", multiplier: 1.3, desc: "130% of planned hours" },
];

const POMODORO_PRESETS = [
  { label: "Classic", study: 25, shortBreak: 5, longBreak: 15 },
  { label: "Short", study: 15, shortBreak: 3, longBreak: 10 },
  { label: "Deep Work", study: 50, shortBreak: 10, longBreak: 20 },
];

const BADGES = [
  { icon: "🔥", label: "7-Day Streak", earned: false },
  { icon: "⚡", label: "Speed Learner", earned: false },
  { icon: "📖", label: "10 Sessions", earned: false },
  { icon: "🎯", label: "Perfect Day", earned: false },
  { icon: "🌙", label: "Night Owl", earned: false },
  { icon: "🏆", label: "Study Master", earned: false },
];

function getLevel(points) {
  return LEVELS.find(l => points >= l.min && points <= l.max) || LEVELS[3];
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ── MOOD SELECTOR ──
function MoodSelector({ mood, onSelect }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, marginBottom: 16 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, marginBottom: 16 }}>HOW ARE YOU FEELING TODAY?</div>
      <div style={{ display: "flex", gap: 12 }}>
        {MOODS.map(m => (
          <button key={m.key} onClick={() => onSelect(m.key)}
            style={{
              flex: 1, padding: "16px 12px", borderRadius: 12, cursor: "pointer", fontFamily: "inherit",
              border: `2px solid ${mood === m.key ? m.color : C.border}`,
              background: mood === m.key ? m.color + "18" : C.surface,
              transition: "all 0.2s", textAlign: "center",
            }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{m.emoji}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: mood === m.key ? m.color : C.text, marginBottom: 3 }}>{m.label}</div>
            <div style={{ fontSize: 10, color: C.muted }}>{m.desc}</div>
          </button>
        ))}
      </div>
      {mood && (
        <div style={{ marginTop: 14, padding: "10px 14px", background: MOODS.find(m => m.key === mood)?.color + "15", borderRadius: 8, fontSize: 11, color: MOODS.find(m => m.key === mood)?.color }}>
          ✓ Plan adjusted to {Math.round(MOODS.find(m => m.key === mood)?.multiplier * 100)}% of original hours
        </div>
      )}

      {/* Adjusted plan preview — empty state */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 20, marginTop: 16 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, marginBottom: 14 }}>TODAY'S ADJUSTED PLAN</div>
        {!mood ? (
          <div style={{ textAlign: "center", color: C.muted, fontSize: 12, padding: "20px 0" }}>
            Select a mood above to see your adjusted plan.
          </div>
        ) : (
          <div style={{ textAlign: "center", color: C.muted, fontSize: 12, padding: "20px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
            Add exams in the <strong style={{ color: C.accent }}>Planner</strong> tab first,<br />
            then generate your plan to see it adjusted here.
          </div>
        )}
      </div>
    </div>
  );
}

// ── POMODORO TIMER ──
function PomodoroTimer() {
  const [preset, setPreset] = useState(0);
  const [phase, setPhase] = useState("study");
  const [timeLeft, setTimeLeft] = useState(POMODORO_PRESETS[0].study * 60);
  const [running, setRunning] = useState(false);
  const [completedBlocks, setCompletedBlocks] = useState(0);
  const intervalRef = useRef(null);

  const current = POMODORO_PRESETS[preset];

  const phaseDurations = {
    study: current.study * 60,
    shortBreak: current.shortBreak * 60,
    longBreak: current.longBreak * 60,
  };

  const phaseColors = {
    study: C.accent,
    shortBreak: C.green,
    longBreak: C.blue,
  };

  const phaseLabels = {
    study: "Study Session",
    shortBreak: "Short Break ☕",
    longBreak: "Long Break 🎉",
  };

  const handlePhaseComplete = useCallback(() => {
    if (phase === "study") {
      setCompletedBlocks(prev => {
        const newCompleted = prev + 1;
        if (newCompleted % 4 === 0) {
          setPhase("longBreak");
          setTimeLeft(current.longBreak * 60);
        } else {
          setPhase("shortBreak");
          setTimeLeft(current.shortBreak * 60);
        }
        return newCompleted;
      });
    } else {
      setPhase("study");
      setTimeLeft(current.study * 60);
    }
  }, [phase, current]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            handlePhaseComplete();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, phase, handlePhaseComplete]);

  const reset = () => {
    clearInterval(intervalRef.current);
    setRunning(false);
    setPhase("study");
    setCompletedBlocks(0);
    setTimeLeft(POMODORO_PRESETS[preset].study * 60);
  };

  const switchPreset = (i) => {
    reset();
    setPreset(i);
    setTimeLeft(POMODORO_PRESETS[i].study * 60);
  };

  const progress = 1 - timeLeft / phaseDurations[phase];
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = circumference * (1 - progress);
  const color = phaseColors[phase];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, marginBottom: 16 }}>POMODORO TIMER</div>

      {/* Preset selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {POMODORO_PRESETS.map((p, i) => (
          <button key={i} onClick={() => switchPreset(i)}
            style={{
              flex: 1, padding: "6px 0", borderRadius: 8,
              border: `1px solid ${preset === i ? color : C.border}`,
              background: preset === i ? color + "18" : "transparent",
              color: preset === i ? color : C.muted,
              cursor: "pointer", fontFamily: "inherit", fontSize: 11, transition: "all 0.15s",
            }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Circle timer */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
        <div style={{ position: "relative", width: 180, height: 180 }}>
          <svg width="180" height="180" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="90" cy="90" r={radius} fill="none" stroke={C.border} strokeWidth="6" />
            <circle cx="90" cy="90" r={radius} fill="none" stroke={color} strokeWidth="6"
              strokeDasharray={circumference} strokeDashoffset={strokeDash}
              strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 32, fontWeight: 700, color, fontFamily: "'Fraunces', serif", letterSpacing: -1 }}>{formatTime(timeLeft)}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>{phaseLabels[phase]}</div>
          </div>
        </div>
      </div>

      {/* Block dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 18 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: i < (completedBlocks % 4) ? color : C.border, transition: "all 0.3s" }} />
        ))}
        <span style={{ fontSize: 10, color: C.muted, marginLeft: 6 }}>{completedBlocks} blocks done</span>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => setRunning(r => !r)}
          style={{
            flex: 2, padding: "11px 0", borderRadius: 10, border: "none",
            background: `linear-gradient(135deg, ${C.gradientA}, ${C.gradientB})`,
            color: "white", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
          }}>
          {running ? "⏸ Pause" : "▶ Start"}
        </button>
        <button onClick={reset}
          style={{ flex: 1, padding: "11px 0", borderRadius: 10, border: `1px solid ${C.border}`, background: "transparent", color: C.muted, cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}>
          ↺ Reset
        </button>
      </div>

      {/* How it works */}
      <div style={{ marginTop: 16, padding: 16, background: C.surface, borderRadius: 12 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, marginBottom: 10 }}>HOW POMODORO WORKS</div>
        {[
          { icon: "📖", text: "Study for the set time without distraction" },
          { icon: "☕", text: "Take a short break" },
          { icon: "🔁", text: "Repeat 4 times" },
          { icon: "🛋️", text: "Take a long break — you earned it!" },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", fontSize: 12, color: C.muted }}>
            <span>{item.icon}</span><span>{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── GAMIFICATION ──
function GamificationPanel({ points, streak }) {
  const level = getLevel(points);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const progress = nextLevel ? (points - level.min) / (nextLevel.min - level.min) : 1;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24 }}>
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, marginBottom: 16 }}>GAMIFICATION</div>

      {/* Level card */}
      <div style={{ background: level.color + "18", border: `1px solid ${level.color}44`, borderRadius: 12, padding: "16px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>CURRENT LEVEL</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: level.color, fontFamily: "'Fraunces', serif" }}>{level.icon} {level.name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            {points} pts{nextLevel ? ` · ${nextLevel.min - points} to next level` : " · MAX LEVEL"}
          </div>
        </div>
        <div style={{ fontSize: 42 }}>{level.icon}</div>
      </div>

      {/* XP bar */}
      {nextLevel && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginBottom: 6 }}>
            <span>{level.name}</span><span>{nextLevel.name}</span>
          </div>
          <div style={{ background: C.border, borderRadius: 99, height: 8 }}>
            <div style={{ width: `${progress * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.gradientA}, ${C.gradientB})`, borderRadius: 99, transition: "width 1s ease" }} />
          </div>
        </div>
      )}

      {/* Streak + Points */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, background: C.surface, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.amber }}>🔥 {streak}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>Day Streak</div>
        </div>
        <div style={{ flex: 1, background: C.surface, borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>{points}</div>
          <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>Total Points</div>
        </div>
      </div>

      {/* Badges — all locked at start */}
      <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1, marginBottom: 10 }}>BADGES</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
        {BADGES.map((b, i) => (
          <div key={i} style={{
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 10, padding: "10px 8px", textAlign: "center", opacity: 0.4,
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{b.icon}</div>
            <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.3 }}>{b.label}</div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "center", fontSize: 11, color: C.muted }}>
        🔒 Log sessions to unlock badges!
      </div>

      {/* Points guide */}
      <div style={{ marginTop: 16, padding: 16, background: C.surface, borderRadius: 12 }}>
        <div style={{ fontSize: 10, color: C.muted, letterSpacing: 1.5, marginBottom: 10 }}>HOW TO EARN POINTS</div>
        {[
          { action: "Complete a study session", pts: "+10", color: C.accent },
          { action: "Finish a revision day", pts: "+20", color: C.blue },
          { action: "Give yourself a perfect rating (5/5)", pts: "+15", color: C.pink },
          { action: "Achieve a 7-day streak", pts: "+50", color: C.amber },
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none", fontSize: 12 }}>
            <span style={{ color: C.muted }}>{item.action}</span>
            <span style={{ color: item.color, fontWeight: 700 }}>{item.pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ──
export default function Features() {
  const [mood, setMood] = useState("");
  const [points, setPoints] = useState(0);   // ← starts at 0
  const [streak] = useState(0);   // ← starts at 0
  const [activeSection, setActiveSection] = useState("mood");

  const sections = [
    { key: "mood", label: "🌤 Mood" },
    { key: "pomodoro", label: "⏱ Pomodoro" },
    { key: "gamification", label: "🏆 Rewards" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,300&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: ${C.border}; }
        .fade { animation: fadeUp 0.35s ease both; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0f0b1a" }}>
        <div>
          <h1 style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, background: `linear-gradient(135deg, ${C.gradientA}, ${C.gradientB})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            study_features
          </h1>
          <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>mood · pomodoro · gamification</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ background: C.amber + "22", border: `1px solid ${C.amber}44`, borderRadius: 20, padding: "4px 14px", fontSize: 11, color: C.amber }}>
            🔥 {streak} day streak
          </div>
          <div style={{ background: C.accent + "22", border: `1px solid ${C.accent}44`, borderRadius: 20, padding: "4px 14px", fontSize: 11, color: C.accent }}>
            ⭐ {points} pts
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 28px" }}>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {sections.map(s => (
            <button key={s.key} onClick={() => setActiveSection(s.key)}
              style={{
                padding: "8px 20px", borderRadius: 8,
                border: `1px solid ${activeSection === s.key ? C.accent : C.border}`,
                background: activeSection === s.key ? C.accent + "18" : "transparent",
                color: activeSection === s.key ? C.accent : C.muted,
                cursor: "pointer", fontFamily: "inherit", fontSize: 11, letterSpacing: 0.5, transition: "all 0.15s",
              }}>
              {s.label}
            </button>
          ))}
        </div>

        {activeSection === "mood" && (
          <div className="fade">
            <MoodSelector mood={mood} onSelect={setMood} />
          </div>
        )}

        {activeSection === "pomodoro" && (
          <div className="fade">
            <PomodoroTimer />
          </div>
        )}

        {activeSection === "gamification" && (
          <div className="fade">
            <GamificationPanel points={points} streak={streak} />
            <button onClick={() => setPoints(p => p + 10)}
              style={{ marginTop: 14, width: "100%", padding: "12px 0", borderRadius: 10, border: "none", background: `linear-gradient(135deg, ${C.gradientA}, ${C.gradientB})`, color: "white", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600 }}>
              Simulate: Complete Session (+10 pts) — for testing only
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
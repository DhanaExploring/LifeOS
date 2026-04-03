import { useState, useEffect, useRef } from "react";
import { tk, today, pct, MIND_MOODS, BODY_MOODS, H_DAILY_HABITS, getWeekKey, AFFIRMATIONS } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono, PBar, Btn, FloatInput, Toggle } from "../ui";

// ── Helpers ──────────────────────────────────────────────────────────────────
function weekDates(weekKey) {
  const sun = new Date(weekKey + "T12:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i + 1); // Mon=1 … Sun=7
    return d.toISOString().split("T")[0];
  });
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Checkbox ─────────────────────────────────────────────────────────────────
function Check({ on, color = tk.sage, onToggle, label }) {
  const { d } = useT();
  return (
    <button onClick={onToggle} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%",
      background: "none", border: "none", cursor: "pointer", padding: "10px 0",
      textAlign: "left",
    }}>
      <span style={{
        width: 20, height: 20, minWidth: 20, minHeight: 20, aspectRatio: "1/1", borderRadius: "100%", boxSizing: "border-box", flexShrink: 0,
        border: on ? "none" : `2px solid ${color}60`,
        background: on ? color : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", boxShadow: on ? `0 2px 6px ${color}40` : "none",
      }}>
        {on && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}
      </span>
      <Mono size={13} color={d ? tk.di2 : tk.ink2} style={{
        textDecoration: on ? "line-through" : "none",
        opacity: on ? 0.6 : 1, transition: "all 0.2s",
      }}>{label}</Mono>
    </button>
  );
}

// ── Mood Row ─────────────────────────────────────────────────────────────────
function MoodRow({ label, moods, value, onPick }) {
  const { d } = useT();
  return (
    <Card>
      <Lbl>{label}</Lbl>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 4, overflow: "hidden" }}>
        {moods.map((m, i) => (
          <button key={i} onClick={() => onPick(value === i ? null : i)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
            padding: "10px 6px", borderRadius: 14, border: "none", cursor: "pointer",
            flex: "1 1 0", minWidth: 0,
            background: value === i ? `${tk.sage}20` : "transparent",
            transform: value === i ? "scale(1.05)" : "scale(1)",
            opacity: value != null && value !== i ? 0.35 : 1,
            transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 24 }}>{m.e}</span>
            <Mono size={9} color={value === i ? tk.sage : (d ? tk.di3 : tk.ink3)} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{m.l}</Mono>
          </button>
        ))}
      </div>
    </Card>
  );
}

// ── Settings Panel ───────────────────────────────────────────────────────────
function SettingsPanel({ config, dp }) {
  const { d } = useT();
  const divC = d ? "rgba(255,255,255,0.07)" : "rgba(44,36,22,0.09)";
  const [newHabit, setNewHabit] = useState("");

  function addHabit() {
    const name = newHabit.trim();
    if (!name) return;
    dp({ type: "H_ADD_CUSTOM_HAB", name });
    setNewHabit("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <Lbl>Manage daily habits</Lbl>
        {H_DAILY_HABITS.map((h, i) => {
          const hidden = (config.hiddenDefaults || []).includes(i);
          return (
            <div key={`d-${i}`} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 0", borderBottom: `1px solid ${divC}`,
              opacity: hidden ? 0.45 : 1, transition: "opacity 0.2s",
            }}>
              <Mono size={13}>{h}</Mono>
              <button onClick={() => dp({ type: "H_TOGGLE_DEFAULT", i })} style={{
                fontFamily: "'DM Mono',monospace", fontSize: 10, padding: "5px 12px",
                borderRadius: 12, border: `1px solid ${divC}`, cursor: "pointer",
                background: hidden ? "transparent" : (d ? tk.sage + "25" : tk.sageL),
                color: hidden ? (d ? tk.di3 : tk.ink3) : tk.sage,
              }}>{hidden ? "Show" : "Hide"}</button>
            </div>
          );
        })}
        {(config.customHabits || []).map((h, i) => (
          <div key={`c-${i}`} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "10px 0", borderBottom: `1px solid ${divC}`,
          }}>
            <Mono size={13}>{h}</Mono>
            <button onClick={() => dp({ type: "H_DEL_CUSTOM_HAB", i })} style={{
              fontFamily: "'DM Mono',monospace", fontSize: 10, padding: "5px 12px",
              borderRadius: 12, border: `1px solid ${divC}`, cursor: "pointer",
              background: "transparent", color: tk.rose,
            }}>Remove</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <FloatInput value={newHabit} onChange={e => setNewHabit(e.target.value)}
            placeholder="New habit…" style={{ flex: 1 }} />
          <button onClick={addHabit} style={{
            width: 40, height: 40, borderRadius: "50%", background: tk.sage, border: "none",
            color: "#fff", fontSize: 20, cursor: "pointer", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: `0 2px 14px ${tk.sage}50`,
          }}>+</button>
        </div>
      </Card>
    </div>
  );
}

// ── Daily View ───────────────────────────────────────────────────────────────
function DailyView({ entry, dp, config }) {
  const { d } = useT();
  const [grateful, setGrateful] = useState(entry.grateful || "");
  const [dump, setDump] = useState(entry.brainDump || "");
  const dumpTimer = useRef(null);

  // 1s debounce for brain dump
  useEffect(() => {
    clearTimeout(dumpTimer.current);
    dumpTimer.current = setTimeout(() => {
      if (dump !== (entry.brainDump || ""))
        dp({ type: "H_DAILY", d: today, k: "brainDump", v: dump });
    }, 1000);
    return () => clearTimeout(dumpTimer.current);
  }, [dump]);

  const activeHabits = [
    ...H_DAILY_HABITS.filter((_, i) => !(config.hiddenDefaults || []).includes(i)),
    ...(config.customHabits || []),
  ];
  const habs = entry.habits || {};
  const divC = d ? "rgba(255,255,255,0.07)" : "rgba(44,36,22,0.09)";

  // Affirmation
  const picked = entry.affirmation;

  function shuffleAffirmation() {
    const txt = AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
    dp({ type: "H_DAILY", d: today, k: "affirmation", v: txt });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* 1 · Affirmation */}
      <Card style={{
        textAlign: "center", padding: "28px 20px",
        background: d
          ? `linear-gradient(135deg, ${tk.d2}, ${tk.sage}15)`
          : `linear-gradient(135deg, #fff, ${tk.sageL})`,
        border: `1px solid ${d ? tk.sage + "20" : tk.sage + "30"}`,
      }}>
        <Lbl style={{ marginBottom: 12 }}>Today's affirmation</Lbl>
        {picked ? (
          <Serif size={18} style={{ lineHeight: 1.5, fontStyle: "italic" }}>
            "{picked}"
          </Serif>
        ) : (
          <Mono size={12} color={d ? tk.di3 : tk.ink3}>
            Tap shuffle to pick your affirmation
          </Mono>
        )}
        <button onClick={shuffleAffirmation} style={{
          fontFamily: "'DM Mono',monospace", fontSize: 11, marginTop: 16,
          color: tk.sage, background: "none", border: "none", cursor: "pointer",
        }}>↻ Shuffle</button>
      </Card>

      {/* 2 · Mind mood */}
      <MoodRow label="Mind mood" moods={MIND_MOODS} value={entry.mindMood}
        onPick={v => dp({ type: "H_DAILY", d: today, k: "mindMood", v })} />

      {/* 3 · Body mood */}
      <MoodRow label="Body mood" moods={BODY_MOODS} value={entry.bodyMood}
        onPick={v => dp({ type: "H_DAILY", d: today, k: "bodyMood", v })} />

      {/* 4 · Grateful */}
      <Card>
        <Lbl>One thing I'm grateful for</Lbl>
        <input value={grateful} onChange={e => setGrateful(e.target.value)}
          onBlur={() => { if (grateful !== (entry.grateful || "")) dp({ type: "H_DAILY", d: today, k: "grateful", v: grateful }); }}
          onKeyDown={e => { if (e.key === "Enter") dp({ type: "H_DAILY", d: today, k: "grateful", v: grateful }); }}
          placeholder="Today I'm grateful for…"
          style={{
            width: "100%", fontFamily: "'DM Mono',monospace", fontSize: 13, padding: "12px 16px",
            borderRadius: 14, border: `1px solid ${divC}`,
            background: d ? tk.d3 : tk.cream, color: d ? tk.di : tk.ink, outline: "none",
          }} />
      </Card>

      {/* 5 · Habits */}
      <Card>
        <Lbl>Habits</Lbl>
        {activeHabits.length === 0 && (
          <Mono size={12} color={d ? tk.di3 : tk.ink3} style={{ padding: "8px 0" }}>
            No habits configured — add some in settings.
          </Mono>
        )}
        {activeHabits.map(h => (
          <Check key={h} on={!!habs[h]} label={h}
            onToggle={() => dp({ type: "H_DAILY_HAB", d: today, name: h })} />
        ))}
      </Card>

      {/* 6 · Brain dump */}
      <Card>
        <Lbl>Brain dump</Lbl>
        <textarea value={dump} onChange={e => setDump(e.target.value)}
          placeholder="Whatever's on your mind. No rules."
          rows={5}
          style={{
            width: "100%", fontFamily: "'DM Mono',monospace", fontSize: 13, padding: "14px 16px",
            borderRadius: 14, border: `1px solid ${divC}`,
            background: d ? tk.d3 : tk.cream, color: d ? tk.di : tk.ink,
            outline: "none", resize: "none", lineHeight: 1.7,
          }} />
      </Card>
    </div>
  );
}

// ── Weekly View ──────────────────────────────────────────────────────────────
function WeeklyView({ dailyAll, weekly, dp, weekKey, config }) {
  const { d } = useT();
  const dates = weekDates(weekKey);
  const divC = d ? "rgba(255,255,255,0.07)" : "rgba(44,36,22,0.09)";

  const activeHabits = [
    ...H_DAILY_HABITS.filter((_, i) => !(config.hiddenDefaults || []).includes(i)),
    ...(config.customHabits || []),
  ];

  // Read from daily entries
  const entries = dates.map(dt => dailyAll[dt] || {});

  // Reflection state
  const [pattern, setPattern] = useState(weekly.pattern || "");
  const [protect, setProtect] = useState(weekly.protect || "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* 1 · Mind mood trend */}
      <Card>
        <Lbl>Mind mood trend</Lbl>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {entries.map((e, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>
                {e.mindMood != null ? MIND_MOODS[e.mindMood].e : "·"}
              </span>
              <Mono size={9} color={d ? tk.di3 : tk.ink3}>{DAYS[i]}</Mono>
            </div>
          ))}
        </div>
      </Card>

      {/* 2 · Body mood trend */}
      <Card>
        <Lbl>Body mood trend</Lbl>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {entries.map((e, i) => (
            <div key={i} style={{ textAlign: "center", flex: 1 }}>
              <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>
                {e.bodyMood != null ? BODY_MOODS[e.bodyMood].e : "·"}
              </span>
              <Mono size={9} color={d ? tk.di3 : tk.ink3}>{DAYS[i]}</Mono>
            </div>
          ))}
        </div>
      </Card>

      {/* 3 · Habit consistency */}
      <Card>
        <Lbl>Habit consistency</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {activeHabits.map(h => {
            const done = entries.filter(e => (e.habits || {})[h]).length;
            return (
              <div key={h}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <Mono size={12}>{h}</Mono>
                  <Mono size={11} color={tk.sage}>{done}/7</Mono>
                </div>
                <PBar v={pct(done, 7)} color={tk.sage} h={6} />
              </div>
            );
          })}
          {activeHabits.length === 0 && (
            <Mono size={12} color={d ? tk.di3 : tk.ink3}>No habits to track</Mono>
          )}
        </div>
      </Card>

      {/* 4 · Brain dump snippets */}
      <Card>
        <Lbl>Brain dump snippets</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {entries.map((e, i) => {
            const txt = (e.brainDump || "").trim();
            if (!txt) return null;
            return (
              <div key={i} style={{
                padding: "10px 14px", borderRadius: 12,
                background: d ? "rgba(255,255,255,0.04)" : tk.cream,
              }}>
                <Mono size={10} color={d ? tk.di3 : tk.ink3} style={{ marginBottom: 4 }}>{DAYS[i]}</Mono>
                <Mono size={12} style={{ lineHeight: 1.5 }}>
                  {txt.length > 60 ? txt.slice(0, 60) + "…" : txt}
                </Mono>
              </div>
            );
          }).filter(Boolean)}
          {entries.every(e => !(e.brainDump || "").trim()) && (
            <Mono size={12} color={d ? tk.di3 : tk.ink3}>No entries this week</Mono>
          )}
        </div>
      </Card>

      {/* 5 · Reflections */}
      <Card>
        <Lbl>Weekly reflections</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <Mono size={12} style={{ marginBottom: 8 }}>What pattern do you notice this week?</Mono>
            <textarea value={pattern} onChange={e => setPattern(e.target.value)}
              onBlur={() => { if (pattern !== (weekly.pattern || "")) dp({ type: "H_WEEKLY", w: weekKey, k: "pattern", v: pattern }); }}
              placeholder="I noticed…"
              rows={3}
              style={{
                width: "100%", fontFamily: "'DM Mono',monospace", fontSize: 13, padding: "12px 16px",
                borderRadius: 14, border: `1px solid ${divC}`,
                background: d ? tk.d3 : tk.cream, color: d ? tk.di : tk.ink,
                outline: "none", resize: "none", lineHeight: 1.6,
              }} />
          </div>
          <div>
            <Mono size={12} style={{ marginBottom: 8 }}>What do you want to protect next week?</Mono>
            <textarea value={protect} onChange={e => setProtect(e.target.value)}
              onBlur={() => { if (protect !== (weekly.protect || "")) dp({ type: "H_WEEKLY", w: weekKey, k: "protect", v: protect }); }}
              placeholder="I want to protect…"
              rows={3}
              style={{
                width: "100%", fontFamily: "'DM Mono',monospace", fontSize: 13, padding: "12px 16px",
                borderRadius: 14, border: `1px solid ${divC}`,
                background: d ? tk.d3 : tk.cream, color: d ? tk.di : tk.ink,
                outline: "none", resize: "none", lineHeight: 1.6,
              }} />
          </div>
        </div>
      </Card>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
];

export default function HealthScreen({ s, dp }) {
  const { d } = useT();
  const isSunday = new Date().getDay() === 0;
  const [tab, setTab] = useState(isSunday ? "weekly" : "daily");
  const [showSettings, setShowSettings] = useState(false);
  const weekKey = getWeekKey();
  const dailyAll = s.health.daily || {};
  const entry = dailyAll[today] || { mindMood: null, bodyMood: null, grateful: "", habits: {}, brainDump: "", affirmation: "" };
  const weekly = (s.health.weekly || {})[weekKey] || { pattern: "", protect: "" };
  const config = s.health.config || { customHabits: [], hiddenDefaults: [] };
  const divC = d ? "rgba(255,255,255,0.07)" : "rgba(44,36,22,0.09)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      {/* Header */}
      <div className="su" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 8 }}>
        <div>
          <Lbl>{tab === "weekly" ? "Weekly review" : "Daily check-in"}</Lbl>
          <Serif size={32}>Health</Serif>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} style={{
          width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
          background: showSettings ? tk.sage : (d ? tk.d3 : tk.cream2),
          border: `1px solid ${showSettings ? tk.sage : divC}`,
          color: showSettings ? "#fff" : (d ? tk.di3 : tk.ink3),
          fontSize: 16, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.2s",
        }}>⚙</button>
      </div>

      {showSettings ? (
        <SettingsPanel config={config} dp={dp} />
      ) : (
        <>
          {/* Tab toggle */}
          <div style={{
            display: "flex", borderRadius: 14, overflow: "hidden",
            background: d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", padding: 3,
          }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                flex: 1, padding: "10px 0", border: "none", cursor: "pointer",
                fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.04em",
                fontWeight: tab === t.id ? 500 : 400,
                background: tab === t.id ? (d ? "rgba(255,255,255,0.1)" : "#fff") : "transparent",
                color: tab === t.id ? tk.sage : (d ? tk.di3 : tk.ink3),
                borderRadius: 12,
                boxShadow: tab === t.id ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s",
              }}>{t.label}</button>
            ))}
          </div>

          {tab === "daily"
            ? <DailyView entry={entry} dp={dp} config={config} />
            : <WeeklyView dailyAll={dailyAll} weekly={weekly} dp={dp} weekKey={weekKey} config={config} />}
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { tk, today } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono } from "../ui";

export default function WorkScreen({ s, dp }) {
  const { d } = useT();
  const work = s.work || { enabled: true, monthlyTarget: "", dailyTodos: [], reminders: [] };
  const breaks = s.breaks || { enabled: false, intervalMin: 60 };
  const [todoText, setTodoText] = useState("");
  const [breakActive, setBreakActive] = useState(false);
  const [breakTimeLeft, setBreakTimeLeft] = useState(0);
  const breakTimer = useRef(null);

  // Filter todos for today
  const todayTodos = work.dailyTodos.filter(t => t.date === today);
  const otherTodos = work.dailyTodos.filter(t => t.date !== today && !t.done);

  // Auto-reset: clear done tasks from previous days each morning
  useEffect(() => {
    if (work.lastResetDate !== today) {
      dp({ type: "WORK_DAILY_RESET", today });
    }
    // Weekly reset: clear weekly target on Monday
    const dayOfWeek = new Date().getDay();
    const d2 = new Date();
    d2.setHours(0, 0, 0, 0);
    d2.setDate(d2.getDate() + 3 - ((d2.getDay() + 6) % 7));
    const yearStart = new Date(d2.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d2 - yearStart) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7);
    const weekKey = `${d2.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    if (dayOfWeek === 1 && work.lastWeeklyReset !== weekKey) {
      dp({ type: "WORK_WEEKLY_RESET", week: weekKey });
    }
  }, []);

  function addTodo() {
    if (!todoText.trim()) return;
    dp({ type: "WORK_ADD_TODO", p: { id: Date.now(), text: todoText.trim(), done: false, date: today } });
    setTodoText("");
  }

  // Break timer
  function startBreakTimer() {
    setBreakActive(true);
    setBreakTimeLeft(breaks.intervalMin * 60);
  }

  function stopBreakTimer() {
    setBreakActive(false);
    setBreakTimeLeft(0);
    if (breakTimer.current) clearInterval(breakTimer.current);
  }

  useEffect(() => {
    if (!breakActive) return;
    breakTimer.current = setInterval(() => {
      setBreakTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(breakTimer.current);
          setBreakActive(false);
          // Send notification if available
          if ("serviceWorker" in navigator && Notification.permission === "granted") {
            navigator.serviceWorker.ready.then(reg => {
              if (reg.active) reg.active.postMessage({
                type: "SHOW_NOTIFICATION",
                title: "Time for a break! ☕",
                body: "You've been working hard. Stand up, stretch, and rest your eyes.",
                tag: "lifeos-break",
              });
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(breakTimer.current);
  }, [breakActive]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s2 = sec % 60;
    return `${m}:${s2.toString().padStart(2, "0")}`;
  };

  const inputStyle = {
    flex: 1, boxSizing: "border-box",
    fontFamily: "'DM Mono',monospace", fontSize: 12,
    padding: "10px 14px", borderRadius: 12,
    border: `1px solid ${d ? "rgba(255,255,255,0.1)" : "rgba(44,36,22,0.12)"}`,
    background: d ? tk.d3 : tk.cream2, color: d ? tk.di : tk.ink,
    outline: "none",
  };

  const addBtn = {
    padding: "10px 16px", borderRadius: 12, border: "none", cursor: "pointer",
    fontFamily: "'DM Mono',monospace", fontSize: 12,
    background: tk.sky, color: "#fff", flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ paddingTop: 8 }}>
        <Lbl>Weekly planner</Lbl>
        <Serif size={32}>Work</Serif>
        <Mono size={12} style={{ marginTop: 4 }}>Small steps every day lead to big results ✦</Mono>
      </div>

      {/* Weekly Target */}
      <Card>
        <Lbl>Weekly target</Lbl>
        <Mono size={11} style={{ marginTop: -8, marginBottom: 12, color: d ? tk.di3 : tk.ink3 }}>
          What's your main focus this week?
        </Mono>
        <textarea
          value={work.monthlyTarget}
          onChange={e => dp({ type: "WORK_TARGET", v: e.target.value })}
          placeholder="e.g. Ship v2.0, close 5 deals, finish course…"
          maxLength={200}
          rows={3}
          style={{
            ...inputStyle, flex: "unset", width: "100%", resize: "none", lineHeight: 1.6,
          }}
        />
      </Card>

      {/* Daily Todos */}
      <Card>
        <Lbl>Today's tasks</Lbl>
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            type="text"
            value={todoText}
            onChange={e => setTodoText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addTodo()}
            placeholder="Add a task…"
            maxLength={100}
            style={inputStyle}
          />
          <button onClick={addTodo} style={addBtn}>+</button>
        </div>
        {todayTodos.length === 0 && (
          <Mono size={11} style={{ textAlign: "center", padding: "12px 0", color: d ? tk.di3 : tk.ink3 }}>
            No tasks for today yet
          </Mono>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {todayTodos.map(t => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              borderRadius: 12,
              background: t.done ? (d ? tk.sage + "15" : tk.sageL) : (d ? tk.d3 : tk.cream2),
              transition: "all 0.2s",
            }}>
              <button
                onClick={() => dp({ type: "WORK_TOGGLE_TODO", id: t.id })}
                style={{
                  width: 20, height: 20, minWidth: 20, minHeight: 20, aspectRatio: "1/1", borderRadius: "100%", boxSizing: "border-box", flexShrink: 0,
                  border: t.done ? "none" : `2px solid ${tk.sage}60`,
                  background: t.done ? tk.sage : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: t.done ? `0 2px 6px ${tk.sage}40` : "none",
                  cursor: "pointer", padding: 0, transition: "all 0.2s",
                }}
              >{t.done && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}</button>
              <Mono size={12} style={{
                flex: 1, textDecoration: t.done ? "line-through" : "none",
                opacity: t.done ? 0.5 : 1,
              }}>{t.text}</Mono>
              <button onClick={() => dp({ type: "WORK_DEL_TODO", id: t.id })} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 14, color: d ? tk.di3 : tk.ink3, padding: 4,
              }}>×</button>
            </div>
          ))}
        </div>

        {/* Carry-over from previous days */}
        {otherTodos.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Mono size={10} style={{ color: tk.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
              Carry-over ({otherTodos.length})
            </Mono>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {otherTodos.map(t => (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "6px 12px",
                  borderRadius: 10, background: d ? tk.d1 : tk.cream2, opacity: 0.7,
                }}>
                  <span style={{ fontSize: 11, color: tk.gold }}>⚑</span>
                  <Mono size={11} style={{ flex: 1 }}>{t.text}</Mono>
                  <button onClick={() => dp({ type: "WORK_DEL_TODO", id: t.id })} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 12, color: d ? tk.di3 : tk.ink3, padding: 4,
                  }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Break Timer */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>☕</span>
            <Lbl style={{ marginBottom: 0 }}>Break reminder</Lbl>
          </div>
          <button
            onClick={() => dp({ type: "BREAKS", p: { enabled: !breaks.enabled } })}
            style={{
              padding: "5px 12px", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 500,
              background: breaks.enabled ? tk.sage : (d ? tk.d3 : tk.cream3),
              color: breaks.enabled ? "#fff" : (d ? tk.di3 : tk.ink3),
              transition: "all 0.2s",
            }}
          >{breaks.enabled ? "ON" : "OFF"}</button>
        </div>

        {breaks.enabled && (
          <>
            <Mono size={11} style={{ marginBottom: 14, color: d ? tk.di3 : tk.ink3 }}>
              Get reminded to take breaks while working
            </Mono>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <Mono size={12}>Remind every</Mono>
              <div style={{ display: "flex", gap: 6 }}>
                {[15, 30, 45, 60, 90].map(m => (
                  <button key={m} onClick={() => dp({ type: "BREAKS", p: { intervalMin: m } })} style={{
                    width: 36, height: 32, borderRadius: 10, border: "none", cursor: "pointer",
                    fontFamily: "'DM Mono',monospace", fontSize: 10,
                    background: breaks.intervalMin === m ? tk.sage : (d ? tk.d3 : tk.cream2),
                    color: breaks.intervalMin === m ? "#fff" : (d ? tk.di3 : tk.ink3),
                    transition: "all 0.2s",
                  }}>{m}m</button>
                ))}
              </div>
            </div>

            {!breakActive ? (
              <button onClick={startBreakTimer} style={{
                width: "100%", padding: "14px 20px", borderRadius: 14, border: "none", cursor: "pointer",
                fontFamily: "'DM Mono',monospace", fontSize: 13, letterSpacing: "0.04em",
                background: tk.sage, color: "#fff", boxShadow: `0 3px 14px ${tk.sage}44`,
              }}>▶ Start work timer</button>
            ) : (
              <div style={{ textAlign: "center" }}>
                <Serif size={38} color={tk.sage}>{formatTime(breakTimeLeft)}</Serif>
                <Mono size={11} style={{ marginTop: 6, marginBottom: 12, color: d ? tk.di3 : tk.ink3 }}>
                  until your next break
                </Mono>
                <button onClick={stopBreakTimer} style={{
                  padding: "10px 24px", borderRadius: 12, border: "none", cursor: "pointer",
                  fontFamily: "'DM Mono',monospace", fontSize: 12,
                  background: d ? tk.d3 : tk.cream3, color: d ? tk.di2 : tk.ink2,
                }}>Stop timer</button>
              </div>
            )}
          </>
        )}

        {!breaks.enabled && (
          <Mono size={11} style={{ color: d ? tk.di3 : tk.ink3 }}>
            Enable to get reminded to take breaks during work sessions
          </Mono>
        )}
      </Card>
    </div>
  );
}

import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { tk, catColor, PHASES, calcPhase, today, pct, H_DAILY_HABITS } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono, Ring } from "../ui";

export default function HomeScreen({ s, dp, go }) {
  const { d } = useT();
  const hd   = (s.health.daily || {})[today] || { mindMood: null, bodyMood: null, habits: {}, grateful: "", brainDump: "", affirmation: "" };
  const healthCfg = s.health?.config || { customHabits: [], hiddenDefaults: [] };
  const activeHabits = [
    ...H_DAILY_HABITS.filter((_, i) => !(healthCfg.hiddenDefaults || []).includes(i)),
    ...(healthCfg.customHabits || []),
  ];
  const habs = hd.habits || {};
  const done = activeHabits.filter(h => !!habs[h]).length;
  const hpct = activeHabits.length ? pct(done, activeHabits.length) : 0;
  const hr   = new Date().getHours();
  const profile = s.profile || {};
  const userName = profile.name || "";
  const greet = hr < 5 ? "Still up?" : hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const showCycle = profile.gender === "female";
  const ci   = showCycle ? calcPhase(s.cycle?.start, s.cycle?.len) : null;
  const ph   = ci ? PHASES[ci.phase] : null;
  const work = s.work || { enabled: false, monthlyTarget: "", dailyTodos: [] };
  const workEnabled = work.enabled;
  const todayTasks = (work.dailyTodos || []).filter(t => t.date === today);
  const tasksDone = todayTasks.filter(t => t.done).length;

  const mwk = Array.from({ length: 7 }).map((_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - (6 - i));
    const k = dt.toISOString().split("T")[0];
    const e = (s.health.daily || {})[k];
    return { day: dt.toLocaleDateString("en-US", { weekday: "short" }), score: e?.mindMood != null ? e.mindMood + 1 : null };
  });

  const tile = { cursor: "pointer", transition: "transform 0.15s ease" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ paddingTop: 8 }}>
        <Mono size={11} color={d ? tk.di3 : tk.ink3} style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Mono>
        <Serif size={34}>{greet}{userName ? `, ${userName}` : ""} <span style={{ color: tk.sage }}>☯</span></Serif>
        <Mono size={12} style={{ marginTop: 4 }}>Here's your life at a glance.</Mono>
      </div>

      {/* Today's affirmation */}
      {hd.affirmation ? (
        <div onClick={() => go("health")} style={tile}>
          <Card style={{
            textAlign: "center", padding: "24px 20px",
            background: d
              ? `linear-gradient(135deg, ${tk.d2}, ${tk.sage}15)`
              : `linear-gradient(135deg, #fff, ${tk.sageL})`,
            border: `1px solid ${d ? tk.sage + "20" : tk.sage + "30"}`,
          }}>
            <Lbl style={{ marginBottom: 10 }}>Today's affirmation</Lbl>
            <Serif size={16} style={{ lineHeight: 1.5, fontStyle: "italic" }}>
              "{hd.affirmation}"
            </Serif>
          </Card>
        </div>
      ) : (
        <div onClick={() => go("health")} style={tile}>
          <Card style={{ textAlign: "center", padding: "20px 16px" }}>
            <Mono size={12} color={d ? tk.di3 : tk.ink3}>Pick today's affirmation in Health</Mono>
          </Card>
        </div>
      )}

      {/* Cycle banner */}
      {ph && (
        <div onClick={() => go("cycle")} className="su pi" style={{ ...tile, borderRadius: 20, padding: "16px 20px", background: d ? ph.dark : ph.light, border: `1px solid ${ph.color}35`, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 30, flexShrink: 0 }}>{ph.emoji}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Mono size={10} color={ph.color} style={{ letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 3 }}>
              {ph.name} Phase · Day {ci.day} of {ci.len} · {ci.nextIn}d until next period
            </Mono>
            <Mono size={12} color={d ? tk.di2 : tk.ink2} style={{ lineHeight: 1.5 }}>{ph.mood.tip}</Mono>
          </div>
        </div>
      )}

      {/* Habit ring + Grateful */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "stretch" }}>
        <div onClick={() => go("health")} style={tile}>
          <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 10, height: "100%", boxSizing: "border-box" }}>
            <Ring v={hpct} />
            <Lbl style={{ marginBottom: 2, textAlign: "center" }}>Habits done</Lbl>
            <Mono size={11} color={tk.sage}>{done}/{activeHabits.length} today</Mono>
          </Card>
        </div>
        <div onClick={() => go("health")} style={tile}>
          <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 8, height: "100%", boxSizing: "border-box" }}>
            <Lbl style={{ marginBottom: 0, textAlign: "center" }}>Grateful for</Lbl>
            {hd.grateful?.trim()
              ? <>
                  <span style={{ fontSize: 28, color: tk.sage }}>❋</span>
                  <Serif size={14} style={{ textAlign: "center", lineHeight: 1.4, fontStyle: "italic", wordBreak: "break-word" }}>
                    {hd.grateful.trim()}
                  </Serif>
                </>
              : <>
                  <span style={{ fontSize: 36, color: tk.sage, opacity: 0.25 }}>❋</span>
                  <Mono size={11} style={{ textAlign: "center" }}>What are you grateful for?</Mono>
                </>
            }
          </Card>
        </div>
      </div>

      {/* Top goals */}
      <div onClick={() => go("goals")} style={tile}>
        <Card>
          <Lbl>Top goals</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {s.goals.filter(g => g.status !== "Completed").slice(0, 3).map(g => (
              <div key={g.id}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                  <Mono size={12} color={d ? tk.di2 : tk.ink2}>{g.title}</Mono>
                  <Mono size={11} color={catColor(g.cat)}>{g.prog}%</Mono>
                </div>
                <div style={{ width: "100%", height: 5, borderRadius: 5, background: d ? tk.d3 : tk.cream3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${g.prog}%`, background: catColor(g.cat), borderRadius: 5, transition: "width 0.55s cubic-bezier(0.34,1.56,0.64,1)" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Work snippet */}
      {workEnabled && (
        <div style={tile}>
          <Card>
            <div onClick={() => go("work")} style={{ cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Lbl style={{ marginBottom: 0 }}>Today's work</Lbl>
              <Mono size={10} color={tk.sage}>{tasksDone}/{todayTasks.length} done</Mono>
            </div>
            {todayTasks.length === 0 ? (
              <Mono size={12} color={d ? tk.di3 : tk.ink3} onClick={() => go("work")} style={{ cursor: "pointer" }}>No tasks yet — tap to plan your day</Mono>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {todayTasks.slice(0, 3).map(t => (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={() => dp({ type: "WORK_TOGGLE_TODO", id: t.id })}
                      style={{
                        width: 16, height: 16, minWidth: 16, minHeight: 16, aspectRatio: "1/1", borderRadius: "100%", boxSizing: "border-box", flexShrink: 0,
                        border: t.done ? "none" : `2px solid ${tk.sage}60`,
                        background: t.done ? tk.sage : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        boxShadow: t.done ? `0 2px 6px ${tk.sage}40` : "none",
                        cursor: "pointer", padding: 0, transition: "all 0.2s",
                      }}
                    >{t.done && <span style={{ color: "#fff", fontSize: 9 }}>✓</span>}</button>
                    <Mono size={12} style={{
                      textDecoration: t.done ? "line-through" : "none",
                      opacity: t.done ? 0.5 : 1,
                    }}>{t.text}</Mono>
                  </div>
                ))}
                {todayTasks.length > 3 && (
                  <Mono size={10} color={d ? tk.di3 : tk.ink3} onClick={() => go("work")} style={{ cursor: "pointer" }}>+{todayTasks.length - 3} more</Mono>
                )}
              </div>
            )}
            {work.monthlyTarget?.trim() && (
              <Mono size={10} style={{ marginTop: 10, color: tk.gold, fontStyle: "italic", lineHeight: 1.5, wordBreak: "break-word" }}>
                🎯 {work.monthlyTarget.trim()}
              </Mono>
            )}
          </Card>
        </div>
      )}

      {/* Mood chart */}
      {mwk.filter(x => x.score !== null).length > 1 && (
        <div onClick={() => go("health")} style={tile}>
          <Card>
            <Lbl>Mood this week</Lbl>
            <ResponsiveContainer width="100%" height={70}>
              <LineChart data={mwk}>
                <XAxis dataKey="day" tick={{ fontFamily: "'DM Mono',monospace", fontSize: 10, fill: d ? tk.di3 : tk.ink3 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: d ? tk.d2 : "#fff", border: "none", borderRadius: 12, fontFamily: "'DM Mono',monospace", fontSize: 11 }} />
                <Line type="monotone" dataKey="score" stroke={tk.sage} strokeWidth={2.5} dot={{ fill: tk.sage, r: 3 }} connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {hd.brainDump?.trim() && (
        <div onClick={() => go("health")} style={tile}>
          <Card style={{ background: d ? tk.d1 : tk.cream2, border: "none" }}>
            <Lbl>Today's brain dump</Lbl>
            <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 15, color: d ? tk.di : tk.ink2, lineHeight: 1.65, wordBreak: "break-word" }}>"{hd.brainDump.trim()}"</p>
          </Card>
        </div>
      )}
    </div>
  );
}

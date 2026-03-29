import { useState } from "react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { tk, today } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono, Toggle } from "../ui";

export default function HealthScreen({ s, dp }) {
  const { d } = useT();
  const log = s.health[today] || { water: 0, workout: false, sleep: 0, steps: 0 };
  const upd = (k, v) => dp({ type: "HEALTH", d: today, k, v });
  const th = s.habitLogs[today] || {};
  const done = Object.values(th).filter(Boolean).length;
  const [nh, setNh] = useState("");

  const wk = Array.from({ length: 7 }).map((_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - (6 - i));
    const k = dt.toISOString().split("T")[0];
    const hl = s.health[k] || {};
    return { day: dt.toLocaleDateString("en-US", { weekday: "short" }), water: hl.water || 0, sleep: hl.sleep || 0 };
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ paddingTop: 8 }}><Lbl>Track daily</Lbl><Serif size={32}>Health</Serif></div>

      {/* Daily log */}
      <Card>
        <Lbl>Daily log</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Water */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
              <Mono size={13}>💧 Water</Mono>
              <Mono size={13} color={tk.sky}>{log.water || 0} glasses</Mono>
            </div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <button key={i} onClick={() => upd("water", (log.water || 0) === i + 1 ? i : i + 1)} style={{
                  width: 34, height: 34, borderRadius: "50%", border: "none", cursor: "pointer",
                  fontFamily: "'DM Mono',monospace", fontSize: 12, transition: "all 0.15s",
                  background: i < (log.water || 0) ? tk.sky : (d ? tk.d3 : tk.cream2),
                  color: i < (log.water || 0) ? "#fff" : (d ? tk.di3 : tk.ink3),
                  transform: i < (log.water || 0) ? "scale(1.07)" : "scale(1)",
                  boxShadow: i < (log.water || 0) ? `0 2px 8px ${tk.sky}50` : "none",
                }}>{i + 1}</button>
              ))}
            </div>
          </div>

          {/* Sleep */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Mono size={13}>😴 Sleep</Mono>
              <Mono size={13} color={tk.plum}>{log.sleep || 0}h</Mono>
            </div>
            <input type="range" min={0} max={12} step={0.5} value={log.sleep || 0} onChange={e => upd("sleep", +e.target.value)}
              style={{ "--thumb": tk.plum, "--track": d ? tk.d3 : tk.cream3, accentColor: tk.plum }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <Mono size={10}>0h</Mono><Mono size={10}>6h</Mono><Mono size={10}>12h</Mono>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Mono size={13}>👟 Steps</Mono>
              <Mono size={13} color={tk.gold}>{(log.steps || 0).toLocaleString()}</Mono>
            </div>
            <input type="range" min={0} max={20000} step={500} value={log.steps || 0} onChange={e => upd("steps", +e.target.value)}
              style={{ "--thumb": tk.gold, "--track": d ? tk.d3 : tk.cream3, accentColor: tk.gold }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <Mono size={10}>0</Mono><Mono size={10}>10k</Mono><Mono size={10}>20k</Mono>
            </div>
          </div>

          {/* Workout */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Mono size={13}>🏃 Workout done?</Mono>
            <Toggle on={!!log.workout} set={v => upd("workout", v)} />
          </div>
        </div>
      </Card>

      {/* Habits */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Lbl style={{ marginBottom: 0 }}>Habits</Lbl>
          <Mono size={11} color={tk.sage}>{done}/{s.habits.length} done</Mono>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
          {s.habits.map(h => (
            <div key={h.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Mono size={13}>{h.icon} {h.name}</Mono>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => dp({ type: "DEL_HAB", id: h.id })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: d ? tk.di3 : tk.ink3 }}>×</button>
                <button onClick={() => dp({ type: "HABIT", d: today, id: h.id })} style={{
                  width: 26, height: 26, borderRadius: "50%",
                  border: `2px solid ${th[h.id] ? "transparent" : (d ? tk.di3 : tk.cream3)}`,
                  background: th[h.id] ? tk.sage : "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
                  boxShadow: th[h.id] ? `0 2px 8px ${tk.sage}50` : "none",
                }}>{th[h.id] && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 14, background: d ? tk.d3 : tk.cream }}>
          <input value={nh} onChange={e => setNh(e.target.value)} placeholder="Add habit…"
            onKeyDown={e => { if (e.key === "Enter" && nh.trim()) { dp({ type: "ADD_HAB", p: { id: Date.now(), name: nh.trim(), icon: "" } }); setNh(""); } }}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'DM Mono',monospace", fontSize: 12, color: d ? tk.di : tk.ink }} />
          <button onClick={() => { if (nh.trim()) { dp({ type: "ADD_HAB", p: { id: Date.now(), name: nh.trim(), icon: "" } }); setNh(""); } }}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 12, color: tk.sage }}>Add</button>
        </div>
      </Card>

      {/* Weekly chart */}
      <Card>
        <Lbl>This week</Lbl>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={wk} barSize={7} barGap={2}>
            <XAxis dataKey="day" tick={{ fontFamily: "'DM Mono',monospace", fontSize: 10, fill: d ? tk.di3 : tk.ink3 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: d ? tk.d2 : "#fff", border: "none", borderRadius: 12, fontFamily: "'DM Mono',monospace", fontSize: 11 }} />
            <Bar dataKey="water" fill={tk.sky} radius={[4, 4, 0, 0]} name="Water" />
            <Bar dataKey="sleep" fill={tk.plum} radius={[4, 4, 0, 0]} name="Sleep" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

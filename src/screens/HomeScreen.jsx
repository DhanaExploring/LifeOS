import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { tk, CAT, MOODS, PHASES, calcPhase, today, pct } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono, Ring } from "../ui";

export default function HomeScreen({ s, dp, go }) {
  const { d } = useT();
  const hl   = s.health[today] || { water: 0, workout: false, sleep: 0, steps: 0 };
  const th   = s.habitLogs[today] || {};
  const done = Object.values(th).filter(Boolean).length;
  const hpct = s.habits.length ? pct(done, s.habits.length) : 0;
  const me   = s.moods[today];
  const mobj = me?.mood != null ? MOODS[me.mood] : null;
  const hr   = new Date().getHours();
  const greet = hr < 5 ? "Still up?" : hr < 12 ? "Good morning" : hr < 17 ? "Good afternoon" : "Good evening";
  const ci   = calcPhase(s.cycle?.start, s.cycle?.len);
  const ph   = ci ? PHASES[ci.phase] : null;

  const mwk = Array.from({ length: 7 }).map((_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - (6 - i));
    const k = dt.toISOString().split("T")[0];
    const e = s.moods[k];
    return { day: dt.toLocaleDateString("en-US", { weekday: "short" }), score: e?.mood != null ? 5 - e.mood : null };
  });

  const tile = { cursor: "pointer", transition: "transform 0.15s ease" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ paddingTop: 8 }}>
        <Mono size={11} color={d ? tk.di3 : tk.ink3} style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Mono>
        <Serif size={34}>{greet} <span style={{ color: tk.sage }}>✦</span></Serif>
        <Mono size={12} style={{ marginTop: 4 }}>Here's your life at a glance.</Mono>
      </div>

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

      {/* Habit ring + Mood */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div onClick={() => go("health")} style={tile}>
          <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 10 }}>
            <Ring v={hpct} />
            <Lbl style={{ marginBottom: 2, textAlign: "center" }}>Habits done</Lbl>
            <Mono size={11} color={tk.sage}>{done}/{s.habits.length} today</Mono>
          </Card>
        </div>
        <div onClick={() => go("journal")} style={tile}>
          <Card style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 16px", gap: 8 }}>
            {mobj
              ? <><span style={{ fontSize: 40 }}>{mobj.e}</span><Mono size={11} color={mobj.c}>{mobj.l}</Mono><Lbl style={{ marginBottom: 0, textAlign: "center" }}>Today's mood</Lbl></>
              : <><span style={{ fontSize: 36, opacity: 0.18 }}>◡</span><Mono size={11} style={{ textAlign: "center" }}>Log your mood</Mono></>
            }
          </Card>
        </div>
      </div>

      {/* Quick stats */}
      <div onClick={() => go("health")} style={tile}>
        <Card>
          <Lbl>Today at a glance</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", textAlign: "center", gap: 8 }}>
            {[
              { i: "💧", v: hl.water || 0, l: "glasses" },
              { i: "🏃", v: hl.workout ? "Done" : "Rest", l: "workout" },
              { i: "😴", v: `${hl.sleep || 0}h`, l: "sleep" },
              { i: "👟", v: `${((hl.steps || 0) / 1000).toFixed(1)}k`, l: "steps" },
            ].map(it => (
              <div key={it.l}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{it.i}</div>
                <Mono size={13} color={d ? tk.di : tk.ink} style={{ fontWeight: 400 }}>{it.v}</Mono>
                <Mono size={10} color={d ? tk.di3 : tk.ink3}>{it.l}</Mono>
              </div>
            ))}
          </div>
        </Card>
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
                  <Mono size={11} color={CAT[g.cat]}>{g.prog}%</Mono>
                </div>
                <div style={{ width: "100%", height: 5, borderRadius: 5, background: d ? tk.d3 : tk.cream3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${g.prog}%`, background: CAT[g.cat], borderRadius: 5, transition: "width 0.55s cubic-bezier(0.34,1.56,0.64,1)" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Mood chart */}
      {mwk.filter(x => x.score !== null).length > 1 && (
        <div onClick={() => go("journal")} style={tile}>
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

      {me?.note && (
        <div onClick={() => go("journal")} style={tile}>
          <Card style={{ background: d ? tk.d1 : tk.cream2, border: "none" }}>
            <Lbl>Today's reflection</Lbl>
            <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 15, color: d ? tk.di : tk.ink2, lineHeight: 1.65 }}>"{me.note}"</p>
          </Card>
        </div>
      )}
    </div>
  );
}

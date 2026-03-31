import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { tk, CAT, pct, today } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono, PBar } from "../ui";

export default function InsightsScreen({ s }) {
  const { d } = useT();
  const avg = Math.round(s.goals.reduce((a, g) => a + g.prog, 0) / Math.max(1, s.goals.length));
  const raw = s.finance || {};
  const f = { income: raw.income || 0, budget: raw.budget || [], investments: raw.investments || [] };
  const work = s.work || { enabled: false, monthlyTarget: "", dailyTodos: [] };
  const workEnabled = work.enabled !== false;
  const todayTasks = (work.dailyTodos || []).filter(t => t.date === today);
  const todayDone = todayTasks.filter(t => t.done).length;
  const allTasks = work.dailyTodos || [];
  const weekTasks = allTasks.filter(t => {
    const d2 = new Date(t.date + "T00:00:00");
    const now = new Date();
    const diff = (now - d2) / 86400000;
    return diff >= 0 && diff < 7;
  });
  const weekDone = weekTasks.filter(t => t.done).length;

  const mwk = Array.from({ length: 7 }).map((_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - (6 - i));
    const k = dt.toISOString().split("T")[0];
    const e = s.moods[k];
    return { day: dt.toLocaleDateString("en-US", { weekday: "short" }), score: e?.mood != null ? 5 - e.mood : 0 };
  });

  const budgetTotal = (f.budget || []).reduce((a, b) => a + b.amount, 0);
  const remaining = f.income - budgetTotal;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ paddingTop: 8 }}><Lbl>Monthly overview</Lbl><Serif size={32}>Insights</Serif></div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {[
          { l: "Goal progress", v: `${avg}%`, s: "avg across all", c: tk.sage },
          { l: "Budget paid", v: `${pct((f.budget || []).filter(b => b.paid).length, (f.budget || []).length)}%`, s: "of planned items", c: tk.gold },
          { l: "Goals done", v: `${s.goals.filter(g => g.status === "Completed").length}/${s.goals.length}`, s: "completed", c: tk.sky },
          { l: "Content", v: `${s.content.done}/${s.content.goal}`, s: "weekly target", c: tk.plum },
        ].map(it => (
          <Card key={it.l} style={{ textAlign: "center", padding: "22px 14px" }}>
            <Serif size={26} color={it.c}>{it.v}</Serif>
            <Mono size={11} color={d ? tk.di : tk.ink2} style={{ marginTop: 8 }}>{it.l}</Mono>
            <Mono size={10} style={{ marginTop: 4 }}>{it.s}</Mono>
          </Card>
        ))}
      </div>

      {/* Goal breakdown */}
      <Card>
        <Lbl>Goal breakdown</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {s.goals.map(g => (
            <div key={g.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <Mono size={11} color={d ? tk.di : tk.ink2}>{g.title.length > 32 ? g.title.slice(0, 32) + "…" : g.title}</Mono>
                <Mono size={11} color={CAT[g.cat]}>{g.prog}%</Mono>
              </div>
              <PBar v={g.prog} color={CAT[g.cat]} />
            </div>
          ))}
        </div>
      </Card>

      {/* Mood chart */}
      <Card>
        <Lbl>Mood this week</Lbl>
        <ResponsiveContainer width="100%" height={90}>
          <LineChart data={mwk}>
            <XAxis dataKey="day" tick={{ fontFamily: "'DM Mono',monospace", fontSize: 10, fill: d ? tk.di3 : tk.ink3 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: d ? tk.d2 : "#fff", border: "none", borderRadius: 12, fontFamily: "'DM Mono',monospace", fontSize: 11 }} />
            <Line type="monotone" dataKey="score" stroke={tk.plum} strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Work snapshot */}
      {workEnabled && (
        <Card>
          <Lbl>Work snapshot</Lbl>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div style={{ textAlign: "center", padding: "14px 8px", borderRadius: 14, background: d ? tk.d3 : tk.cream2 }}>
              <Serif size={24} color={tk.sage}>{todayDone}/{todayTasks.length}</Serif>
              <Mono size={10} style={{ marginTop: 6 }}>Today's tasks</Mono>
            </div>
            <div style={{ textAlign: "center", padding: "14px 8px", borderRadius: 14, background: d ? tk.d3 : tk.cream2 }}>
              <Serif size={24} color={tk.sky}>{weekDone}/{weekTasks.length}</Serif>
              <Mono size={10} style={{ marginTop: 6 }}>This week</Mono>
            </div>
          </div>
          {work.monthlyTarget?.trim() && (
            <div style={{ padding: "12px 14px", borderRadius: 12, background: d ? tk.d3 : tk.cream2 }}>
              <Mono size={10} color={tk.gold} style={{ marginBottom: 6, letterSpacing: "0.1em", textTransform: "uppercase" }}>Weekly focus</Mono>
              <Mono size={12} color={d ? tk.di2 : tk.ink2}>{work.monthlyTarget.trim()}</Mono>
            </div>
          )}
          {todayTasks.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <PBar v={pct(todayDone, todayTasks.length)} color={tk.sage} />
              <Mono size={10} style={{ marginTop: 6, textAlign: "center" }}>{pct(todayDone, todayTasks.length)}% of today's tasks done</Mono>
            </div>
          )}
        </Card>
      )}

      {/* Finance snapshot */}
      <Card>
        <Lbl>Finance snapshot</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Mono size={13}>Monthly income</Mono>
            <Mono size={13} color={tk.sage}>+₹{f.income.toLocaleString()}</Mono>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Mono size={13}>Budget planned</Mono>
            <Mono size={13} color={tk.rose}>-₹{budgetTotal.toLocaleString()}</Mono>
          </div>
          <div style={{ height: 1, background: d ? "rgba(255,255,255,0.06)" : "rgba(44,36,22,0.08)", margin: "4px 0" }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Mono size={13} color={d ? tk.di : tk.ink}>Remaining</Mono>
            <Mono size={13} color={remaining >= 0 ? tk.sage : tk.rose}>{remaining >= 0 ? "+" : ""}₹{remaining.toLocaleString()}</Mono>
          </div>
        </div>
      </Card>
    </div>
  );
}

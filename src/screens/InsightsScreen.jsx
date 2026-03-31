import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { tk, catColor, pct, today, H_DAILY_HABITS } from "../constants";
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

  const healthDaily = (s.health?.daily || {})[today] || {};
  const healthCfg = s.health?.config || { customHabits: [], hiddenDefaults: [] };
  const activeHabits = [
    ...H_DAILY_HABITS.filter((_, i) => !(healthCfg.hiddenDefaults || []).includes(i)),
    ...(healthCfg.customHabits || []),
  ];
  const habsDone = activeHabits.filter(h => (healthDaily.habits || {})[h]).length;

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
      {(() => {
        const tiles = [
          { l: "Goal progress", v: `${avg}%`, s: "avg across all", c: tk.sage },
          { l: "Budget paid", v: `${pct((f.budget || []).filter(b => b.paid).length, (f.budget || []).length)}%`, s: "of planned items", c: tk.gold },
          { l: "Habits", v: `${habsDone}/${activeHabits.length}`, s: "done today", c: tk.plum },
          ...(workEnabled ? [{ l: "Work", v: `${todayDone}/${todayTasks.length}`, s: "today's tasks", c: tk.sky }] : []),
        ];
        const isOdd = tiles.length % 2 !== 0;
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {tiles.map((it, i) => (
              <Card key={it.l} style={{ textAlign: "center", padding: "22px 14px", ...(isOdd && i === tiles.length - 1 ? { gridColumn: "1 / -1" } : {}) }}>
                <Serif size={26} color={it.c}>{it.v}</Serif>
                <Mono size={11} color={d ? tk.di : tk.ink2} style={{ marginTop: 8 }}>{it.l}</Mono>
                <Mono size={10} style={{ marginTop: 4 }}>{it.s}</Mono>
              </Card>
            ))}
          </div>
        );
      })()}

      {/* Goal breakdown */}
      <Card>
        <Lbl>Goal breakdown</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {s.goals.map(g => (
            <div key={g.id}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <Mono size={11} color={d ? tk.di : tk.ink2}>{g.title.length > 32 ? g.title.slice(0, 32) + "…" : g.title}</Mono>
                <Mono size={11} color={catColor(g.cat)}>{g.prog}%</Mono>
              </div>
              <PBar v={g.prog} color={catColor(g.cat)} />
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
      {workEnabled && work.monthlyTarget?.trim() && (
        <Card>
          <Lbl>Weekly focus</Lbl>
          <Mono size={12} color={d ? tk.di2 : tk.ink2}>{work.monthlyTarget.trim()}</Mono>
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

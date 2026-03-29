import { useState } from "react";
import { tk, PHASES, calcPhase, today } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono, Dots, Btn } from "../ui";

export default function CycleScreen({ s, dp }) {
  const { d } = useT();
  const cyc = s.cycle || { start: "", len: 28, logs: {} };
  const [editing, setEditing] = useState(!cyc.start);
  const [ns, setNs] = useState(cyc.start || "");
  const [nl, setNl] = useState(cyc.len || 28);
  const [tab, setTab] = useState("overview");
  const ci  = calcPhase(cyc.start, cyc.len);
  const ph  = ci ? PHASES[ci.phase] : null;
  const TABS = ["overview", "food", "workout", "self-care"];

  const ts = d ? tk.di3 : tk.ink3;
  const tm = d ? tk.di2 : tk.ink2;
  const tx = d ? tk.di : tk.ink;
  const cbg = d ? tk.d2 : "#fff";
  const inp = d ? tk.d3 : tk.cream;
  const div = d ? "rgba(255,255,255,0.06)" : "rgba(44,36,22,0.07)";

  function saveSetup() { dp({ type: "CYCLE", p: { start: ns, len: +nl || 28 } }); setEditing(false); }

  // ── Setup ──────────────────────────────────────────────────────────────────
  if (editing || !cyc.start) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ paddingTop: 8 }}>
        <Lbl>Your cycle</Lbl>
        <Serif size={32}>Cycle Tracker</Serif>
        <Mono size={12} style={{ marginTop: 6 }}>Enter your cycle details to unlock daily phase guidance, food tips, workout suggestions and self-care ideas.</Mono>
      </div>

      <Card>
        <Lbl>Set up your cycle</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <Mono size={12} color={tm} style={{ marginBottom: 10 }}>First day of your last period</Mono>
            <input type="date" value={ns} onChange={e => setNs(e.target.value)}
              style={{ width: "100%", fontFamily: "'DM Mono',monospace", fontSize: 13, padding: "13px 16px", borderRadius: 14, border: `1px solid ${div}`, background: inp, color: tx, outline: "none" }} />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Mono size={12} color={tm}>Average cycle length</Mono>
              <Mono size={13} color={tk.rose} style={{ fontWeight: 400 }}>{nl} days</Mono>
            </div>
            <input type="range" min={21} max={35} value={nl} onChange={e => setNl(+e.target.value)}
              style={{ "--thumb": tk.rose, "--track": d ? tk.d3 : tk.cream3, accentColor: tk.rose }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
              <Mono size={10} color={ts}>21 days</Mono>
              <Mono size={10} color={ts}>35 days</Mono>
            </div>
          </div>

          {ns && (() => {
            const preview = calcPhase(ns, nl);
            if (!preview) return null;
            const pp = PHASES[preview.phase];
            return (
              <div style={{ borderRadius: 16, padding: "14px 16px", background: d ? pp.dark : pp.light, border: `1px solid ${pp.color}35` }}>
                <Mono size={10} color={pp.color} style={{ letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>You are currently in</Mono>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{pp.emoji}</span>
                  <div>
                    <Serif size={18} color={tx}>{pp.name} Phase</Serif>
                    <Mono size={11} color={pp.color}>{pp.sub} · Day {preview.day} of {preview.len}</Mono>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ padding: "13px 16px", borderRadius: 14, background: inp }}>
            <Mono size={11} color={ts} style={{ lineHeight: 1.75 }}>🔒 Stored only on your device. Never shared. You can update this anytime.</Mono>
          </div>

          <Btn onClick={saveSetup} color={tk.rose} style={{ width: "100%", textAlign: "center", opacity: ns ? 1 : 0.45, pointerEvents: ns ? "auto" : "none" }}>
            Save & see my phase →
          </Btn>
        </div>
      </Card>

      <Lbl>The four phases</Lbl>
      {Object.values(PHASES).map((p, i) => (
        <div key={p.name} className="su" style={{ animationDelay: `${i * 0.06}s`, borderRadius: 20, padding: 20, background: cbg, border: `1px solid ${div}`, borderLeft: `4px solid ${p.color}`, boxShadow: d ? "0 2px 12px rgba(0,0,0,0.3)" : "0 1px 12px rgba(44,36,22,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div><Serif size={17} color={tx}>{p.emoji} {p.name}</Serif><Mono size={11} color={p.color} style={{ marginTop: 2 }}>{p.range} · {p.sub}</Mono></div>
            <Dots n={p.energy} color={p.color} />
          </div>
          <Mono size={11} color={ts} style={{ lineHeight: 1.7 }}>{p.desc.slice(0, 118)}…</Mono>
        </div>
      ))}
    </div>
  );

  // ── Main tracker ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 8 }}>
        <div><Lbl>Your cycle</Lbl><Serif size={32}>Cycle Tracker</Serif></div>
        <Btn onClick={() => setEditing(true)} variant="outline" style={{ padding: "7px 16px", fontSize: 11 }}>Edit</Btn>
      </div>

      {/* Hero */}
      <div className="su pi" style={{ borderRadius: 24, padding: 24, position: "relative", overflow: "hidden", background: d ? ph.dark : ph.light, border: `1px solid ${ph.color}30`, boxShadow: `0 6px 30px ${ph.color}22` }}>
        <div style={{ position: "absolute", right: 14, top: 10, fontSize: 88, opacity: 0.1, pointerEvents: "none", lineHeight: 1 }}>{ph.emoji}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: ph.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 16px ${ph.color}55`, flexShrink: 0 }}><span style={{ fontSize: 26 }}>{ph.emoji}</span></div>
          <div><Serif size={22} color={tx}>{ph.name} Phase</Serif><Mono size={11} color={ph.color} style={{ marginTop: 2 }}>{ph.sub}</Mono></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
          {[
            { l: "Cycle day", v: ci.day, s: `of ${ci.len}` },
            { l: "Next period", v: ci.nextIn, s: "days away" },
            { l: "Energy", v: null, e: ph.energy, s: ph.energyLabel || ["", "Very low", "Low", "Moderate", "High", "Peak"][ph.energy] },
          ].map((it, i) => (
            <div key={i} style={{ padding: "12px 10px", borderRadius: 14, background: "rgba(255,255,255,0.32)", backdropFilter: "blur(6px)" }}>
              <Mono size={9} color={ts} style={{ letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>{it.l}</Mono>
              {it.v != null ? <Serif size={26} color={ph.color}>{it.v}</Serif> : <div style={{ paddingTop: 4 }}><Dots n={it.e} color={ph.color} /></div>}
              <Mono size={10} color={ts} style={{ marginTop: 4 }}>{it.s}</Mono>
            </div>
          ))}
        </div>

        <Mono size={12} color={tm} style={{ lineHeight: 1.75 }}>{ph.desc}</Mono>
      </div>

      {/* Timeline bar */}
      <Card>
        <Lbl>Your cycle timeline</Lbl>
        <div style={{ display: "flex", gap: 3, marginBottom: 10 }}>
          {[["menstrual", 18], ["follicular", 29], ["ovulatory", 14], ["luteal", 39]].map(([k, w]) => {
            const active = ci.phase === k, p = PHASES[k];
            return <div key={k} style={{ flex: w, height: 12, borderRadius: 8, background: active ? p.color : (d ? tk.d3 : tk.cream3), boxShadow: active ? `0 2px 10px ${p.color}70` : "none", transition: "all 0.4s ease" }} />;
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {Object.entries(PHASES).map(([k, p]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: ci.phase === k ? p.color : (d ? tk.d3 : tk.cream3) }} />
              <Mono size={9} color={ci.phase === k ? p.color : ts}>{p.name.slice(0, 3)}</Mono>
            </div>
          ))}
        </div>

        {ci.nextPeriod && (
          <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 14, background: d ? tk.d3 : tk.cream, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Mono size={12} color={tm}>🗓 Next period expected</Mono>
            <Mono size={12} color={tk.rose} style={{ fontWeight: 400 }}>
              {ci.nextPeriod.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </Mono>
          </div>
        )}
      </Card>

      {/* Mood + work */}
      <Card style={{ borderLeft: `4px solid ${ph.color}` }}>
        <Lbl>Mood forecast</Lbl>
        <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: tx, lineHeight: 1.65, marginBottom: 12 }}>{ph.mood.feel}</p>
        <div style={{ padding: "12px 14px", borderRadius: 12, background: d ? ph.dark : ph.light }}>
          <Mono size={11} color={ph.color} style={{ lineHeight: 1.75 }}>💡 {ph.mood.tip}</Mono>
        </div>
      </Card>

      <Card>
        <Lbl>Work & productivity</Lbl>
        <Mono size={12} color={tm} style={{ lineHeight: 1.75 }}>{ph.work}</Mono>
      </Card>

      {/* Tab nav */}
      <div style={{ display: "flex", gap: 4, padding: 4, borderRadius: 16, background: d ? tk.d1 : tk.cream2 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "9px 4px", borderRadius: 12, border: "none", cursor: "pointer",
            fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.03em",
            background: tab === t ? (d ? tk.d3 : "#fff") : "transparent",
            color: tab === t ? ph.color : ts,
            boxShadow: tab === t ? (d ? "0 1px 6px rgba(0,0,0,0.35)" : "0 1px 8px rgba(44,36,22,0.1)") : "none",
            transition: "all 0.2s ease",
          }}>
            {t === "self-care" ? "Self care" : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* All phases */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(PHASES).map(([k, p]) => {
            const active = ci.phase === k;
            return (
              <div key={k} className="su" style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 18, background: active ? (d ? p.dark : p.light) : (d ? tk.d2 : "#fff"), border: `1px solid ${active ? p.color + "45" : div}`, boxShadow: active ? `0 2px 14px ${p.color}1a` : "0 1px 8px rgba(44,36,22,0.05)" }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{p.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Serif size={16} color={active ? p.color : tx}>{p.name}</Serif>
                    <Mono size={10} color={ts}>{p.range}</Mono>
                  </div>
                  <Mono size={11} color={ts} style={{ marginBottom: 6 }}>{p.sub}</Mono>
                  <Dots n={p.energy} color={p.color} />
                </div>
                {active && <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, boxShadow: `0 0 10px ${p.color}`, flexShrink: 0 }} />}
              </div>
            );
          })}
        </div>
      )}

      {/* Food */}
      {tab === "food" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <Mono size={10} color={tk.sage} style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>✓ Eat more of this</Mono>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ph.food.eat.map((item, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 14, background: d ? "#182e1a" : tk.sageL }}>
                  <Mono size={12} color={tm}>{item}</Mono>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Mono size={10} color={tk.rose} style={{ letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>✗ Best to avoid</Mono>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ph.food.avoid.map((item, i) => (
                <div key={i} style={{ padding: "12px 14px", borderRadius: 14, background: d ? tk.d3 : tk.roseL }}>
                  <Mono size={12} color={tm}>{item}</Mono>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Workout */}
      {tab === "workout" && (
        <Card>
          <Lbl>This phase</Lbl>
          <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 15, color: ph.color, lineHeight: 1.65, marginBottom: 18 }}>{ph.workout.note}</p>
          <Lbl>Recommended for you</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {ph.workout.list.map((item, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: d ? ph.dark : ph.light }}>
                <Mono size={13} color={tx}>{item}</Mono>
              </div>
            ))}
          </div>
          <div style={{ padding: "14px 16px", borderRadius: 14, background: d ? tk.d3 : tk.roseL }}>
            <Mono size={10} color={tk.rose} style={{ letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Best to skip</Mono>
            <Mono size={12} color={tm}>{ph.workout.skip}</Mono>
          </div>
        </Card>
      )}

      {/* Self care */}
      {tab === "self-care" && (
        <Card>
          <Lbl>Things that will actually help right now</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {ph.care.map((item, i) => (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 14, background: i % 2 === 0 ? (d ? tk.d3 : tk.cream) : (d ? ph.dark : ph.light) }}>
                <Mono size={13} color={tx}>{item}</Mono>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Symptom logger */}
      <Card>
        <Lbl>Log today's symptoms</Lbl>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {["Cramps", "Bloating", "Headache", "Fatigue", "Brain fog", "Mood swings", "Cravings", "Tender", "Back pain", "High energy", "Clear-headed", "Happy", "Irritable", "Anxious", "Motivated", "Confident"].map(sym => {
            const on = (cyc.logs?.[today] || []).includes(sym);
            return (
              <button key={sym} onClick={() => dp({ type: "CYC_SYM", d: today, sym })} style={{
                padding: "8px 14px", borderRadius: 20, border: `1px solid ${on ? ph.color : div}`,
                background: on ? (d ? ph.dark : ph.light) : "transparent", cursor: "pointer",
                fontFamily: "'DM Mono',monospace", fontSize: 11, color: on ? ph.color : ts, transition: "all 0.2s ease",
              }}>{sym}</button>
            );
          })}
        </div>
      </Card>

      <Btn onClick={() => setEditing(true)} variant="outline" style={{ width: "100%", textAlign: "center", padding: "13px" }}>⚙ Update cycle settings</Btn>
    </div>
  );
}

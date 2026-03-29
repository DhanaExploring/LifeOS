import { useState } from "react";
import { tk, MOODS, today } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono, Btn } from "../ui";

export default function JournalScreen({ s, dp }) {
  const { d } = useT();
  const e = s.moods[today] || { mood: null, note: "" };
  const [note, setNote] = useState(e.note || "");
  const recent = Object.entries(s.moods).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 8);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ paddingTop: 8 }}><Lbl>Reflect daily</Lbl><Serif size={32}>Journal</Serif></div>

      {/* Mood picker */}
      <Card>
        <Lbl>Today's mood</Lbl>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "0 2px" }}>
          {MOODS.map((m, i) => (
            <button key={i} onClick={() => dp({ type: "MOOD", d: today, mood: i, note })} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "12px 6px", borderRadius: 18, border: "none", cursor: "pointer",
              background: e.mood === i ? (m.c + "22") : "transparent",
              transform: e.mood === i ? "scale(1.12)" : "scale(1)",
              opacity: e.mood === i ? 1 : 0.38,
              transition: "all 0.22s cubic-bezier(0.34,1.56,0.64,1)",
            }}>
              <span style={{ fontSize: 30 }}>{m.e}</span>
              <Mono size={10} color={m.c}>{m.l}</Mono>
            </button>
          ))}
        </div>
      </Card>

      {/* Reflection */}
      <Card>
        <Lbl>Daily reflection</Lbl>
        <textarea value={note} onChange={ev => setNote(ev.target.value)} maxLength={300}
          placeholder="What's on your mind today…"
          style={{
            width: "100%", fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 15,
            padding: "14px 16px", borderRadius: 14,
            border: `1px solid ${d ? "rgba(255,255,255,0.07)" : "rgba(44,36,22,0.09)"}`,
            background: d ? tk.d3 : tk.cream, color: d ? tk.di : tk.ink,
            outline: "none", resize: "none", lineHeight: 1.7, minHeight: 110,
          }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
          <Mono size={11}>{note.length}/300</Mono>
          <Btn onClick={() => dp({ type: "MOOD", d: today, mood: e.mood, note })}>Save</Btn>
        </div>
      </Card>

      {/* Recent entries */}
      {recent.length > 0 && (
        <Card>
          <Lbl>Recent entries</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent.map(([dt, en]) => {
              const mood = en.mood != null ? MOODS[en.mood] : null;
              return (
                <div key={dt} style={{ padding: "14px 16px", borderRadius: 16, background: d ? tk.d3 : tk.cream }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: en.note ? 8 : 0 }}>
                    {mood && <span style={{ fontSize: 18 }}>{mood.e}</span>}
                    <Mono size={11}>{new Date(dt + "T12:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })}</Mono>
                    {mood && <Mono size={11} color={mood.c} style={{ marginLeft: "auto" }}>{mood.l}</Mono>}
                  </div>
                  {en.note && (
                    <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 13, color: d ? tk.di3 : tk.ink3, lineHeight: 1.65 }}>"{en.note}"</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

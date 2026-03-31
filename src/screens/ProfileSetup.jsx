import { useState } from "react";
import { tk } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono } from "../ui";

export default function ProfileSetup({ onDone, dp, existingProfile }) {
  const { d } = useT();
  const [name, setName] = useState(existingProfile?.name || "");
  const [gender, setGender] = useState(existingProfile?.gender || "");

  function save() {
    if (!name.trim() || !gender) return;
    dp({ type: "PROFILE", p: { name: name.trim(), gender } });
    if (onDone) onDone();
  }

  const genders = [
    { id: "female", label: "Female", emoji: "♀" },
    { id: "male", label: "Male", emoji: "♂" },
    { id: "other", label: "Other", emoji: "⚧" },
  ];

  return (
    <div style={{
      position: "fixed", inset: 0, background: d ? tk.d0 : tk.cream,
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 40, color: tk.sage, display: "block", marginBottom: 12 }}>☯</span>
          <Serif size={28}>Welcome to LifeOS</Serif>
          <Mono size={12} style={{ marginTop: 8 }}>Let's personalise your experience</Mono>
        </div>

        <Card style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <Lbl>Your name</Lbl>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name…"
              maxLength={50}
              style={{
                width: "100%", boxSizing: "border-box",
                fontFamily: "'DM Mono',monospace", fontSize: 13,
                padding: "12px 16px", borderRadius: 14,
                border: `1px solid ${d ? "rgba(255,255,255,0.1)" : "rgba(44,36,22,0.12)"}`,
                background: d ? tk.d3 : tk.cream2, color: d ? tk.di : tk.ink,
                outline: "none",
              }}
            />
          </div>

          <div>
            <Lbl>Gender</Lbl>
            <Mono size={11} style={{ marginTop: -8, marginBottom: 12, color: d ? tk.di3 : tk.ink3 }}>
              This helps us show relevant features like cycle tracking
            </Mono>
            <div style={{ display: "flex", gap: 10 }}>
              {genders.map(g => (
                <button
                  key={g.id}
                  onClick={() => setGender(g.id)}
                  style={{
                    flex: 1, padding: "14px 8px", borderRadius: 14,
                    border: gender === g.id
                      ? `2px solid ${tk.sage}`
                      : `1px solid ${d ? "rgba(255,255,255,0.08)" : "rgba(44,36,22,0.1)"}`,
                    background: gender === g.id
                      ? (d ? tk.sage + "20" : tk.sageL)
                      : (d ? tk.d3 : tk.cream2),
                    cursor: "pointer", textAlign: "center",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{g.emoji}</span>
                  <span style={{
                    fontFamily: "'DM Mono',monospace", fontSize: 11,
                    color: gender === g.id ? tk.sage : (d ? tk.di2 : tk.ink2),
                  }}>{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={save}
            disabled={!name.trim() || !gender}
            style={{
              width: "100%", padding: "14px 20px", borderRadius: 14,
              border: "none", cursor: name.trim() && gender ? "pointer" : "not-allowed",
              fontFamily: "'DM Mono',monospace", fontSize: 13, letterSpacing: "0.04em",
              background: name.trim() && gender ? tk.sage : (d ? tk.d3 : tk.cream3),
              color: name.trim() && gender ? "#fff" : (d ? tk.di3 : tk.ink3),
              boxShadow: name.trim() && gender ? `0 3px 14px ${tk.sage}55` : "none",
              transition: "all 0.2s",
            }}
          >
            {existingProfile?.name ? "Update profile" : "Get started"}
          </button>
        </Card>
      </div>
    </div>
  );
}

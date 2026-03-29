import { tk } from "./constants";
import { useT } from "./ThemeContext";

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, cls = "" }) {
  const { d } = useT();
  return (
    <div className={`su ${cls}`} style={{
      background: d ? tk.d2 : "#fff",
      borderRadius: 20,
      padding: 20,
      border: `1px solid ${d ? "rgba(255,255,255,0.045)" : "rgba(44,36,22,0.055)"}`,
      boxShadow: d ? "0 2px 16px rgba(0,0,0,0.35)" : "0 2px 20px rgba(44,36,22,0.07)",
      ...style,
    }}>{children}</div>
  );
}

// ── Typography ───────────────────────────────────────────────────────────────
export function Lbl({ children, style = {} }) {
  const { d } = useT();
  return (
    <p style={{
      fontFamily: "'DM Mono',monospace", fontSize: 10, letterSpacing: "0.15em",
      textTransform: "uppercase", color: d ? tk.di3 : tk.ink3, marginBottom: 14, ...style,
    }}>{children}</p>
  );
}

export function Serif({ children, size = 28, color, style = {} }) {
  const { d } = useT();
  return (
    <p style={{
      fontFamily: "'Playfair Display',serif", fontSize: size,
      color: color || (d ? tk.di : tk.ink), lineHeight: 1.2, ...style,
    }}>{children}</p>
  );
}

export function Mono({ children, size = 13, color, style = {} }) {
  const { d } = useT();
  return (
    <p style={{
      fontFamily: "'DM Mono',monospace", fontSize: size,
      color: color || (d ? tk.di2 : tk.ink2), lineHeight: 1.6, ...style,
    }}>{children}</p>
  );
}

// ── Progress Bar ─────────────────────────────────────────────────────────────
export function PBar({ v, color = tk.sage, h = 5 }) {
  const { d } = useT();
  return (
    <div style={{ width: "100%", height: h, borderRadius: h, background: d ? tk.d3 : tk.cream3, overflow: "hidden" }}>
      <div style={{
        height: "100%", width: `${v}%`, background: color, borderRadius: h,
        transition: "width 0.55s cubic-bezier(0.34,1.56,0.64,1)",
      }} />
    </div>
  );
}

// ── Ring (circular progress) ─────────────────────────────────────────────────
export function Ring({ v, size = 82, stroke = 6, color = tk.sage }) {
  const { d } = useT();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (v / 100) * c;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={d ? tk.d3 : tk.cream3} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`} style={{ transition: "stroke-dashoffset 0.7s ease" }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fill: color }}>{v}%</text>
    </svg>
  );
}

// ── Toggle Switch ────────────────────────────────────────────────────────────
export function Toggle({ on, set, color = tk.sage }) {
  return (
    <button onClick={() => set(!on)} style={{
      width: 46, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
      position: "relative", background: on ? color : "#ccc8c0", transition: "background 0.25s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", top: 3, width: 20, height: 20, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 5px rgba(0,0,0,0.22)", transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        left: on ? 23 : 3,
      }} />
    </button>
  );
}

// ── Status Chip ──────────────────────────────────────────────────────────────
export function Chip({ label }) {
  const map = {
    "Not Started": { c: tk.ink3, bg: tk.cream2 },
    "In Progress": { c: tk.gold, bg: tk.goldL },
    "Completed":   { c: tk.sage, bg: tk.sageL },
  };
  const s = map[label] || map["Not Started"];
  return (
    <span style={{
      fontFamily: "'DM Mono',monospace", fontSize: 10, padding: "4px 10px",
      borderRadius: 20, background: s.bg, color: s.c, whiteSpace: "nowrap",
    }}>{label}</span>
  );
}

// ── Energy Dots ──────────────────────────────────────────────────────────────
export function Dots({ n, max = 5, color }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: "50%",
          background: i < n ? color : "rgba(0,0,0,0.1)", transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, color = tk.sage, variant = "fill", style = {} }) {
  const { d } = useT();
  const base = {
    fontFamily: "'DM Mono',monospace", fontSize: 12, letterSpacing: "0.04em",
    padding: "11px 20px", borderRadius: 14, border: "none", cursor: "pointer",
    transition: "all 0.15s", ...style,
  };
  if (variant === "fill") return <button onClick={onClick} style={{ ...base, background: color, color: "#fff", boxShadow: `0 3px 12px ${color}55` }}>{children}</button>;
  if (variant === "ghost") return <button onClick={onClick} style={{ ...base, background: d ? tk.d3 : tk.cream2, color: d ? tk.di2 : tk.ink2 }}>{children}</button>;
  return <button onClick={onClick} style={{ ...base, background: "transparent", border: `1px solid ${d ? "rgba(255,255,255,0.1)" : "rgba(44,36,22,0.12)"}`, color: d ? tk.di3 : tk.ink3 }}>{children}</button>;
}

// ── Float Input ──────────────────────────────────────────────────────────────
export function FloatInput({ value, onChange, placeholder, style = {} }) {
  const { d } = useT();
  return (
    <input value={value} onChange={onChange} placeholder={placeholder} style={{
      width: "100%", fontFamily: "'DM Mono',monospace", fontSize: 13, padding: "12px 16px",
      borderRadius: 14, border: `1px solid ${d ? "rgba(255,255,255,0.08)" : "rgba(44,36,22,0.1)"}`,
      background: d ? tk.d3 : tk.cream, color: d ? tk.di : tk.ink, outline: "none", ...style,
    }} />
  );
}

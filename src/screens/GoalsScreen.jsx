import { useState } from "react";
import { tk, DEFAULT_CATS, catColor, catColorL } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono, PBar, Chip, Btn, FloatInput } from "../ui";

export default function GoalsScreen({ s, dp }) {
  const { d } = useT();
  const [open, setOpen] = useState(false);
  const allCats = [...DEFAULT_CATS, ...(s.customCategories || [])];
  const [f, setF] = useState({ title: "", cat: allCats[0], deadline: "", status: "Not Started", ms: "" });
  const [filter, setFilter] = useState("All");
  const [addingCat, setAddingCat] = useState(false);
  const [newCat, setNewCat] = useState("");
  const divC = d ? "rgba(255,255,255,0.07)" : "rgba(44,36,22,0.09)";
  const sel = { fontFamily: "'DM Mono',monospace", fontSize: 12, padding: "11px 16px", borderRadius: 14, border: `1px solid ${divC}`, background: d ? tk.d3 : tk.cream, color: d ? tk.di : tk.ink, outline: "none", width: "100%" };

  function add() {
    if (!f.title.trim()) return;
    dp({ type: "ADD_GOAL", p: { ...f, id: Date.now(), prog: 0, ms: f.ms.split(",").map(m => m.trim()).filter(Boolean) } });
    setF({ title: "", cat: allCats[0], deadline: "", status: "Not Started", ms: "" });
    setOpen(false);
  }

  function addCategory() {
    const name = newCat.trim();
    if (!name || allCats.includes(name)) return;
    dp({ type: "ADD_CATEGORY", name });
    setNewCat("");
    setAddingCat(false);
  }

  const cats = ["All", ...allCats];
  const filtered = filter === "All" ? s.goals : s.goals.filter(g => g.cat === filter);
  const completedCount = filtered.filter(g => g.status === "Completed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", paddingTop: 8 }}>
        <div>
          <Lbl>Goals</Lbl><Serif size={32}>Goals</Serif>
          <Mono size={12} style={{ marginTop: 4 }}>{completedCount}/{filtered.length} completed</Mono>
        </div>
        <button onClick={() => setOpen(!open)} style={{ width: 40, height: 40, borderRadius: "50%", background: tk.sage, border: "none", color: "#fff", fontSize: 22, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 2px 14px ${tk.sage}50`, flexShrink: 0 }}>{open ? "×" : "+"}</button>
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {cats.map(cat => {
          const active = filter === cat;
          const color = cat === "All" ? tk.sage : catColor(cat);
          return (
            <button key={cat} onClick={() => setFilter(cat)} style={{
              fontFamily: "'DM Mono',monospace", fontSize: 11, letterSpacing: "0.04em", padding: "8px 16px", borderRadius: 20,
              border: `1.5px solid ${active ? color : divC}`,
              background: active ? (d ? color + "25" : color + "18") : "transparent",
              color: active ? color : (d ? tk.di3 : tk.ink3), cursor: "pointer", transition: "all 0.2s ease", fontWeight: active ? 500 : 400,
            }}>
              {cat !== "All" && <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: catColor(cat), marginRight: 7, verticalAlign: "middle" }} />}
              {cat}
            </button>
          );
        })}
        {!addingCat ? (
          <button onClick={() => setAddingCat(true)} style={{
            fontFamily: "'DM Mono',monospace", fontSize: 11, padding: "8px 14px", borderRadius: 20,
            border: `1.5px dashed ${divC}`, background: "transparent",
            color: d ? tk.di3 : tk.ink3, cursor: "pointer",
          }}>+ Category</button>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()}
              placeholder="Name…" autoFocus
              style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, padding: "7px 12px", borderRadius: 14, border: `1px solid ${divC}`, background: d ? tk.d3 : tk.cream, color: d ? tk.di : tk.ink, outline: "none", width: 100 }} />
            <button onClick={addCategory} style={{ background: tk.sage, border: "none", color: "#fff", borderRadius: 14, padding: "7px 12px", fontFamily: "'DM Mono',monospace", fontSize: 11, cursor: "pointer" }}>Add</button>
            <button onClick={() => { setAddingCat(false); setNewCat(""); }} style={{ background: "none", border: "none", color: d ? tk.di3 : tk.ink3, fontSize: 16, cursor: "pointer" }}>×</button>
          </div>
        )}
      </div>

      {/* New goal form */}
      {open && (
        <Card>
          <Lbl>New goal</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <FloatInput value={f.title} onChange={e => setF(p => ({ ...p, title: e.target.value }))} placeholder="Goal title…" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select value={f.cat} onChange={e => setF(p => ({ ...p, cat: e.target.value }))} style={sel}>{allCats.map(c => <option key={c}>{c}</option>)}</select>
              <select value={f.status} onChange={e => setF(p => ({ ...p, status: e.target.value }))} style={sel}><option>Not Started</option><option>In Progress</option><option>Completed</option></select>
            </div>
            <input type="date" value={f.deadline} onChange={e => setF(p => ({ ...p, deadline: e.target.value }))} style={{ ...sel, width: "100%" }} />
            <FloatInput value={f.ms} onChange={e => setF(p => ({ ...p, ms: e.target.value }))} placeholder="Milestones, comma separated" />
            <Btn onClick={add} style={{ width: "100%", textAlign: "center" }}>Add goal</Btn>
          </div>
        </Card>
      )}

      {/* Goals by category */}
      {(filter === "All" ? allCats : [filter]).map(cat => {
        const gs = filtered.filter(g => g.cat === cat);
        if (!gs.length) return null;
        return (
          <div key={cat}>
            <div onClick={() => setFilter(filter === cat ? "All" : cat)} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, cursor: "pointer", transition: "opacity 0.15s" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: catColor(cat), boxShadow: filter === cat ? `0 0 8px ${catColor(cat)}60` : "none", transition: "box-shadow 0.2s" }} />
              <Lbl style={{ marginBottom: 0 }}>{cat}</Lbl>
              <Mono size={10} color={d ? tk.di3 : tk.ink3}>({gs.length})</Mono>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {gs.map(g => (
                <Card key={g.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ flex: 1, paddingRight: 10 }}>
                      <Mono size={13} color={d ? tk.di : tk.ink2}>{g.title}</Mono>
                      {g.deadline && <Mono size={11} style={{ marginTop: 3 }}>Due {new Date(g.deadline + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Mono>}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Chip label={g.status} />
                      <button onClick={() => dp({ type: "DEL_GOAL", id: g.id })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: d ? tk.di3 : tk.ink3, lineHeight: 1 }}>×</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}><PBar v={g.prog} color={catColor(cat)} /></div>
                    <Mono size={11} color={catColor(cat)} style={{ width: 30, textAlign: "right" }}>{g.prog}%</Mono>
                  </div>
                  <input type="range" min={0} max={100} value={g.prog} onChange={e => dp({ type: "GOAL_P", id: g.id, v: +e.target.value })}
                    style={{ "--thumb": catColor(cat), "--track": d ? tk.d3 : tk.cream3, accentColor: catColor(cat) }} />
                  {g.ms?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                      {g.ms.map((m, i) => <span key={i} style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, padding: "4px 10px", borderRadius: 20, background: d ? tk.d3 : catColorL(cat), color: catColor(cat) }}>{m}</span>)}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && <Card style={{ textAlign: "center", padding: "32px 20px" }}><Mono size={13} color={d ? tk.di3 : tk.ink3}>No goals in {filter}. Tap + to add one.</Mono></Card>}
    </div>
  );
}

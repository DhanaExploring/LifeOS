import { useState, useEffect } from "react";
import { tk, pct } from "../constants";
import { useT } from "../ThemeContext";
import { Card, Lbl, Serif, Mono, PBar, Toggle, Btn } from "../ui";

export default function FinanceScreen({ s, dp }) {
  const { d } = useT();
  const raw = s.finance || {};
  const f = { income: raw.income || 0, budget: raw.budget || [], investments: raw.investments || [], month: raw.month || "", resetDay: raw.resetDay || 1 };
  const curMonth = new Date().toISOString().slice(0, 7);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [ef, setEf] = useState({ name: "", amount: "", repeat: true, cat: "Essentials" });
  const [invText, setInvText] = useState("");
  const [invAmt, setInvAmt] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetNotice, setResetNotice] = useState(false);

  const divC = d ? "rgba(255,255,255,0.07)" : "rgba(44,36,22,0.09)";
  const inp = { fontFamily: "'DM Mono',monospace", fontSize: 13, padding: "12px 16px", borderRadius: 14, border: `1px solid ${divC}`, background: d ? tk.d3 : tk.cream, color: d ? tk.di : tk.ink, outline: "none", width: "100%" };
  const CATS = ["Essentials", "Subscriptions", "Food", "Transport", "Shopping", "Other"];
  const catColors = { Essentials: tk.rose, Subscriptions: tk.plum, Food: tk.gold, Transport: tk.sky, Shopping: tk.sage, Other: tk.di3 };

  // Auto reset on the configured day
  useEffect(() => {
    const todayDay = new Date().getDate();
    if (f.month && f.month !== curMonth && todayDay >= (f.resetDay || 1)) {
      dp({ type: "FIN_RESET_MONTH", m: curMonth });
      setResetNotice(true);
    }
  }, []);

  const totalBudget = f.budget.reduce((a, b) => a + b.amount, 0);
  const totalPaid = f.budget.filter(b => b.paid).reduce((a, b) => a + b.amount, 0);
  const totalPending = totalBudget - totalPaid;
  const recurring = f.budget.filter(b => b.repeat);
  const oneTime = f.budget.filter(b => !b.repeat);

  const totalInvest = f.investments.reduce((a, v) => a + (v.amount || 0), 0);
  const savings = f.income - totalBudget - totalInvest;

  function addItem() {
    if (!ef.name.trim() || !ef.amount) return;
    dp({ type: "FIN_ADD_ITEM", p: { id: Date.now(), name: ef.name.trim(), amount: +ef.amount, repeat: ef.repeat, cat: ef.cat, paid: false } });
    setEf({ name: "", amount: "", repeat: true, cat: "Essentials" }); setAdding(false);
  }
  function saveEdit() {
    if (!ef.name.trim() || !ef.amount) return;
    dp({ type: "FIN_EDIT_ITEM", id: editing, p: { name: ef.name.trim(), amount: +ef.amount, repeat: ef.repeat, cat: ef.cat } });
    setEditing(null); setEf({ name: "", amount: "", repeat: true, cat: "Essentials" });
  }
  function startEdit(b) { setEditing(b.id); setEf({ name: b.name, amount: b.amount, repeat: b.repeat, cat: b.cat || "Essentials" }); setAdding(false); }
  function cancelEdit() { setEditing(null); setEf({ name: "", amount: "", repeat: true, cat: "Essentials" }); }

  const renderForm = (isEdit) => (
    <Card>
      <Lbl>{isEdit ? "Edit expense" : "New expense"}</Lbl>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={ef.name} onChange={e => setEf(p => ({ ...p, name: e.target.value }))} placeholder="Expense name…" style={inp} />
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, padding: "12px 16px", borderRadius: 14, border: `1px solid ${divC}`, background: d ? tk.d3 : tk.cream }}>
            <Mono size={13}>₹</Mono>
            <input type="number" value={ef.amount} onChange={e => setEf(p => ({ ...p, amount: e.target.value }))} placeholder="0"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'DM Mono',monospace", fontSize: 13, color: d ? tk.di : tk.ink }} />
          </div>
          <select value={ef.cat} onChange={e => setEf(p => ({ ...p, cat: e.target.value }))} style={{ ...inp, width: "auto", flex: 1 }}>
            {CATS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0" }}>
          <Mono size={12} color={d ? tk.di2 : tk.ink2}>Repeats monthly</Mono>
          <Toggle on={ef.repeat} set={v => setEf(p => ({ ...p, repeat: v }))} color={tk.gold} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn onClick={isEdit ? saveEdit : addItem} style={{ flex: 1, textAlign: "center" }}>{isEdit ? "Save" : "Add"}</Btn>
          <Btn onClick={isEdit ? cancelEdit : () => setAdding(false)} variant="ghost" style={{ flex: 1, textAlign: "center" }}>Cancel</Btn>
        </div>
      </div>
    </Card>
  );

  const renderItem = (b) => (
    <div key={b.id} className="su" style={{
      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 16,
      background: d ? tk.d2 : "#fff", border: `1px solid ${divC}`,
      boxShadow: d ? "0 1px 8px rgba(0,0,0,0.25)" : "0 1px 8px rgba(44,36,22,0.05)",
      opacity: b.paid ? 0.55 : 1, transition: "opacity 0.2s",
    }}>
      <button onClick={() => dp({ type: "FIN_TOGGLE_PAID", id: b.id })} style={{
        width: 20, height: 20, minWidth: 20, minHeight: 20, aspectRatio: "1/1", borderRadius: "100%", boxSizing: "border-box",
        border: `2px solid ${b.paid ? "transparent" : tk.sage + "60"}`,
        background: b.paid ? tk.sage : "transparent", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s",
        flexShrink: 0, boxShadow: b.paid ? `0 2px 6px ${tk.sage}40` : "none",
      }}>{b.paid && <span style={{ color: "#fff", fontSize: 11 }}>✓</span>}</button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Mono size={13} color={d ? tk.di : tk.ink} style={{ textDecoration: b.paid ? "line-through" : "none" }}>{b.name}</Mono>
          {b.repeat && <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8, padding: "2px 6px", borderRadius: 8, background: d ? tk.d3 : tk.goldL, color: tk.gold }}>↻</span>}
        </div>
        <Mono size={10} color={catColors[b.cat] || tk.ink3}>{b.cat || "Other"}</Mono>
      </div>
      <Mono size={13} color={d ? tk.di2 : tk.ink2} style={{ flexShrink: 0 }}>₹{b.amount.toLocaleString()}</Mono>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button onClick={() => startEdit(b)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: d ? tk.di3 : tk.ink3, padding: 4 }}>✎</button>
        <button onClick={() => dp({ type: "FIN_DEL_ITEM", id: b.id })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: d ? tk.di3 : tk.ink3, padding: 4 }}>×</button>
      </div>
    </div>
  );

  const resetBanner = resetNotice && (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderRadius: 16, background: d ? tk.gold + "18" : tk.goldL, border: `1px solid ${d ? tk.gold + "30" : tk.gold + "25"}`, animation: "toastIn 0.3s ease both" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 18 }}>🔄</span>
        <div><Mono size={12} color={tk.gold} style={{ fontWeight: 600 }}>New month started!</Mono><Mono size={11} color={d ? tk.di2 : tk.ink2}>Time to review your expenses</Mono></div>
      </div>
      <button onClick={() => setResetNotice(false)} style={{ background: "none", border: "none", color: d ? tk.di3 : tk.ink3, cursor: "pointer", fontSize: 16, padding: 4 }}>✕</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingBottom: 32 }}>
      <div className="su" style={{ paddingTop: 8 }}>
        <Lbl>Monthly budget</Lbl><Serif size={32}>Finance</Serif>
        <Mono size={12} style={{ marginTop: 4 }}>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</Mono>
      </div>

      {resetBanner}

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        <Card style={{ textAlign: "center", padding: "18px 10px" }}><Serif size={20} color={tk.gold}>₹{totalBudget.toLocaleString()}</Serif><Mono size={10} style={{ marginTop: 6 }}>Total budget</Mono></Card>
        <Card style={{ textAlign: "center", padding: "18px 10px" }}><Serif size={20} color={tk.sage}>₹{totalPaid.toLocaleString()}</Serif><Mono size={10} style={{ marginTop: 6 }}>Paid</Mono></Card>
        <Card style={{ textAlign: "center", padding: "18px 10px" }}><Serif size={20} color={tk.rose}>₹{totalPending.toLocaleString()}</Serif><Mono size={10} style={{ marginTop: 6 }}>Pending</Mono></Card>
      </div>

      {totalBudget > 0 && (
        <Card>
          <Lbl>Budget progress</Lbl>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <Mono size={11}>{f.budget.filter(b => b.paid).length}/{f.budget.length} paid</Mono>
            <Mono size={11} color={tk.sage}>{pct(totalPaid, totalBudget)}%</Mono>
          </div>
          <PBar v={pct(totalPaid, totalBudget)} color={tk.sage} h={6} />
        </Card>
      )}

      {/* Income */}
      <Card>
        <Lbl>Monthly income</Lbl>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 14, background: d ? tk.d3 : tk.cream }}>
          <Mono size={13}>₹</Mono>
          <input type="number" value={f.income} onChange={e => dp({ type: "FIN", k: "income", v: +e.target.value || 0 })}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "'DM Mono',monospace", fontSize: 13, color: d ? tk.di : tk.ink }} />
        </div>
        {f.income > 0 && (
          <Mono size={11} color={(totalBudget + totalInvest) > f.income ? tk.rose : tk.sage} style={{ marginTop: 10 }}>
            {(totalBudget + totalInvest) > f.income
              ? `⚠ Expenses exceed income by ₹${((totalBudget + totalInvest) - f.income).toLocaleString()}`
              : `✓ ₹${(f.income - totalBudget - totalInvest).toLocaleString()} remaining after budget & investments`}
          </Mono>
        )}
      </Card>

      {/* Savings breakdown */}
      {f.income > 0 && (
        <Card>
          <Lbl>Money breakdown</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Mono size={12} color={d ? tk.di2 : tk.ink2}>Income</Mono>
              <Mono size={12} color={tk.sage}>₹{f.income.toLocaleString()}</Mono>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Mono size={12} color={d ? tk.di2 : tk.ink2}>Budget planned</Mono>
              <Mono size={12} color={tk.rose}>−₹{totalBudget.toLocaleString()}</Mono>
            </div>
            {totalInvest > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Mono size={12} color={d ? tk.di2 : tk.ink2}>Investments</Mono>
                <Mono size={12} color={tk.sky}>−₹{totalInvest.toLocaleString()}</Mono>
              </div>
            )}
            <div style={{ height: 1, background: d ? "rgba(255,255,255,0.07)" : "rgba(44,36,22,0.09)", margin: "2px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Mono size={13} color={d ? tk.di : tk.ink} style={{ fontWeight: 600 }}>{savings >= 0 ? "Savings / Left to plan" : "Overspent"}</Mono>
              <Serif size={20} color={savings >= 0 ? tk.sage : tk.rose}>{savings >= 0 ? "" : "−"}₹{Math.abs(savings).toLocaleString()}</Serif>
            </div>
            {f.income > 0 && (
              <PBar v={Math.max(0, pct(Math.max(0, savings), f.income))} color={savings >= 0 ? tk.sage : tk.rose} h={5} />
            )}
          </div>
        </Card>
      )}

      {/* Edit form */}
      {editing && renderForm(true)}

      {/* Expenses list or empty state */}
      {f.budget.length === 0 && !adding ? (
        <div onClick={() => { setAdding(true); setEditing(null); }} style={{ border: `1.5px dashed ${divC}`, borderRadius: 18, padding: "36px 24px", textAlign: "center", cursor: "pointer", transition: "all 0.15s" }}>
          <Serif size={16} color={d ? tk.di2 : tk.ink2} style={{ marginBottom: 6 }}>No expenses yet</Serif>
          <Mono size={12} color={d ? tk.di3 : tk.ink3}>Tap here to start planning your month</Mono>
        </div>
      ) : <>
        {recurring.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, padding: "3px 8px", borderRadius: 8, background: d ? tk.d3 : tk.goldL, color: tk.gold }}>↻</span>
                <Lbl style={{ marginBottom: 0 }}>Monthly recurring</Lbl>
                <Mono size={10} color={d ? tk.di3 : tk.ink3}>({recurring.length})</Mono>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{recurring.map(renderItem)}</div>
          </div>
        )}

        {oneTime.length > 0 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Lbl style={{ marginBottom: 0 }}>This month only</Lbl>
                <Mono size={10} color={d ? tk.di3 : tk.ink3}>({oneTime.length})</Mono>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{oneTime.map(renderItem)}</div>
          </div>
        )}

        {adding ? renderForm(false) : (
          <button onClick={() => { setAdding(true); setEditing(null); }} style={{
            width: "100%", padding: "14px", borderRadius: 16, border: `1.5px dashed ${divC}`,
            background: "transparent", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 12,
            color: d ? tk.di3 : tk.ink3, transition: "all 0.15s",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add expense
          </button>
        )}
      </>}

      {/* Investments */}
      <Card>
        <Lbl>Investments to consider</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {f.investments.length === 0 && <Mono size={12} color={d ? tk.di3 : tk.ink3} style={{ textAlign: "center", padding: "12px 0" }}>No investments noted yet.</Mono>}
          {f.investments.map(inv => (
            <div key={inv.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 14, background: d ? tk.d3 : tk.cream }}>
              <span style={{ color: tk.sky, fontSize: 11 }}>◈</span>
              <div style={{ flex: 1, minWidth: 0 }}><Mono size={12} color={d ? tk.di : tk.ink2}>{inv.name}</Mono></div>
              {inv.amount > 0 && <Mono size={11} color={tk.sky}>₹{inv.amount.toLocaleString()}</Mono>}
              <button onClick={() => dp({ type: "FIN_DEL_INV", id: inv.id })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: d ? tk.di3 : tk.ink3, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={invText} onChange={e => setInvText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && invText.trim()) { dp({ type: "FIN_ADD_INV", p: { id: Date.now(), name: invText.trim(), amount: +invAmt || 0 } }); setInvText(""); setInvAmt(""); } }} placeholder="e.g. SIP, FD, Stocks…" style={{ ...inp, flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 0, minWidth: 100, padding: "12px 14px", borderRadius: 14, border: `1px solid ${divC}`, background: d ? tk.d3 : tk.cream }}>
              <Mono size={11}>₹</Mono>
              <input type="number" value={invAmt} onChange={e => setInvAmt(e.target.value)} placeholder="0"
                style={{ flex: 1, width: "100%", background: "transparent", border: "none", outline: "none", fontFamily: "'DM Mono',monospace", fontSize: 12, color: d ? tk.di : tk.ink }} />
            </div>
          </div>
          <button onClick={() => { if (invText.trim()) { dp({ type: "FIN_ADD_INV", p: { id: Date.now(), name: invText.trim(), amount: +invAmt || 0 } }); setInvText(""); setInvAmt(""); } }}
            style={{ width: "100%", padding: "13px 16px", borderRadius: 14, background: tk.sky, border: "none", color: "#fff", cursor: "pointer", fontFamily: "'DM Mono',monospace", fontSize: 12, letterSpacing: "0.03em" }}>+ Add investment</button>
        </div>
      </Card>

      {/* Monthly reset — collapsible */}
      <Card>
        <div onClick={() => setShowReset(!showReset)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lbl style={{ marginBottom: 0 }}>Monthly reset</Lbl>
            <Mono size={11} color={tk.gold}>↻ {f.resetDay}{f.resetDay === 1 ? "st" : f.resetDay === 2 ? "nd" : f.resetDay === 3 ? "rd" : "th"} of every month</Mono>
          </div>
          <span style={{ fontSize: 14, color: d ? tk.di3 : tk.ink3, transition: "transform 0.2s", transform: showReset ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
        </div>
        {showReset && (
          <div style={{ marginTop: 14 }}>
            <Mono size={12} color={d ? tk.di2 : tk.ink2} style={{ marginBottom: 14, lineHeight: 1.6 }}>
              Budget resets automatically every month on this day. Recurring items get marked unpaid, completed one-time items are removed.
            </Mono>
            <Mono size={11} color={d ? tk.di3 : tk.ink3} style={{ marginBottom: 8 }}>Reset day of month</Mono>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {Array.from({ length: 31 }).map((_, i) => {
                const day = i + 1; const active = f.resetDay === day;
                return (
                  <button key={day} onClick={() => dp({ type: "FIN", k: "resetDay", v: day })} style={{
                    width: 36, height: 36, borderRadius: "50%",
                    border: `1.5px solid ${active ? tk.gold : divC}`,
                    background: active ? (d ? tk.gold + "30" : tk.goldL) : "transparent",
                    color: active ? tk.gold : (d ? tk.di3 : tk.ink3), cursor: "pointer",
                    fontFamily: "'DM Mono',monospace", fontSize: 12,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", fontWeight: active ? 600 : 400,
                  }}>{day}</button>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

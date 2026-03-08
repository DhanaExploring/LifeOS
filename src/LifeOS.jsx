import { useState, useReducer, createContext, useContext } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

const ThemeCtx = createContext();
const useTheme = () => useContext(ThemeCtx);
const today = new Date().toISOString().split("T")[0];

const MOODS = [
  { emoji: "😄", label: "Great", color: "#6cb97a" },
  { emoji: "🙂", label: "Good", color: "#8aad8e" },
  { emoji: "😐", label: "Okay", color: "#c9b99a" },
  { emoji: "😔", label: "Low", color: "#c4a882" },
  { emoji: "😤", label: "Rough", color: "#b89090" },
];

const initState = {
  habits: [
    { id: 1, name: "Morning meditation", icon: "🧘" },
    { id: 2, name: "Read 20 min", icon: "📖" },
    { id: 3, name: "No junk food", icon: "🥗" },
    { id: 4, name: "Journal", icon: "✍️" },
  ],
  habitLogs: { [today]: { 1: true, 2: false, 3: true, 4: false } },
  goals: [
    { id: 1, title: "Launch personal website", category: "Work", progress: 65, deadline: "2025-03-31", status: "In Progress", milestones: ["Design", "Build", "Deploy"] },
    { id: 2, title: "Run a 10K", category: "Health", progress: 40, deadline: "2025-04-15", status: "In Progress", milestones: ["5K first", "Build endurance", "Race day"] },
    { id: 3, title: "Save ₹1,00,000", category: "Finance", progress: 30, deadline: "2025-12-31", status: "In Progress", milestones: ["₹25k", "₹50k", "₹1L"] },
    { id: 4, title: "Grow to 1K subscribers", category: "Content", progress: 12, deadline: "2025-06-30", status: "Not Started", milestones: ["100 subs", "500 subs", "1K subs"] },
  ],
  healthLogs: { [today]: { water: 6, workout: true, sleep: 7.5, steps: 8200 } },
  financeLogs: { income: 65000, expenses: 42000, savingsTarget: 100000, saved: 30000 },
  contentLogs: { ideas: ["Deep work routine vlog", "Budget tracker tutorial", "Morning routine 2025"], planned: 4, completed: 2, weeklyGoal: 3 },
  moods: { [today]: { mood: 1, reflection: "Focused and calm today. Got a lot done in the morning block." } },
  darkMode: false,
};

const weekMoodData = [{ day: "Mon", score: 4 }, { day: "Tue", score: 3 }, { day: "Wed", score: 5 }, { day: "Thu", score: 4 }, { day: "Fri", score: 3 }, { day: "Sat", score: 4 }, { day: "Sun", score: 5 }];
const weekHealthData = [{ day: "Mon", water: 8, sleep: 7 }, { day: "Tue", water: 6, sleep: 6.5 }, { day: "Wed", water: 7, sleep: 8 }, { day: "Thu", water: 5, sleep: 7 }, { day: "Fri", water: 6, sleep: 7.5 }, { day: "Sat", water: 9, sleep: 9 }, { day: "Sun", water: 8, sleep: 8 }];
const pct = (v, t) => Math.min(100, Math.round((v / t) * 100));

function reducer(state, action) {
  switch (action.type) {
    case "TOGGLE_DARK": return { ...state, darkMode: !state.darkMode };
    case "TOGGLE_HABIT": {
      const logs = { ...state.habitLogs };
      logs[action.date] = { ...(logs[action.date] || {}), [action.habitId]: !(logs[action.date]?.[action.habitId]) };
      return { ...state, habitLogs: logs };
    }
    case "UPDATE_HEALTH": {
      const logs = { ...state.healthLogs };
      logs[action.date] = { ...(logs[action.date] || {}), [action.key]: action.val };
      return { ...state, healthLogs: logs };
    }
    case "UPDATE_GOAL_PROGRESS":
      return { ...state, goals: state.goals.map(g => g.id === action.id ? { ...g, progress: action.value, status: action.value === 100 ? "Completed" : action.value > 0 ? "In Progress" : g.status } : g) };
    case "ADD_GOAL": return { ...state, goals: [...state.goals, action.payload] };
    case "UPDATE_FINANCE": return { ...state, financeLogs: { ...state.financeLogs, [action.key]: action.val } };
    case "UPDATE_CONTENT": return { ...state, contentLogs: { ...state.contentLogs, [action.key]: action.val } };
    case "ADD_IDEA": return { ...state, contentLogs: { ...state.contentLogs, ideas: [...state.contentLogs.ideas, action.idea] } };
    case "REMOVE_IDEA": return { ...state, contentLogs: { ...state.contentLogs, ideas: state.contentLogs.ideas.filter((_, i) => i !== action.index) } };
    case "SAVE_MOOD": { const moods = { ...state.moods }; moods[action.date] = { mood: action.mood, reflection: action.reflection }; return { ...state, moods }; }
    default: return state;
  }
}

function Card({ children, className = "" }) {
  const { dark } = useTheme();
  return <div className={`rounded-2xl p-5 ${dark ? "bg-zinc-800" : "bg-white"} ${className}`} style={{ boxShadow: dark ? "0 1px 4px rgba(0,0,0,0.4)" : "0 1px 10px rgba(0,0,0,0.07)" }}>{children}</div>;
}

function ST({ children }) {
  const { dark } = useTheme();
  return <h2 className={`text-xs font-semibold tracking-widest uppercase mb-4 ${dark ? "text-zinc-500" : "text-stone-400"}`}>{children}</h2>;
}

function PBar({ value, color = "#8aad8e" }) {
  const { dark } = useTheme();
  return <div className={`w-full h-1.5 rounded-full ${dark ? "bg-zinc-700" : "bg-stone-100"} overflow-hidden`}><div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, background: color }} /></div>;
}

function Badge({ label }) {
  const cls = { "Not Started": "bg-stone-100 text-stone-400", "In Progress": "bg-amber-50 text-amber-600", "Completed": "bg-green-50 text-green-600" };
  return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cls[label] || cls["Not Started"]}`}>{label}</span>;
}

function Ring({ value, size = 76, stroke = 6, color = "#8aad8e" }) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, offset = circ - (value / 100) * circ;
  return <svg width={size} height={size}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e8e0d8" strokeWidth={stroke} /><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset 0.6s ease" }} /><text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="13" fontWeight="600" fill={color}>{value}%</text></svg>;
}

function Toggle({ value, onChange }) {
  return <button onClick={() => onChange(!value)} className="w-11 h-6 rounded-full relative transition-all duration-300" style={{ background: value ? "#8aad8e" : "#e2e8f0" }}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${value ? "left-5" : "left-0.5"}`} /></button>;
}

const CAT_COLORS = { Work: "#7b9ec7", Health: "#8aad8e", Finance: "#c9a96e", Content: "#b08ec7" };

function HomeScreen({ state, dispatch }) {
  const { dark } = useTheme();
  const todayH = state.habitLogs[today] || {};
  const done = Object.values(todayH).filter(Boolean).length;
  const hPct = state.habits.length ? pct(done, state.habits.length) : 0;
  const moodEntry = state.moods[today];
  const moodObj = moodEntry?.mood != null ? MOODS[moodEntry.mood] : null;
  const h = new Date().getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const hl = state.healthLogs[today];
  return (
    <div className="space-y-4 pb-8">
      <div className="pt-2">
        <p className={`text-xs tracking-widest uppercase ${dark?"text-zinc-500":"text-stone-400"}`}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
        <h1 className={`text-3xl font-light mt-1 ${dark?"text-zinc-100":"text-stone-700"}`}>{greeting} ✦</h1>
        <p className={`text-sm mt-0.5 ${dark?"text-zinc-500":"text-stone-400"}`}>Here's your life at a glance.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center justify-center text-center py-6">
          <Ring value={hPct} /><p className={`text-xs mt-2 ${dark?"text-zinc-400":"text-stone-500"}`}>Habits done</p><p className={`text-xs ${dark?"text-zinc-600":"text-stone-300"}`}>{done}/{state.habits.length} today</p>
        </Card>
        <Card className="flex flex-col items-center justify-center text-center py-6">
          {moodObj ? <><span className="text-4xl">{moodObj.emoji}</span><p className="text-xs mt-2 font-medium" style={{color:moodObj.color}}>{moodObj.label}</p><p className={`text-xs mt-0.5 ${dark?"text-zinc-500":"text-stone-400"}`}>Today's mood</p></> : <><span className="text-3xl opacity-25">☁️</span><p className={`text-xs mt-2 ${dark?"text-zinc-500":"text-stone-400"}`}>Log your mood</p></>}
        </Card>
      </div>
      {hl && <Card><ST>Today at a glance</ST><div className="grid grid-cols-4 gap-2 text-center">{[{icon:"💧",val:`${hl.water}`,label:"glasses"},{icon:"🏃",val:hl.workout?"Done":"Rest",label:"workout"},{icon:"😴",val:`${hl.sleep}h`,label:"sleep"},{icon:"👟",val:`${(hl.steps/1000).toFixed(1)}k`,label:"steps"}].map(s=><div key={s.label}><div className="text-xl">{s.icon}</div><div className={`text-sm font-semibold mt-1 ${dark?"text-zinc-200":"text-stone-700"}`}>{s.val}</div><div className={`text-xs ${dark?"text-zinc-600":"text-stone-400"}`}>{s.label}</div></div>)}</div></Card>}
      <Card><ST>Top goals</ST><div className="space-y-4">{state.goals.filter(g=>g.status!=="Completed").slice(0,3).map(g=><div key={g.id}><div className="flex justify-between items-center mb-1.5"><span className={`text-sm ${dark?"text-zinc-300":"text-stone-600"}`}>{g.title}</span><span className={`text-xs ${dark?"text-zinc-500":"text-stone-400"}`}>{g.progress}%</span></div><PBar value={g.progress} color={CAT_COLORS[g.category]} /></div>)}</div></Card>
      <Card><ST>Mood this week</ST><ResponsiveContainer width="100%" height={80}><LineChart data={weekMoodData}><XAxis dataKey="day" tick={{fontSize:10,fill:dark?"#71717a":"#a8a29e"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:dark?"#27272a":"#fff",border:"none",borderRadius:12,fontSize:12}}/><Line type="monotone" dataKey="score" stroke="#8aad8e" strokeWidth={2} dot={{fill:"#8aad8e",r:3}}/></LineChart></ResponsiveContainer></Card>
      {moodEntry?.reflection && <Card><ST>Today's reflection</ST><p className={`text-sm leading-relaxed italic ${dark?"text-zinc-400":"text-stone-500"}`}>"{moodEntry.reflection}"</p></Card>}
    </div>
  );
}

function GoalsScreen({ state, dispatch }) {
  const { dark } = useTheme();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", category: "Work", deadline: "", status: "Not Started" });
  function addGoal() { if (!form.title.trim()) return; dispatch({ type: "ADD_GOAL", payload: { ...form, id: Date.now(), progress: 0, milestones: [] } }); setForm({ title: "", category: "Work", deadline: "", status: "Not Started" }); setAdding(false); }
  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between pt-2">
        <div><h1 className={`text-2xl font-light ${dark?"text-zinc-100":"text-stone-700"}`}>Goals</h1><p className={`text-xs mt-0.5 ${dark?"text-zinc-500":"text-stone-400"}`}>{state.goals.filter(g=>g.status==="Completed").length}/{state.goals.length} completed</p></div>
        <button onClick={()=>setAdding(!adding)} className="w-9 h-9 rounded-full text-white text-xl flex items-center justify-center" style={{background:"#8aad8e"}}>{adding?"×":"+"}</button>
      </div>
      {adding && <Card><ST>New goal</ST><div className="space-y-3"><input className={`w-full text-sm rounded-xl px-4 py-3 outline-none ${dark?"bg-zinc-700 text-zinc-100 placeholder-zinc-500":"bg-stone-50 text-stone-700 placeholder-stone-300"}`} placeholder="Goal title…" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/><div className="grid grid-cols-2 gap-2"><select className={`text-sm rounded-xl px-3 py-2.5 outline-none ${dark?"bg-zinc-700 text-zinc-200":"bg-stone-50 text-stone-600"}`} value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>{Object.keys(CAT_COLORS).map(c=><option key={c}>{c}</option>)}</select><select className={`text-sm rounded-xl px-3 py-2.5 outline-none ${dark?"bg-zinc-700 text-zinc-200":"bg-stone-50 text-stone-600"}`} value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option>Not Started</option><option>In Progress</option><option>Completed</option></select></div><input type="date" className={`w-full text-sm rounded-xl px-4 py-3 outline-none ${dark?"bg-zinc-700 text-zinc-100":"bg-stone-50 text-stone-600"}`} value={form.deadline} onChange={e=>setForm(f=>({...f,deadline:e.target.value}))}/><button onClick={addGoal} className="w-full py-3 rounded-xl text-white text-sm font-medium" style={{background:"#8aad8e"}}>Add Goal</button></div></Card>}
      {["Work","Health","Finance","Content"].map(cat => {
        const gs = state.goals.filter(g => g.category === cat);
        if (!gs.length) return null;
        return <div key={cat}><ST>{cat}</ST><div className="space-y-3">{gs.map(g=><Card key={g.id}><div className="flex items-start justify-between mb-3"><div className="flex-1 pr-3"><p className={`text-sm font-medium ${dark?"text-zinc-100":"text-stone-700"}`}>{g.title}</p>{g.deadline&&<p className={`text-xs mt-0.5 ${dark?"text-zinc-500":"text-stone-400"}`}>Due {new Date(g.deadline+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</p>}</div><Badge label={g.status}/></div><div className="flex items-center gap-3 mb-2"><div className="flex-1"><PBar value={g.progress} color={CAT_COLORS[cat]}/></div><span className={`text-xs w-8 text-right font-medium ${dark?"text-zinc-400":"text-stone-500"}`}>{g.progress}%</span></div><input type="range" min={0} max={100} value={g.progress} onChange={e=>dispatch({type:"UPDATE_GOAL_PROGRESS",id:g.id,value:+e.target.value})} className="w-full h-1" style={{accentColor:CAT_COLORS[cat]}}/>{g.milestones.length>0&&<div className="flex flex-wrap gap-1.5 mt-3">{g.milestones.map((m,i)=><span key={i} className={`text-xs px-2.5 py-1 rounded-full ${dark?"bg-zinc-700 text-zinc-400":"bg-stone-100 text-stone-500"}`}>{m}</span>)}</div>}</Card>)}</div></div>;
      })}
    </div>
  );
}

function HealthScreen({ state, dispatch }) {
  const { dark } = useTheme();
  const log = state.healthLogs[today] || { water: 0, workout: false, sleep: 0, steps: 0 };
  const upd = (key, val) => dispatch({ type: "UPDATE_HEALTH", date: today, key, val });
  const todayH = state.habitLogs[today] || {};
  const done = Object.values(todayH).filter(Boolean).length;
  return (
    <div className="space-y-4 pb-8">
      <div className="pt-2"><h1 className={`text-2xl font-light ${dark?"text-zinc-100":"text-stone-700"}`}>Health</h1><p className={`text-xs mt-0.5 ${dark?"text-zinc-500":"text-stone-400"}`}>Log today's health data</p></div>
      <Card><ST>Daily log</ST><div className="space-y-6">
        <div><div className="flex justify-between mb-3"><span className={`text-sm ${dark?"text-zinc-300":"text-stone-600"}`}>💧 Water</span><span className={`text-sm font-semibold ${dark?"text-zinc-200":"text-stone-700"}`}>{log.water} glasses</span></div><div className="flex gap-2 flex-wrap">{[...Array(10)].map((_,i)=><button key={i} onClick={()=>upd("water",i+1)} className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${i<log.water?"text-white scale-105":dark?"bg-zinc-700 text-zinc-500":"bg-stone-100 text-stone-400"}`} style={i<log.water?{background:"#7bb4c9"}:{}}>{i+1}</button>)}</div></div>
        <div><div className="flex justify-between mb-3"><span className={`text-sm ${dark?"text-zinc-300":"text-stone-600"}`}>😴 Sleep</span><span className={`text-sm font-semibold ${dark?"text-zinc-200":"text-stone-700"}`}>{log.sleep}h</span></div><input type="range" min={0} max={12} step={0.5} value={log.sleep} onChange={e=>upd("sleep",+e.target.value)} className="w-full h-1" style={{accentColor:"#b8a9d4"}}/><div className={`flex justify-between text-xs mt-1.5 ${dark?"text-zinc-600":"text-stone-300"}`}><span>0h</span><span>6h</span><span>12h</span></div></div>
        <div><div className="flex justify-between mb-3"><span className={`text-sm ${dark?"text-zinc-300":"text-stone-600"}`}>👟 Steps</span><span className={`text-sm font-semibold ${dark?"text-zinc-200":"text-stone-700"}`}>{log.steps.toLocaleString()}</span></div><input type="range" min={0} max={20000} step={500} value={log.steps} onChange={e=>upd("steps",+e.target.value)} className="w-full h-1" style={{accentColor:"#c9a96e"}}/><div className={`flex justify-between text-xs mt-1.5 ${dark?"text-zinc-600":"text-stone-300"}`}><span>0</span><span>10k</span><span>20k</span></div></div>
        <div className="flex items-center justify-between"><span className={`text-sm ${dark?"text-zinc-300":"text-stone-600"}`}>🏃 Workout done?</span><Toggle value={log.workout} onChange={v=>upd("workout",v)}/></div>
      </div></Card>
      <Card><ST>Habits — {done}/{state.habits.length} done</ST><div className="space-y-3">{state.habits.map(h=><div key={h.id} className="flex items-center justify-between"><span className={`text-sm ${dark?"text-zinc-300":"text-stone-600"}`}>{h.icon} {h.name}</span><button onClick={()=>dispatch({type:"TOGGLE_HABIT",date:today,habitId:h.id})} className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${todayH[h.id]?"border-transparent text-white":dark?"border-zinc-600":"border-stone-200"}`} style={todayH[h.id]?{background:"#8aad8e"}:{}}>{todayH[h.id]&&<span className="text-xs">✓</span>}</button></div>)}</div></Card>
      <Card><ST>This week</ST><ResponsiveContainer width="100%" height={110}><BarChart data={weekHealthData} barSize={8} barGap={2}><XAxis dataKey="day" tick={{fontSize:10,fill:dark?"#71717a":"#a8a29e"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:dark?"#27272a":"#fff",border:"none",borderRadius:12,fontSize:12}}/><Bar dataKey="water" fill="#7bb4c9" radius={[4,4,0,0]} name="Water"/><Bar dataKey="sleep" fill="#b8a9d4" radius={[4,4,0,0]} name="Sleep"/></BarChart></ResponsiveContainer><div className="flex gap-5 mt-1">{[{c:"#7bb4c9",l:"Water (glasses)"},{c:"#b8a9d4",l:"Sleep (hrs)"}].map(x=><span key={x.l} className="flex items-center gap-1.5 text-xs text-stone-400"><span className="w-2.5 h-2.5 rounded-full" style={{background:x.c}}/>{x.l}</span>)}</div></Card>
    </div>
  );
}

function FinanceScreen({ state, dispatch }) {
  const { dark } = useTheme();
  const f = state.financeLogs;
  const sPct = pct(f.saved, f.savingsTarget), spPct = pct(f.expenses, f.income);
  return (
    <div className="space-y-4 pb-8">
      <div className="pt-2"><h1 className={`text-2xl font-light ${dark?"text-zinc-100":"text-stone-700"}`}>Finance</h1><p className={`text-xs mt-0.5 ${dark?"text-zinc-500":"text-stone-400"}`}>Simple. Clear. In control.</p></div>
      <Card><ST>Savings goal</ST><div className="flex items-center gap-5"><Ring value={sPct} size={80} color="#c9a96e"/><div><p className={`text-2xl font-light ${dark?"text-zinc-100":"text-stone-700"}`}>₹{f.saved.toLocaleString()}</p><p className={`text-xs ${dark?"text-zinc-500":"text-stone-400"}`}>of ₹{f.savingsTarget.toLocaleString()}</p><p className="text-xs mt-2 font-medium" style={{color:"#c9a96e"}}>₹{(f.savingsTarget-f.saved).toLocaleString()} to go</p></div></div></Card>
      <Card><ST>Monthly numbers</ST><div className="space-y-4">{[{label:"Income",key:"income",color:"#8aad8e"},{label:"Expenses",key:"expenses",color:"#c47e7e"},{label:"Total saved",key:"saved",color:"#c9a96e"},{label:"Savings target",key:"savingsTarget",color:"#7b9ec7"}].map(item=><div key={item.key}><label className={`text-xs ${dark?"text-zinc-500":"text-stone-400"} mb-1.5 block`}>{item.label}</label><div className={`flex items-center gap-2 rounded-xl px-4 py-3 ${dark?"bg-zinc-700":"bg-stone-50"}`}><span className={`text-sm ${dark?"text-zinc-500":"text-stone-400"}`}>₹</span><input type="number" className={`flex-1 bg-transparent text-sm outline-none font-medium ${dark?"text-zinc-100":"text-stone-700"}`} value={f[item.key]} onChange={e=>dispatch({type:"UPDATE_FINANCE",key:item.key,val:+e.target.value||0})}/></div></div>)}</div></Card>
      <Card><ST>Spend rate</ST><div className="flex justify-between text-xs mb-2"><span className={dark?"text-zinc-400":"text-stone-500"}>₹{f.expenses.toLocaleString()} spent</span><span className={dark?"text-zinc-400":"text-stone-500"}>{spPct}% of income</span></div><PBar value={spPct} color={spPct>80?"#c47e7e":"#8aad8e"}/><p className={`text-xs mt-2 ${dark?"text-zinc-500":"text-stone-400"}`}>{spPct>80?"⚠️ High spending this month":"✓ Spending looks healthy"}</p></Card>
      <Card><div className="text-center py-3"><p className={`text-xs mb-2 ${dark?"text-zinc-500":"text-stone-400"}`}>Net this month</p><p className={`text-3xl font-light ${f.income-f.expenses>=0?"text-green-500":"text-red-400"}`}>{f.income-f.expenses>=0?"+":"-"}₹{Math.abs(f.income-f.expenses).toLocaleString()}</p></div></Card>
    </div>
  );
}

function ContentScreen({ state, dispatch }) {
  const { dark } = useTheme();
  const c = state.contentLogs;
  const [newIdea, setNewIdea] = useState("");
  const wPct = pct(c.completed, c.weeklyGoal);
  return (
    <div className="space-y-4 pb-8">
      <div className="pt-2"><h1 className={`text-2xl font-light ${dark?"text-zinc-100":"text-stone-700"}`}>Content</h1><p className={`text-xs mt-0.5 ${dark?"text-zinc-500":"text-stone-400"}`}>Track your creative output</p></div>
      <Card><ST>Weekly publishing goal</ST><div className="flex items-center gap-5"><Ring value={wPct} size={80} color="#b08ec7"/><div><p className={`text-2xl font-light ${dark?"text-zinc-100":"text-stone-700"}`}>{c.completed}<span className={`text-base ${dark?"text-zinc-500":"text-stone-400"}`}>/{c.weeklyGoal}</span></p><p className={`text-xs ${dark?"text-zinc-500":"text-stone-400"}`}>videos published</p><div className="flex gap-2 mt-3"><button onClick={()=>dispatch({type:"UPDATE_CONTENT",key:"completed",val:Math.max(0,c.completed-1)})} className={`w-8 h-8 rounded-full text-lg flex items-center justify-center ${dark?"bg-zinc-700 text-zinc-300":"bg-stone-100 text-stone-500"}`}>−</button><button onClick={()=>dispatch({type:"UPDATE_CONTENT",key:"completed",val:c.completed+1})} className="w-8 h-8 rounded-full text-lg flex items-center justify-center text-white" style={{background:"#b08ec7"}}>+</button></div></div></div></Card>
      <Card><ST>Pipeline</ST><div className="grid grid-cols-3 gap-3 text-center">{[{label:"Ideas",val:c.ideas.length,color:"#b08ec7"},{label:"Planned",val:c.planned,color:"#7bb4c9"},{label:"Published",val:c.completed,color:"#8aad8e"}].map(s=><div key={s.label} className={`rounded-xl py-4 ${dark?"bg-zinc-700":"bg-stone-50"}`}><div className="text-2xl font-light" style={{color:s.color}}>{s.val}</div><div className={`text-xs mt-1 ${dark?"text-zinc-500":"text-stone-400"}`}>{s.label}</div></div>)}</div></Card>
      <Card><ST>Idea bank</ST><div className="space-y-2 mb-3">{c.ideas.length===0&&<p className={`text-sm text-center py-4 ${dark?"text-zinc-600":"text-stone-300"}`}>No ideas yet.</p>}{c.ideas.map((idea,i)=><div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${dark?"bg-zinc-700":"bg-stone-50"}`}><span style={{color:"#b08ec7"}} className="text-xs">✦</span><span className={`text-sm flex-1 ${dark?"text-zinc-300":"text-stone-600"}`}>{idea}</span><button onClick={()=>dispatch({type:"REMOVE_IDEA",index:i})} className={`text-base leading-none ${dark?"text-zinc-600":"text-stone-300"} hover:text-red-400`}>×</button></div>)}</div><div className={`flex gap-2 rounded-xl px-3 py-2.5 ${dark?"bg-zinc-700":"bg-stone-50"}`}><input className={`flex-1 bg-transparent text-sm outline-none ${dark?"text-zinc-200 placeholder-zinc-600":"text-stone-600 placeholder-stone-300"}`} placeholder="New idea…" value={newIdea} onChange={e=>setNewIdea(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&newIdea.trim()){dispatch({type:"ADD_IDEA",idea:newIdea.trim()});setNewIdea("")}}}/><button onClick={()=>{if(newIdea.trim()){dispatch({type:"ADD_IDEA",idea:newIdea.trim()});setNewIdea("")}}} className="text-sm font-medium" style={{color:"#b08ec7"}}>Add</button></div></Card>
    </div>
  );
}

function JournalScreen({ state, dispatch }) {
  const { dark } = useTheme();
  const entry = state.moods[today] || { mood: null, reflection: "" };
  const [text, setText] = useState(entry.reflection || "");
  const save = () => dispatch({ type: "SAVE_MOOD", date: today, mood: entry.mood, reflection: text });
  const recent = Object.entries(state.moods).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7);
  return (
    <div className="space-y-4 pb-8">
      <div className="pt-2"><h1 className={`text-2xl font-light ${dark?"text-zinc-100":"text-stone-700"}`}>Journal</h1><p className={`text-xs mt-0.5 ${dark?"text-zinc-500":"text-stone-400"}`}>How are you feeling today?</p></div>
      <Card><ST>Today's mood</ST><div className="flex justify-between px-1">{MOODS.map((m,i)=><button key={i} onClick={()=>dispatch({type:"SAVE_MOOD",date:today,mood:i,reflection:text})} className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all ${entry.mood===i?"scale-110":"opacity-40 hover:opacity-70"}`} style={entry.mood===i?{background:m.color+"22"}:{}}><span className="text-2xl">{m.emoji}</span><span className="text-xs" style={{color:m.color}}>{m.label}</span></button>)}</div></Card>
      <Card><ST>Daily reflection</ST><textarea className={`w-full text-sm rounded-xl p-3 outline-none resize-none leading-relaxed ${dark?"bg-zinc-700 text-zinc-200 placeholder-zinc-600":"bg-stone-50 text-stone-600 placeholder-stone-300"}`} rows={4} maxLength={300} placeholder="What's on your mind? (max 300 chars)" value={text} onChange={e=>setText(e.target.value)}/><div className="flex justify-between items-center mt-2"><span className={`text-xs ${dark?"text-zinc-600":"text-stone-300"}`}>{text.length}/300</span><button onClick={save} className="text-xs px-4 py-1.5 rounded-full text-white font-medium" style={{background:"#8aad8e"}}>Save</button></div></Card>
      <Card><ST>Mood trend</ST><ResponsiveContainer width="100%" height={90}><LineChart data={weekMoodData}><XAxis dataKey="day" tick={{fontSize:10,fill:dark?"#71717a":"#a8a29e"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:dark?"#27272a":"#fff",border:"none",borderRadius:12,fontSize:12}}/><Line type="monotone" dataKey="score" stroke="#b08ec7" strokeWidth={2} dot={{fill:"#b08ec7",r:3}}/></LineChart></ResponsiveContainer></Card>
      <Card><ST>Recent entries</ST>{recent.length===0&&<p className={`text-sm text-center py-4 ${dark?"text-zinc-600":"text-stone-300"}`}>No entries yet.</p>}<div className="space-y-3">{recent.map(([date,e])=>{const mood=e.mood!=null?MOODS[e.mood]:null;return(<div key={date} className={`rounded-xl p-3 ${dark?"bg-zinc-700":"bg-stone-50"}`}><div className="flex items-center gap-2 mb-1">{mood&&<span>{mood.emoji}</span>}<span className={`text-xs font-medium ${dark?"text-zinc-400":"text-stone-500"}`}>{new Date(date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>{mood&&<span className="text-xs ml-auto" style={{color:mood.color}}>{mood.label}</span>}</div>{e.reflection&&<p className={`text-xs italic leading-relaxed ${dark?"text-zinc-500":"text-stone-400"}`}>"{e.reflection}"</p>}</div>);})}</div></Card>
    </div>
  );
}

function InsightsScreen({ state }) {
  const { dark } = useTheme();
  const avg = Math.round(state.goals.reduce((a, g) => a + g.progress, 0) / Math.max(1, state.goals.length));
  const f = state.financeLogs;
  return (
    <div className="space-y-4 pb-8">
      <div className="pt-2"><h1 className={`text-2xl font-light ${dark?"text-zinc-100":"text-stone-700"}`}>Insights</h1><p className={`text-xs mt-0.5 ${dark?"text-zinc-500":"text-stone-400"}`}>Your progress at a glance</p></div>
      <div className="grid grid-cols-2 gap-3">{[{label:"Avg goal progress",val:`${avg}%`,sub:"across all goals",color:"#8aad8e"},{label:"Savings",val:`${pct(f.saved,f.savingsTarget)}%`,sub:"of annual target",color:"#c9a96e"},{label:"Goals done",val:`${state.goals.filter(g=>g.status==="Completed").length}/${state.goals.length}`,sub:"completed",color:"#7b9ec7"},{label:"Content",val:`${state.contentLogs.completed}/${state.contentLogs.weeklyGoal}`,sub:"weekly target",color:"#b08ec7"}].map(s=><Card key={s.label} className="text-center py-5"><p className="text-2xl font-light" style={{color:s.color}}>{s.val}</p><p className={`text-xs font-medium mt-1.5 ${dark?"text-zinc-300":"text-stone-600"}`}>{s.label}</p><p className={`text-xs mt-0.5 ${dark?"text-zinc-600":"text-stone-400"}`}>{s.sub}</p></Card>)}</div>
      <Card><ST>Goal breakdown</ST><div className="space-y-4">{state.goals.map(g=><div key={g.id}><div className="flex justify-between mb-1.5"><span className={`text-xs ${dark?"text-zinc-400":"text-stone-500"}`}>{g.title.length>30?g.title.substring(0,30)+"…":g.title}</span><span className={`text-xs font-medium ${dark?"text-zinc-300":"text-stone-600"}`}>{g.progress}%</span></div><PBar value={g.progress} color={CAT_COLORS[g.category]}/></div>)}</div></Card>
      <Card><ST>Mood this week</ST><ResponsiveContainer width="100%" height={100}><LineChart data={weekMoodData}><XAxis dataKey="day" tick={{fontSize:10,fill:dark?"#71717a":"#a8a29e"}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:dark?"#27272a":"#fff",border:"none",borderRadius:12,fontSize:12}}/><Line type="monotone" dataKey="score" stroke="#b08ec7" strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer></Card>
      <Card><ST>Finance snapshot</ST><div className="space-y-3"><div className="flex justify-between"><span className={`text-sm ${dark?"text-zinc-400":"text-stone-500"}`}>Monthly income</span><span className="text-sm font-medium text-green-500">+₹{f.income.toLocaleString()}</span></div><div className="flex justify-between"><span className={`text-sm ${dark?"text-zinc-400":"text-stone-500"}`}>Monthly expenses</span><span className="text-sm font-medium text-red-400">-₹{f.expenses.toLocaleString()}</span></div><div className={`border-t pt-3 ${dark?"border-zinc-700":"border-stone-100"}`}><div className="flex justify-between"><span className={`text-sm font-medium ${dark?"text-zinc-300":"text-stone-700"}`}>Net savings</span><span className={`text-sm font-semibold ${f.income-f.expenses>=0?"text-green-500":"text-red-400"}`}>{f.income-f.expenses>=0?"+":""}₹{(f.income-f.expenses).toLocaleString()}</span></div></div></div></Card>
    </div>
  );
}

const NAV = [
  { id: "home", icon: "⌂", label: "Home" }, { id: "goals", icon: "◎", label: "Goals" },
  { id: "health", icon: "♡", label: "Health" }, { id: "finance", icon: "◇", label: "Finance" },
  { id: "content", icon: "✦", label: "Content" }, { id: "journal", icon: "✎", label: "Journal" },
  { id: "insights", icon: "◈", label: "Insights" },
];

export default function LifeOS() {
  const [state, dispatch] = useReducer(reducer, initState);
  const [screen, setScreen] = useState("home");
  const dark = state.darkMode;
  const screens = { home: HomeScreen, goals: GoalsScreen, health: HealthScreen, finance: FinanceScreen, content: ContentScreen, journal: JournalScreen, insights: InsightsScreen };
  const Screen = screens[screen];

  return (
    <ThemeCtx.Provider value={{ dark }}>
      <div className={`min-h-screen transition-colors duration-300 ${dark ? "bg-zinc-900" : "bg-stone-50"}`} style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="max-w-md mx-auto relative min-h-screen flex flex-col">
          <div className={`sticky top-0 z-10 px-5 pt-8 pb-3 flex items-center justify-between ${dark ? "bg-zinc-900/95" : "bg-stone-50/95"} backdrop-blur-sm`}>
            <div className="flex items-center gap-2">
              <span style={{ color: "#8aad8e" }}>✦</span>
              <span className={`text-sm font-bold tracking-widest uppercase ${dark ? "text-zinc-200" : "text-stone-500"}`}>LifeOS</span>
            </div>
            <button onClick={() => dispatch({ type: "TOGGLE_DARK" })} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${dark ? "bg-zinc-700 text-yellow-300" : "bg-stone-200 text-stone-500"}`}>{dark ? "☀" : "☾"}</button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-28"><Screen state={state} dispatch={dispatch} /></div>
          <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md border-t ${dark ? "bg-zinc-900/98 border-zinc-800" : "bg-white/98 border-stone-100"} backdrop-blur-sm z-20`}>
            <div className="flex items-center justify-around px-1 py-2.5">
              {NAV.map(n => (
                <button key={n.id} onClick={() => setScreen(n.id)} className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-xl transition-all ${screen === n.id ? "" : "opacity-30"}`} style={screen === n.id ? { background: "#8aad8e15" } : {}}>
                  <span className="text-base leading-none" style={screen === n.id ? { color: "#8aad8e" } : {}}>{n.icon}</span>
                  <span className={`text-[9px] leading-none tracking-wide ${dark ? "text-zinc-400" : "text-stone-500"}`} style={screen === n.id ? { color: "#8aad8e" } : {}}>{n.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

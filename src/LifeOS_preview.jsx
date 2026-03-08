import { useState, useReducer, useEffect, createContext, useContext, useRef, useCallback } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";
import { SettingsScreen, BackupReminderBanner, useBackupReminder, pullFromSupabase, pushToSupabase } from "./BackupSystem";

/* ══════════════════════════════════════════════════════════
   LIFEOS — FULL INTERACTIVE PREVIEW
   Warm organic minimalism · Playfair + DM Mono
══════════════════════════════════════════════════════════ */

const Fonts = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Mono:ital,wght@0,300;0,400;1,300&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    input[type=range] { -webkit-appearance:none; appearance:none; background:transparent; cursor:pointer; width:100%; }
    input[type=range]::-webkit-slider-runnable-track { height:4px; border-radius:2px; background:var(--track); }
    input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:var(--thumb,#7a9e7e); margin-top:-7px; box-shadow:0 1px 6px rgba(0,0,0,0.25); }
    select { appearance:none; }
    ::-webkit-scrollbar { width:3px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:rgba(0,0,0,0.12); border-radius:2px; }
    @keyframes slideUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes popIn     { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
    @keyframes toastIn   { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
    @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.4} }
    .su { animation: slideUp 0.32s cubic-bezier(0.16,1,0.3,1) both; }
    .su1 { animation-delay:0.04s }
    .su2 { animation-delay:0.08s }
    .su3 { animation-delay:0.12s }
    .pi { animation: popIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both; }
  `}</style>
);

// ── Tokens ──────────────────────────────────────────────────────────────────
const tk = {
  // light
  cream:"#faf7f2", cream2:"#f4efe6", cream3:"#e8e0d4",
  ink:"#2c2416",   ink2:"#5c5040",   ink3:"#9c8c78",
  // dark
  d0:"#17140f", d1:"#1f1c16", d2:"#27231c", d3:"#312d24",
  di:"#f0e8d8",  di2:"#c8bfaa", di3:"#7a7060",
  // accents
  sage:"#7a9e7e",  sageL:"#d4e8d6", sageD:"#4a6e4e",
  gold:"#c4974a",  goldL:"#f5e4c0",
  sky:"#6b9ab8",   skyL:"#daeaf3",
  plum:"#9b7fa8",  plumL:"#ede0f4",
  rose:"#c47a7a",  roseL:"#fdf0f0",
  amber:"#c4974a",
};

const CAT  = { Work:tk.sky,  Health:tk.sage, Finance:tk.gold, Content:tk.plum };
const CATL = { Work:tk.skyL, Health:tk.sageL,Finance:tk.goldL,Content:tk.plumL };

// ── Cycle data ───────────────────────────────────────────────────────────────
const PHASES = {
  menstrual: {
    name:"Menstrual", sub:"Rest & release", range:"Days 1–5",
    color:tk.rose, light:tk.roseL, dark:"#2e1818", emoji:"🌑", energy:2,
    desc:"Your body is doing deep, quiet work. Honour the rest it's asking for. This is a time for stillness, letting go, and gentle care — not pushing through.",
    mood:{ feel:"Introspective, sensitive, possibly tender. Cramps may affect your mood and focus.", tip:"Give yourself full permission to slow down. Rest is genuinely productive right now." },
    food:{
      eat:["🥬 Iron-rich foods — spinach, lentils, dark chocolate, beetroot","🍲 Warming meals — soups, stews, khichdi, ginger tea","🐟 Omega-3s — flaxseeds, walnuts, fatty fish","🎃 Magnesium — pumpkin seeds, bananas, dark greens","🥥 Hydrating foods — coconut water, cucumber, watermelon"],
      avoid:["🧂 Salty & processed foods — worsens bloating","☕ Caffeine — amplifies cramps and anxiety","🧊 Cold & raw foods — harder to digest right now","🍷 Alcohol — increases inflammation and fatigue","🍬 Refined sugar — energy spikes make mood swings worse"],
    },
    workout:{ note:"Gentle movement only. Your body is already doing a lot.", list:["🧘 Yin yoga or restorative yoga","🚶 Slow walks in nature","💆 Stretching and foam rolling","🛁 Complete rest if cramps are severe"], skip:"HIIT, heavy lifting, long runs — save it for next week." },
    care:["🌿 Use a heating pad on your abdomen","📖 Read something indulgent with zero agenda","🛁 Long Epsom salt baths","🎵 Build a soft, cosy playlist","✍️ Write what you want to release this cycle","😴 Sleep in — rest is not laziness","🫖 Chamomile, ginger or raspberry leaf tea"],
    work:"Avoid scheduling big presentations. Best for: reflection, reviewing old work, journalling, archiving.",
  },
  follicular: {
    name:"Follicular", sub:"Rise & explore", range:"Days 6–13",
    color:tk.sage, light:tk.sageL, dark:"#182e1a", emoji:"🌱", energy:4,
    desc:"Oestrogen is rising and so are you. Fresh ideas, natural optimism, curiosity returning. Your brain is literally more creative during this phase — lean into it.",
    mood:{ feel:"Optimistic, curious, sociable, motivated. You may feel pulled to start new things.", tip:"This is your best time to brainstorm, plan and start the thing you've been putting off." },
    food:{
      eat:["🥗 Light, fresh foods — salads, sprouts, fermented foods","🌱 Phytoestrogens — flaxseeds, edamame, tofu, sesame","🥛 Probiotics — yoghurt, kefir, kimchi, kombucha","🌾 Complex carbs — oats, quinoa, brown rice","🥦 Cruciferous veg — broccoli, cauliflower, cabbage"],
      avoid:["🍔 Heavy, greasy meals — your digestion is sensitive","🍭 Excess sugar — can cause oestrogen imbalance","🫘 Processed soy in large amounts"],
    },
    workout:{ note:"Your strength and stamina are building. Try new things, push yourself.", list:["🏋️ Weight training — try increasing weights","🏃 Running, cycling, HIIT","💃 Dance classes, Zumba, fun cardio","🧗 Rock climbing, team sports, anything new"], skip:"Nothing — most resilient phase for any workout type." },
    care:["🌸 Try something new — a class, a recipe, a place","👯 Make plans with friends — you're at your most social","📝 Brain-dump all your ideas into a notebook","🎨 Start a creative project or side project","🌞 Morning sunlight to amplify your mood","💄 Great phase for photos, events, big asks","🌿 Light, refreshing skincare — your skin is glowing"],
    work:"Best for: brainstorming, starting projects, pitching ideas, learning new skills, scheduling important calls or presentations.",
  },
  ovulatory: {
    name:"Ovulatory", sub:"Peak & shine", range:"Days 14–17",
    color:tk.gold, light:tk.goldL, dark:"#2e2416", emoji:"🌕", energy:5,
    desc:"You are at your absolute peak. Oestrogen and testosterone both high. You're magnetic, articulate, confident — the world feels genuinely open right now.",
    mood:{ feel:"Confident, warm, expressive, naturally charismatic. Pulled toward connection and visibility.", tip:"Use this window for your most important work and conversations. It won't last long — maximise it." },
    food:{
      eat:["🫐 Anti-inflammatory — turmeric, berries, leafy greens","🥬 Fibre-rich — lentils, beans, vegetables","🥚 Light proteins — chicken, fish, eggs, tofu","🌈 Antioxidant-rich — colourful fruits and veg","💧 Lots of water, coconut water, herbal teas"],
      avoid:["🍖 Heavy meals — you want to feel light and energised","🍷 Excess alcohol — even when you feel great, it's inflammatory","🍰 High-sugar foods — energy crash hits hard from this high"],
    },
    workout:{ note:"Your absolute strongest phase. Push yourself — you'll recover faster too.", list:["🏋️ Heavy lifting — PBs are genuinely possible now","🏃 Speed runs, intervals, sprints","⚽ Team sports — coordination and drive are at peak","🧘 Power yoga or hot yoga"], skip:"Nothing — listen to your body if ovulation brings any discomfort." },
    care:["💬 Have the difficult conversation you've been avoiding","🎤 Give the presentation, pitch, or performance","📸 Take photos — you'll feel and look your best","🥂 Schedule date nights or social events","✨ Wear something that makes you feel powerful","🌺 Treat yourself — massage, facial, something luxurious","🧠 Make the big decision you've been sitting on"],
    work:"Best for: public speaking, negotiations, job interviews, big meetings, content creation, launching things. You are at your most persuasive.",
  },
  luteal: {
    name:"Luteal", sub:"Wind down & complete", range:"Days 18–28",
    color:tk.plum, light:tk.plumL, dark:"#22182e", emoji:"🌗", energy:3,
    desc:"Progesterone rises then both hormones drop. Detail-focused early on, increasingly introspective as you approach your period. Be extra kind to yourself in the second half.",
    mood:{ feel:"Detail-oriented early on, then possibly irritable, sensitive or anxious. Bloating, cravings and brain fog are common.", tip:"Don't over-schedule your late luteal days. Protect your time, lower expectations, and be gentle with yourself." },
    food:{
      eat:["🍫 Magnesium — dark chocolate, almonds, leafy greens","🍠 Complex carbs — sweet potato, oats, brown rice","🥛 Calcium-rich — dairy, fortified plant milks, sesame","🍌 Vitamin B6 — chickpeas, bananas, tuna (supports serotonin)","🍲 Warming cooked foods — soups, roasted veg, dals"],
      avoid:["☕ Caffeine — worsens anxiety, breast tenderness, sleep","🧂 Salt — increases water retention and bloating","🍷 Alcohol — dramatically worsens PMS and mood","🍬 Refined sugar — the cravings are a trap","⏭ Skipping meals — blood sugar drops hit much harder now"],
    },
    workout:{ note:"Early luteal: moderate training is great. Late luteal: slow right down.", list:["🚶 Walking, hiking, gentle cycling","🧘 Hatha or restorative yoga","🏊 Swimming — very gentle on the body","💪 Moderate strength training — early phase only"], skip:"Intense HIIT in late phase — cortisol spikes worsen PMS significantly." },
    care:["🛁 Warm baths with lavender oil","📋 Use this phase for admin, editing, finishing tasks","🍫 Have the dark chocolate — zero guilt","😴 Prioritise 8+ hours of sleep","🌲 Time in nature genuinely, measurably helps","📵 Reduce social media in the late phase","💆 Book a massage or do self-massage","🫂 Communicate your needs to people close to you"],
    work:"Best for: detail work, editing, reviewing, admin, wrapping up projects. Avoid scheduling new launches or big social events in late luteal.",
  },
};

function calcPhase(startDate, len = 28) {
  if (!startDate) return null;
  const start = new Date(startDate + "T00:00:00");
  const now   = new Date();
  const diff  = Math.floor((now - start) / 86400000);
  if (diff < 0) return null;
  const day = (diff % len) + 1;
  let phase;
  if      (day <= 5)  phase = "menstrual";
  else if (day <= 13) phase = "follicular";
  else if (day <= 17) phase = "ovulatory";
  else                phase = "luteal";
  const nextIn = len - day + 1;
  // next period date
  const cyclesSince = Math.floor(diff / len);
  const nextPeriod  = new Date(start);
  nextPeriod.setDate(start.getDate() + (cyclesSince + 1) * len);
  return { phase, day, nextIn, nextPeriod, len };
}

// ── State ────────────────────────────────────────────────────────────────────
const today = new Date().toISOString().split("T")[0];
const MOODS = [
  {e:"😄",l:"Great",c:tk.sage},{e:"🙂",l:"Good",c:"#9b9e7a"},
  {e:"😐",l:"Okay",c:tk.gold},{e:"😔",l:"Low",c:tk.plum},{e:"😤",l:"Rough",c:tk.rose},
];

const INIT = {
  dark: false,
  habits: [],
  habitLogs: {},
  goals: [],
  health: {},
  finance: { income: 0, expenses: 0, target: 0, saved: 0 },
  content: { ideas: [], planned: 0, done: 0, goal: 0 },
  moods: {},
  cycle: { start: "", len: 28, logs: {} },
};

const pct = (v,t) => !t?0:Math.min(100,Math.round(v/t*100));

function reducer(s,a){
  switch(a.type){
    case "DARK":    return {...s,dark:!s.dark};
    case "HABIT": { const l={...s.habitLogs}; l[a.d]={...(l[a.d]||{}),[a.id]:!(l[a.d]?.[a.id])}; return {...s,habitLogs:l}; }
    case "HEALTH":  { const h={...s.health}; h[a.d]={...(h[a.d]||{}),[a.k]:a.v}; return {...s,health:h}; }
    case "GOAL_P":  return {...s,goals:s.goals.map(g=>g.id===a.id?{...g,prog:a.v,status:a.v===100?"Completed":a.v>0?"In Progress":"Not Started"}:g)};
    case "ADD_GOAL":return {...s,goals:[...s.goals,a.p]};
    case "DEL_GOAL":return {...s,goals:s.goals.filter(g=>g.id!==a.id)};
    case "FIN":     return {...s,finance:{...s.finance,[a.k]:a.v}};
    case "CON":     return {...s,content:{...s.content,[a.k]:a.v}};
    case "ADD_IDEA":return {...s,content:{...s.content,ideas:[...s.content.ideas,a.v]}};
    case "DEL_IDEA":return {...s,content:{...s.content,ideas:s.content.ideas.filter((_,i)=>i!==a.i)}};
    case "MOOD":    { const m={...s.moods}; m[a.d]={mood:a.mood,note:a.note}; return {...s,moods:m}; }
    case "ADD_HAB": return {...s,habits:[...s.habits,a.p]};
    case "DEL_HAB": return {...s,habits:s.habits.filter(h=>h.id!==a.id)};
    case "CYCLE":   return {...s,cycle:{...s.cycle,...a.p}};
    case "CYC_SYM": { const logs={...(s.cycle.logs||{})}; const dl=[...(logs[a.d]||[])]; const i=dl.indexOf(a.sym); if(i>=0)dl.splice(i,1);else dl.push(a.sym); logs[a.d]=dl; return {...s,cycle:{...s.cycle,logs}}; }
    case "IMPORT_STATE": return { ...INIT, ...a.payload, dark: s.dark };
    case "RESET_ALL": return { ...INIT };
    default: return s;
  }
}

// ── Theme context ─────────────────────────────────────────────────────────────
const Ctx = createContext();
const useT = () => useContext(Ctx);

// ── Shared atoms ──────────────────────────────────────────────────────────────
function Card({children, style={}, cls=""}) {
  const {d} = useT();
  return (
    <div className={`su ${cls}`} style={{
      background: d ? tk.d2 : "#fff",
      borderRadius: 20,
      padding: 20,
      border: `1px solid ${d?"rgba(255,255,255,0.045)":"rgba(44,36,22,0.055)"}`,
      boxShadow: d ? "0 2px 16px rgba(0,0,0,0.35)" : "0 2px 20px rgba(44,36,22,0.07)",
      ...style
    }}>{children}</div>
  );
}

const Lbl = ({children, style={}}) => {
  const {d} = useT();
  return <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:d?tk.di3:tk.ink3,marginBottom:14,...style}}>{children}</p>;
};
const Serif = ({children, size=28, color, style={}}) => {
  const {d}=useT(); return <p style={{fontFamily:"'Playfair Display',serif",fontSize:size,color:color||(d?tk.di:tk.ink),lineHeight:1.2,...style}}>{children}</p>;
};
const Mono = ({children, size=13, color, style={}}) => {
  const {d}=useT(); return <p style={{fontFamily:"'DM Mono',monospace",fontSize:size,color:color||(d?tk.di2:tk.ink2),lineHeight:1.6,...style}}>{children}</p>;
};

function PBar({v,color=tk.sage,h=5}) {
  const {d}=useT();
  return <div style={{width:"100%",height:h,borderRadius:h,background:d?tk.d3:tk.cream3,overflow:"hidden"}}><div style={{height:"100%",width:`${v}%`,background:color,borderRadius:h,transition:"width 0.55s cubic-bezier(0.34,1.56,0.64,1)"}}/></div>;
}

function Ring({v,size=82,stroke=6,color=tk.sage}) {
  const {d}=useT();
  const r=(size-stroke)/2, c=2*Math.PI*r, off=c-(v/100)*c;
  return (
    <svg width={size} height={size} style={{flexShrink:0}}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={d?tk.d3:tk.cream3} strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{transition:"stroke-dashoffset 0.7s ease"}}/>
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        style={{fontFamily:"'DM Mono',monospace",fontSize:13,fill:color}}>{v}%</text>
    </svg>
  );
}

function Toggle({on,set,color=tk.sage}) {
  return <button onClick={()=>set(!on)} style={{width:46,height:26,borderRadius:13,border:"none",cursor:"pointer",position:"relative",background:on?color:"#ccc8c0",transition:"background 0.25s",flexShrink:0}}><span style={{position:"absolute",top:3,width:20,height:20,borderRadius:"50%",background:"#fff",boxShadow:"0 1px 5px rgba(0,0,0,0.22)",transition:"left 0.25s cubic-bezier(0.34,1.56,0.64,1)",left:on?23:3}}/></button>;
}

function Chip({label}) {
  const map = {"Not Started":{c:tk.ink3,bg:tk.cream2},"In Progress":{c:tk.gold,bg:tk.goldL},"Completed":{c:tk.sage,bg:tk.sageL}};
  const s = map[label]||map["Not Started"];
  return <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,padding:"4px 10px",borderRadius:20,background:s.bg,color:s.c,whiteSpace:"nowrap"}}>{label}</span>;
}

function Dots({n,max=5,color}) {
  return <div style={{display:"flex",gap:5}}>{Array.from({length:max}).map((_,i)=><div key={i} style={{width:7,height:7,borderRadius:"50%",background:i<n?color:"rgba(0,0,0,0.1)",transition:"background 0.3s"}}/>)}</div>;
}

function Btn({children,onClick,color=tk.sage,variant="fill",style={}}) {
  const {d}=useT();
  const base = {fontFamily:"'DM Mono',monospace",fontSize:12,letterSpacing:"0.04em",padding:"11px 20px",borderRadius:14,border:"none",cursor:"pointer",transition:"all 0.15s",...style};
  if(variant==="fill") return <button onClick={onClick} style={{...base,background:color,color:"#fff",boxShadow:`0 3px 12px ${color}55`}}>{children}</button>;
  if(variant==="ghost") return <button onClick={onClick} style={{...base,background:d?tk.d3:tk.cream2,color:d?tk.di2:tk.ink2}}>{children}</button>;
  return <button onClick={onClick} style={{...base,background:"transparent",border:`1px solid ${d?"rgba(255,255,255,0.1)":"rgba(44,36,22,0.12)"}`,color:d?tk.di3:tk.ink3}}>{children}</button>;
}

function FloatInput({value,onChange,placeholder,style={}}) {
  const {d}=useT();
  return <input value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",fontFamily:"'DM Mono',monospace",fontSize:13,padding:"12px 16px",borderRadius:14,border:`1px solid ${d?"rgba(255,255,255,0.08)":"rgba(44,36,22,0.1)"}`,background:d?tk.d3:tk.cream,color:d?tk.di:tk.ink,outline:"none",...style}}/>;
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeScreen({s,dp}) {
  const {d}=useT();
  const hl  = s.health[today]||{water:0,workout:false,sleep:0,steps:0};
  const th  = s.habitLogs[today]||{};
  const done= Object.values(th).filter(Boolean).length;
  const hpct= s.habits.length?pct(done,s.habits.length):0;
  const me  = s.moods[today];
  const mobj= me?.mood!=null?MOODS[me.mood]:null;
  const hr  = new Date().getHours();
  const greet= hr<5?"Still up?":hr<12?"Good morning":hr<17?"Good afternoon":"Good evening";
  const ci  = calcPhase(s.cycle?.start, s.cycle?.len);
  const ph  = ci?PHASES[ci.phase]:null;
  const mwk = Array.from({length:7}).map((_,i)=>{const dt=new Date();dt.setDate(dt.getDate()-(6-i));const k=dt.toISOString().split("T")[0];const e=s.moods[k];return{day:dt.toLocaleDateString("en-US",{weekday:"short"}),score:e?.mood!=null?5-e.mood:null};});

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
      <div className="su" style={{paddingTop:8}}>
        <Mono size={11} color={d?tk.di3:tk.ink3} style={{letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:6}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</Mono>
        <Serif size={34}>{greet} <span style={{color:tk.sage}}>✦</span></Serif>
        <Mono size={12} style={{marginTop:4}}>Here's your life at a glance.</Mono>
      </div>

      {/* Cycle banner */}
      {ph && (
        <div className="su pi" style={{borderRadius:20,padding:"16px 20px",background:d?ph.dark:ph.light,border:`1px solid ${ph.color}35`,display:"flex",alignItems:"center",gap:14}}>
          <span style={{fontSize:30,flexShrink:0}}>{ph.emoji}</span>
          <div style={{flex:1,minWidth:0}}>
            <Mono size={10} color={ph.color} style={{letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:3}}>{ph.name} Phase · Day {ci.day} of {ci.len} · {ci.nextIn}d until next period</Mono>
            <Mono size={12} color={d?tk.di2:tk.ink2} style={{lineHeight:1.5}}>{ph.mood.tip}</Mono>
          </div>
        </div>
      )}

      {/* Habit ring + Mood */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Card style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",gap:10}}>
          <Ring v={hpct}/>
          <Lbl style={{marginBottom:2,textAlign:"center"}}>Habits done</Lbl>
          <Mono size={11} color={tk.sage}>{done}/{s.habits.length} today</Mono>
        </Card>
        <Card style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",gap:8}}>
          {mobj?<><span style={{fontSize:40}}>{mobj.e}</span><Mono size={11} color={mobj.c}>{mobj.l}</Mono><Lbl style={{marginBottom:0,textAlign:"center"}}>Today's mood</Lbl></>:<><span style={{fontSize:36,opacity:0.18}}>◡</span><Mono size={11} style={{textAlign:"center"}}>Log your mood</Mono></>}
        </Card>
      </div>

      {/* Quick stats */}
      <Card>
        <Lbl>Today at a glance</Lbl>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",textAlign:"center",gap:8}}>
          {[{i:"💧",v:hl.water||0,l:"glasses"},{i:"🏃",v:hl.workout?"Done":"Rest",l:"workout"},{i:"😴",v:`${hl.sleep||0}h`,l:"sleep"},{i:"👟",v:`${((hl.steps||0)/1000).toFixed(1)}k`,l:"steps"}].map(it=>(
            <div key={it.l}><div style={{fontSize:22,marginBottom:4}}>{it.i}</div><Mono size={13} color={d?tk.di:tk.ink} style={{fontWeight:400}}>{it.v}</Mono><Mono size={10} color={d?tk.di3:tk.ink3}>{it.l}</Mono></div>
          ))}
        </div>
      </Card>

      {/* Top goals */}
      <Card>
        <Lbl>Top goals</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {s.goals.filter(g=>g.status!=="Completed").slice(0,3).map(g=>(
            <div key={g.id}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                <Mono size={12} color={d?tk.di2:tk.ink2}>{g.title}</Mono>
                <Mono size={11} color={CAT[g.cat]}>{g.prog}%</Mono>
              </div>
              <PBar v={g.prog} color={CAT[g.cat]}/>
            </div>
          ))}
        </div>
      </Card>

      {/* Mood chart */}
      {mwk.filter(x=>x.score!==null).length>1 && (
        <Card>
          <Lbl>Mood this week</Lbl>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={mwk}>
              <XAxis dataKey="day" tick={{fontFamily:"'DM Mono',monospace",fontSize:10,fill:d?tk.di3:tk.ink3}} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{background:d?tk.d2:"#fff",border:"none",borderRadius:12,fontFamily:"'DM Mono',monospace",fontSize:11}}/>
              <Line type="monotone" dataKey="score" stroke={tk.sage} strokeWidth={2.5} dot={{fill:tk.sage,r:3}} connectNulls={false}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {me?.note && (
        <Card style={{background:d?tk.d1:tk.cream2,border:"none"}}>
          <Lbl>Today's reflection</Lbl>
          <p style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:15,color:d?tk.di:tk.ink2,lineHeight:1.65}}>"{me.note}"</p>
        </Card>
      )}
    </div>
  );
}

// ── CYCLE ─────────────────────────────────────────────────────────────────────
function CycleScreen({s,dp}) {
  const {d}=useT();
  const cyc = s.cycle||{start:"",len:28,logs:{}};
  const [editing, setEditing] = useState(!cyc.start);
  const [ns, setNs] = useState(cyc.start||"");
  const [nl, setNl] = useState(cyc.len||28);
  const [tab, setTab]   = useState("overview");
  const ci   = calcPhase(cyc.start, cyc.len);
  const ph   = ci ? PHASES[ci.phase] : null;
  const TABS = ["overview","food","workout","self-care"];

  const ts = d?tk.di3:tk.ink3, tm = d?tk.di2:tk.ink2, tx = d?tk.di:tk.ink;
  const cbg = d?tk.d2:"#fff", inp = d?tk.d3:tk.cream, div = d?"rgba(255,255,255,0.06)":"rgba(44,36,22,0.07)";

  function saveSetup() { dp({type:"CYCLE",p:{start:ns,len:+nl||28}}); setEditing(false); }

  // ── Setup ────────────────────────────────────────────────────────────────
  if (editing || !cyc.start) return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
      <div className="su" style={{paddingTop:8}}>
        <Lbl>Your cycle</Lbl>
        <Serif size={32}>Cycle Tracker</Serif>
        <Mono size={12} style={{marginTop:6}}>Enter your cycle details to unlock daily phase guidance, food tips, workout suggestions and self-care ideas.</Mono>
      </div>

      {/* Setup card */}
      <Card>
        <Lbl>Set up your cycle</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:18}}>

          {/* Date picker */}
          <div>
            <Mono size={12} color={tm} style={{marginBottom:10}}>First day of your last period</Mono>
            <input type="date" value={ns} onChange={e=>setNs(e.target.value)}
              style={{width:"100%",fontFamily:"'DM Mono',monospace",fontSize:13,padding:"13px 16px",borderRadius:14,border:`1px solid ${div}`,background:inp,color:tx,outline:"none"}}/>
          </div>

          {/* Length slider */}
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <Mono size={12} color={tm}>Average cycle length</Mono>
              <Mono size={13} color={tk.rose} style={{fontWeight:400}}>{nl} days</Mono>
            </div>
            <input type="range" min={21} max={35} value={nl} onChange={e=>setNl(+e.target.value)}
              style={{"--thumb":tk.rose,"--track":d?tk.d3:tk.cream3,accentColor:tk.rose}}/>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:5}}>
              <Mono size={10} color={ts}>21 days</Mono>
              <Mono size={10} color={ts}>35 days</Mono>
            </div>
          </div>

          {/* Preview of what phase they'll see */}
          {ns && (() => {
            const preview = calcPhase(ns, nl);
            if (!preview) return null;
            const pp = PHASES[preview.phase];
            return (
              <div style={{borderRadius:16,padding:"14px 16px",background:d?pp.dark:pp.light,border:`1px solid ${pp.color}35`}}>
                <Mono size={10} color={pp.color} style={{letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>You are currently in</Mono>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <span style={{fontSize:28}}>{pp.emoji}</span>
                  <div>
                    <Serif size={18} color={tx}>{pp.name} Phase</Serif>
                    <Mono size={11} color={pp.color}>{pp.sub} · Day {preview.day} of {preview.len}</Mono>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{padding:"13px 16px",borderRadius:14,background:inp}}>
            <Mono size={11} color={ts} style={{lineHeight:1.75}}>🔒 Stored only on your device. Never shared. You can update this anytime.</Mono>
          </div>

          <Btn onClick={saveSetup} color={tk.rose} style={{width:"100%",textAlign:"center",opacity:ns?1:0.45,pointerEvents:ns?"auto":"none"}}>
            Save & see my phase →
          </Btn>
        </div>
      </Card>

      {/* Phase previews */}
      <Lbl>The four phases</Lbl>
      {Object.values(PHASES).map((p,i) => (
        <div key={p.name} className="su" style={{animationDelay:`${i*0.06}s`,borderRadius:20,padding:20,background:cbg,border:`1px solid ${div}`,borderLeft:`4px solid ${p.color}`,boxShadow:d?"0 2px 12px rgba(0,0,0,0.3)":"0 1px 12px rgba(44,36,22,0.06)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
            <div><Serif size={17} color={tx}>{p.emoji} {p.name}</Serif><Mono size={11} color={p.color} style={{marginTop:2}}>{p.range} · {p.sub}</Mono></div>
            <Dots n={p.energy} color={p.color}/>
          </div>
          <Mono size={11} color={ts} style={{lineHeight:1.7}}>{p.desc.slice(0,118)}…</Mono>
        </div>
      ))}
    </div>
  );

  // ── Main tracker ──────────────────────────────────────────────────────────
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
      <div className="su" style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",paddingTop:8}}>
        <div><Lbl>Your cycle</Lbl><Serif size={32}>Cycle Tracker</Serif></div>
        <Btn onClick={()=>setEditing(true)} variant="outline" style={{padding:"7px 16px",fontSize:11}}>Edit</Btn>
      </div>

      {/* Hero */}
      <div className="su pi" style={{borderRadius:24,padding:24,position:"relative",overflow:"hidden",background:d?ph.dark:ph.light,border:`1px solid ${ph.color}30`,boxShadow:`0 6px 30px ${ph.color}22`}}>
        <div style={{position:"absolute",right:14,top:10,fontSize:88,opacity:0.1,pointerEvents:"none",lineHeight:1}}>{ph.emoji}</div>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
          <div style={{width:50,height:50,borderRadius:"50%",background:ph.color,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 4px 16px ${ph.color}55`,flexShrink:0}}><span style={{fontSize:26}}>{ph.emoji}</span></div>
          <div><Serif size={22} color={tx}>{ph.name} Phase</Serif><Mono size={11} color={ph.color} style={{marginTop:2}}>{ph.sub}</Mono></div>
        </div>

        {/* Stats row */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:18}}>
          {[{l:"Cycle day",v:ci.day,s:`of ${ci.len}`},{l:"Next period",v:ci.nextIn,s:"days away"},{l:"Energy",v:null,e:ph.energy,s:ph.energyLabel||["","Very low","Low","Moderate","High","Peak"][ph.energy]}].map((it,i)=>(
            <div key={i} style={{padding:"12px 10px",borderRadius:14,background:"rgba(255,255,255,0.32)",backdropFilter:"blur(6px)"}}>
              <Mono size={9} color={ts} style={{letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:5}}>{it.l}</Mono>
              {it.v!=null ? <Serif size={26} color={ph.color}>{it.v}</Serif> : <div style={{paddingTop:4}}><Dots n={it.e} color={ph.color}/></div>}
              <Mono size={10} color={ts} style={{marginTop:4}}>{it.s}</Mono>
            </div>
          ))}
        </div>

        <Mono size={12} color={tm} style={{lineHeight:1.75}}>{ph.desc}</Mono>
      </div>

      {/* Timeline bar */}
      <Card>
        <Lbl>Your cycle timeline</Lbl>
        <div style={{display:"flex",gap:3,marginBottom:10}}>
          {[["menstrual",18],["follicular",29],["ovulatory",14],["luteal",39]].map(([k,w])=>{
            const active=ci.phase===k, p=PHASES[k];
            return <div key={k} style={{flex:w,height:12,borderRadius:8,background:active?p.color:(d?tk.d3:tk.cream3),boxShadow:active?`0 2px 10px ${p.color}70`:"none",transition:"all 0.4s ease"}}/>;
          })}
        </div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {Object.entries(PHASES).map(([k,p])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:ci.phase===k?p.color:(d?tk.d3:tk.cream3)}}/>
              <Mono size={9} color={ci.phase===k?p.color:ts}>{p.name.slice(0,3)}</Mono>
            </div>
          ))}
        </div>

        {/* Next period */}
        {ci.nextPeriod && (
          <div style={{marginTop:14,padding:"12px 14px",borderRadius:14,background:d?tk.d3:tk.cream,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <Mono size={12} color={tm}>🗓 Next period expected</Mono>
            <Mono size={12} color={tk.rose} style={{fontWeight:400}}>
              {ci.nextPeriod.toLocaleDateString("en-US",{month:"long",day:"numeric"})}
            </Mono>
          </div>
        )}
      </Card>

      {/* Mood + work */}
      <Card style={{borderLeft:`4px solid ${ph.color}`}}>
        <Lbl>Mood forecast</Lbl>
        <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,color:tx,lineHeight:1.65,marginBottom:12}}>{ph.mood.feel}</p>
        <div style={{padding:"12px 14px",borderRadius:12,background:d?ph.dark:ph.light}}>
          <Mono size={11} color={ph.color} style={{lineHeight:1.75}}>💡 {ph.mood.tip}</Mono>
        </div>
      </Card>

      <Card>
        <Lbl>Work & productivity</Lbl>
        <Mono size={12} color={tm} style={{lineHeight:1.75}}>{ph.work}</Mono>
      </Card>

      {/* Tab nav */}
      <div style={{display:"flex",gap:4,padding:4,borderRadius:16,background:d?tk.d1:tk.cream2}}>
        {TABS.map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"9px 4px",borderRadius:12,border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:"0.03em",background:tab===t?(d?tk.d3:"#fff"):"transparent",color:tab===t?ph.color:ts,boxShadow:tab===t?(d?"0 1px 6px rgba(0,0,0,0.35)":"0 1px 8px rgba(44,36,22,0.1)"):"none",transition:"all 0.2s ease"}}>
            {t==="self-care"?"Self care":t[0].toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {/* All phases */}
      {tab==="overview" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {Object.entries(PHASES).map(([k,p])=>{
            const active=ci.phase===k;
            return (
              <div key={k} className="su" style={{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",borderRadius:18,background:active?(d?p.dark:p.light):(d?tk.d2:"#fff"),border:`1px solid ${active?p.color+"45":div}`,boxShadow:active?`0 2px 14px ${p.color}1a`:"0 1px 8px rgba(44,36,22,0.05)"}}>
                <span style={{fontSize:28,flexShrink:0}}>{p.emoji}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                    <Serif size={16} color={active?p.color:tx}>{p.name}</Serif>
                    <Mono size={10} color={ts}>{p.range}</Mono>
                  </div>
                  <Mono size={11} color={ts} style={{marginBottom:6}}>{p.sub}</Mono>
                  <Dots n={p.energy} color={p.color}/>
                </div>
                {active && <div style={{width:8,height:8,borderRadius:"50%",background:p.color,boxShadow:`0 0 10px ${p.color}`,flexShrink:0}}/>}
              </div>
            );
          })}
        </div>
      )}

      {/* Food */}
      {tab==="food" && (
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card>
            <Mono size={10} color={tk.sage} style={{letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14}}>✓ Eat more of this</Mono>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {ph.food.eat.map((item,i)=>(
                <div key={i} style={{padding:"12px 14px",borderRadius:14,background:d?"#182e1a":tk.sageL}}>
                  <Mono size={12} color={tm}>{item}</Mono>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <Mono size={10} color={tk.rose} style={{letterSpacing:"0.14em",textTransform:"uppercase",marginBottom:14}}>✗ Best to avoid</Mono>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {ph.food.avoid.map((item,i)=>(
                <div key={i} style={{padding:"12px 14px",borderRadius:14,background:d?tk.d3:tk.roseL}}>
                  <Mono size={12} color={tm}>{item}</Mono>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Workout */}
      {tab==="workout" && (
        <Card>
          <Lbl>This phase</Lbl>
          <p style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:15,color:ph.color,lineHeight:1.65,marginBottom:18}}>{ph.workout.note}</p>
          <Lbl>Recommended for you</Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:16}}>
            {ph.workout.list.map((item,i)=>(
              <div key={i} style={{padding:"14px 16px",borderRadius:14,background:d?ph.dark:ph.light}}>
                <Mono size={13} color={tx}>{item}</Mono>
              </div>
            ))}
          </div>
          <div style={{padding:"14px 16px",borderRadius:14,background:d?tk.d3:tk.roseL}}>
            <Mono size={10} color={tk.rose} style={{letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:6}}>Best to skip</Mono>
            <Mono size={12} color={tm}>{ph.workout.skip}</Mono>
          </div>
        </Card>
      )}

      {/* Self care */}
      {tab==="self-care" && (
        <Card>
          <Lbl>Things that will actually help right now</Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {ph.care.map((item,i)=>(
              <div key={i} style={{padding:"14px 16px",borderRadius:14,background:i%2===0?(d?tk.d3:tk.cream):(d?ph.dark:ph.light)}}>
                <Mono size={13} color={tx}>{item}</Mono>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Symptom logger */}
      <Card>
        <Lbl>Log today's symptoms</Lbl>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {["Cramps","Bloating","Headache","Fatigue","Brain fog","Mood swings","Cravings","Tender","Back pain","High energy","Clear-headed","Happy","Irritable","Anxious","Motivated","Confident"].map(sym=>{
            const on=(cyc.logs?.[today]||[]).includes(sym);
            return <button key={sym} onClick={()=>dp({type:"CYC_SYM",d:today,sym})} style={{padding:"8px 14px",borderRadius:20,border:`1px solid ${on?ph.color:div}`,background:on?(d?ph.dark:ph.light):"transparent",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:11,color:on?ph.color:ts,transition:"all 0.2s ease"}}>{sym}</button>;
          })}
        </div>
      </Card>

      <Btn onClick={()=>setEditing(true)} variant="outline" style={{width:"100%",textAlign:"center",padding:"13px"}}>⚙ Update cycle settings</Btn>
    </div>
  );
}

// ── GOALS ─────────────────────────────────────────────────────────────────────
function GoalsScreen({s,dp}) {
  const {d}=useT();
  const [open,setOpen]=useState(false);
  const [f,setF]=useState({title:"",cat:"Work",deadline:"",status:"Not Started",ms:""});
  const div=d?"rgba(255,255,255,0.07)":"rgba(44,36,22,0.09)";
  const sel = {fontFamily:"'DM Mono',monospace",fontSize:12,padding:"11px 16px",borderRadius:14,border:`1px solid ${div}`,background:d?tk.d3:tk.cream,color:d?tk.di:tk.ink,outline:"none"};
  function add(){if(!f.title.trim())return;dp({type:"ADD_GOAL",p:{...f,id:Date.now(),prog:0,ms:f.ms.split(",").map(m=>m.trim()).filter(Boolean)}});setF({title:"",cat:"Work",deadline:"",status:"Not Started",ms:""});setOpen(false);}
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
      <div className="su" style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",paddingTop:8}}>
        <div><Lbl>Work · Health · Finance · Content</Lbl><Serif size={32}>Goals</Serif><Mono size={12} style={{marginTop:4}}>{s.goals.filter(g=>g.status==="Completed").length}/{s.goals.length} completed</Mono></div>
        <button onClick={()=>setOpen(!open)} style={{width:40,height:40,borderRadius:"50%",background:tk.sage,border:"none",color:"#fff",fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:`0 2px 14px ${tk.sage}50`,flexShrink:0}}>{open?"×":"+"}</button>
      </div>
      {open && (
        <Card>
          <Lbl>New goal</Lbl>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <FloatInput value={f.title} onChange={e=>setF(p=>({...p,title:e.target.value}))} placeholder="Goal title…"/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <select value={f.cat} onChange={e=>setF(p=>({...p,cat:e.target.value}))} style={sel}>{Object.keys(CAT).map(c=><option key={c}>{c}</option>)}</select>
              <select value={f.status} onChange={e=>setF(p=>({...p,status:e.target.value}))} style={sel}><option>Not Started</option><option>In Progress</option><option>Completed</option></select>
            </div>
            <input type="date" value={f.deadline} onChange={e=>setF(p=>({...p,deadline:e.target.value}))} style={{...sel,width:"100%"}}/>
            <FloatInput value={f.ms} onChange={e=>setF(p=>({...p,ms:e.target.value}))} placeholder="Milestones, comma separated"/>
            <Btn onClick={add} style={{width:"100%",textAlign:"center"}}>Add goal</Btn>
          </div>
        </Card>
      )}
      {["Work","Health","Finance","Content"].map(cat=>{
        const gs=s.goals.filter(g=>g.cat===cat); if(!gs.length) return null;
        return (
          <div key={cat}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}><div style={{width:8,height:8,borderRadius:"50%",background:CAT[cat]}}/><Lbl style={{marginBottom:0}}>{cat}</Lbl></div>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {gs.map(g=>(
                <Card key={g.id}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div style={{flex:1,paddingRight:10}}><Mono size={13} color={d?tk.di:tk.ink2}>{g.title}</Mono>{g.deadline&&<Mono size={11} style={{marginTop:3}}>Due {new Date(g.deadline+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</Mono>}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}><Chip label={g.status}/><button onClick={()=>dp({type:"DEL_GOAL",id:g.id})} style={{background:"none",border:"none",cursor:"pointer",fontSize:18,color:d?tk.di3:tk.ink3,lineHeight:1}}>×</button></div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}><div style={{flex:1}}><PBar v={g.prog} color={CAT[cat]}/></div><Mono size={11} color={CAT[cat]} style={{width:30,textAlign:"right"}}>{g.prog}%</Mono></div>
                  <input type="range" min={0} max={100} value={g.prog} onChange={e=>dp({type:"GOAL_P",id:g.id,v:+e.target.value})} style={{"--thumb":CAT[cat],"--track":d?tk.d3:tk.cream3,accentColor:CAT[cat]}}/>
                  {g.ms?.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:6,marginTop:12}}>{g.ms.map((m,i)=><span key={i} style={{fontFamily:"'DM Mono',monospace",fontSize:10,padding:"4px 10px",borderRadius:20,background:d?tk.d3:CATL[cat],color:CAT[cat]}}>{m}</span>)}</div>}
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── HEALTH ────────────────────────────────────────────────────────────────────
function HealthScreen({s,dp}) {
  const {d}=useT();
  const log=s.health[today]||{water:0,workout:false,sleep:0,steps:0};
  const upd=(k,v)=>dp({type:"HEALTH",d:today,k,v});
  const th=s.habitLogs[today]||{};
  const done=Object.values(th).filter(Boolean).length;
  const [nh,setNh]=useState("");
  const wk=Array.from({length:7}).map((_,i)=>{const dt=new Date();dt.setDate(dt.getDate()-(6-i));const k=dt.toISOString().split("T")[0];const hl=s.health[k]||{};return{day:dt.toLocaleDateString("en-US",{weekday:"short"}),water:hl.water||0,sleep:hl.sleep||0};});
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
      <div className="su" style={{paddingTop:8}}><Lbl>Track daily</Lbl><Serif size={32}>Health</Serif></div>
      <Card>
        <Lbl>Daily log</Lbl>
        <div style={{display:"flex",flexDirection:"column",gap:22}}>
          <div>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}><Mono size={13}>💧 Water</Mono><Mono size={13} color={tk.sky}>{log.water||0} glasses</Mono></div>
            <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>{Array.from({length:10}).map((_,i)=><button key={i} onClick={()=>upd("water",(log.water||0)===i+1?i:i+1)} style={{width:34,height:34,borderRadius:"50%",border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,transition:"all 0.15s",background:i<(log.water||0)?tk.sky:(d?tk.d3:tk.cream2),color:i<(log.water||0)?"#fff":(d?tk.di3:tk.ink3),transform:i<(log.water||0)?"scale(1.07)":"scale(1)",boxShadow:i<(log.water||0)?`0 2px 8px ${tk.sky}50`:"none"}}>{i+1}</button>)}</div>
          </div>
          <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><Mono size={13}>😴 Sleep</Mono><Mono size={13} color={tk.plum}>{log.sleep||0}h</Mono></div><input type="range" min={0} max={12} step={0.5} value={log.sleep||0} onChange={e=>upd("sleep",+e.target.value)} style={{"--thumb":tk.plum,"--track":d?tk.d3:tk.cream3,accentColor:tk.plum}}/><div style={{display:"flex",justifyContent:"space-between",marginTop:5}}><Mono size={10}>0h</Mono><Mono size={10}>6h</Mono><Mono size={10}>12h</Mono></div></div>
          <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><Mono size={13}>👟 Steps</Mono><Mono size={13} color={tk.gold}>{(log.steps||0).toLocaleString()}</Mono></div><input type="range" min={0} max={20000} step={500} value={log.steps||0} onChange={e=>upd("steps",+e.target.value)} style={{"--thumb":tk.gold,"--track":d?tk.d3:tk.cream3,accentColor:tk.gold}}/><div style={{display:"flex",justifyContent:"space-between",marginTop:5}}><Mono size={10}>0</Mono><Mono size={10}>10k</Mono><Mono size={10}>20k</Mono></div></div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><Mono size={13}>🏃 Workout done?</Mono><Toggle on={!!log.workout} set={v=>upd("workout",v)}/></div>
        </div>
      </Card>
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><Lbl style={{marginBottom:0}}>Habits</Lbl><Mono size={11} color={tk.sage}>{done}/{s.habits.length} done</Mono></div>
        <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:14}}>{s.habits.map(h=><div key={h.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><Mono size={13}>{h.icon} {h.name}</Mono><div style={{display:"flex",alignItems:"center",gap:12}}><button onClick={()=>dp({type:"DEL_HAB",id:h.id})} style={{background:"none",border:"none",cursor:"pointer",fontSize:16,color:d?tk.di3:tk.ink3}}>×</button><button onClick={()=>dp({type:"HABIT",d:today,id:h.id})} style={{width:26,height:26,borderRadius:"50%",border:`2px solid ${th[h.id]?"transparent":(d?tk.di3:tk.cream3)}`,background:th[h.id]?tk.sage:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s",boxShadow:th[h.id]?`0 2px 8px ${tk.sage}50`:"none"}}>{th[h.id]&&<span style={{color:"#fff",fontSize:12}}>✓</span>}</button></div></div>)}</div>
        <div style={{display:"flex",gap:10,padding:"12px 14px",borderRadius:14,background:d?tk.d3:tk.cream}}><input value={nh} onChange={e=>setNh(e.target.value)} placeholder="Add habit…" onKeyDown={e=>{if(e.key==="Enter"&&nh.trim()){dp({type:"ADD_HAB",p:{id:Date.now(),name:nh.trim(),icon:""}});setNh("");}}} style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Mono',monospace",fontSize:12,color:d?tk.di:tk.ink}}/><button onClick={()=>{if(nh.trim()){dp({type:"ADD_HAB",p:{id:Date.now(),name:nh.trim(),icon:""}});setNh("");}}} style={{background:"none",border:"none",cursor:"pointer",fontFamily:"'DM Mono',monospace",fontSize:12,color:tk.sage}}>Add</button></div>
      </Card>
      <Card><Lbl>This week</Lbl><ResponsiveContainer width="100%" height={100}><BarChart data={wk} barSize={7} barGap={2}><XAxis dataKey="day" tick={{fontFamily:"'DM Mono',monospace",fontSize:10,fill:d?tk.di3:tk.ink3}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:d?tk.d2:"#fff",border:"none",borderRadius:12,fontFamily:"'DM Mono',monospace",fontSize:11}}/><Bar dataKey="water" fill={tk.sky} radius={[4,4,0,0]} name="Water"/><Bar dataKey="sleep" fill={tk.plum} radius={[4,4,0,0]} name="Sleep"/></BarChart></ResponsiveContainer></Card>
    </div>
  );
}

// ── JOURNAL ───────────────────────────────────────────────────────────────────
function JournalScreen({s,dp}) {
  const {d}=useT();
  const e=s.moods[today]||{mood:null,note:""};
  const [note,setNote]=useState(e.note||"");
  const recent=Object.entries(s.moods).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,8);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
      <div className="su" style={{paddingTop:8}}><Lbl>Reflect daily</Lbl><Serif size={32}>Journal</Serif></div>
      <Card><Lbl>Today's mood</Lbl><div style={{display:"flex",justifyContent:"space-between",padding:"0 2px"}}>{MOODS.map((m,i)=><button key={i} onClick={()=>dp({type:"MOOD",d:today,mood:i,note})} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8,padding:"12px 6px",borderRadius:18,border:"none",cursor:"pointer",background:e.mood===i?(m.c+"22"):"transparent",transform:e.mood===i?"scale(1.12)":"scale(1)",opacity:e.mood===i?1:0.38,transition:"all 0.22s cubic-bezier(0.34,1.56,0.64,1)"}}><span style={{fontSize:30}}>{m.e}</span><Mono size={10} color={m.c}>{m.l}</Mono></button>)}</div></Card>
      <Card><Lbl>Daily reflection</Lbl><textarea value={note} onChange={e=>setNote(e.target.value)} maxLength={300} placeholder="What's on your mind today…" style={{width:"100%",fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:15,padding:"14px 16px",borderRadius:14,border:`1px solid ${d?"rgba(255,255,255,0.07)":"rgba(44,36,22,0.09)"}`,background:d?tk.d3:tk.cream,color:d?tk.di:tk.ink,outline:"none",resize:"none",lineHeight:1.7,minHeight:110}}/><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}><Mono size={11}>{note.length}/300</Mono><Btn onClick={()=>dp({type:"MOOD",d:today,mood:e.mood,note})}>Save</Btn></div></Card>
      {recent.length>0&&<Card><Lbl>Recent entries</Lbl><div style={{display:"flex",flexDirection:"column",gap:10}}>{recent.map(([dt,en])=>{const mood=en.mood!=null?MOODS[en.mood]:null;return(<div key={dt} style={{padding:"14px 16px",borderRadius:16,background:d?tk.d3:tk.cream}}><div style={{display:"flex",alignItems:"center",gap:8,marginBottom:en.note?8:0}}>{mood&&<span style={{fontSize:18}}>{mood.e}</span>}<Mono size={11}>{new Date(dt+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric"})}</Mono>{mood&&<Mono size={11} color={mood.c} style={{marginLeft:"auto"}}>{mood.l}</Mono>}</div>{en.note&&<p style={{fontFamily:"'Playfair Display',serif",fontStyle:"italic",fontSize:13,color:d?tk.di3:tk.ink3,lineHeight:1.65}}>"{en.note}"</p>}</div>)})}</div></Card>}
    </div>
  );
}

// ── FINANCE ───────────────────────────────────────────────────────────────────
function FinanceScreen({s,dp}) {
  const {d}=useT();
  const f=s.finance;
  const sp=pct(f.saved,f.target), ep=pct(f.expenses,f.income);
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
      <div className="su" style={{paddingTop:8}}><Lbl>Simple & clear</Lbl><Serif size={32}>Finance</Serif></div>
      <Card><Lbl>Savings goal</Lbl><div style={{display:"flex",alignItems:"center",gap:20}}><Ring v={sp} color={tk.gold} size={88}/><div><Serif size={26}>₹{f.saved.toLocaleString()}</Serif><Mono size={12} style={{marginTop:4}}>of ₹{f.target.toLocaleString()}</Mono><Mono size={12} color={tk.gold} style={{marginTop:8}}>₹{(f.target-f.saved).toLocaleString()} to go</Mono></div></div></Card>
      <Card><Lbl>Monthly numbers</Lbl><div style={{display:"flex",flexDirection:"column",gap:14}}>{[{l:"Monthly income",k:"income"},{l:"Monthly expenses",k:"expenses"},{l:"Total saved so far",k:"saved"},{l:"Savings target",k:"target"}].map(it=><div key={it.k}><Mono size={11} style={{marginBottom:8,letterSpacing:"0.06em"}}>{it.l}</Mono><div style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",borderRadius:14,background:d?tk.d3:tk.cream}}><Mono size={13}>₹</Mono><input type="number" value={f[it.k]} onChange={e=>dp({type:"FIN",k:it.k,v:+e.target.value||0})} style={{flex:1,background:"transparent",border:"none",outline:"none",fontFamily:"'DM Mono',monospace",fontSize:13,color:d?tk.di:tk.ink}}/></div></div>)}</div></Card>
      <Card><Lbl>Spend rate</Lbl><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><Mono size={12}>₹{f.expenses.toLocaleString()} spent</Mono><Mono size={12} color={ep>80?tk.rose:tk.sage}>{ep}% of income</Mono></div><PBar v={ep} color={ep>80?tk.rose:tk.sage} h={6}/><Mono size={11} color={ep>80?tk.rose:tk.sage} style={{marginTop:10}}>{ep>80?"⚠ High spending this month":ep===0?"Enter your numbers above":"✓ Spending looks healthy"}</Mono></Card>
      <Card style={{textAlign:"center",padding:"28px 20px"}}><Lbl style={{textAlign:"center"}}>Net this month</Lbl><Serif size={36} color={f.income-f.expenses>=0?tk.sage:tk.rose}>{f.income-f.expenses>=0?"+":"-"}₹{Math.abs(f.income-f.expenses).toLocaleString()}</Serif></Card>
    </div>
  );
}

// ── INSIGHTS ──────────────────────────────────────────────────────────────────
function InsightsScreen({s}) {
  const {d}=useT();
  const avg=Math.round(s.goals.reduce((a,g)=>a+g.prog,0)/Math.max(1,s.goals.length));
  const f=s.finance;
  const mwk=Array.from({length:7}).map((_,i)=>{const dt=new Date();dt.setDate(dt.getDate()-(6-i));const k=dt.toISOString().split("T")[0];const e=s.moods[k];return{day:dt.toLocaleDateString("en-US",{weekday:"short"}),score:e?.mood!=null?5-e.mood:0};});
  return (
    <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
      <div className="su" style={{paddingTop:8}}><Lbl>Monthly overview</Lbl><Serif size={32}>Insights</Serif></div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{[{l:"Goal progress",v:`${avg}%`,s:"avg across all",c:tk.sage},{l:"Savings",v:`${pct(f.saved,f.target)}%`,s:"of annual target",c:tk.gold},{l:"Goals done",v:`${s.goals.filter(g=>g.status==="Completed").length}/${s.goals.length}`,s:"completed",c:tk.sky},{l:"Content",v:`${s.content.done}/${s.content.goal}`,s:"weekly target",c:tk.plum}].map(it=><Card key={it.l} style={{textAlign:"center",padding:"22px 14px"}}><Serif size={26} color={it.c}>{it.v}</Serif><Mono size={11} color={d?tk.di:tk.ink2} style={{marginTop:8}}>{it.l}</Mono><Mono size={10} style={{marginTop:4}}>{it.s}</Mono></Card>)}</div>
      <Card><Lbl>Goal breakdown</Lbl><div style={{display:"flex",flexDirection:"column",gap:14}}>{s.goals.map(g=><div key={g.id}><div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><Mono size={11} color={d?tk.di:tk.ink2}>{g.title.length>32?g.title.slice(0,32)+"…":g.title}</Mono><Mono size={11} color={CAT[g.cat]}>{g.prog}%</Mono></div><PBar v={g.prog} color={CAT[g.cat]}/></div>)}</div></Card>
      <Card><Lbl>Mood this week</Lbl><ResponsiveContainer width="100%" height={90}><LineChart data={mwk}><XAxis dataKey="day" tick={{fontFamily:"'DM Mono',monospace",fontSize:10,fill:d?tk.di3:tk.ink3}} axisLine={false} tickLine={false}/><Tooltip contentStyle={{background:d?tk.d2:"#fff",border:"none",borderRadius:12,fontFamily:"'DM Mono',monospace",fontSize:11}}/><Line type="monotone" dataKey="score" stroke={tk.plum} strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer></Card>
      <Card><Lbl>Finance snapshot</Lbl><div style={{display:"flex",flexDirection:"column",gap:12}}><div style={{display:"flex",justifyContent:"space-between"}}><Mono size={13}>Monthly income</Mono><Mono size={13} color={tk.sage}>+₹{f.income.toLocaleString()}</Mono></div><div style={{display:"flex",justifyContent:"space-between"}}><Mono size={13}>Monthly expenses</Mono><Mono size={13} color={tk.rose}>-₹{f.expenses.toLocaleString()}</Mono></div><div style={{height:1,background:d?"rgba(255,255,255,0.06)":"rgba(44,36,22,0.08)",margin:"4px 0"}}/><div style={{display:"flex",justifyContent:"space-between"}}><Mono size={13} color={d?tk.di:tk.ink}>Net savings</Mono><Mono size={13} color={f.income-f.expenses>=0?tk.sage:tk.rose}>{f.income-f.expenses>=0?"+":""}₹{(f.income-f.expenses).toLocaleString()}</Mono></div></div></Card>
    </div>
  );
}

// ── NAVIGATION ────────────────────────────────────────────────────────────────
const NAV = [
  {id:"home",    icon:"⌂", label:"Home"},
  {id:"goals",   icon:"◎", label:"Goals"},
  {id:"health",  icon:"♡", label:"Health"},
  {id:"finance", icon:"◇", label:"Finance"},
  {id:"journal", icon:"✎", label:"Journal"},
  {id:"cycle",   icon:"◉", label:"Cycle"},
  {id:"insights",icon:"◈", label:"Insights"},
];

const SCREENS = {
  home:    HomeScreen,
  goals:   GoalsScreen,
  health:  HealthScreen,
  finance: FinanceScreen,
  journal: JournalScreen,
  cycle:   CycleScreen,
  insights:InsightsScreen,
};

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function LifeOS({ signOut, userEmail, userId }) {
  const [state,dispatch] = useReducer(reducer, INIT);
  const [screen,setScreen] = useState("home");
  const [flash,setFlash]   = useState(false);
  const [showSettings,setShowSettings] = useState(false);
  const [loading,setLoading] = useState(true);
  const dark = state.dark;
  const initialLoad = useRef(true);

  // Pull from Supabase on first load
  useEffect(()=>{
    if(!userId) return;
    pullFromSupabase(userId)
      .then(data => { if(data) dispatch({type:"IMPORT_STATE",payload:data}); })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  },[userId]);

  // Auto-push to Supabase on every state change (debounced, skip initial load)
  useEffect(()=>{
    if(initialLoad.current){ initialLoad.current=false; return; }
    if(loading || !userId) return;
    const t=setTimeout(()=>{ pushToSupabase(state, userId).catch(()=>{}); },1500);
    return()=>clearTimeout(t);
  },[state,loading,userId]);

  useEffect(()=>{ setFlash(true); const t=setTimeout(()=>setFlash(false),1400); return()=>clearTimeout(t); },[state]);

  const Screen = SCREENS[screen];

  if (loading) {
    return (
      <Ctx.Provider value={{d:dark}}>
        <Fonts/>
        <div style={{position:"fixed",inset:0,background:dark?tk.d0:tk.cream,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{textAlign:"center"}}>
            <span style={{color:tk.sage,fontSize:36,lineHeight:1,display:"block",animation:"pulse 1.2s ease infinite"}}>✦</span>
            <p style={{fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:"0.15em",textTransform:"uppercase",color:dark?tk.di3:tk.ink3,marginTop:16}}>Loading your data…</p>
          </div>
        </div>
      </Ctx.Provider>
    );
  }

  return (
    <Ctx.Provider value={{d:dark}}>
      <Fonts/>
      <div style={{position:"fixed",inset:0,background:dark?tk.d0:tk.cream,display:"flex",justifyContent:"center",overflow:"hidden"}}>

        {/* Saved toast */}
        <div style={{position:"fixed",top:16,left:"50%",zIndex:200,background:"#2c2416",color:"#faf7f2",fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:"0.09em",padding:"7px 20px",borderRadius:40,boxShadow:"0 4px 24px rgba(0,0,0,0.28)",pointerEvents:"none",transition:"all 0.3s ease",opacity:flash?1:0,transform:`translateX(-50%) translateY(${flash?0:-10}px)`}}>✦ saved</div>

        {/* Phone shell */}
        <div style={{width:"100%",maxWidth:430,height:"100%",display:"flex",flexDirection:"column",position:"relative"}}>

          {/* Top bar */}
          <div style={{padding:"28px 22px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",background:dark?tk.d0:tk.cream,backdropFilter:"blur(16px)",position:"sticky",top:0,zIndex:30}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{color:tk.sage,fontSize:19,lineHeight:1}}>✦</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,letterSpacing:"0.2em",textTransform:"uppercase",color:dark?tk.di:tk.ink2}}>LifeOS</span>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>dispatch({type:"DARK"})} style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${dark?"rgba(255,255,255,0.09)":"rgba(44,36,22,0.12)"}`,background:dark?tk.d3:tk.cream2,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                {dark?"☀":"☾"}
              </button>
              <button onClick={()=>setShowSettings(true)} style={{width:34,height:34,borderRadius:"50%",border:`1px solid ${dark?"rgba(255,255,255,0.09)":"rgba(44,36,22,0.12)"}`,background:dark?tk.d3:tk.cream2,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.2s"}}>
                ⚙
              </button>
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{flex:1,overflowY:"auto",padding:"0 22px 110px",scrollBehavior:"smooth"}}>
            {showSettings ? (
              <div style={{display:"flex",flexDirection:"column",gap:16,paddingBottom:32}}>
                <div style={{display:"flex",alignItems:"center",gap:12,paddingTop:8}}>
                  <button onClick={()=>setShowSettings(false)} style={{width:32,height:32,borderRadius:"50%",border:`1px solid ${dark?"rgba(255,255,255,0.09)":"rgba(44,36,22,0.12)"}`,background:dark?tk.d3:tk.cream2,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'DM Mono',monospace",color:dark?tk.di:tk.ink2}}>←</button>
                  <span style={{fontFamily:"'Playfair Display',serif",fontSize:28,color:dark?tk.di:tk.ink}}>Settings</span>
                </div>

                {/* Account section */}
                <div style={{background:dark?tk.d2:"#fff",borderRadius:20,padding:20,border:`1px solid ${dark?"rgba(255,255,255,0.045)":"rgba(44,36,22,0.055)"}`,boxShadow:dark?"0 2px 16px rgba(0,0,0,0.35)":"0 2px 20px rgba(44,36,22,0.07)"}}>
                  <p style={{fontFamily:"'DM Mono',monospace",fontSize:10,letterSpacing:"0.15em",textTransform:"uppercase",color:dark?tk.di3:tk.ink3,marginBottom:14}}>Account</p>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
                    <p style={{fontFamily:"'DM Mono',monospace",fontSize:12,color:dark?tk.di2:tk.ink2}}>{userEmail || "—"}</p>
                  </div>
                  <button onClick={signOut} style={{width:"100%",fontFamily:"'DM Mono',monospace",fontSize:12,letterSpacing:"0.04em",padding:"12px 20px",borderRadius:14,border:`1px solid ${dark?"rgba(196,122,122,0.3)":"rgba(196,122,122,0.25)"}`,cursor:"pointer",background:"transparent",color:tk.rose,transition:"all 0.15s",textAlign:"center"}}>
                    Sign out
                  </button>
                </div>

                <SettingsScreen state={state} dispatch={dispatch} dark={dark}/>
              </div>
            ) : (
              <Screen s={state} dp={dispatch}/>
            )}
          </div>

          {/* Bottom nav */}
          <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,zIndex:40,background:dark?"rgba(23,20,15,0.97)":"rgba(250,247,242,0.97)",backdropFilter:"blur(20px)",borderTop:`1px solid ${dark?"rgba(255,255,255,0.055)":"rgba(44,36,22,0.08)"}`,padding:"10px 4px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-around"}}>
              {NAV.map(n=>{
                const on=screen===n.id;
                return (
                  <button key={n.id} onClick={()=>setScreen(n.id)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"5px 6px",borderRadius:12,border:"none",cursor:"pointer",background:on?(dark?"rgba(122,158,126,0.13)":"rgba(122,158,126,0.1)"):"transparent",opacity:on?1:0.28,transition:"all 0.2s ease",minWidth:38}}>
                    <span style={{fontSize:16,lineHeight:1,color:on?tk.sage:(dark?tk.di:tk.ink)}}>{n.icon}</span>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:"0.04em",color:on?tk.sage:(dark?tk.di3:tk.ink3)}}>{n.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Ctx.Provider>
  );
}

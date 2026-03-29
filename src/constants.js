// ── Design Tokens ────────────────────────────────────────────────────────────
export const tk = {
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

// ── Category Colors ──────────────────────────────────────────────────────────
export const CAT  = { Work:tk.sky, Health:tk.sage, Finance:tk.gold, Content:tk.plum };
export const CATL = { Work:tk.skyL, Health:tk.sageL, Finance:tk.goldL, Content:tk.plumL };

// ── Today's date key ─────────────────────────────────────────────────────────
export const today = new Date().toISOString().split("T")[0];

// ── Moods ────────────────────────────────────────────────────────────────────
export const MOODS = [
  {e:"😄",l:"Great",c:tk.sage},{e:"🙂",l:"Good",c:"#9b9e7a"},
  {e:"😐",l:"Okay",c:tk.gold},{e:"😔",l:"Low",c:tk.plum},{e:"😤",l:"Rough",c:tk.rose},
];

// ── Cycle Phases ─────────────────────────────────────────────────────────────
export const PHASES = {
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

// ── Cycle Phase Calculator ───────────────────────────────────────────────────
export function calcPhase(startDate, len = 28) {
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
  const cyclesSince = Math.floor(diff / len);
  const nextPeriod  = new Date(start);
  nextPeriod.setDate(start.getDate() + (cyclesSince + 1) * len);
  return { phase, day, nextIn, nextPeriod, len };
}

// ── Utility ──────────────────────────────────────────────────────────────────
export const pct = (v, t) => !t ? 0 : Math.min(100, Math.round(v / t * 100));

// ── Navigation Config ────────────────────────────────────────────────────────
export const NAV = [
  {id:"home",    icon:"⌂", label:"Home"},
  {id:"goals",   icon:"◎", label:"Goals"},
  {id:"health",  icon:"♡", label:"Health"},
  {id:"finance", icon:"◇", label:"Finance"},
  {id:"journal", icon:"✎", label:"Journal"},
  {id:"cycle",   icon:"◉", label:"Cycle"},
  {id:"insights",icon:"◈", label:"Insights"},
];

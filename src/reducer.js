// ── Initial State ────────────────────────────────────────────────────────────
export const INIT = {
  dark: false,
  profile: { name: "", gender: "" },
  habits: [],
  habitLogs: {},
  goals: [],
  customCategories: [],
  health: { daily: {}, weekly: {}, config: { customHabits: [], hiddenDefaults: [] } },
  finance: { income: 0, budget: [], investments: [], month: new Date().toISOString().slice(0, 7), resetDay: 1 },
  content: { ideas: [], planned: 0, done: 0, goal: 0 },
  moods: {},
  cycle: { start: "", len: 28, logs: {} },
  notifications: { morning: true, evening: true, morningTime: "08:00", eveningTime: "21:00" },
  work: { enabled: true, monthlyTarget: "", dailyTodos: [], reminders: [] },
  breaks: { enabled: false, intervalMin: 60 },
};

// ── Reducer ──────────────────────────────────────────────────────────────────
export function reducer(s, a) {
  switch (a.type) {
    case "DARK":
      return { ...s, dark: !s.dark };

    case "HABIT": {
      const l = { ...s.habitLogs };
      l[a.d] = { ...(l[a.d] || {}), [a.id]: !(l[a.d]?.[a.id]) };
      return { ...s, habitLogs: l };
    }

    case "H_DAILY": {
      const daily = { ...(s.health.daily || {}) };
      daily[a.d] = { ...(daily[a.d] || { mindMood: null, bodyMood: null, grateful: "", habits: {}, brainDump: "", affirmation: "" }), [a.k]: a.v };
      return { ...s, health: { ...s.health, daily } };
    }

    case "H_DAILY_HAB": {
      const daily = { ...(s.health.daily || {}) };
      const de = { ...(daily[a.d] || { mindMood: null, bodyMood: null, grateful: "", habits: {}, brainDump: "", affirmation: "" }) };
      const hb = { ...de.habits }; hb[a.name] = !hb[a.name]; de.habits = hb;
      daily[a.d] = de;
      return { ...s, health: { ...s.health, daily } };
    }

    case "H_WEEKLY": {
      const weekly = { ...(s.health.weekly || {}) };
      weekly[a.w] = { ...(weekly[a.w] || { pattern: "", protect: "" }), [a.k]: a.v };
      return { ...s, health: { ...s.health, weekly } };
    }

    case "GOAL_P":
      return {
        ...s,
        goals: s.goals.map(g =>
          g.id === a.id
            ? { ...g, prog: a.v, status: a.v === 100 ? "Completed" : a.v > 0 ? "In Progress" : "Not Started" }
            : g
        ),
      };

    case "ADD_GOAL":
      return { ...s, goals: [...s.goals, a.p] };

    case "DEL_GOAL":
      return { ...s, goals: s.goals.filter(g => g.id !== a.id) };

    case "ADD_CATEGORY":
      return { ...s, customCategories: [...(s.customCategories || []), a.name] };

    case "DEL_CATEGORY":
      return { ...s, customCategories: (s.customCategories || []).filter(c => c !== a.name) };

    case "FIN": {
      const fin = { ...s.finance, budget: s.finance.budget || [], investments: s.finance.investments || [] };
      return { ...s, finance: { ...fin, [a.k]: a.v } };
    }

    case "FIN_ADD_ITEM":
      return { ...s, finance: { ...s.finance, budget: [...(s.finance.budget || []), a.p] } };

    case "FIN_DEL_ITEM":
      return { ...s, finance: { ...s.finance, budget: (s.finance.budget || []).filter(b => b.id !== a.id) } };

    case "FIN_EDIT_ITEM":
      return { ...s, finance: { ...s.finance, budget: (s.finance.budget || []).map(b => b.id === a.id ? { ...b, ...a.p } : b) } };

    case "FIN_TOGGLE_PAID":
      return { ...s, finance: { ...s.finance, budget: (s.finance.budget || []).map(b => b.id === a.id ? { ...b, paid: !b.paid } : b) } };

    case "FIN_RESET_MONTH":
      return {
        ...s,
        finance: {
          ...s.finance,
          month: a.m,
          budget: (s.finance.budget || [])
            .filter(b => b.repeat)
            .map(b => ({ ...b, paid: false })),
        },
      };

    case "FIN_ADD_INV":
      return { ...s, finance: { ...s.finance, investments: [...(s.finance.investments || []), a.p] } };

    case "FIN_DEL_INV":
      return { ...s, finance: { ...s.finance, investments: (s.finance.investments || []).filter(v => v.id !== a.id) } };

    case "CON":
      return { ...s, content: { ...s.content, [a.k]: a.v } };

    case "ADD_IDEA":
      return { ...s, content: { ...s.content, ideas: [...s.content.ideas, a.v] } };

    case "DEL_IDEA":
      return { ...s, content: { ...s.content, ideas: s.content.ideas.filter((_, i) => i !== a.i) } };

    case "MOOD": {
      const m = { ...s.moods };
      m[a.d] = { mood: a.mood, note: a.note };
      return { ...s, moods: m };
    }

    case "ADD_HAB":
      return { ...s, habits: [...s.habits, a.p] };

    case "DEL_HAB":
      return { ...s, habits: s.habits.filter(h => h.id !== a.id) };

    case "CYCLE":
      return { ...s, cycle: { ...s.cycle, ...a.p } };

    case "CYC_SYM": {
      const logs = { ...(s.cycle.logs || {}) };
      const dl = [...(logs[a.d] || [])];
      const i = dl.indexOf(a.sym);
      if (i >= 0) dl.splice(i, 1); else dl.push(a.sym);
      logs[a.d] = dl;
      return { ...s, cycle: { ...s.cycle, logs } };
    }

    case "H_ADD_CUSTOM_HAB": {
      const cfg = { ...(s.health.config || { customHabits: [], hiddenDefaults: [] }) };
      cfg.customHabits = [...cfg.customHabits, a.name];
      return { ...s, health: { ...s.health, config: cfg } };
    }

    case "H_DEL_CUSTOM_HAB": {
      const cfg = { ...(s.health.config || { customHabits: [], hiddenDefaults: [] }) };
      cfg.customHabits = cfg.customHabits.filter((_, i) => i !== a.i);
      return { ...s, health: { ...s.health, config: cfg } };
    }

    case "H_TOGGLE_DEFAULT": {
      const cfg = { ...(s.health.config || { customHabits: [], hiddenDefaults: [] }) };
      const hd = [...cfg.hiddenDefaults];
      const idx = hd.indexOf(a.i);
      if (idx >= 0) hd.splice(idx, 1); else hd.push(a.i);
      cfg.hiddenDefaults = hd;
      return { ...s, health: { ...s.health, config: cfg } };
    }

    case "IMPORT_STATE": {
      const imp = { ...INIT, ...a.payload, dark: s.dark };
      if (!imp.health) imp.health = { ...INIT.health };
      if (!imp.health.daily) imp.health.daily = {};
      if (!imp.health.weekly) imp.health.weekly = {};
      if (!imp.health.config) imp.health.config = { ...INIT.health.config };
      if (!imp.profile) imp.profile = INIT.profile;
      if (!imp.work) imp.work = INIT.work;
      if (!imp.breaks) imp.breaks = INIT.breaks;
      return imp;
    }

    case "PROFILE":
      return { ...s, profile: { ...(s.profile || INIT.profile), ...a.p } };

    case "WORK_TOGGLE":
      return { ...s, work: { ...(s.work || INIT.work), enabled: !(s.work || INIT.work).enabled } };

    case "WORK_TARGET":
      return { ...s, work: { ...(s.work || INIT.work), monthlyTarget: a.v } };

    case "WORK_ADD_TODO":
      return { ...s, work: { ...(s.work || INIT.work), dailyTodos: [...(s.work || INIT.work).dailyTodos, a.p] } };

    case "WORK_TOGGLE_TODO":
      return { ...s, work: { ...(s.work || INIT.work), dailyTodos: (s.work || INIT.work).dailyTodos.map(t => t.id === a.id ? { ...t, done: !t.done } : t) } };

    case "WORK_DEL_TODO":
      return { ...s, work: { ...(s.work || INIT.work), dailyTodos: (s.work || INIT.work).dailyTodos.filter(t => t.id !== a.id) } };

    case "WORK_ADD_REMINDER":
      return { ...s, work: { ...(s.work || INIT.work), reminders: [...(s.work || INIT.work).reminders, a.p] } };

    case "WORK_DEL_REMINDER":
      return { ...s, work: { ...(s.work || INIT.work), reminders: (s.work || INIT.work).reminders.filter(r => r.id !== a.id) } };

    case "WORK_DAILY_RESET": {
      const w = s.work || INIT.work;
      // Remove done tasks from previous days, keep today's and undone carry-overs
      const cleaned = w.dailyTodos.filter(t => t.date === a.today || !t.done);
      return { ...s, work: { ...w, dailyTodos: cleaned, lastResetDate: a.today } };
    }

    case "WORK_WEEKLY_RESET":
      return { ...s, work: { ...(s.work || INIT.work), monthlyTarget: "", lastWeeklyReset: a.week } };

    case "BREAKS":
      return { ...s, breaks: { ...(s.breaks || INIT.breaks), ...a.p } };

    case "NOTIF_PREFS":
      return { ...s, notifications: { ...(s.notifications || INIT.notifications), [a.k]: a.v } };

    case "RESET_ALL":
      return { ...INIT };

    default:
      return s;
  }
}

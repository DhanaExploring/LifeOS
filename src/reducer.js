// ── Initial State ────────────────────────────────────────────────────────────
export const INIT = {
  dark: false,
  habits: [],
  habitLogs: {},
  goals: [],
  health: {},
  finance: { income: 0, budget: [], investments: [], month: new Date().toISOString().slice(0, 7) },
  content: { ideas: [], planned: 0, done: 0, goal: 0 },
  moods: {},
  cycle: { start: "", len: 28, logs: {} },
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

    case "HEALTH": {
      const h = { ...s.health };
      h[a.d] = { ...(h[a.d] || {}), [a.k]: a.v };
      return { ...s, health: h };
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
            .map(b => b.repeat ? { ...b, paid: false } : b)
            .filter(b => b.repeat || !b.paid),
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

    case "IMPORT_STATE":
      return { ...INIT, ...a.payload, dark: s.dark };

    case "RESET_ALL":
      return { ...INIT };

    default:
      return s;
  }
}

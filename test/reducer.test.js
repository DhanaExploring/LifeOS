import { describe, it, expect } from "vitest";
import { reducer, INIT } from "../src/reducer";

describe("reducer", () => {
  it("returns INIT state shape by default", () => {
    expect(INIT.dark).toBe(false);
    expect(INIT.habits).toEqual([]);
    expect(INIT.goals).toEqual([]);
    expect(INIT.finance.budget).toEqual([]);
  });

  it("DARK toggles dark mode", () => {
    const s1 = reducer(INIT, { type: "DARK" });
    expect(s1.dark).toBe(true);
    const s2 = reducer(s1, { type: "DARK" });
    expect(s2.dark).toBe(false);
  });

  // ── Habits ──────────────────────────────────────────────────────────────
  it("HABIT toggles a habit log for a date", () => {
    const s = reducer(INIT, { type: "HABIT", d: "2025-03-28", id: 1 });
    expect(s.habitLogs["2025-03-28"][1]).toBe(true);
    const s2 = reducer(s, { type: "HABIT", d: "2025-03-28", id: 1 });
    expect(s2.habitLogs["2025-03-28"][1]).toBe(false);
  });

  it("ADD_HAB adds a habit", () => {
    const s = reducer(INIT, { type: "ADD_HAB", p: { id: 42, name: "Read", icon: "📖" } });
    expect(s.habits).toHaveLength(1);
    expect(s.habits[0].name).toBe("Read");
  });

  it("DEL_HAB removes a habit", () => {
    const s = reducer({ ...INIT, habits: [{ id: 1 }, { id: 2 }] }, { type: "DEL_HAB", id: 1 });
    expect(s.habits).toHaveLength(1);
    expect(s.habits[0].id).toBe(2);
  });

  // ── Health Check-in ──────────────────────────────────────────────────────
  it("H_DAILY sets a daily health field", () => {
    const s = reducer(INIT, { type: "H_DAILY", d: "2025-03-28", k: "mindMood", v: 3 });
    expect(s.health.daily["2025-03-28"].mindMood).toBe(3);
  });

  it("H_DAILY_HAB toggles a daily habit by name", () => {
    const s1 = reducer(INIT, { type: "H_DAILY_HAB", d: "2025-03-28", name: "Drank enough water" });
    expect(s1.health.daily["2025-03-28"].habits["Drank enough water"]).toBe(true);
    const s2 = reducer(s1, { type: "H_DAILY_HAB", d: "2025-03-28", name: "Drank enough water" });
    expect(s2.health.daily["2025-03-28"].habits["Drank enough water"]).toBe(false);
  });

  it("H_WEEKLY sets a weekly health field", () => {
    const s = reducer(INIT, { type: "H_WEEKLY", w: "2025-03-23", k: "pattern", v: "More sleep" });
    expect(s.health.weekly["2025-03-23"].pattern).toBe("More sleep");
  });


  it("IMPORT_STATE migrates old health format", () => {
    const payload = { health: { "2025-03-28": { water: 8 } } };
    const s = reducer(INIT, { type: "IMPORT_STATE", payload });
    // Old format has no .daily key, so sub-keys get defaults
    expect(s.health.daily).toEqual({});
    expect(s.health.weekly).toEqual({});
    expect(s.health.config).toEqual(INIT.health.config);
  });

  it("IMPORT_STATE preserves health sub-keys independently", () => {
    const payload = { health: { config: { customHabits: ["Meditate"], hiddenDefaults: [0] }, weekly: { "w1": { pattern: "test" } } } };
    const s = reducer(INIT, { type: "IMPORT_STATE", payload });
    expect(s.health.daily).toEqual({});
    expect(s.health.weekly).toEqual({ "w1": { pattern: "test" } });
    expect(s.health.config.customHabits).toEqual(["Meditate"]);
  });

  // ── Configurable Health Habits ──────────────────────────────────────────
  it("H_ADD_CUSTOM_HAB adds a custom habit", () => {
    const s = reducer(INIT, { type: "H_ADD_CUSTOM_HAB", name: "Meditate" });
    expect(s.health.config.customHabits).toEqual(["Meditate"]);
  });

  it("H_DEL_CUSTOM_HAB removes a custom habit by index", () => {
    const withHab = { ...INIT, health: { ...INIT.health, config: { ...INIT.health.config, customHabits: ["A", "B"] } } };
    const s = reducer(withHab, { type: "H_DEL_CUSTOM_HAB", i: 0 });
    expect(s.health.config.customHabits).toEqual(["B"]);
  });

  it("H_TOGGLE_DEFAULT toggles default habit visibility", () => {
    const s1 = reducer(INIT, { type: "H_TOGGLE_DEFAULT", i: 1 });
    expect(s1.health.config.hiddenDefaults).toEqual([1]);
    const s2 = reducer(s1, { type: "H_TOGGLE_DEFAULT", i: 1 });
    expect(s2.health.config.hiddenDefaults).toEqual([]);
  });


  // ── Goals ───────────────────────────────────────────────────────────────
  it("ADD_GOAL adds a goal", () => {
    const g = { id: 1, title: "Test goal", prog: 0, status: "Not Started", cat: "Work" };
    const s = reducer(INIT, { type: "ADD_GOAL", p: g });
    expect(s.goals).toHaveLength(1);
    expect(s.goals[0].title).toBe("Test goal");
  });

  it("DEL_GOAL removes a goal", () => {
    const state = { ...INIT, goals: [{ id: 1 }, { id: 2 }] };
    const s = reducer(state, { type: "DEL_GOAL", id: 1 });
    expect(s.goals).toHaveLength(1);
    expect(s.goals[0].id).toBe(2);
  });

  it("GOAL_P updates progress and derives status", () => {
    const state = { ...INIT, goals: [{ id: 1, prog: 0, status: "Not Started" }] };
    const s1 = reducer(state, { type: "GOAL_P", id: 1, v: 50 });
    expect(s1.goals[0].prog).toBe(50);
    expect(s1.goals[0].status).toBe("In Progress");

    const s2 = reducer(s1, { type: "GOAL_P", id: 1, v: 100 });
    expect(s2.goals[0].status).toBe("Completed");

    const s3 = reducer(s2, { type: "GOAL_P", id: 1, v: 0 });
    expect(s3.goals[0].status).toBe("Not Started");
  });

  // ── Finance ─────────────────────────────────────────────────────────────
  it("FIN updates a finance field", () => {
    const s = reducer(INIT, { type: "FIN", k: "income", v: 50000 });
    expect(s.finance.income).toBe(50000);
  });

  it("FIN_ADD_ITEM adds a budget item", () => {
    const item = { id: 1, name: "Rent", amount: 10000, repeat: true, cat: "Essentials", paid: false };
    const s = reducer(INIT, { type: "FIN_ADD_ITEM", p: item });
    expect(s.finance.budget).toHaveLength(1);
    expect(s.finance.budget[0].name).toBe("Rent");
  });

  it("FIN_DEL_ITEM removes a budget item", () => {
    const state = { ...INIT, finance: { ...INIT.finance, budget: [{ id: 1 }, { id: 2 }] } };
    const s = reducer(state, { type: "FIN_DEL_ITEM", id: 1 });
    expect(s.finance.budget).toHaveLength(1);
  });

  it("FIN_EDIT_ITEM updates a budget item", () => {
    const state = { ...INIT, finance: { ...INIT.finance, budget: [{ id: 1, name: "Rent", amount: 5000 }] } };
    const s = reducer(state, { type: "FIN_EDIT_ITEM", id: 1, p: { name: "Rent updated", amount: 6000 } });
    expect(s.finance.budget[0].name).toBe("Rent updated");
    expect(s.finance.budget[0].amount).toBe(6000);
  });

  it("FIN_TOGGLE_PAID toggles paid status", () => {
    const state = { ...INIT, finance: { ...INIT.finance, budget: [{ id: 1, paid: false }] } };
    const s = reducer(state, { type: "FIN_TOGGLE_PAID", id: 1 });
    expect(s.finance.budget[0].paid).toBe(true);
  });

  it("FIN_RESET_MONTH resets recurring items and removes all one-time items", () => {
    const state = {
      ...INIT,
      finance: {
        ...INIT.finance,
        month: "2025-02",
        budget: [
          { id: 1, name: "Rent", repeat: true, paid: true },
          { id: 2, name: "Gift", repeat: false, paid: true },
          { id: 3, name: "Trip", repeat: false, paid: false },
        ],
      },
    };
    const s = reducer(state, { type: "FIN_RESET_MONTH", m: "2025-03" });
    expect(s.finance.month).toBe("2025-03");
    // Only recurring kept (paid reset), all one-time items removed
    expect(s.finance.budget).toHaveLength(1);
    expect(s.finance.budget[0].name).toBe("Rent");
    expect(s.finance.budget[0].paid).toBe(false);
  });

  it("FIN_ADD_INV / FIN_DEL_INV manage investments", () => {
    const s = reducer(INIT, { type: "FIN_ADD_INV", p: { id: 1, name: "SIP", amount: 5000 } });
    expect(s.finance.investments).toHaveLength(1);
    const s2 = reducer(s, { type: "FIN_DEL_INV", id: 1 });
    expect(s2.finance.investments).toHaveLength(0);
  });

  // ── Content ─────────────────────────────────────────────────────────────
  it("CON updates a content field", () => {
    const s = reducer(INIT, { type: "CON", k: "done", v: 3 });
    expect(s.content.done).toBe(3);
  });

  it("ADD_IDEA / DEL_IDEA manage ideas", () => {
    const s = reducer(INIT, { type: "ADD_IDEA", v: "Vlog idea" });
    expect(s.content.ideas).toEqual(["Vlog idea"]);
    const s2 = reducer(s, { type: "DEL_IDEA", i: 0 });
    expect(s2.content.ideas).toEqual([]);
  });

  // ── Custom Categories ──────────────────────────────────────────────────
  it("ADD_CATEGORY adds a custom category", () => {
    const s = reducer(INIT, { type: "ADD_CATEGORY", name: "Learning" });
    expect(s.customCategories).toEqual(["Learning"]);
  });

  it("DEL_CATEGORY removes a custom category", () => {
    const s = reducer({ ...INIT, customCategories: ["Learning", "Travel"] }, { type: "DEL_CATEGORY", name: "Learning" });
    expect(s.customCategories).toEqual(["Travel"]);
  });

  // ── Mood ────────────────────────────────────────────────────────────────
  it("MOOD saves a mood entry", () => {
    const s = reducer(INIT, { type: "MOOD", d: "2025-03-28", mood: 0, note: "Great day" });
    expect(s.moods["2025-03-28"]).toEqual({ mood: 0, note: "Great day" });
  });

  // ── Cycle ───────────────────────────────────────────────────────────────
  it("CYCLE updates cycle settings", () => {
    const s = reducer(INIT, { type: "CYCLE", p: { start: "2025-03-01", len: 30 } });
    expect(s.cycle.start).toBe("2025-03-01");
    expect(s.cycle.len).toBe(30);
  });

  it("CYC_SYM toggles symbols for a date", () => {
    const s = reducer(INIT, { type: "CYC_SYM", d: "2025-03-28", sym: "Cramps" });
    expect(s.cycle.logs["2025-03-28"]).toContain("Cramps");
    const s2 = reducer(s, { type: "CYC_SYM", d: "2025-03-28", sym: "Cramps" });
    expect(s2.cycle.logs["2025-03-28"]).not.toContain("Cramps");
  });

  // ── Special ─────────────────────────────────────────────────────────────
  it("IMPORT_STATE merges payload over INIT, preserving current dark", () => {
    const current = { ...INIT, dark: true };
    const payload = { goals: [{ id: 99 }], habits: [{ id: 88 }] };
    const s = reducer(current, { type: "IMPORT_STATE", payload });
    expect(s.dark).toBe(true); // preserved
    expect(s.goals).toEqual([{ id: 99 }]);
    expect(s.habits).toEqual([{ id: 88 }]);
  });

  it("RESET_ALL returns INIT", () => {
    const altered = { ...INIT, dark: true, goals: [{ id: 1 }] };
    const s = reducer(altered, { type: "RESET_ALL" });
    expect(s).toEqual(INIT);
  });

  it("unknown action returns state unchanged", () => {
    const s = reducer(INIT, { type: "UNKNOWN_ACTION" });
    expect(s).toBe(INIT);
  });

  // ── Null-safety: old data ───────────────────────────────────────────────
  it("handles null budget/investments in FIN actions gracefully", () => {
    const state = { ...INIT, finance: { income: 0 } }; // no budget key
    expect(() => reducer(state, { type: "FIN_ADD_ITEM", p: { id: 1 } })).not.toThrow();
    expect(() => reducer(state, { type: "FIN_DEL_ITEM", id: 1 })).not.toThrow();
    expect(() => reducer(state, { type: "FIN_TOGGLE_PAID", id: 1 })).not.toThrow();
    expect(() => reducer(state, { type: "FIN_RESET_MONTH", m: "2025-03" })).not.toThrow();
    expect(() => reducer(state, { type: "FIN_ADD_INV", p: { id: 1 } })).not.toThrow();
    expect(() => reducer(state, { type: "FIN_DEL_INV", id: 1 })).not.toThrow();
  });

  // ── Profile ─────────────────────────────────────────────────────────────
  it("INIT includes profile with empty name and gender", () => {
    expect(INIT.profile).toEqual({ name: "", gender: "" });
  });

  it("PROFILE sets profile fields", () => {
    const s = reducer(INIT, { type: "PROFILE", p: { name: "Dhana", gender: "female" } });
    expect(s.profile.name).toBe("Dhana");
    expect(s.profile.gender).toBe("female");
  });

  it("PROFILE merges partial updates", () => {
    const withProfile = { ...INIT, profile: { name: "Dhana", gender: "female" } };
    const s = reducer(withProfile, { type: "PROFILE", p: { name: "Dhana L" } });
    expect(s.profile.name).toBe("Dhana L");
    expect(s.profile.gender).toBe("female");
  });

  // ── Work ────────────────────────────────────────────────────────────────
  it("INIT includes work with enabled=true", () => {
    expect(INIT.work.enabled).toBe(true);
    expect(INIT.work.dailyTodos).toEqual([]);
    expect(INIT.work.reminders).toEqual([]);
    expect(INIT.work.monthlyTarget).toBe("");
  });

  it("WORK_TOGGLE toggles work enabled", () => {
    const s = reducer(INIT, { type: "WORK_TOGGLE" });
    expect(s.work.enabled).toBe(false);
    const s2 = reducer(s, { type: "WORK_TOGGLE" });
    expect(s2.work.enabled).toBe(true);
  });

  it("WORK_TARGET sets monthly target", () => {
    const s = reducer(INIT, { type: "WORK_TARGET", v: "Ship v2.0" });
    expect(s.work.monthlyTarget).toBe("Ship v2.0");
  });

  it("WORK_ADD_TODO adds a todo", () => {
    const todo = { id: 1, text: "Review PR", done: false, date: "2026-03-30" };
    const s = reducer(INIT, { type: "WORK_ADD_TODO", p: todo });
    expect(s.work.dailyTodos).toHaveLength(1);
    expect(s.work.dailyTodos[0].text).toBe("Review PR");
  });

  it("WORK_TOGGLE_TODO toggles a todo's done state", () => {
    const withTodo = { ...INIT, work: { ...INIT.work, dailyTodos: [{ id: 1, text: "Test", done: false }] } };
    const s = reducer(withTodo, { type: "WORK_TOGGLE_TODO", id: 1 });
    expect(s.work.dailyTodos[0].done).toBe(true);
    const s2 = reducer(s, { type: "WORK_TOGGLE_TODO", id: 1 });
    expect(s2.work.dailyTodos[0].done).toBe(false);
  });

  it("WORK_DEL_TODO removes a todo", () => {
    const withTodos = { ...INIT, work: { ...INIT.work, dailyTodos: [{ id: 1 }, { id: 2 }] } };
    const s = reducer(withTodos, { type: "WORK_DEL_TODO", id: 1 });
    expect(s.work.dailyTodos).toHaveLength(1);
    expect(s.work.dailyTodos[0].id).toBe(2);
  });

  it("WORK_ADD_REMINDER adds a reminder", () => {
    const s = reducer(INIT, { type: "WORK_ADD_REMINDER", p: { id: 1, text: "Call client" } });
    expect(s.work.reminders).toHaveLength(1);
    expect(s.work.reminders[0].text).toBe("Call client");
  });

  it("WORK_DEL_REMINDER removes a reminder", () => {
    const withReminders = { ...INIT, work: { ...INIT.work, reminders: [{ id: 1 }, { id: 2 }] } };
    const s = reducer(withReminders, { type: "WORK_DEL_REMINDER", id: 1 });
    expect(s.work.reminders).toHaveLength(1);
    expect(s.work.reminders[0].id).toBe(2);
  });

  // ── Breaks ──────────────────────────────────────────────────────────────
  it("INIT includes breaks with enabled=false", () => {
    expect(INIT.breaks.enabled).toBe(false);
    expect(INIT.breaks.intervalMin).toBe(60);
  });

  it("BREAKS updates break settings", () => {
    const s = reducer(INIT, { type: "BREAKS", p: { enabled: true } });
    expect(s.breaks.enabled).toBe(true);
    expect(s.breaks.intervalMin).toBe(60); // unchanged
  });

  it("BREAKS can set interval", () => {
    const s = reducer(INIT, { type: "BREAKS", p: { intervalMin: 30 } });
    expect(s.breaks.intervalMin).toBe(30);
  });

  // ── IMPORT_STATE handles new fields ─────────────────────────────────────
  it("IMPORT_STATE initialises missing profile, work, breaks", () => {
    const payload = { goals: [{ id: 1 }] };
    const s = reducer(INIT, { type: "IMPORT_STATE", payload });
    expect(s.profile).toEqual(INIT.profile);
    expect(s.work).toEqual(INIT.work);
    expect(s.breaks).toEqual(INIT.breaks);
  });
});

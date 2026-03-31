import { describe, it, expect } from "vitest";
import { tk, CAT, CATL, MOODS, PHASES, calcPhase, pct, NAV, today, MIND_MOODS, BODY_MOODS } from "../src/constants";

describe("constants", () => {
  it("tk has core design tokens", () => {
    expect(tk.cream).toBeDefined();
    expect(tk.d0).toBeDefined();
    expect(tk.sage).toBeDefined();
    expect(tk.gold).toBeDefined();
  });

  it("CAT and CATL have matching keys", () => {
    const keys = Object.keys(CAT);
    expect(keys).toEqual(["Work", "Health", "Finance", "Content"]);
    expect(Object.keys(CATL)).toEqual(keys);
  });

  it("today is a valid YYYY-MM-DD string", () => {
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("MOODS has 5 entries with required fields", () => {
    expect(MOODS).toHaveLength(5);
    MOODS.forEach(m => {
      expect(m).toHaveProperty("e");
      expect(m).toHaveProperty("l");
      expect(m).toHaveProperty("c");
    });
  });

  it("PHASES has 4 phases with all required fields", () => {
    const keys = Object.keys(PHASES);
    expect(keys).toEqual(["menstrual", "follicular", "ovulatory", "luteal"]);
    keys.forEach(k => {
      const p = PHASES[k];
      expect(p.name).toBeDefined();
      expect(p.color).toBeDefined();
      expect(p.food).toBeDefined();
      expect(p.workout).toBeDefined();
      expect(p.care).toBeDefined();
      expect(p.mood).toBeDefined();
      expect(typeof p.energy).toBe("number");
    });
  });

  it("NAV has 7 entries with id, icon, label", () => {
    expect(NAV).toHaveLength(7);
    NAV.forEach(n => {
      expect(n.id).toBeDefined();
      expect(n.icon).toBeDefined();
      expect(n.label).toBeDefined();
    });
  });

  it("NAV includes work tab", () => {
    expect(NAV.find(n => n.id === "work")).toBeDefined();
  });

  it("MIND_MOODS has 5 entries with e and l", () => {
    expect(MIND_MOODS).toHaveLength(5);
    MIND_MOODS.forEach(m => {
      expect(m).toHaveProperty("e");
      expect(m).toHaveProperty("l");
    });
  });

  it("BODY_MOODS has 5 entries with e and l", () => {
    expect(BODY_MOODS).toHaveLength(5);
    BODY_MOODS.forEach(m => {
      expect(m).toHaveProperty("e");
      expect(m).toHaveProperty("l");
    });
  });
});

describe("pct()", () => {
  it("returns 0 when total is 0", () => {
    expect(pct(5, 0)).toBe(0);
  });

  it("calculates correct percentage", () => {
    expect(pct(50, 100)).toBe(50);
    expect(pct(1, 3)).toBe(33);
  });

  it("caps at 100", () => {
    expect(pct(200, 100)).toBe(100);
  });
});

// Helper: get a local date string YYYY-MM-DD (matching how calcPhase works)
function localDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("calcPhase()", () => {
  it("returns null if no start date", () => {
    expect(calcPhase(null)).toBeNull();
    expect(calcPhase("")).toBeNull();
  });

  it("returns null if start is in the future", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    expect(calcPhase(localDateStr(future))).toBeNull();
  });

  it("returns menstrual for day 1 (today as start)", () => {
    const todayLocal = localDateStr();
    const result = calcPhase(todayLocal, 28);
    expect(result).not.toBeNull();
    expect(result.phase).toBe("menstrual");
    expect(result.day).toBe(1);
  });

  it("calculates correct phase for known offset", () => {
    const start = new Date();
    start.setDate(start.getDate() - 10); // 10 days ago → diff=10, day=11 → follicular
    const result = calcPhase(localDateStr(start), 28);
    expect(result.phase).toBe("follicular");
    expect(result.day).toBe(11);
  });

  it("wraps around for multiple cycles", () => {
    const start = new Date();
    start.setDate(start.getDate() - 30); // 30 days ago → diff=30, day=(30%28)+1=3 → menstrual
    const result = calcPhase(localDateStr(start), 28);
    expect(result.day).toBe(3);
    expect(result.phase).toBe("menstrual");
  });

  it("includes nextPeriod and nextIn", () => {
    const todayLocal = localDateStr();
    const result = calcPhase(todayLocal, 28);
    expect(result).not.toBeNull();
    expect(result.nextIn).toBeDefined();
    expect(result.nextPeriod).toBeInstanceOf(Date);
    expect(result.len).toBe(28);
  });
});

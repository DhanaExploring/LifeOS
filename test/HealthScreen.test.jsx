import { describe, it, expect, vi } from "vitest";
import { screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "./helpers";
import HealthScreen from "../src/screens/HealthScreen";
import { INIT } from "../src/reducer";
import { today, getWeekKey } from "../src/constants";

const state = {
  ...INIT,
  health: {
    ...INIT.health,
    daily: {
      [today]: { mindMood: 3, bodyMood: 2, habits: { "Drank enough water": true }, grateful: "", brainDump: "", affirmation: "" },
    },
    weekly: {},
  },
};

const emptyState = { ...INIT };

// Today is Sunday → default tab is "weekly". Helper to switch to daily.
async function goDaily(user) {
  await user.click(screen.getByText("Daily"));
}

// ── Tab Toggle ──────────────────────────────────────────────────────────────
describe("HealthScreen – Tabs", () => {
  it("shows tab toggle with Daily and Weekly", () => {
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    expect(screen.getByText("Daily")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
  });

  it("defaults to Weekly tab on Sundays", () => {
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("Weekly review")).toBeInTheDocument();
  });

  it("shows 'Daily check-in' header after switching to Daily", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText("Daily check-in")).toBeInTheDocument();
  });
});

// ── Daily View – Affirmation ────────────────────────────────────────────────
describe("HealthScreen – Daily Affirmation", () => {
  it("shows affirmation section with shuffle button", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText("Today's affirmation")).toBeInTheDocument();
    expect(screen.getByText("↻ Shuffle")).toBeInTheDocument();
  });

  it("shows placeholder when no affirmation picked", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText("Tap shuffle to pick your affirmation")).toBeInTheDocument();
  });

  it("shows picked affirmation text", async () => {
    const user = userEvent.setup();
    const withAffirm = {
      ...INIT,
      health: {
        ...INIT.health,
        daily: { [today]: { mindMood: null, bodyMood: null, grateful: "", habits: {}, brainDump: "", affirmation: "I am enough." } },
      },
    };
    renderWithTheme(<HealthScreen s={withAffirm} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText(/"I am enough."/)).toBeInTheDocument();
  });

  it("dispatches H_DAILY with k='affirmation' on shuffle click", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={emptyState} dp={dp} />);
    await goDaily(user);
    await user.click(screen.getByText("↻ Shuffle"));
    expect(dp).toHaveBeenCalledWith(expect.objectContaining({ type: "H_DAILY", d: today, k: "affirmation" }));
  });
});

// ── Daily View – Mood Rows ──────────────────────────────────────────────────
describe("HealthScreen – Daily Moods", () => {
  it("renders Mind mood and Body mood labels", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText("Mind mood")).toBeInTheDocument();
    expect(screen.getByText("Body mood")).toBeInTheDocument();
  });

  it("renders 5 mind mood emojis", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText("😰")).toBeInTheDocument();
    expect(screen.getByText("🤩")).toBeInTheDocument();
  });

  it("renders 5 body mood emojis", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText("😓")).toBeInTheDocument();
    expect(screen.getByText("💪")).toBeInTheDocument();
  });

  it("dispatches H_DAILY for mind mood when emoji clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={emptyState} dp={dp} />);
    await goDaily(user);
    await user.click(screen.getByText("🤩"));
    expect(dp).toHaveBeenCalledWith({ type: "H_DAILY", d: today, k: "mindMood", v: 4 });
  });

  it("dispatches H_DAILY for body mood when emoji clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={emptyState} dp={dp} />);
    await goDaily(user);
    await user.click(screen.getByText("💪"));
    expect(dp).toHaveBeenCalledWith({ type: "H_DAILY", d: today, k: "bodyMood", v: 4 });
  });

  it("deselects mood when same emoji clicked (toggles to null)", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    // state has mindMood: 3 (😊) — appears in both rows, use getAllByText and pick first (mind row)
    renderWithTheme(<HealthScreen s={state} dp={dp} />);
    await goDaily(user);
    await user.click(screen.getAllByText("😊")[0]); // first one is mind mood row
    expect(dp).toHaveBeenCalledWith({ type: "H_DAILY", d: today, k: "mindMood", v: null });
  });
});

// ── Daily View – Grateful ───────────────────────────────────────────────────
describe("HealthScreen – Daily Grateful", () => {
  it("renders grateful input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByPlaceholderText("Today I'm grateful for…")).toBeInTheDocument();
  });

  it("dispatches H_DAILY for grateful on blur", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={emptyState} dp={dp} />);
    await goDaily(user);
    const input = screen.getByPlaceholderText("Today I'm grateful for…");
    await user.type(input, "sunshine");
    await user.tab(); // blur
    expect(dp).toHaveBeenCalledWith({ type: "H_DAILY", d: today, k: "grateful", v: "sunshine" });
  });
});

// ── Daily View – Habits ─────────────────────────────────────────────────────
describe("HealthScreen – Daily Habits", () => {
  it("renders 3 default habit checkboxes", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText("Drank enough water")).toBeInTheDocument();
    expect(screen.getByText("Moved my body")).toBeInTheDocument();
    expect(screen.getByText("No screens before bed")).toBeInTheDocument();
  });

  it("dispatches H_DAILY_HAB when habit clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={state} dp={dp} />);
    await goDaily(user);
    await user.click(screen.getByText("Moved my body"));
    expect(dp).toHaveBeenCalledWith({ type: "H_DAILY_HAB", d: today, name: "Moved my body" });
  });

  it("hides default habits that are in hiddenDefaults", async () => {
    const user = userEvent.setup();
    const withHidden = {
      ...INIT,
      health: {
        ...INIT.health,
        config: { customHabits: [], hiddenDefaults: [0] },
      },
    };
    renderWithTheme(<HealthScreen s={withHidden} dp={() => {}} />);
    await goDaily(user);
    expect(screen.queryByText("Drank enough water")).not.toBeInTheDocument();
    expect(screen.getByText("Moved my body")).toBeInTheDocument();
    expect(screen.getByText("No screens before bed")).toBeInTheDocument();
  });

  it("shows custom habits alongside defaults", async () => {
    const user = userEvent.setup();
    const withCustom = {
      ...INIT,
      health: {
        ...INIT.health,
        config: { customHabits: ["Read 10 pages"], hiddenDefaults: [] },
      },
    };
    renderWithTheme(<HealthScreen s={withCustom} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText("Read 10 pages")).toBeInTheDocument();
    expect(screen.getByText("Drank enough water")).toBeInTheDocument();
  });

  it("shows empty message when all habits hidden and no custom", async () => {
    const user = userEvent.setup();
    const allHidden = {
      ...INIT,
      health: {
        ...INIT.health,
        config: { customHabits: [], hiddenDefaults: [0, 1, 2] },
      },
    };
    renderWithTheme(<HealthScreen s={allHidden} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByText(/no habits configured/i)).toBeInTheDocument();
  });
});

// ── Daily View – Brain Dump ─────────────────────────────────────────────────
describe("HealthScreen – Daily Brain Dump", () => {
  it("renders brain dump textarea", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    await goDaily(user);
    expect(screen.getByPlaceholderText("Whatever's on your mind. No rules.")).toBeInTheDocument();
  });

  it("dispatches H_DAILY for brainDump after 1s debounce", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={emptyState} dp={dp} />);
    await goDaily(user);
    const ta = screen.getByPlaceholderText("Whatever's on your mind. No rules.");
    await user.type(ta, "thoughts");
    // Not dispatched yet (debounce)
    expect(dp).not.toHaveBeenCalledWith(expect.objectContaining({ k: "brainDump" }));
    // Advance past debounce
    act(() => { vi.advanceTimersByTime(1100); });
    expect(dp).toHaveBeenCalledWith({ type: "H_DAILY", d: today, k: "brainDump", v: "thoughts" });
    vi.useRealTimers();
  });
});

// ── Weekly View ─────────────────────────────────────────────────────────────
describe("HealthScreen – Weekly View", () => {
  it("shows mood trend sections", () => {
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("Mind mood trend")).toBeInTheDocument();
    expect(screen.getByText("Body mood trend")).toBeInTheDocument();
  });

  it("shows habit consistency section", () => {
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("Habit consistency")).toBeInTheDocument();
  });

  it("shows brain dump snippets section", () => {
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("Brain dump snippets")).toBeInTheDocument();
  });

  it("shows day labels Mon–Sun in mood trends", () => {
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    expect(screen.getAllByText("Mon")).toHaveLength(2);
    expect(screen.getAllByText("Sun")).toHaveLength(2);
  });

  it("shows '·' placeholder for days without mood data", () => {
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    const dots = screen.getAllByText("·");
    expect(dots.length).toBe(14);
  });

  it("shows 'No entries this week' when no brain dumps", () => {
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("No entries this week")).toBeInTheDocument();
  });

  it("shows weekly reflection textareas", () => {
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByPlaceholderText("I noticed…")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("I want to protect…")).toBeInTheDocument();
  });

  it("dispatches H_WEEKLY on pattern textarea blur", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={emptyState} dp={dp} />);
    const ta = screen.getByPlaceholderText("I noticed…");
    await user.type(ta, "stress pattern");
    await user.tab();
    expect(dp).toHaveBeenCalledWith({ type: "H_WEEKLY", w: getWeekKey(), k: "pattern", v: "stress pattern" });
  });

  it("dispatches H_WEEKLY on protect textarea blur", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={emptyState} dp={dp} />);
    const ta = screen.getByPlaceholderText("I want to protect…");
    await user.type(ta, "my sleep schedule");
    await user.tab();
    expect(dp).toHaveBeenCalledWith({ type: "H_WEEKLY", w: getWeekKey(), k: "protect", v: "my sleep schedule" });
  });
});

// ── Settings Panel ──────────────────────────────────────────────────────────
describe("HealthScreen – Settings", () => {
  it("opens settings panel when gear icon clicked", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    await user.click(screen.getByText("⚙"));
    expect(screen.getByText("Manage daily habits")).toBeInTheDocument();
  });

  it("shows default habits with Hide buttons", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    await user.click(screen.getByText("⚙"));
    expect(screen.getByText("Drank enough water")).toBeInTheDocument();
    expect(screen.getAllByText("Hide")).toHaveLength(3);
  });

  it("shows 'Show' for hidden default habits", async () => {
    const user = userEvent.setup();
    const withHidden = {
      ...INIT,
      health: { ...INIT.health, config: { customHabits: [], hiddenDefaults: [1] } },
    };
    renderWithTheme(<HealthScreen s={withHidden} dp={() => {}} />);
    await user.click(screen.getByText("⚙"));
    expect(screen.getAllByText("Hide")).toHaveLength(2);
    expect(screen.getByText("Show")).toBeInTheDocument();
  });

  it("dispatches H_TOGGLE_DEFAULT when Hide clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={emptyState} dp={dp} />);
    await user.click(screen.getByText("⚙"));
    await user.click(screen.getAllByText("Hide")[0]);
    expect(dp).toHaveBeenCalledWith({ type: "H_TOGGLE_DEFAULT", i: 0 });
  });

  it("shows add new habit input", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    await user.click(screen.getByText("⚙"));
    expect(screen.getByPlaceholderText("New habit…")).toBeInTheDocument();
  });

  it("dispatches H_ADD_CUSTOM_HAB when + button clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={emptyState} dp={dp} />);
    await user.click(screen.getByText("⚙"));
    await user.type(screen.getByPlaceholderText("New habit…"), "Meditate");
    await user.click(screen.getByText("+"));
    expect(dp).toHaveBeenCalledWith({ type: "H_ADD_CUSTOM_HAB", name: "Meditate" });
  });

  it("shows custom habits with Remove buttons", async () => {
    const user = userEvent.setup();
    const withCustom = {
      ...INIT,
      health: { ...INIT.health, config: { customHabits: ["Meditate", "Journal"], hiddenDefaults: [] } },
    };
    renderWithTheme(<HealthScreen s={withCustom} dp={() => {}} />);
    await user.click(screen.getByText("⚙"));
    expect(screen.getByText("Meditate")).toBeInTheDocument();
    expect(screen.getByText("Journal")).toBeInTheDocument();
    expect(screen.getAllByText("Remove")).toHaveLength(2);
  });

  it("dispatches H_DEL_CUSTOM_HAB when Remove clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    const withCustom = {
      ...INIT,
      health: { ...INIT.health, config: { customHabits: ["Meditate"], hiddenDefaults: [] } },
    };
    renderWithTheme(<HealthScreen s={withCustom} dp={dp} />);
    await user.click(screen.getByText("⚙"));
    await user.click(screen.getByText("Remove"));
    expect(dp).toHaveBeenCalledWith({ type: "H_DEL_CUSTOM_HAB", i: 0 });
  });

  it("hides tabs when settings panel is open", async () => {
    const user = userEvent.setup();
    renderWithTheme(<HealthScreen s={emptyState} dp={() => {}} />);
    await user.click(screen.getByText("⚙"));
    expect(screen.queryByText("Weekly")).not.toBeInTheDocument();
  });
});

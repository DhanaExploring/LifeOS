import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "./helpers";
import WorkScreen from "../src/screens/WorkScreen";
import { INIT } from "../src/reducer";
import { today } from "../src/constants";

const baseState = {
  ...INIT,
  work: { enabled: true, monthlyTarget: "", dailyTodos: [], reminders: [] },
  breaks: { enabled: false, intervalMin: 60 },
};

describe("WorkScreen", () => {
  it("renders heading and subtitle", () => {
    renderWithTheme(<WorkScreen s={baseState} dp={() => {}} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
    expect(screen.getByText(/small steps every day/i)).toBeInTheDocument();
  });

  it("shows weekly target section", () => {
    renderWithTheme(<WorkScreen s={baseState} dp={() => {}} />);
    expect(screen.getByText("Weekly target")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ship v2/i)).toBeInTheDocument();
  });

  it("shows today's tasks section", () => {
    renderWithTheme(<WorkScreen s={baseState} dp={() => {}} />);
    expect(screen.getByText("Today's tasks")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Add a task…")).toBeInTheDocument();
  });

  it("shows empty state when no tasks", () => {
    renderWithTheme(<WorkScreen s={baseState} dp={() => {}} />);
    expect(screen.getByText("No tasks for today yet")).toBeInTheDocument();
  });

  it("shows existing todos for today", () => {
    const withTodos = {
      ...baseState,
      work: { ...baseState.work, dailyTodos: [{ id: 1, text: "Review PR", done: false, date: today }] },
    };
    renderWithTheme(<WorkScreen s={withTodos} dp={() => {}} />);
    expect(screen.getByText("Review PR")).toBeInTheDocument();
  });

  it("dispatches WORK_ADD_TODO when adding a task", async () => {
    const dp = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<WorkScreen s={baseState} dp={dp} />);
    const input = screen.getByPlaceholderText("Add a task…");
    await user.type(input, "Deploy app");
    await user.click(screen.getAllByText("+")[0]);
    expect(dp).toHaveBeenCalledWith(expect.objectContaining({ type: "WORK_ADD_TODO", p: expect.objectContaining({ text: "Deploy app", done: false }) }));
  });

  it("dispatches WORK_TOGGLE_TODO when clicking checkbox", async () => {
    const dp = vi.fn();
    const withTodos = {
      ...baseState,
      work: { ...baseState.work, dailyTodos: [{ id: 1, text: "Task 1", done: false, date: today }] },
    };
    const user = userEvent.setup();
    const { container } = renderWithTheme(<WorkScreen s={withTodos} dp={dp} />);
    // Find the checkbox — it's a button with a 22px width style inside the todo row
    const allButtons = container.querySelectorAll("button");
    // Find the checkbox button (styled with width:22) near "Task 1"
    const checkBtn = Array.from(allButtons).find(b => b.style.width === "20px" && b.style.height === "20px");
    await user.click(checkBtn);
    expect(dp).toHaveBeenCalledWith({ type: "WORK_TOGGLE_TODO", id: 1 });
  });

  it("dispatches WORK_DEL_TODO when clicking delete", async () => {
    const dp = vi.fn();
    const withTodos = {
      ...baseState,
      work: { ...baseState.work, dailyTodos: [{ id: 1, text: "Task 1", done: false, date: today }] },
    };
    const user = userEvent.setup();
    renderWithTheme(<WorkScreen s={withTodos} dp={dp} />);
    // The × button is the delete button in the todo row
    const deleteBtn = screen.getByText("×");
    await user.click(deleteBtn);
    expect(dp).toHaveBeenCalledWith({ type: "WORK_DEL_TODO", id: 1 });
  });

  it("dispatches WORK_TARGET on weekly target change", async () => {
    const dp = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<WorkScreen s={baseState} dp={dp} />);
    const textarea = screen.getByPlaceholderText(/ship v2/i);
    await user.type(textarea, "A");
    expect(dp).toHaveBeenCalledWith({ type: "WORK_TARGET", v: "A" });
  });

  // ── Break timer ──────────────────────────────────────────────────────────
  it("shows break reminder section", () => {
    renderWithTheme(<WorkScreen s={baseState} dp={() => {}} />);
    expect(screen.getByText("Break reminder")).toBeInTheDocument();
  });

  it("shows OFF state when breaks disabled", () => {
    renderWithTheme(<WorkScreen s={baseState} dp={() => {}} />);
    expect(screen.getByText("OFF")).toBeInTheDocument();
    expect(screen.getByText(/enable to get reminded/i)).toBeInTheDocument();
  });

  it("shows timer controls when breaks enabled", () => {
    const withBreaks = { ...baseState, breaks: { enabled: true, intervalMin: 60 } };
    renderWithTheme(<WorkScreen s={withBreaks} dp={() => {}} />);
    expect(screen.getByText("ON")).toBeInTheDocument();
    expect(screen.getByText("Remind every")).toBeInTheDocument();
    expect(screen.getByText("▶ Start work timer")).toBeInTheDocument();
  });

  it("shows interval buttons when breaks enabled", () => {
    const withBreaks = { ...baseState, breaks: { enabled: true, intervalMin: 30 } };
    renderWithTheme(<WorkScreen s={withBreaks} dp={() => {}} />);
    expect(screen.getByText("15m")).toBeInTheDocument();
    expect(screen.getByText("30m")).toBeInTheDocument();
    expect(screen.getByText("45m")).toBeInTheDocument();
    expect(screen.getByText("60m")).toBeInTheDocument();
    expect(screen.getByText("90m")).toBeInTheDocument();
  });

  it("dispatches BREAKS to toggle enabled", async () => {
    const dp = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<WorkScreen s={baseState} dp={dp} />);
    await user.click(screen.getByText("OFF"));
    expect(dp).toHaveBeenCalledWith({ type: "BREAKS", p: { enabled: true } });
  });

  it("dispatches BREAKS with breakStartedAt when starting timer", async () => {
    const dp = vi.fn();
    const user = userEvent.setup();
    const withBreaks = { ...baseState, breaks: { enabled: true, intervalMin: 60 } };
    renderWithTheme(<WorkScreen s={withBreaks} dp={dp} />);
    await user.click(screen.getByText("▶ Start work timer"));
    expect(dp).toHaveBeenCalledWith(expect.objectContaining({ type: "BREAKS", p: expect.objectContaining({ breakStartedAt: expect.any(Number) }) }));
  });

  it("shows countdown and stop button when timer is active", () => {
    const withTimer = { ...baseState, breaks: { enabled: true, intervalMin: 60, breakStartedAt: Date.now() - 10000 } };
    renderWithTheme(<WorkScreen s={withTimer} dp={() => {}} />);
    expect(screen.getByText("Stop timer")).toBeInTheDocument();
    expect(screen.getByText(/until your next break/i)).toBeInTheDocument();
  });

  it("dispatches BREAKS to clear breakStartedAt when stopping timer", async () => {
    const dp = vi.fn();
    const user = userEvent.setup();
    const withTimer = { ...baseState, breaks: { enabled: true, intervalMin: 60, breakStartedAt: Date.now() - 10000 } };
    renderWithTheme(<WorkScreen s={withTimer} dp={dp} />);
    await user.click(screen.getByText("Stop timer"));
    expect(dp).toHaveBeenCalledWith({ type: "BREAKS", p: { breakStartedAt: 0 } });
  });

  // ── Carry-over ──────────────────────────────────────────────────────────
  it("shows carry-over section for undone tasks from other days", () => {
    const withOld = {
      ...baseState,
      work: { ...baseState.work, dailyTodos: [{ id: 1, text: "Old task", done: false, date: "2026-03-28" }] },
    };
    renderWithTheme(<WorkScreen s={withOld} dp={() => {}} />);
    expect(screen.getByText(/carry-over/i)).toBeInTheDocument();
    expect(screen.getByText("Old task")).toBeInTheDocument();
  });

  it("does not show carry-over for completed old tasks", () => {
    const withOldDone = {
      ...baseState,
      work: { ...baseState.work, dailyTodos: [{ id: 1, text: "Done task", done: true, date: "2026-03-28" }] },
    };
    renderWithTheme(<WorkScreen s={withOldDone} dp={() => {}} />);
    expect(screen.queryByText(/carry-over/i)).not.toBeInTheDocument();
  });
});

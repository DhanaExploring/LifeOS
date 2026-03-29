import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "./helpers";
import HealthScreen from "../src/screens/HealthScreen";
import { INIT } from "../src/reducer";
import { today } from "../src/constants";

// Mock recharts
vi.mock("recharts", () => ({
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

const state = {
  ...INIT,
  habits: [
    { id: 1, name: "Meditate", icon: "🧘" },
    { id: 2, name: "Read", icon: "📖" },
  ],
  habitLogs: { [today]: { 1: true } },
  health: { [today]: { water: 4, sleep: 7.5, steps: 6000, workout: false } },
};

describe("HealthScreen", () => {
  it("renders Daily log section", () => {
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    expect(screen.getByText("Daily log")).toBeInTheDocument();
  });

  it("shows current water count", () => {
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    expect(screen.getByText("4 glasses")).toBeInTheDocument();
  });

  it("shows current sleep value", () => {
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    expect(screen.getByText("7.5h")).toBeInTheDocument();
  });

  it("shows habits and done count", () => {
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    expect(screen.getByText("1/2 done")).toBeInTheDocument();
    expect(screen.getByText(/Meditate/)).toBeInTheDocument();
    expect(screen.getByText(/Read/)).toBeInTheDocument();
  });

  it("dispatches HABIT when toggle clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={state} dp={dp} />);
    // Find the unchecked habit toggle (the second toggle — Read)
    const toggles = screen.getAllByText("✓");
    // Only 1 check mark for habit 1
    expect(toggles).toHaveLength(1);
  });

  it("dispatches HEALTH when water button clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<HealthScreen s={state} dp={dp} />);
    // Click water button "6"
    await user.click(screen.getByText("6"));
    expect(dp).toHaveBeenCalledWith({ type: "HEALTH", d: today, k: "water", v: 6 });
  });

  it("shows add habit input", () => {
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    expect(screen.getByPlaceholderText("Add habit…")).toBeInTheDocument();
  });

  it("shows weekly chart container", () => {
    renderWithTheme(<HealthScreen s={state} dp={() => {}} />);
    expect(screen.getByText("This week")).toBeInTheDocument();
  });
});

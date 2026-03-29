import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "./helpers";
import HomeScreen from "../src/screens/HomeScreen";
import { INIT } from "../src/reducer";

// Mock recharts to avoid SVG measurement issues in jsdom
vi.mock("recharts", () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

const baseState = {
  ...INIT,
  habits: [{ id: 1, name: "Read", icon: "📖" }],
  habitLogs: {},
  goals: [{ id: 1, title: "Test goal", prog: 50, status: "In Progress", cat: "Work" }],
  health: {},
  moods: {},
  cycle: { start: "", len: 28, logs: {} },
};

describe("HomeScreen", () => {
  it("renders greeting and subtitle", () => {
    renderWithTheme(<HomeScreen s={baseState} dp={() => {}} go={() => {}} />);
    expect(screen.getByText(/here's your life at a glance/i)).toBeInTheDocument();
  });

  it("shows habit ring with 0/1 when none done", () => {
    renderWithTheme(<HomeScreen s={baseState} dp={() => {}} go={() => {}} />);
    expect(screen.getByText("0/1 today")).toBeInTheDocument();
  });

  it("shows top goals", () => {
    renderWithTheme(<HomeScreen s={baseState} dp={() => {}} go={() => {}} />);
    expect(screen.getByText("Test goal")).toBeInTheDocument();
  });

  it("shows 'Log your mood' when no mood logged", () => {
    renderWithTheme(<HomeScreen s={baseState} dp={() => {}} go={() => {}} />);
    expect(screen.getByText("Log your mood")).toBeInTheDocument();
  });

  it("calls go() when clicking a tile", async () => {
    const go = vi.fn();
    renderWithTheme(<HomeScreen s={baseState} dp={() => {}} go={go} />);
    // Click the "Today at a glance" card area
    screen.getByText("Today at a glance").closest("[style]").click();
    expect(go).toHaveBeenCalledWith("health");
  });
});

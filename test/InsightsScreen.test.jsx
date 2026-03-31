import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "./helpers";
import InsightsScreen from "../src/screens/InsightsScreen";
import { INIT } from "../src/reducer";

// Mock recharts
vi.mock("recharts", () => ({
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

const state = {
  ...INIT,
  goals: [
    { id: 1, title: "Launch website", prog: 80, status: "In Progress", cat: "Work" },
    { id: 2, title: "Save money", prog: 40, status: "In Progress", cat: "Finance" },
  ],
  finance: { income: 50000, budget: [{ id: 1, amount: 15000, paid: true }, { id: 2, amount: 5000, paid: false }], investments: [] },
  moods: {},
};

describe("InsightsScreen", () => {
  it("renders title", () => {
    renderWithTheme(<InsightsScreen s={state} />);
    expect(screen.getByText("Insights")).toBeInTheDocument();
  });

  it("shows average goal progress", () => {
    renderWithTheme(<InsightsScreen s={state} />);
    expect(screen.getByText("60%")).toBeInTheDocument(); // (80+40)/2
    expect(screen.getByText("Goal progress")).toBeInTheDocument();
  });

  it("shows work tile when enabled", () => {
    const s = { ...state, work: { enabled: true, monthlyTarget: "", dailyTodos: [] } };
    renderWithTheme(<InsightsScreen s={s} />);
    expect(screen.getByText("Work")).toBeInTheDocument();
  });

  it("shows habits tile", () => {
    renderWithTheme(<InsightsScreen s={state} />);
    expect(screen.getByText("Habits")).toBeInTheDocument();
    expect(screen.getByText("done today")).toBeInTheDocument();
  });

  it("shows goal breakdown", () => {
    renderWithTheme(<InsightsScreen s={state} />);
    expect(screen.getByText("Goal breakdown")).toBeInTheDocument();
    expect(screen.getByText("Launch website")).toBeInTheDocument();
    expect(screen.getByText("Save money")).toBeInTheDocument();
  });

  it("shows finance snapshot", () => {
    renderWithTheme(<InsightsScreen s={state} />);
    expect(screen.getByText("Finance snapshot")).toBeInTheDocument();
    expect(screen.getByText("Monthly income")).toBeInTheDocument();
    expect(screen.getByText("Budget planned")).toBeInTheDocument();
  });

  it("shows mood chart section", () => {
    renderWithTheme(<InsightsScreen s={state} />);
    expect(screen.getByText("Mood this week")).toBeInTheDocument();
  });
});

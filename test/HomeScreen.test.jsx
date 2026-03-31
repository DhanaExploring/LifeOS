import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "./helpers";
import HomeScreen from "../src/screens/HomeScreen";
import { INIT } from "../src/reducer";
import { today } from "../src/constants";

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
  health: { daily: {}, weekly: {}, config: { customHabits: [], hiddenDefaults: [] } },
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

  it("shows prompt to pick affirmation when none set", () => {
    renderWithTheme(<HomeScreen s={baseState} dp={() => {}} go={() => {}} />);
    expect(screen.getByText(/pick today's affirmation/i)).toBeInTheDocument();
  });

  it("shows today's affirmation when set", () => {
    const withAffirm = {
      ...baseState,
      health: { ...baseState.health, daily: { [today]: { mindMood: null, bodyMood: null, habits: {}, grateful: "", brainDump: "", affirmation: "I am enough." } } },
    };
    renderWithTheme(<HomeScreen s={withAffirm} dp={() => {}} go={() => {}} />);
    expect(screen.getByText(/"I am enough."/)).toBeInTheDocument();
    expect(screen.getByText("Today's affirmation")).toBeInTheDocument();
  });

  it("shows grateful prompt when nothing entered", () => {
    renderWithTheme(<HomeScreen s={baseState} dp={() => {}} go={() => {}} />);
    expect(screen.getByText("What are you grateful for?")).toBeInTheDocument();
  });

  it("shows grateful text when entered", () => {
    const withGrateful = {
      ...baseState,
      health: { ...baseState.health, daily: { [today]: { mindMood: null, bodyMood: null, habits: {}, grateful: "my family", brainDump: "", affirmation: "" } } },
    };
    renderWithTheme(<HomeScreen s={withGrateful} dp={() => {}} go={() => {}} />);
    expect(screen.getByText("my family")).toBeInTheDocument();
    expect(screen.getByText("Grateful for")).toBeInTheDocument();
  });

  it("calls go() when clicking a tile", async () => {
    const go = vi.fn();
    renderWithTheme(<HomeScreen s={baseState} dp={() => {}} go={go} />);
    screen.getByText("Top goals").closest("[style]").click();
    expect(go).toHaveBeenCalledWith("goals");
  });

  // ── Cycle visibility based on gender ──────────────────────────────────────
  it("hides cycle banner when gender is male", () => {
    const maleState = { ...baseState, profile: { name: "John", gender: "male" }, cycle: { start: today, len: 28, logs: {} } };
    const { container } = renderWithTheme(<HomeScreen s={maleState} dp={() => {}} go={() => {}} />);
    expect(container.textContent).not.toMatch(/Phase/i);
    expect(container.textContent).not.toMatch(/until next period/i);
  });

  it("hides cycle banner when gender is other", () => {
    const otherState = { ...baseState, profile: { name: "Alex", gender: "other" }, cycle: { start: today, len: 28, logs: {} } };
    const { container } = renderWithTheme(<HomeScreen s={otherState} dp={() => {}} go={() => {}} />);
    expect(container.textContent).not.toMatch(/Phase/i);
    expect(container.textContent).not.toMatch(/until next period/i);
  });

  it("shows cycle banner when gender is female and cycle is set", () => {
    // Use a start date 2 days ago so calcPhase reliably returns menstrual phase
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const startDate = twoDaysAgo.toISOString().split("T")[0];
    const femaleState = { ...baseState, profile: { name: "Sarah", gender: "female" }, cycle: { start: startDate, len: 28, logs: {} } };
    const { container } = renderWithTheme(<HomeScreen s={femaleState} dp={() => {}} go={() => {}} />);
    // Banner shows phase name
    expect(container.textContent).toMatch(/Menstrual Phase/);
  });

  it("shows username in greeting when profile is set", () => {
    const withName = { ...baseState, profile: { name: "Dhana", gender: "male" } };
    renderWithTheme(<HomeScreen s={withName} dp={() => {}} go={() => {}} />);
    expect(screen.getByText(/Dhana/)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "./helpers";
import CycleScreen from "../src/screens/CycleScreen";
import { INIT } from "../src/reducer";
import { today } from "../src/constants";

const setupState = { ...INIT, cycle: { start: "", len: 28, logs: {} } };

const activeState = (() => {
  // Set start 10 days ago → follicular phase, day 11
  const start = new Date();
  start.setDate(start.getDate() - 10);
  const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
  return {
    ...INIT,
    cycle: { start: dateStr, len: 28, logs: {} },
  };
})();

describe("CycleScreen – Setup mode", () => {
  it("renders setup view when no start date", () => {
    renderWithTheme(<CycleScreen s={setupState} dp={() => {}} />);
    expect(screen.getByText("Set up your cycle")).toBeInTheDocument();
    expect(screen.getByText(/enter your cycle details/i)).toBeInTheDocument();
  });

  it("shows date input and cycle length slider", () => {
    renderWithTheme(<CycleScreen s={setupState} dp={() => {}} />);
    expect(screen.getByText(/first day of your last period/i)).toBeInTheDocument();
    expect(screen.getByText(/average cycle length/i)).toBeInTheDocument();
  });

  it("shows the four phases overview", () => {
    renderWithTheme(<CycleScreen s={setupState} dp={() => {}} />);
    expect(screen.getByText("The four phases")).toBeInTheDocument();
    expect(screen.getByText(/Menstrual/)).toBeInTheDocument();
    expect(screen.getByText(/Follicular/)).toBeInTheDocument();
    expect(screen.getByText(/Ovulatory/)).toBeInTheDocument();
    expect(screen.getByText(/Luteal/)).toBeInTheDocument();
  });
});

describe("CycleScreen – Active tracker", () => {
  it("renders phase hero card", () => {
    renderWithTheme(<CycleScreen s={activeState} dp={() => {}} />);
    expect(screen.getByText("Follicular Phase")).toBeInTheDocument();
    expect(screen.getAllByText(/rise & explore/i).length).toBeGreaterThanOrEqual(1);
  });

  it("shows cycle day number", () => {
    renderWithTheme(<CycleScreen s={activeState} dp={() => {}} />);
    expect(screen.getByText("Cycle day")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
  });

  it("shows timeline bar", () => {
    renderWithTheme(<CycleScreen s={activeState} dp={() => {}} />);
    expect(screen.getByText("Your cycle timeline")).toBeInTheDocument();
  });

  it("shows tab navigation", () => {
    renderWithTheme(<CycleScreen s={activeState} dp={() => {}} />);
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Workout")).toBeInTheDocument();
    expect(screen.getByText("Self care")).toBeInTheDocument();
  });

  it("switches tabs on click", async () => {
    const user = userEvent.setup();
    renderWithTheme(<CycleScreen s={activeState} dp={() => {}} />);
    await user.click(screen.getByText("Food"));
    expect(screen.getByText(/eat more of this/i)).toBeInTheDocument();
    expect(screen.getByText(/best to avoid/i)).toBeInTheDocument();
  });

  it("shows symptom logger", () => {
    renderWithTheme(<CycleScreen s={activeState} dp={() => {}} />);
    expect(screen.getByText("Log today's symptoms")).toBeInTheDocument();
    expect(screen.getByText("Cramps")).toBeInTheDocument();
    expect(screen.getByText("Fatigue")).toBeInTheDocument();
  });

  it("dispatches CYC_SYM on symptom click", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<CycleScreen s={activeState} dp={dp} />);
    await user.click(screen.getByText("Cramps"));
    expect(dp).toHaveBeenCalledWith({ type: "CYC_SYM", d: today, sym: "Cramps" });
  });

  it("shows Edit button for cycle settings", () => {
    renderWithTheme(<CycleScreen s={activeState} dp={() => {}} />);
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });
});

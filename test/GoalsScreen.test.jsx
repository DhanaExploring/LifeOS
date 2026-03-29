import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "./helpers";
import GoalsScreen from "../src/screens/GoalsScreen";
import { INIT } from "../src/reducer";

const state = {
  ...INIT,
  goals: [
    { id: 1, title: "Launch site", prog: 60, status: "In Progress", cat: "Work", deadline: "2025-06-01", ms: ["Design", "Build"] },
    { id: 2, title: "Run 10K", prog: 0, status: "Not Started", cat: "Health", deadline: "", ms: [] },
  ],
};

describe("GoalsScreen", () => {
  it("renders completed count", () => {
    renderWithTheme(<GoalsScreen s={state} dp={() => {}} />);
    expect(screen.getByText("0/2 completed")).toBeInTheDocument();
  });

  it("renders all goals", () => {
    renderWithTheme(<GoalsScreen s={state} dp={() => {}} />);
    expect(screen.getByText("Launch site")).toBeInTheDocument();
    expect(screen.getByText("Run 10K")).toBeInTheDocument();
  });

  it("shows category filter pills", () => {
    renderWithTheme(<GoalsScreen s={state} dp={() => {}} />);
    expect(screen.getByText("All")).toBeInTheDocument();
    // "Work" and "Health" appear in both filter pills and category headers
    expect(screen.getAllByText("Work").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Health").length).toBeGreaterThanOrEqual(1);
  });

  it("filters by category when pill clicked", async () => {
    const user = userEvent.setup();
    renderWithTheme(<GoalsScreen s={state} dp={() => {}} />);
    // Click the filter pill button for Work
    const workButtons = screen.getAllByText("Work");
    await user.click(workButtons[0]);
    expect(screen.getByText("Launch site")).toBeInTheDocument();
    expect(screen.queryByText("Run 10K")).not.toBeInTheDocument();
  });

  it("shows + button that opens form", async () => {
    const user = userEvent.setup();
    renderWithTheme(<GoalsScreen s={state} dp={() => {}} />);
    await user.click(screen.getByText("+"));
    expect(screen.getByText("New goal")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Goal title…")).toBeInTheDocument();
  });

  it("dispatches DEL_GOAL when × clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<GoalsScreen s={state} dp={dp} />);
    const delBtns = screen.getAllByText("×");
    await user.click(delBtns[0]);
    expect(dp).toHaveBeenCalledWith({ type: "DEL_GOAL", id: 1 });
  });

  it("renders milestones as chips", () => {
    renderWithTheme(<GoalsScreen s={state} dp={() => {}} />);
    expect(screen.getByText("Design")).toBeInTheDocument();
    expect(screen.getByText("Build")).toBeInTheDocument();
  });

  it("shows empty state when filter has no goals", async () => {
    const user = userEvent.setup();
    renderWithTheme(<GoalsScreen s={state} dp={() => {}} />);
    await user.click(screen.getByText("Finance"));
    expect(screen.getByText(/no goals in finance/i)).toBeInTheDocument();
  });
});

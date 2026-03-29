import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "./helpers";
import JournalScreen from "../src/screens/JournalScreen";
import { INIT } from "../src/reducer";
import { today } from "../src/constants";

const emptyState = { ...INIT };

const stateWithMood = {
  ...INIT,
  moods: {
    [today]: { mood: 0, note: "Feeling great today" },
    "2025-03-27": { mood: 2, note: "Okay day" },
  },
};

describe("JournalScreen", () => {
  it("renders title", () => {
    renderWithTheme(<JournalScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("Journal")).toBeInTheDocument();
  });

  it("shows all 5 mood buttons", () => {
    renderWithTheme(<JournalScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("😄")).toBeInTheDocument();
    expect(screen.getByText("🙂")).toBeInTheDocument();
    expect(screen.getByText("😐")).toBeInTheDocument();
    expect(screen.getByText("😔")).toBeInTheDocument();
    expect(screen.getByText("😤")).toBeInTheDocument();
  });

  it("shows reflection textarea", () => {
    renderWithTheme(<JournalScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByPlaceholderText(/what's on your mind/i)).toBeInTheDocument();
  });

  it("shows char counter", () => {
    renderWithTheme(<JournalScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("0/300")).toBeInTheDocument();
  });

  it("dispatches MOOD when mood button clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<JournalScreen s={emptyState} dp={dp} />);
    await user.click(screen.getByText("😄"));
    expect(dp).toHaveBeenCalledWith(expect.objectContaining({ type: "MOOD", mood: 0 }));
  });

  it("shows recent entries when moods exist", () => {
    renderWithTheme(<JournalScreen s={stateWithMood} dp={() => {}} />);
    expect(screen.getByText("Recent entries")).toBeInTheDocument();
    // Text appears in both textarea and recent entry
    expect(screen.getAllByText(/feeling great today/i).length).toBeGreaterThanOrEqual(1);
  });

  it("dispatches MOOD on save", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<JournalScreen s={stateWithMood} dp={dp} />);
    await user.click(screen.getByText("Save"));
    expect(dp).toHaveBeenCalledWith(expect.objectContaining({ type: "MOOD" }));
  });
});

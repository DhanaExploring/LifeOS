import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock BackupSystem before importing LifeOS
vi.mock("../src/BackupSystem", () => ({
  SettingsScreen: () => <div data-testid="settings-screen">Settings</div>,
  pullFromSupabase: vi.fn(() => Promise.resolve(null)),
  pushToSupabase: vi.fn(() => Promise.resolve()),
}));

// Mock recharts globally
vi.mock("recharts", () => ({
  LineChart: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  Bar: () => null,
  XAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
}));

import LifeOS from "../src/LifeOS_preview";
import { pullFromSupabase } from "../src/BackupSystem";

describe("LifeOS root shell", () => {
  it("shows loading state initially then renders home screen", async () => {
    render(<LifeOS signOut={() => {}} userEmail="test@test.com" userId="u1" />);
    // Loading indicator
    expect(screen.getByText(/loading your data/i)).toBeInTheDocument();
    // Wait for loading to finish
    expect(await screen.findByText("LifeOS")).toBeInTheDocument();
  });

  it("renders bottom nav with all 7 items", async () => {
    render(<LifeOS signOut={() => {}} userEmail="test@test.com" userId="u1" />);
    await screen.findByText("LifeOS");
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Goals")).toBeInTheDocument();
    expect(screen.getByText("Health")).toBeInTheDocument();
    expect(screen.getByText("Finance")).toBeInTheDocument();
    expect(screen.getByText("Journal")).toBeInTheDocument();
    expect(screen.getByText("Cycle")).toBeInTheDocument();
    expect(screen.getByText("Insights")).toBeInTheDocument();
  });

  it("navigates between screens via bottom nav", async () => {
    const user = userEvent.setup();
    render(<LifeOS signOut={() => {}} userEmail="test@test.com" userId="u1" />);
    await screen.findByText("LifeOS");

    // Navigate to Goals
    await user.click(screen.getByText("Goals"));
    expect(await screen.findByText(/completed/)).toBeInTheDocument();

    // Navigate to Journal
    await user.click(screen.getByText("Journal"));
    expect(await screen.findByText("Today's mood")).toBeInTheDocument();
  });

  it("opens settings and shows account info", async () => {
    const user = userEvent.setup();
    render(<LifeOS signOut={() => {}} userEmail="test@test.com" userId="u1" />);
    await screen.findByText("LifeOS");

    // Click settings gear
    await user.click(screen.getByText("⚙"));
    expect(screen.getAllByText("Settings").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("test@test.com")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("calls signOut when sign out button clicked", async () => {
    const user = userEvent.setup();
    const signOut = vi.fn();
    render(<LifeOS signOut={signOut} userEmail="test@test.com" userId="u1" />);
    await screen.findByText("LifeOS");

    await user.click(screen.getByText("⚙"));
    await user.click(screen.getByText("Sign out"));
    expect(signOut).toHaveBeenCalled();
  });

  it("toggles dark mode", async () => {
    const user = userEvent.setup();
    render(<LifeOS signOut={() => {}} userEmail="test@test.com" userId="u1" />);
    await screen.findByText("LifeOS");

    // Default is light → shows moon
    expect(screen.getByText("☾")).toBeInTheDocument();
    await user.click(screen.getByText("☾"));
    // After toggle → shows sun
    expect(screen.getByText("☀")).toBeInTheDocument();
  });

  it("calls pullFromSupabase on mount with userId", async () => {
    render(<LifeOS signOut={() => {}} userEmail="test@test.com" userId="u123" />);
    await screen.findByText("LifeOS");
    expect(pullFromSupabase).toHaveBeenCalledWith("u123");
  });
});

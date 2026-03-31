import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "./helpers";
import ProfileSetup from "../src/screens/ProfileSetup";

describe("ProfileSetup", () => {
  it("renders welcome heading and subtitle", () => {
    renderWithTheme(<ProfileSetup dp={() => {}} />);
    expect(screen.getByText("Welcome to LifeOS")).toBeInTheDocument();
    expect(screen.getByText(/personalise your experience/i)).toBeInTheDocument();
  });

  it("shows name input and gender buttons", () => {
    renderWithTheme(<ProfileSetup dp={() => {}} />);
    expect(screen.getByPlaceholderText("Enter your name…")).toBeInTheDocument();
    expect(screen.getByText("Female")).toBeInTheDocument();
    expect(screen.getByText("Male")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("shows 'Get started' button for new users", () => {
    renderWithTheme(<ProfileSetup dp={() => {}} />);
    expect(screen.getByText("Get started")).toBeInTheDocument();
  });

  it("shows 'Update profile' button for existing users", () => {
    renderWithTheme(<ProfileSetup dp={() => {}} existingProfile={{ name: "Dhana", gender: "male" }} />);
    expect(screen.getByText("Update profile")).toBeInTheDocument();
  });

  it("pre-fills existing profile values", () => {
    renderWithTheme(<ProfileSetup dp={() => {}} existingProfile={{ name: "Dhana", gender: "male" }} />);
    expect(screen.getByDisplayValue("Dhana")).toBeInTheDocument();
  });

  it("dispatches PROFILE and calls onDone when submitted", async () => {
    const dp = vi.fn();
    const onDone = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<ProfileSetup dp={dp} onDone={onDone} />);

    await user.type(screen.getByPlaceholderText("Enter your name…"), "Sarah");
    await user.click(screen.getByText("Female"));
    await user.click(screen.getByText("Get started"));

    expect(dp).toHaveBeenCalledWith({ type: "PROFILE", p: { name: "Sarah", gender: "female" } });
    expect(onDone).toHaveBeenCalled();
  });

  it("does not dispatch when name is empty", async () => {
    const dp = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<ProfileSetup dp={dp} />);

    await user.click(screen.getByText("Male"));
    await user.click(screen.getByText("Get started"));

    expect(dp).not.toHaveBeenCalled();
  });

  it("does not dispatch when gender is not selected", async () => {
    const dp = vi.fn();
    const user = userEvent.setup();
    renderWithTheme(<ProfileSetup dp={dp} />);

    await user.type(screen.getByPlaceholderText("Enter your name…"), "John");
    await user.click(screen.getByText("Get started"));

    expect(dp).not.toHaveBeenCalled();
  });

  it("shows gender help text", () => {
    renderWithTheme(<ProfileSetup dp={() => {}} />);
    expect(screen.getByText(/cycle tracking/i)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "./helpers";
import FinanceScreen from "../src/screens/FinanceScreen";
import { INIT } from "../src/reducer";

const emptyState = { ...INIT };

const stateWithBudget = {
  ...INIT,
  finance: {
    income: 50000,
    budget: [
      { id: 1, name: "Rent", amount: 15000, repeat: true, cat: "Essentials", paid: false },
      { id: 2, name: "Netflix", amount: 500, repeat: true, cat: "Subscriptions", paid: true },
      { id: 3, name: "Birthday gift", amount: 2000, repeat: false, cat: "Shopping", paid: false },
    ],
    investments: [{ id: 10, name: "SIP", amount: 5000 }],
    month: new Date().toISOString().slice(0, 7),
    resetDay: 1,
  },
};

describe("FinanceScreen", () => {
  it("renders title and month", () => {
    renderWithTheme(<FinanceScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("Finance")).toBeInTheDocument();
  });

  it("shows empty state when no budget items", () => {
    renderWithTheme(<FinanceScreen s={emptyState} dp={() => {}} />);
    expect(screen.getByText("No expenses yet")).toBeInTheDocument();
    expect(screen.getByText(/tap here to start planning/i)).toBeInTheDocument();
  });

  it("shows budget summary when items exist", () => {
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    expect(screen.getByText("Total budget")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("shows recurring and one-time sections", () => {
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    expect(screen.getByText("Monthly recurring")).toBeInTheDocument();
    expect(screen.getByText("This month only")).toBeInTheDocument();
  });

  it("renders budget items with names", () => {
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.getByText("Netflix")).toBeInTheDocument();
    expect(screen.getByText("Birthday gift")).toBeInTheDocument();
  });

  it("dispatches FIN_TOGGLE_PAID when checkbox clicked", async () => {
    const user = userEvent.setup();
    const dp = vi.fn();
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={dp} />);
    // Click the first checkmark button (Rent — unpaid)
    const checkButtons = screen.getAllByRole("button").filter(b => b.style.borderRadius === "100%");
    // The first round button for a budget item
    await user.click(checkButtons[0]);
    expect(dp).toHaveBeenCalledWith(expect.objectContaining({ type: "FIN_TOGGLE_PAID" }));
  });

  it("shows investments section", () => {
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    expect(screen.getByText("Investments to consider")).toBeInTheDocument();
    expect(screen.getByText("SIP")).toBeInTheDocument();
  });

  it("shows collapsible monthly reset section", async () => {
    const user = userEvent.setup();
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    expect(screen.getByText("Monthly reset")).toBeInTheDocument();
    // Click to expand
    await user.click(screen.getByText("Monthly reset"));
    expect(screen.getByText(/budget resets automatically/i)).toBeInTheDocument();
  });

  it("opens add expense form when + Add expense clicked", async () => {
    const user = userEvent.setup();
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    await user.click(screen.getByText(/add expense/i));
    expect(screen.getByText("New expense")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Expense name…")).toBeInTheDocument();
  });

  it("shows income remaining calculation", () => {
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    // Income 50000 - budget 17500 = 32500 remaining
    expect(screen.getByText(/remaining after budget/i)).toBeInTheDocument();
  });

  it("shows money breakdown with savings", () => {
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    expect(screen.getByText("Money breakdown")).toBeInTheDocument();
    expect(screen.getByText("Savings / Left to plan")).toBeInTheDocument();
  });

  it("shows investments subtracted in money breakdown", () => {
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    // Investment of 5000 should appear
    expect(screen.getByText("Investments")).toBeInTheDocument();
  });

  it("shows add investment button", () => {
    renderWithTheme(<FinanceScreen s={stateWithBudget} dp={() => {}} />);
    expect(screen.getByText("+ Add investment")).toBeInTheDocument();
  });
});

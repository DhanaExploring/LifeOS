import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "./helpers";
import { Card, Lbl, Serif, Mono, PBar, Ring, Toggle, Chip, Dots, Btn, FloatInput } from "../src/ui";

describe("Card", () => {
  it("renders children", () => {
    renderWithTheme(<Card>Hello Card</Card>);
    expect(screen.getByText("Hello Card")).toBeInTheDocument();
  });

  it("applies custom style", () => {
    const { container } = renderWithTheme(<Card style={{ padding: 40 }}>C</Card>);
    expect(container.firstChild.style.padding).toBe("40px");
  });
});

describe("Lbl", () => {
  it("renders uppercase text", () => {
    renderWithTheme(<Lbl>Section</Lbl>);
    const el = screen.getByText("Section");
    expect(el).toBeInTheDocument();
    expect(el.style.textTransform).toBe("uppercase");
  });
});

describe("Serif", () => {
  it("renders with Playfair Display font", () => {
    renderWithTheme(<Serif>Title</Serif>);
    expect(screen.getByText("Title").style.fontFamily).toContain("Playfair Display");
  });

  it("accepts custom size and color", () => {
    renderWithTheme(<Serif size={40} color="red">Big</Serif>);
    const el = screen.getByText("Big");
    expect(el.style.fontSize).toBe("40px");
    expect(el.style.color).toBe("red");
  });
});

describe("Mono", () => {
  it("renders with DM Mono font", () => {
    renderWithTheme(<Mono>Code</Mono>);
    expect(screen.getByText("Code").style.fontFamily).toContain("DM Mono");
  });
});

describe("PBar", () => {
  it("renders bar with correct width for given value", () => {
    const { container } = renderWithTheme(<PBar v={75} />);
    // The outer div has overflow:hidden, the inner div has the width %
    const bars = container.querySelectorAll("div div");
    const innerBar = bars[bars.length - 1];
    expect(innerBar.style.width).toBe("75%");
  });

  it("renders 0% width for v=0", () => {
    const { container } = renderWithTheme(<PBar v={0} />);
    const bars = container.querySelectorAll("div div");
    const innerBar = bars[bars.length - 1];
    expect(innerBar.style.width).toBe("0%");
  });
});

describe("Ring", () => {
  it("renders SVG with percentage text", () => {
    const { container } = renderWithTheme(<Ring v={42} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(screen.getByText("42%")).toBeInTheDocument();
  });
});

describe("Toggle", () => {
  it("calls set with toggled value on click", async () => {
    const user = userEvent.setup();
    let val = false;
    const set = (v) => { val = v; };
    renderWithTheme(<Toggle on={false} set={set} />);
    await user.click(screen.getByRole("button"));
    expect(val).toBe(true);
  });
});

describe("Chip", () => {
  it("renders label text", () => {
    renderWithTheme(<Chip label="In Progress" />);
    expect(screen.getByText("In Progress")).toBeInTheDocument();
  });

  it("handles unknown status gracefully", () => {
    renderWithTheme(<Chip label="Custom" />);
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });
});

describe("Dots", () => {
  it("renders correct number of dots", () => {
    const { container } = renderWithTheme(<Dots n={3} max={5} color="red" />);
    // The flex wrapper has 5 dot children with borderRadius 50%
    const dots = container.querySelectorAll('[style*="border-radius: 50%"]');
    expect(dots).toHaveLength(5);
  });
});

describe("Btn", () => {
  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    let clicked = false;
    renderWithTheme(<Btn onClick={() => { clicked = true; }}>Click me</Btn>);
    await user.click(screen.getByText("Click me"));
    expect(clicked).toBe(true);
  });

  it("renders ghost variant without error", () => {
    renderWithTheme(<Btn variant="ghost">Ghost</Btn>);
    expect(screen.getByText("Ghost")).toBeInTheDocument();
  });

  it("renders outline variant without error", () => {
    renderWithTheme(<Btn variant="outline">Outline</Btn>);
    expect(screen.getByText("Outline")).toBeInTheDocument();
  });
});

describe("FloatInput", () => {
  it("renders input with placeholder", () => {
    renderWithTheme(<FloatInput value="" onChange={() => {}} placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("fires onChange", async () => {
    const user = userEvent.setup();
    let val = "";
    renderWithTheme(<FloatInput value={val} onChange={e => { val = e.target.value; }} placeholder="input" />);
    await user.type(screen.getByPlaceholderText("input"), "x");
    expect(val).toBe("x");
  });
});

import { render } from "@testing-library/react";
import { ThemeCtx } from "../src/ThemeContext";

/** Render a component wrapped in ThemeCtx.Provider */
export function renderWithTheme(ui, { dark = false, ...options } = {}) {
  return render(
    <ThemeCtx.Provider value={{ d: dark }}>{ui}</ThemeCtx.Provider>,
    options
  );
}

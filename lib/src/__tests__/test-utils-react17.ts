import { render as rtlRender, screen } from "@testing-library/react";
// act lives in react-dom/test-utils in React 17
import { act } from "react-dom/test-utils";
import type { ReactElement } from "react";

export { act, screen };

export function render(ui: ReactElement, options?: Record<string, unknown>) {
  return rtlRender(ui, { ...options, legacyRoot: true } as any);
}

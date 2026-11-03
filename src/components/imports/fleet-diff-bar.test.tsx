import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FleetDiffBar } from "./fleet-diff-bar";
import { stubReducedMotion } from "./test-fixtures";

const counts = { rows_total: 300, created: 297, filled: 0, unchanged: 0, skipped: 3, warnings: 12, errors: 3 };

beforeEach(() => stubReducedMotion(false));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FleetDiffBar", () => {
  it("lists all four counts and the warnings count as text", () => {
    const { container } = render(<FleetDiffBar counts={counts} />);
    const items = Array.from(container.querySelectorAll("li")).map((li) => li.textContent);
    expect(items).toEqual(["Create 297", "Fill 0", "Unchanged 0", "Skip 3", "12 rows with warnings"]);
  });

  it("hides the bar from screen readers and leaves zero segments out of it", () => {
    const { container } = render(<FleetDiffBar counts={counts} />);
    const bar = container.querySelector('[aria-hidden="true"].flex') as HTMLElement;
    expect(bar.children).toHaveLength(2);
    expect((bar.children[0] as HTMLElement).style.width).toBe("99%");
    expect((bar.children[1] as HTMLElement).style.width).toBe("1%");
  });

  it("renders a static bar with reduced motion", () => {
    stubReducedMotion(true);
    const { container } = render(<FleetDiffBar counts={counts} />);
    const bar = container.querySelector('[aria-hidden="true"].flex') as HTMLElement;
    expect((bar.children[0] as HTMLElement).style.transform).toBe("");
  });
});

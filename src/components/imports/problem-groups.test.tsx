import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ProblemGroups } from "./problem-groups";
import type { ImportProblemGroup } from "@/types/imports";

const group = (code: string, severity: "error" | "warning", rows: number[]): ImportProblemGroup => ({
  code,
  severity,
  column: null,
  message: `${code} message from the server`,
  fix_hint: `${code} fix hint from the server`,
  rows,
});

afterEach(cleanup);

describe("ProblemGroups", () => {
  it("shows errors before warnings with the server text and rows unchanged", () => {
    const { container } = render(
      <ProblemGroups
        warnings={[group("VIN_CHECK_DIGIT", "warning", [5])]}
        errors={[group("REQUIRED_MISSING", "error", [4, 17, 203]), group("FOO_BAR", "error", [9])]}
      />
    );
    const items = Array.from(container.querySelectorAll("li"));
    expect(items.map((li) => li.dataset.severity)).toEqual(["error", "error", "warning"]);
    expect(items[0].textContent).toContain("Will be skipped");
    expect(items[0].textContent).toContain("REQUIRED_MISSING message from the server");
    expect(items[0].textContent).toContain("REQUIRED_MISSING fix hint from the server");
    expect(items[0].textContent).toContain("Rows 4, 17, 203");
    expect(items[1].textContent).toContain("FOO_BAR message from the server");
    expect(items[2].textContent).toContain("Will import");
    expect(items[2].textContent).toContain("Row 5");
    expect(items[0].querySelector('[role="group"]')?.getAttribute("aria-label")).toBe("Rows for this problem");
  });

  it("renders nothing without problems", () => {
    const { container } = render(<ProblemGroups errors={[]} warnings={[]} />);
    expect(container.innerHTML).toBe("");
  });
});

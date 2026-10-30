import { cleanup, render, screen } from "@testing-library/react";
import { LazyMotion, MotionGlobalConfig, domAnimation } from "motion/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ImportProgress } from "./import-progress";
import { stubReducedMotion } from "./test-fixtures";

const steps: [string, string, string] = ["Uploading file", "Saving 297 trucks", "297 trucks added ✓"];

function renderProgress(activeStep: 0 | 1 | 2) {
  return render(
    <LazyMotion features={domAnimation} strict>
      <ImportProgress steps={steps} activeStep={activeStep} />
    </LazyMotion>
  );
}

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
beforeEach(() => stubReducedMotion(false));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ImportProgress", () => {
  it("puts the full step label in a polite live region", () => {
    const { container, rerender } = renderProgress(1);
    const live = container.querySelector('[aria-live="polite"]')!;
    expect(live.textContent).toBe("Saving 297 trucks");
    rerender(
      <LazyMotion features={domAnimation} strict>
        <ImportProgress steps={steps} activeStep={2} />
      </LazyMotion>
    );
    expect(live.textContent).toBe("297 trucks added ✓");
  });

  it("hides the per-letter spans from screen readers", () => {
    const { container } = renderProgress(0);
    const letters = container.querySelectorAll("[data-letter]");
    expect(letters).toHaveLength("Uploading file".length);
    for (const letter of letters) expect(letter.closest('[aria-hidden="true"]')).toBeTruthy();
  });

  it("never renders a percentage", () => {
    for (const step of [0, 1, 2] as const) {
      const { container } = renderProgress(step);
      expect(container.textContent).not.toContain("%");
      cleanup();
    }
  });

  it("shows a plain label with reduced motion: no letters, no sheen", () => {
    stubReducedMotion(true);
    const { container } = renderProgress(1);
    expect(container.querySelectorAll("[data-letter]")).toHaveLength(0);
    expect(screen.getByTestId("progress-label").textContent).toBe("Saving 297 trucks");
    expect(screen.queryByTestId("progress-sheen")).toBeNull();
  });
});

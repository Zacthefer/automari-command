import { act, cleanup, render, screen } from "@testing-library/react";
import { LazyMotion, MotionGlobalConfig, domAnimation } from "motion/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CLIMB_MS, HOLD_PCT, ImportProgress, STILL_SAVING_MS, progressLabel, progressPercent } from "./import-progress";
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
  vi.useRealTimers();
});

const bar = () => Number(screen.getByTestId("progress-bar").dataset.progress);
const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

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

  it("climbs to HOLD_PCT over CLIMB_MS and waits there for the real response", () => {
    vi.useFakeTimers();
    renderProgress(1);
    expect(bar()).toBe(0);
    advance(CLIMB_MS / 2);
    expect(bar()).toBe(HOLD_PCT / 2);
    advance(CLIMB_MS * 4);
    expect(bar()).toBe(HOLD_PCT);
  });

  it("only reaches 100 on the done step", () => {
    vi.useFakeTimers();
    const { container, rerender } = renderProgress(1);
    advance(1000);
    expect(bar()).toBeLessThan(100);
    rerender(
      <LazyMotion features={domAnimation} strict>
        <ImportProgress steps={steps} activeStep={2} />
      </LazyMotion>
    );
    expect(bar()).toBe(100);
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe("297 trucks added ✓");
    expect(screen.queryByTestId("progress-sheen")).toBeNull();
  });

  it("says Still saving… when the server is slow", () => {
    vi.useFakeTimers();
    const { container } = renderProgress(1);
    advance(CLIMB_MS + STILL_SAVING_MS);
    expect(container.querySelector('[aria-live="polite"]')!.textContent).toBe("Still saving…");
    expect(bar()).toBe(HOLD_PCT);
  });
});

describe("progressPercent / progressLabel", () => {
  it("never passes HOLD_PCT before done, however long it runs", () => {
    for (const ms of [-5, 0, 2500, CLIMB_MS, 60_000]) expect(progressPercent(ms, false)).toBeLessThanOrEqual(HOLD_PCT);
    expect(progressPercent(0, true)).toBe(100);
  });

  it("follows the original phases with real step text", () => {
    expect(progressLabel(steps, 0, 0)).toBe("Uploading file");
    expect(progressLabel(steps, 1, 0)).toBe("Saving 297 trucks");
    expect(progressLabel(steps, 1, CLIMB_MS * 0.5)).toBe("Saving 297 trucks");
    expect(progressLabel(steps, 1, CLIMB_MS * 0.9)).toBe("Finalizing");
    expect(progressLabel(steps, 1, CLIMB_MS + STILL_SAVING_MS)).toBe("Still saving…");
  });

  it("doesn't claim saving before the request is sent", () => {
    expect(progressLabel(steps, 0, CLIMB_MS * 0.9)).toBe("Uploading file");
  });

  it("shows the done text only on the done step", () => {
    expect(progressLabel(steps, 2, 0)).toBe("297 trucks added ✓");
  });
});

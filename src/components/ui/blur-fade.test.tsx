import { cleanup, render, waitFor } from "@testing-library/react";
import { LazyMotion, MotionGlobalConfig, domAnimation } from "motion/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { BlurFadeStack, staggerDelay } from "./blur-fade";

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
afterEach(cleanup);

function Nothing() {
  return null;
}

describe("staggerDelay", () => {
  it("steps 50ms per section and stops after the fourth", () => {
    const expected = [0, 0.05, 0.1, 0.15, 0.15, 0.15];
    [0, 1, 2, 3, 4, 9].forEach((index, i) => expect(staggerDelay(index)).toBeCloseTo(expected[i]));
  });
});

describe("BlurFadeStack", () => {
  it("wraps each section once, in order, and keeps the stack's class", () => {
    const { container } = render(
      <LazyMotion features={domAnimation} strict>
        <BlurFadeStack className="space-y-6">
          <h1>Title</h1>
          {false}
          <p>Body</p>
        </BlurFadeStack>
      </LazyMotion>
    );
    const stack = container.firstElementChild!;
    expect(stack.className).toBe("space-y-6");
    expect(Array.from(stack.children).map((w) => w.textContent)).toEqual(["Title", "Body"]);
  });

  it("gives each section inside a fragment its own wrapper, so the stack's gaps still apply", () => {
    const { container } = render(
      <LazyMotion features={domAnimation} strict>
        <BlurFadeStack>
          <h1>Title</h1>
          <>
            <p>Stats</p>
            <>
              <p>Charts</p>
            </>
            <p>Totals</p>
          </>
        </BlurFadeStack>
      </LazyMotion>
    );
    const wrappers = Array.from(container.firstElementChild!.children);
    expect(wrappers.map((w) => w.textContent)).toEqual(["Title", "Stats", "Charts", "Totals"]);
  });

  it("hides the wrapper of a section that renders nothing, so it leaves no gap", () => {
    const { container } = render(
      <LazyMotion features={domAnimation} strict>
        <BlurFadeStack>
          <Nothing />
          <p>Body</p>
        </BlurFadeStack>
      </LazyMotion>
    );
    const [empty] = Array.from(container.firstElementChild!.children);
    expect(empty.childNodes).toHaveLength(0);
    expect(empty.className).toContain("empty:hidden");
  });

  it("ends every section at its normal position, fully visible", async () => {
    const { container } = render(
      <LazyMotion features={domAnimation} strict>
        <BlurFadeStack>
          <p>Body</p>
        </BlurFadeStack>
      </LazyMotion>
    );
    const wrapper = container.firstElementChild!.firstElementChild as HTMLElement;
    await waitFor(() => expect(wrapper.style.opacity).toBe("1"));
    expect(wrapper.style.transform).toBe("none");
  });
});

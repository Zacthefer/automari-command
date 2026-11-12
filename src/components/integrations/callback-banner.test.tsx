import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
let params = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => params,
  useRouter: () => ({ replace }),
  usePathname: () => "/integrations",
}));

const { CallbackBanner } = await import("./callback-banner");

afterEach(() => {
  cleanup();
  replace.mockReset();
});

describe("CallbackBanner", () => {
  it("shows the Motive result and cleans the URL so a refresh doesn't repeat it", () => {
    params = new URLSearchParams("motive=connected");
    render(<CallbackBanner />);
    expect(screen.getByRole("status").textContent).toContain("Motive is connected");
    expect(replace).toHaveBeenCalledWith("/integrations", { scroll: false });
  });

  it("shows errors as alerts and can be dismissed", () => {
    params = new URLSearchParams("motive=error&reason=expired");
    render(<CallbackBanner />);
    expect(screen.getByRole("alert").textContent).toContain("took too long");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("stays out of the way on a normal visit", () => {
    params = new URLSearchParams();
    const { container } = render(<CallbackBanner />);
    expect(container.innerHTML).toBe("");
    expect(replace).not.toHaveBeenCalled();
  });
});

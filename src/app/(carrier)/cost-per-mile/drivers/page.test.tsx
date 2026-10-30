import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Driver } from "@/types/cost-per-mile";

const getDrivers = vi.fn();

vi.mock("@/lib/api-cpm", () => ({ getDrivers: () => getDrivers() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const { default: DriversPage } = await import("./page");

const driver = { id: "d1", first_name: "Pat", last_name: "Example", phone: null, cdl_number: null, cdl_state: null, status: "active" } as unknown as Driver;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  getDrivers.mockReset();
  vi.useRealTimers();
});

describe("DriversPage load states", () => {
  it("invites an import only after a successful empty load", async () => {
    getDrivers.mockResolvedValue([]);
    render(<DriversPage />);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByText("Bring your fleet in from a spreadsheet")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Upload CSV" })).toHaveLength(1);
  });

  it("shows a load error with Try again instead of the import invite", async () => {
    getDrivers.mockRejectedValueOnce(new Error("Request failed with status 500"));
    render(<DriversPage />);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByRole("alert").textContent).toContain("Couldn't load your drivers. Try again.");
    expect(screen.queryByText("Bring your fleet in from a spreadsheet")).toBeNull();
    expect(screen.queryAllByRole("button", { name: "Upload CSV" })).toHaveLength(0);
    getDrivers.mockResolvedValueOnce([driver]);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    expect(screen.getByText("Pat Example")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Upload CSV" })).toHaveLength(1);
  });
});

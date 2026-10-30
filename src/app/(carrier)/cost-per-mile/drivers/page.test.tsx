import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Driver } from "@/types/cost-per-mile";

const getDrivers = vi.fn();
let onImported: ((ids: string[]) => unknown) | undefined;

vi.mock("@/lib/api-cpm", () => ({ getDrivers: () => getDrivers() }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/imports/use-csv-import", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/imports/use-csv-import")>();
  return {
    ...actual,
    useCsvImport: (entity: "trucks" | "drivers", options: { onImported?: (ids: string[]) => unknown }) => {
      onImported = options.onImported;
      return actual.useCsvImport(entity, options);
    },
  };
});

const { default: DriversPage } = await import("./page");

const makeDriver = (id: string, first: string) =>
  ({ id, first_name: first, last_name: "Example", phone: null, cdl_number: null, cdl_state: null, status: "active" }) as unknown as Driver;
const driver = makeDriver("d1", "Pat");
const rowFor = (name: string) => screen.getByText(name).closest("tr")!;

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

  it("reloads without the skeleton after an import and glows the new rows for 1.6s", async () => {
    getDrivers.mockResolvedValueOnce([driver]);
    render(<DriversPage />);
    await act(() => vi.advanceTimersByTimeAsync(0));

    let resolve!: (list: Driver[]) => void;
    getDrivers.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    let finished!: Promise<unknown>;
    act(() => {
      finished = Promise.resolve(onImported!(["d2"]));
    });
    // The list stays on screen while it re-fetches
    expect(screen.getByText("Pat Example")).toBeTruthy();
    expect(getDrivers).toHaveBeenCalledTimes(2);
    await act(async () => {
      resolve([driver, makeDriver("d2", "Robin")]);
      await finished;
    });
    expect(rowFor("Robin Example").className).toContain("import-row-glow");
    expect(rowFor("Pat Example").className).not.toContain("import-row-glow");
    await act(() => vi.advanceTimersByTimeAsync(1599));
    expect(rowFor("Robin Example").className).toContain("import-row-glow");
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(rowFor("Robin Example").className).not.toContain("import-row-glow");
  });

  it("does nothing after an import if the page was left during the reload", async () => {
    getDrivers.mockResolvedValueOnce([driver]);
    const { unmount } = render(<DriversPage />);
    await act(() => vi.advanceTimersByTimeAsync(0));
    let resolve!: (list: Driver[]) => void;
    getDrivers.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const finished = Promise.resolve(onImported!(["d2"]));
    unmount();
    resolve([driver, makeDriver("d2", "Robin")]);
    await finished;
    expect(vi.getTimerCount()).toBe(0);
  });
});

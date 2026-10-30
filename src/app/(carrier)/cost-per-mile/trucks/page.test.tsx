import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Truck } from "@/types/cost-per-mile";

const getTrucks = vi.fn();
let onImported: ((ids: string[]) => unknown) | undefined;

vi.mock("@/lib/api-cpm", () => ({ getTrucks: () => getTrucks() }));
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

const { default: TrucksPage } = await import("./page");

const truck = (id: string, unit: string): Truck => ({
  id,
  tenant_id: "t",
  unit_number: unit,
  vin: null,
  year: null,
  make: null,
  model: null,
  status: "active",
  notes: null,
  created_at: "",
  updated_at: "",
});

const uploadButtons = () => screen.queryAllByRole("button", { name: "Upload CSV" });
const rowFor = (unit: string) => screen.getByText(unit).closest("tr")!;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  getTrucks.mockReset();
  vi.useRealTimers();
});

describe("TrucksPage import entry points", () => {
  it("invites an import on an empty fleet, with one Upload CSV button", async () => {
    getTrucks.mockResolvedValue([]);
    render(<TrucksPage />);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByText("Bring your fleet in from a spreadsheet")).toBeTruthy();
    expect(screen.queryByText("No trucks found")).toBeNull();
    expect(uploadButtons()).toHaveLength(1);
    expect(uploadButtons()[0].closest(".rounded-2xl")).toBeTruthy();
  });

  it("puts the Upload CSV button in the header when there are trucks", async () => {
    getTrucks.mockResolvedValue([truck("id1", "T-101")]);
    render(<TrucksPage />);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(uploadButtons()).toHaveLength(1);
    expect(screen.queryByText("Bring your fleet in from a spreadsheet")).toBeNull();
    expect(uploadButtons()[0].closest(".rounded-2xl")).toBeNull();
  });

  it("shows a load error with Try again instead of the import invite", async () => {
    getTrucks.mockRejectedValueOnce(new Error("Request failed with status 500"));
    render(<TrucksPage />);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByRole("alert").textContent).toContain("Couldn't load your trucks. Try again.");
    expect(screen.queryByText("Bring your fleet in from a spreadsheet")).toBeNull();
    expect(uploadButtons()).toHaveLength(0);
    getTrucks.mockResolvedValueOnce([truck("id1", "T-101")]);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    expect(screen.getByText("T-101")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("reloads without the skeleton after an import and glows the new rows for 1.6s", async () => {
    getTrucks.mockResolvedValueOnce([truck("id1", "T-101")]);
    render(<TrucksPage />);
    await act(() => vi.advanceTimersByTimeAsync(0));

    let resolve!: (list: Truck[]) => void;
    getTrucks.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    let finished!: Promise<unknown>;
    act(() => {
      finished = Promise.resolve(onImported!(["id2"]));
    });
    // The list stays on screen while it re-fetches
    expect(screen.getByText("T-101")).toBeTruthy();
    expect(getTrucks).toHaveBeenCalledTimes(2);
    await act(async () => {
      resolve([truck("id1", "T-101"), truck("id2", "T-102")]);
      await finished;
    });
    expect(rowFor("T-102").className).toContain("import-row-glow");
    expect(rowFor("T-101").className).not.toContain("import-row-glow");
    await act(() => vi.advanceTimersByTimeAsync(1599));
    expect(rowFor("T-102").className).toContain("import-row-glow");
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(rowFor("T-102").className).not.toContain("import-row-glow");
  });
});

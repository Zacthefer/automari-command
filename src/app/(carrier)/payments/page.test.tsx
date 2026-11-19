import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { MoneyBoard, MoneyBucket, MoneyRow } from "@/types";

const getMoneyBoard = vi.fn();

vi.mock("@/lib/api", () => ({ getMoneyBoard: () => getMoneyBoard() }));
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

const { default: MoneyBoardPage } = await import("./page");

function bucket(key: MoneyBucket["key"], label: string, count: number | null, total: number | null): MoneyBucket {
  return { key, label, source: `${label} source`, connected: count !== null, count, total };
}

function row(overrides: Partial<MoneyRow>): MoneyRow {
  return {
    kind: "load", id: "l1", number: "LD-1", broker_name: "Echo", bucket: "waiting",
    amount: 100, days: 3, due_at: "2026-12-07T12:00:00Z", paid_at: null, ...overrides,
  };
}

const BOARD: MoneyBoard = {
  as_of: "2026-11-19T14:00:00Z",
  buckets: [
    bucket("not_billed", "Not billed yet", 3, 1000.1),
    bucket("waiting", "Waiting on payment", 2, 2600.8),
    bucket("past_due", "Past due", 2, 3701),
    bucket("action", "Needs action", 1, 400.4),
    bucket("paid", "Paid (last 30 days)", 2, 570.57),
    bucket("funded", "Funded", null, null),
    bucket("reserve", "Reserve held", null, null),
    bucket("short_paid", "Short-paid or charged back", null, null),
  ],
  coverage: {
    counted: 8,
    total: 10,
    missing: [
      { kind: "load", id: "l9", number: "LD-NORATE", reason: "No approved rate con yet" },
      { kind: "invoice", id: "i9", number: "INV-77", reason: "Priced at your default rate, not a rate con" },
    ],
  },
  confirmation: { paid: 2, confirmed: 0 },
  rows: [
    row({ id: "l3", number: "LD-PASTDUE", bucket: "past_due", amount: 3000.3, due_at: "2026-10-19T12:00:00Z" }),
    row({ id: "l9", number: "LD-NORATE", bucket: "not_billed", amount: null, due_at: null }),
    row({ id: "l2", number: "LD-WAITING", amount: 2000.2 }),
    row({ kind: "invoice", id: "i5", number: "INV-55", bucket: "paid", amount: 70.07, paid_at: "2026-11-17T12:00:00Z" }),
  ],
  rows_total: 4,
  total_outstanding: 6702.2,
  total_paid_30d: 570.57,
  action_required_count: 1,
  avg_days_to_payment: 18.4,
  aging_buckets: [{ label: "0-30", count: 3, total_amount: 3001.2 }],
};

afterEach(() => {
  cleanup();
  getMoneyBoard.mockReset();
});

function table() {
  return within(screen.getByRole("table"));
}

describe("MoneyBoardPage", () => {
  it("shows every box with its amount, and factoring boxes as not connected instead of $0", async () => {
    getMoneyBoard.mockResolvedValue(BOARD);
    render(<MoneyBoardPage />);

    const waiting = await screen.findByRole("button", { name: /Waiting on payment/ });
    expect(within(waiting).getByText("$2,601")).toBeTruthy();
    expect(within(waiting).getByText("2 items")).toBeTruthy();
    expect(screen.getByText("$6,702.20")).toBeTruthy();

    expect(screen.queryByRole("button", { name: /Funded/ })).toBeNull();
    expect(screen.getByText(/From your factoring company: not connected yet/)).toBeTruthy();
    expect(screen.getAllByText("Not connected")).toHaveLength(3);
  });

  it("says how much is counted, names what isn't, and how much payment is confirmed", async () => {
    getMoneyBoard.mockResolvedValue(BOARD);
    render(<MoneyBoardPage />);

    expect(await screen.findByText("Counting 8 of 10 (80%).")).toBeTruthy();
    expect(screen.getByRole("link", { name: "INV-77" }).getAttribute("href")).toBe("/invoices/i9");
    expect(screen.getByText("(No approved rate con yet)")).toBeTruthy();
    expect(screen.getByText(/2 marked paid by you\. 0 confirmed by your factoring company or bank yet/)).toBeTruthy();
  });

  it("never rounds up to 100% while an amount is still missing", async () => {
    const missing = [BOARD.coverage.missing[0]];
    getMoneyBoard.mockResolvedValue({ ...BOARD, coverage: { counted: 199, total: 200, missing } });
    render(<MoneyBoardPage />);

    expect(await screen.findByText("Counting 199 of 200 (99%).")).toBeTruthy();
  });

  it("filters the table by the box you choose, and choosing it again shows everything", async () => {
    getMoneyBoard.mockResolvedValue(BOARD);
    render(<MoneyBoardPage />);

    const pastDue = await screen.findByRole("button", { name: /Past due/ });
    fireEvent.click(pastDue);

    expect(pastDue.getAttribute("aria-pressed")).toBe("true");
    expect(table().getAllByRole("row")).toHaveLength(2); // header + LD-PASTDUE
    expect(table().getByText("$3,000.30")).toBeTruthy();
    expect(table().getByText("Past due since Oct 19")).toBeTruthy();

    fireEvent.click(pastDue);
    expect(table().getAllByRole("row")).toHaveLength(5);
  });

  it("never prints $0 for an amount it can't vouch for", async () => {
    getMoneyBoard.mockResolvedValue(BOARD);
    render(<MoneyBoardPage />);

    expect(await screen.findByText("Amount unknown")).toBeTruthy();
    expect(table().getByRole("link", { name: "INV-55" }).getAttribute("href")).toBe("/invoices/i5");
    expect(table().getByText("Paid Nov 17")).toBeTruthy();
  });

  it("never shows a due date on a paid row, even when the paid date is missing", async () => {
    getMoneyBoard.mockResolvedValue({ ...BOARD, rows: [row({ bucket: "paid", paid_at: null })], rows_total: 1 });
    render(<MoneyBoardPage />);

    expect(await screen.findByRole("table")).toBeTruthy();
    expect(table().getByText("Paid")).toBeTruthy();
    expect(table().queryByText(/^Due [A-Z]/)).toBeNull();
  });

  it("explains an empty board and a box with nothing in it", async () => {
    getMoneyBoard.mockResolvedValue({ ...BOARD, rows: [], rows_total: 0, coverage: { counted: 0, total: 0, missing: [] } });
    render(<MoneyBoardPage />);

    expect(await screen.findByText("No money to track yet")).toBeTruthy();
    expect(screen.queryByText(/Counting/)).toBeNull();
  });

  it("shows a retryable error, never an empty board, when loading fails", async () => {
    getMoneyBoard.mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce(BOARD);
    render(<MoneyBoardPage />);

    expect(await screen.findByText(/Couldn't load your money board/)).toBeTruthy();
    expect(screen.queryByText("No money to track yet")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("Counting 8 of 10 (80%).")).toBeTruthy();
  });
});

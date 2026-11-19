import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const getExpenses = vi.fn();

vi.mock("@/lib/api-cpm", () => ({ getExpenses: () => getExpenses() }));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

const { default: ExpensesPage } = await import("./page");

afterEach(() => {
  cleanup();
  getExpenses.mockReset();
});

describe("ExpensesPage load states", () => {
  it("shows 'No expenses found' only after a successful empty load", async () => {
    getExpenses.mockResolvedValue([]);
    render(<ExpensesPage />);

    expect(await screen.findByText("No expenses found")).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("shows a retryable error, never 'No expenses found', when loading fails", async () => {
    getExpenses.mockRejectedValueOnce(new Error("500")).mockResolvedValueOnce([]);
    render(<ExpensesPage />);

    expect(await screen.findByText(/Couldn't load your expenses/)).toBeTruthy();
    expect(screen.queryByText("No expenses found")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByText("No expenses found")).toBeTruthy();
  });
});

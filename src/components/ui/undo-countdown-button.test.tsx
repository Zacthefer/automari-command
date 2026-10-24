import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UndoCountdownButton } from "./undo-countdown-button";

const WINDOW = 3000;

function setup(onCommit: () => unknown = vi.fn(), onError = vi.fn()) {
  const utils = render(
    <UndoCountdownButton label="Send" onCommit={onCommit} onError={onError} undoWindow={WINDOW} />
  );
  return { ...utils, button: screen.getByRole("button"), onCommit, onError };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("UndoCountdownButton", () => {
  it("does not commit when undone inside the window", async () => {
    const { button, onCommit } = setup();
    fireEvent.click(button);
    expect(button.textContent).toContain("Undo");
    fireEvent.click(button);
    await act(() => vi.advanceTimersByTimeAsync(WINDOW * 2));
    expect(onCommit).not.toHaveBeenCalled();
    expect(button.textContent).toContain("Send");
  });

  it("undoes on Escape", async () => {
    const { button, onCommit } = setup();
    fireEvent.click(button);
    fireEvent.keyDown(button, { key: "Escape" });
    await act(() => vi.advanceTimersByTimeAsync(WINDOW * 2));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits once after the window and shows done", async () => {
    const { button, onCommit } = setup();
    fireEvent.click(button);
    await act(() => vi.advanceTimersByTimeAsync(WINDOW - 1));
    expect(onCommit).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(button.textContent).toContain("Done");
  });

  it("waits for the action before showing done", async () => {
    let resolve!: () => void;
    const onCommit = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    const { button } = setup(onCommit);
    fireEvent.click(button);
    await act(() => vi.advanceTimersByTimeAsync(WINDOW));
    expect(button.textContent).toContain("Working");
    expect(button).toHaveProperty("disabled", true);
    await act(async () => resolve());
    expect(button.textContent).toContain("Done");
  });

  it("returns to idle and reports the error when the action fails", async () => {
    const error = new Error("boom");
    const { button, onError } = setup(vi.fn().mockRejectedValue(error));
    fireEvent.click(button);
    await act(() => vi.advanceTimersByTimeAsync(WINDOW));
    expect(onError).toHaveBeenCalledWith(error);
    expect(button.textContent).toContain("Send");
  });

  it("commits when unmounted mid-countdown", async () => {
    const { button, onCommit, unmount } = setup();
    fireEvent.click(button);
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });

  it("does not commit when unmounted while idle", async () => {
    const { onCommit, unmount } = setup();
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(WINDOW));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("reports busy while counting down and running, then not busy", async () => {
    const onBusyChange = vi.fn();
    render(
      <UndoCountdownButton label="Send" onCommit={vi.fn()} onBusyChange={onBusyChange} undoWindow={WINDOW} />
    );
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(onBusyChange).toHaveBeenLastCalledWith(true);
    fireEvent.click(button);
    expect(onBusyChange).toHaveBeenLastCalledWith(false);
    fireEvent.click(button);
    await act(() => vi.advanceTimersByTimeAsync(WINDOW));
    expect(onBusyChange.mock.calls).toEqual([[true], [false], [true], [false]]);
  });

  it("treats a double click as start then undo, never a double commit", async () => {
    const { button, onCommit } = setup();
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    await act(() => vi.advanceTimersByTimeAsync(WINDOW));
    expect(onCommit).toHaveBeenCalledTimes(1);
  });
});

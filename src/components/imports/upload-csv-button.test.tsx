import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Loaded up front so the hook's import() calls resolve without real I/O under fake timers
import "@/lib/csv-read";
import "./import-sheet";
import { UploadCsvButton } from "./upload-csv-button";
import { useCsvImport } from "./use-csv-import";
import { csvFile, hangingFetch, jsonResponse, makePreview, problem, readBlob, stubReducedMotion } from "./test-fixtures";

const fetchMock = vi.fn();

function Harness() {
  const importer = useCsvImport("trucks");
  return (
    <>
      <UploadCsvButton
        state={importer.state}
        onPick={(file) => void importer.pick(file)}
        onRetry={importer.retry}
        inputRef={importer.inputRef}
      />
      <output data-testid="status">{importer.state.status}</output>
    </>
  );
}

const fileInput = (container: HTMLElement) => container.querySelector('input[type="file"]') as HTMLInputElement;
const progress = (container: HTMLElement) => container.querySelector("[data-progress]")?.getAttribute("data-progress");
const status = () => screen.getByTestId("status").textContent;

async function pickIn(container: HTMLElement, file = csvFile("Unit\n101\n")) {
  await act(async () => {
    fireEvent.change(fileInput(container), { target: { files: [file] } });
  });
  return file;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  stubReducedMotion(false);
});
afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("UploadCsvButton", () => {
  it("keeps the accessible name 'Upload CSV' and hides the rolled label", () => {
    render(<Harness />);
    const button = screen.getByRole("button", { name: "Upload CSV" });
    expect(screen.getByText("Choose a CSV file").getAttribute("aria-hidden")).toBe("true");
    expect(button).toBeTruthy();
  });

  it("opens the hidden CSV input on click", () => {
    const { container } = render(<Harness />);
    const input = fileInput(container);
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    fireEvent.click(screen.getByRole("button", { name: "Upload CSV" }));
    expect(click).toHaveBeenCalledTimes(1);
    expect(input.getAttribute("accept")).toBe(".csv,text/csv");
    expect(input.tabIndex).toBe(-1);
    expect(input.getAttribute("aria-hidden")).toBe("true");
  });

  it("runs the ring to 90 then 95 and never 100 while waiting", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { container } = render(<Harness />);
    await pickIn(container);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(progress(container)).toBe("90");
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(1200));
    expect(progress(container)).toBe("95");
    await act(() => vi.advanceTimersByTimeAsync(1799));
    expect(screen.queryByText("Still checking…")).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(screen.getAllByText("Still checking…").length).toBeGreaterThan(0);
    for (let t = 3000; t < 59_999; t += 1000) {
      await act(() => vi.advanceTimersByTimeAsync(1000));
      expect(container.querySelector('[data-progress="100"]')).toBeNull();
    }
  });

  it("fills to 100 with a ✓ on success and opens the panel 450ms later", async () => {
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
    const { container } = render(<Harness />);
    await pickIn(container);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    await act(async () => resolve(jsonResponse(200, makePreview())));
    expect(progress(container)).toBe("100");
    expect(screen.getByTestId("ring-check")).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(449));
    expect(status()).toBe("checked");
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(status()).toBe("reviewing");
  });

  it("drops the ring and shows the server text on an error", async () => {
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
    const { container } = render(<Harness />);
    const seen: (string | null | undefined)[] = [];
    const observer = new MutationObserver(() => seen.push(progress(container)));
    observer.observe(container, { attributes: true, subtree: true, childList: true });
    await pickIn(container);
    await act(() => vi.advanceTimersByTimeAsync(1500));
    await act(async () => resolve(problem(422, "MISSING_COLUMN")));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    observer.disconnect();
    expect(seen).not.toContain("100");
    expect(container.querySelector("[data-progress]")).toBeNull();
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("MISSING_COLUMN message");
    expect(alert.textContent).toContain("MISSING_COLUMN hint");
    expect(screen.getByRole("button", { name: "Upload CSV" })).toBeTruthy();
    expect(status()).toBe("idle");
  });

  it("times out at 60s and retries with the same bytes without re-reading", async () => {
    fetchMock.mockImplementationOnce(hangingFetch());
    const { container } = render(<Harness />);
    const file = await pickIn(container);
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(screen.getByRole("alert").textContent).toContain("This is taking too long.");
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Try again" })));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(file.arrayBufferSpy).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
    const [a, b] = await Promise.all(
      [0, 1].map((i) => readBlob((fetchMock.mock.calls[i][1].body as FormData).get("file") as File))
    );
    expect(b).toEqual(a);
  });

  it("shows no ring with reduced motion: Checking… then ✓", async () => {
    stubReducedMotion(true);
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
    const { container } = render(<Harness />);
    await pickIn(container);
    expect(container.querySelector("[data-progress]")).toBeNull();
    expect(screen.getByRole("button").textContent).toContain("Checking…");
    await act(async () => resolve(jsonResponse(200, makePreview())));
    expect(container.querySelector("svg.lucide-check")).toBeTruthy();
    await act(() => vi.advanceTimersByTimeAsync(149));
    expect(status()).toBe("checked");
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(status()).toBe("reviewing");
  });

  it("resets the input so the same file can be picked again", () => {
    const onPick = vi.fn();
    const inputRef = createRef<HTMLInputElement>();
    render(<UploadCsvButton state={{ status: "idle" }} onPick={onPick} onRetry={vi.fn()} inputRef={inputRef} />);
    const file = csvFile("Unit\n1\n");
    fireEvent.change(inputRef.current!, { target: { files: [file] } });
    expect(inputRef.current!.value).toBe("");
    fireEvent.change(inputRef.current!, { target: { files: [file] } });
    expect(onPick).toHaveBeenCalledTimes(2);
  });
});

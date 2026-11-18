import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatTextNumber, TextNumberCard } from "./text-number-card";

const fetchMock = vi.fn();
const onSaved = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function renderCard(currentNumber: string | null) {
  return render(<TextNumberCard tenantId="t-1" currentNumber={currentNumber} onSaved={onSaved} />);
}

function save(value: string) {
  fireEvent.change(screen.getByLabelText("Phone number"), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Save number" }));
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  localStorage.setItem("automari_token", "tok");
});
afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  onSaved.mockReset();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("formatTextNumber", () => {
  it("shows stored US numbers the way people read them", () => {
    expect(formatTextNumber("+12695550142")).toBe("(269) 555-0142");
    expect(formatTextNumber(null)).toBe("");
  });
});

describe("TextNumberCard", () => {
  it("warns when the company has no text number yet", () => {
    renderCard(null);
    expect(screen.getByText(/can't be received until you add one/)).toBeTruthy();
  });

  it("saves the typed number to this client and hands back the updated client", async () => {
    const updated = { id: "t-1", twilio_phone: "+12695550142" };
    fetchMock.mockResolvedValueOnce(jsonResponse(200, updated));
    renderCard(null);

    save(" (269) 555-0142 ");

    await vi.waitFor(() => expect(onSaved).toHaveBeenCalledWith(updated));
    expect(await screen.findByText("Saved. Drivers text BOLs to (269) 555-0142.")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Phone number"), { target: { value: "269" } });
    expect(screen.queryByText(/^Saved\./)).toBeNull();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/tenants\/t-1$/);
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ twilio_phone: "(269) 555-0142" });
  });

  it("clears the number when the field is emptied", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, { id: "t-1", twilio_phone: null }));
    renderCard("+12695550142");

    save("   ");

    await vi.waitFor(() => expect(onSaved).toHaveBeenCalled());
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ twilio_phone: null });
  });

  it("shows the server's reason when the number belongs to another carrier", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(409, { error: "That text number already belongs to another carrier" }));
    renderCard(null);

    save("269-555-0142");

    expect(await screen.findByText("That text number already belongs to another carrier")).toBeTruthy();
    expect(onSaved).not.toHaveBeenCalled();
  });
});

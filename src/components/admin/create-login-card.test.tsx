import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreateLoginCard } from "./create-login-card";

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function renderCard() {
  return render(<CreateLoginCard tenantId="t-1" defaultEmail="Owner@AcmeFreight.com " defaultName="Pat Owner" />);
}

function sentBody() {
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return { url, init, body: JSON.parse(init.body as string) };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  localStorage.setItem("automari_token", "tok");
});
afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("CreateLoginCard", () => {
  it("creates a carrier login for this client with a lowercased email and a generated password", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { id: "u-1" }));
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Create login" }));

    await screen.findByText(/Login created for/);
    const { url, init, body } = sentBody();
    expect(url).toMatch(/\/api\/auth\/users$/);
    expect(init.method).toBe("POST");
    expect(body).toMatchObject({ email: "owner@acmefreight.com", name: "Pat Owner", role: "carrier", tenant_id: "t-1" });
    expect(body.password).toHaveLength(16);
    // The password shown is the one that was sent
    expect(screen.getByText(body.password)).toBeTruthy();
  });

  it("shows the server's message and keeps the form when the email is taken", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(400, { error: "User with email 'owner@acmefreight.com' already exists" }));
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Create login" }));

    await screen.findByText(/already exists/);
    expect(screen.getByRole("button", { name: "Create login" })).toBeTruthy();
  });

  it("tells the admin to copy by hand when the clipboard is blocked", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { id: "u-1" }));
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Create login" }));
    fireEvent.click(await screen.findByRole("button", { name: "Copy" }));

    await waitFor(() => expect(screen.getByText(/copy it by hand/)).toBeTruthy());
  });

  it("goes back to the form after Done so the password is no longer on screen", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(201, { id: "u-1" }));
    renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Create login" }));
    fireEvent.click(await screen.findByRole("button", { name: "Done" }));

    expect(screen.queryByText(/Login created for/)).toBeNull();
    expect(screen.getByRole("button", { name: "Create login" })).toBeTruthy();
  });
});

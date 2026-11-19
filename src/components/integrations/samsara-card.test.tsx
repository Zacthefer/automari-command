import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LazyMotion, MotionGlobalConfig, domAnimation } from "motion/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { IntegrationConnection } from "@/types";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  connectSamsara: vi.fn(),
  syncSamsara: vi.fn(),
  disconnectSamsara: vi.fn(),
}));

const api = await import("@/lib/api");
const { SamsaraCard } = await import("./samsara-card");

const counts = {
  trucks_created: 4, trucks_updated: 0, trucks_matched: 0, trucks_skipped: 0,
  drivers_created: 2, drivers_updated: 0, drivers_matched: 0,
};

function connection(overrides: Partial<IntegrationConnection> = {}): IntegrationConnection {
  return {
    id: "c1", provider: "samsara", status: "connected", external_account_id: "org-9",
    token_expires_at: null, scopes: null, last_synced_at: null, last_error: null,
    created_at: "2026-11-18T00:00:00Z", ...overrides,
  };
}

function renderCard(conn: IntegrationConnection | null, onChanged = vi.fn()) {
  render(
    <LazyMotion features={domAnimation} strict>
      <SamsaraCard connection={conn} onChanged={onChanged} />
    </LazyMotion>
  );
  return onChanged;
}

const button = (name: RegExp | string) => screen.getByRole("button", { name });
const tokenField = () => screen.getByLabelText("Samsara API token") as HTMLInputElement;

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);

describe("SamsaraCard", () => {
  it("explains how to create the token, and hides what's typed", () => {
    renderCard(null);
    expect(screen.getByText(/Settings → API Tokens/)).toBeTruthy();
    expect(screen.getByText(/Read Org Information, Read Vehicles, Read Drivers, Read Vehicle Statistics/)).toBeTruthy();
    expect(tokenField().type).toBe("password");
    expect((button("Connect Samsara") as HTMLButtonElement).disabled).toBe(true);
  });

  it("connects with the trimmed token, clears the field, and reports what came in", async () => {
    vi.mocked(api.connectSamsara).mockResolvedValue({ connection: connection(), sync: counts, sync_problem: null });
    const onChanged = renderCard(null);

    fireEvent.change(tokenField(), { target: { value: "  samsara_api_abc  " } });
    fireEvent.click(button("Connect Samsara"));

    await screen.findByText("Samsara is connected. Trucks: 4 added. Drivers: 2 added.");
    expect(api.connectSamsara).toHaveBeenCalledWith("samsara_api_abc");
    expect(tokenField().value).toBe("");
    expect(onChanged).toHaveBeenCalled();
  });

  it("shows the API's reason when the token is rejected, and keeps it so it can be fixed", async () => {
    vi.mocked(api.connectSamsara).mockRejectedValue(
      new api.ApiError("Samsara didn't accept that token. Check it's copied in full and hasn't been deleted.", 400)
    );
    const onChanged = renderCard(null);

    fireEvent.change(tokenField(), { target: { value: "wrong" } });
    fireEvent.click(button("Connect Samsara"));

    expect((await screen.findByRole("alert")).textContent).toContain("didn't accept that token");
    expect(tokenField().value).toBe("wrong");
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("asks for a new token when Samsara stopped accepting the old one", () => {
    renderCard(connection({ status: "needs_reconnect" }));
    expect(screen.getByText("Needs a new token")).toBeTruthy();
    expect(button("Save new token")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sync now" })).toBeNull();
  });

  it("syncs when connected", async () => {
    vi.mocked(api.syncSamsara).mockResolvedValue({ ...counts, trucks_created: 0, trucks_updated: 4, drivers_created: 0 });
    const onChanged = renderCard(connection());

    expect(screen.queryByLabelText("Samsara API token")).toBeNull();
    fireEvent.click(button("Sync now"));

    await screen.findByText("Trucks: 4 updated.");
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
  });

  it("confirms before disconnecting, and reminds the carrier to delete the token in Samsara", async () => {
    vi.mocked(api.disconnectSamsara).mockResolvedValue(undefined);
    const onChanged = renderCard(connection());

    fireEvent.click(button("Disconnect"));
    expect(screen.getByText(/delete the "Automari" token in Samsara/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Disconnect" })[0]);

    await waitFor(() => expect(api.disconnectSamsara).toHaveBeenCalled());
    expect(onChanged).toHaveBeenCalled();
  });
});

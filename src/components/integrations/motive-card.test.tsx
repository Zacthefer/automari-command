import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LazyMotion, MotionGlobalConfig, domAnimation } from "motion/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { IntegrationConnection } from "@/types";

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  startMotiveConnect: vi.fn(),
  syncMotive: vi.fn(),
  disconnectMotive: vi.fn(),
}));

const api = await import("@/lib/api");
const { MotiveCard } = await import("./motive-card");

const counts = {
  trucks_created: 4, trucks_updated: 0, trucks_matched: 0, trucks_skipped: 0,
  drivers_created: 2, drivers_updated: 0, drivers_matched: 0,
};

function connection(overrides: Partial<IntegrationConnection> = {}): IntegrationConnection {
  return {
    id: "c1", provider: "motive", status: "connected", external_account_id: "98765",
    token_expires_at: null, scopes: null, last_synced_at: null, last_error: null,
    created_at: "2026-11-11T00:00:00Z", ...overrides,
  };
}

function renderCard(conn: IntegrationConnection | null, onChanged = vi.fn()) {
  render(
    <LazyMotion features={domAnimation} strict>
      <MotiveCard connection={conn} onChanged={onChanged} />
    </LazyMotion>
  );
  return onChanged;
}

const button = (name: RegExp | string) => screen.getByRole("button", { name });

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
beforeEach(() => vi.resetAllMocks());
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MotiveCard", () => {
  it("offers Connect when there's no connection, and sends the browser to Motive", async () => {
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    vi.mocked(api.startMotiveConnect).mockResolvedValue({ authorize_url: "https://gomotive.com/oauth/authorize?x=1" });
    renderCard(null);

    expect(screen.getByText("Not connected")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Disconnect" })).toBeNull();
    fireEvent.click(button("Connect Motive"));

    expect(button("Opening Motive…")).toHaveProperty("disabled", true);
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://gomotive.com/oauth/authorize?x=1"));
  });

  it("shows the server's reason when Motive isn't set up", async () => {
    vi.mocked(api.startMotiveConnect).mockRejectedValue(
      new api.ApiError("Motive isn't set up yet. Contact Automari support.", 503)
    );
    renderCard(null);
    fireEvent.click(button("Connect Motive"));
    expect((await screen.findByRole("alert")).textContent).toContain("Motive isn't set up yet");
    expect(button("Connect Motive")).toHaveProperty("disabled", false);
  });

  it("syncs, shows what came in, and reloads the connection", async () => {
    vi.mocked(api.syncMotive).mockResolvedValue(counts);
    const onChanged = renderCard(connection({ last_synced_at: null }));

    expect(screen.getByText("Connected")).toBeTruthy();
    expect(screen.getByText("Not synced yet")).toBeTruthy();
    fireEvent.click(button("Sync now"));

    expect(button("Syncing…")).toHaveProperty("disabled", true);
    expect(await screen.findByText("Trucks: 4 added. Drivers: 2 added.")).toBeTruthy();
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("shows a failed sync's reason and still reloads, so a needed reconnect shows up", async () => {
    vi.mocked(api.syncMotive).mockRejectedValue(new api.ApiError("Motive needs to be reconnected.", 409));
    const onChanged = renderCard(connection());
    fireEvent.click(button("Sync now"));
    expect((await screen.findByRole("alert")).textContent).toContain("Motive needs to be reconnected.");
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("asks for a fresh login when Motive rejected the token", () => {
    renderCard(connection({ status: "needs_reconnect" }));
    expect(screen.getByText("Needs reconnecting")).toBeTruthy();
    expect(screen.getByText(/Syncing is paused until you reconnect/)).toBeTruthy();
    expect(button("Reconnect Motive")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Sync now" })).toBeNull();
  });

  it("mentions a sync that didn't finish last time", () => {
    renderCard(connection({ last_error: "unreachable" }));
    expect(screen.getByText(/The last sync didn't finish/)).toBeTruthy();
  });

  it("confirms before disconnecting, and can be backed out of", async () => {
    vi.mocked(api.disconnectMotive).mockResolvedValue(undefined);
    const onChanged = renderCard(connection());

    fireEvent.click(button("Disconnect"));
    expect(screen.getByText(/Trucks and drivers already brought in stay/)).toBeTruthy();
    fireEvent.click(button("Keep connected"));
    expect(api.disconnectMotive).not.toHaveBeenCalled();
    expect(button("Sync now")).toBeTruthy();

    fireEvent.click(button("Disconnect"));
    fireEvent.click(button("Disconnect"));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(api.disconnectMotive).toHaveBeenCalledTimes(1);
  });
});

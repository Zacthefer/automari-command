import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import type { IntegrationConnection } from "@/types";
import { actionErrorMessage, activeMotiveConnection, callbackMessage, syncSummary } from "./motive-text";

const zero = {
  trucks_created: 0, trucks_updated: 0, trucks_matched: 0, trucks_skipped: 0,
  drivers_created: 0, drivers_updated: 0, drivers_matched: 0,
};

function connection(status: IntegrationConnection["status"], id: string = status): IntegrationConnection {
  return {
    id, provider: "motive", status, external_account_id: "123", token_expires_at: null,
    scopes: null, last_synced_at: null, last_error: null, created_at: "2026-11-11T00:00:00Z",
  };
}

describe("callbackMessage", () => {
  it("ignores pages that aren't a Motive callback", () => {
    expect(callbackMessage(null, null)).toBeNull();
    expect(callbackMessage("something", null)).toBeNull();
  });

  it("confirms a clean connect", () => {
    expect(callbackMessage("connected", null)).toEqual({
      tone: "success",
      text: "Motive is connected. Your trucks and drivers are now in Automari.",
    });
  });

  it.each([
    ["connected", "fleet_busy", "warning", /spreadsheet import was saving/],
    ["connected", "sync_failed", "warning", /didn't finish. Click Sync now/],
    ["error", "expired", "error", /took too long/],
    ["error", "cancelled", "warning", /login was cancelled/],
    ["error", "other_fleet_connected", "error", /different Motive fleet/],
    ["error", "token_rejected", "error", /didn't accept that login/],
    ["error", "unauthorized", "error", /didn't accept that login/],
    ["error", "unexpected_response", "error", /contact Automari support/],
    ["error", "too_many_records", "error", /contact Automari support/],
    ["error", "unreachable", "error", /Couldn't reach Motive/],
    ["error", "http_500", "error", /Couldn't reach Motive/],
  ])("%s / %s reads as plain English", (result, reason, tone, text) => {
    const message = callbackMessage(result, reason)!;
    expect(message.tone).toBe(tone);
    expect(message.text).toMatch(text);
  });
});

describe("activeMotiveConnection", () => {
  it("skips disconnected history and other providers", () => {
    const samsara = { ...connection("connected", "s"), provider: "samsara" };
    expect(activeMotiveConnection([connection("disconnected"), samsara])).toBeNull();
    expect(activeMotiveConnection([connection("disconnected"), connection("needs_reconnect")])?.id).toBe("needs_reconnect");
  });
});

describe("syncSummary", () => {
  it("lists only the counts that happened", () => {
    expect(syncSummary({ ...zero, trucks_created: 4, trucks_updated: 2, drivers_matched: 3 })).toBe(
      "Trucks: 4 added, 2 updated. Drivers: 3 already in Automari."
    );
  });

  it("explains a skipped truck", () => {
    expect(syncSummary({ ...zero, trucks_skipped: 1 })).toMatch(/1 skipped \(same unit number .* no VIN/);
  });

  it("says so when Motive had nothing", () => {
    expect(syncSummary(zero)).toBe("Motive has no trucks or drivers to bring in yet.");
  });
});

describe("actionErrorMessage", () => {
  it("passes the server's plain-English text through for 409, 502 and 503", () => {
    for (const status of [409, 502, 503]) {
      expect(actionErrorMessage(new ApiError("Motive needs to be reconnected.", status), "x")).toBe(
        "Motive needs to be reconnected."
      );
    }
  });

  it("explains the rate limit and a vanished connection", () => {
    expect(actionErrorMessage(new ApiError("Too many requests.", 429), "x")).toMatch(/Wait a minute/);
    expect(actionErrorMessage(new ApiError("Motive isn't connected", 404), "x")).toMatch(/Refresh the page/);
  });

  it("falls back for other statuses and blames the connection for network errors", () => {
    expect(actionErrorMessage(new ApiError("boom", 500), "The sync didn't finish.")).toBe("The sync didn't finish.");
    expect(actionErrorMessage(new TypeError("Failed to fetch"), "x")).toMatch(/internet connection/);
  });
});

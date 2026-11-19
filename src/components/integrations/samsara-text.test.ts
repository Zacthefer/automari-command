import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api";
import type { IntegrationConnection, SamsaraConnectResult } from "@/types";
import { activeSamsaraConnection, connectResultMessage, samsaraErrorMessage } from "./samsara-text";

function connection(overrides: Partial<IntegrationConnection> = {}): IntegrationConnection {
  return {
    id: "c1", provider: "samsara", status: "connected", external_account_id: "org-9",
    token_expires_at: null, scopes: null, last_synced_at: null, last_error: null,
    created_at: "2026-11-18T00:00:00Z", ...overrides,
  };
}

const counts = {
  trucks_created: 3, trucks_updated: 0, trucks_matched: 0, trucks_skipped: 0,
  drivers_created: 2, drivers_updated: 0, drivers_matched: 0,
};

function result(overrides: Partial<SamsaraConnectResult> = {}): SamsaraConnectResult {
  return { connection: connection(), sync: counts, sync_problem: null, ...overrides };
}

describe("activeSamsaraConnection", () => {
  it("picks the live Samsara row and ignores Motive and disconnected history", () => {
    const live = connection({ id: "live" });
    expect(activeSamsaraConnection([
      connection({ id: "old", status: "disconnected" }),
      connection({ id: "m", provider: "motive" }),
      live,
    ])).toBe(live);
    expect(activeSamsaraConnection([connection({ status: "disconnected" })])).toBeNull();
  });
});

describe("connectResultMessage", () => {
  it("reports what came in", () => {
    expect(connectResultMessage(result())).toEqual({
      tone: "success",
      text: "Samsara is connected. Trucks: 3 added. Drivers: 2 added.",
    });
    expect(connectResultMessage(result({ sync: { ...counts, trucks_created: 0, drivers_created: 0 } })).text)
      .toBe("Samsara is connected. Samsara has no trucks or drivers to bring in yet.");
  });

  it("explains each way the first sync can fall short", () => {
    expect(connectResultMessage(result({ sync: null, sync_problem: "fleet_busy" })).tone).toBe("warning");
    expect(connectResultMessage(result({ sync: null, sync_problem: "sync_failed" })).text).toContain("Sync now");
    const permission = connectResultMessage(result({ sync: null, sync_problem: "missing_permission" }));
    expect(permission.tone).toBe("error");
    expect(permission.text).toContain("Read Vehicle Statistics");
  });
});

describe("samsaraErrorMessage", () => {
  it("passes through the API's plain-English text", () => {
    for (const status of [400, 409, 422, 502]) {
      expect(samsaraErrorMessage(new ApiError("From the API", status), "fallback")).toBe("From the API");
    }
  });

  it("has its own words for rate limits, a missing connection, and network trouble", () => {
    expect(samsaraErrorMessage(new ApiError("x", 429), "fallback")).toContain("Wait a minute");
    expect(samsaraErrorMessage(new ApiError("x", 404), "fallback")).toContain("Refresh the page");
    expect(samsaraErrorMessage(new ApiError("x", 500), "fallback")).toBe("fallback");
    expect(samsaraErrorMessage(new TypeError("Failed to fetch"), "fallback")).toContain("internet connection");
  });
});

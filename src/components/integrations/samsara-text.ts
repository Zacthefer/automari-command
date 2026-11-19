import { ApiError } from "@/lib/api";
import type { IntegrationConnection, SamsaraConnectResult } from "@/types";
import { syncSummary, type CallbackMessage } from "./motive-text";

// Every Samsara message the carrier can see, in one place so the wording stays consistent.

/** The read-only permissions to tick when creating the token, in Samsara's own words. */
export const SAMSARA_PERMISSIONS = [
  "Read Org Information",
  "Read Vehicles",
  "Read Drivers",
  "Read Vehicle Statistics",
] as const;

/** The carrier's live Samsara connection, if any. Disconnected rows are history. */
export function activeSamsaraConnection(connections: IntegrationConnection[]): IntegrationConnection | null {
  const live = connections.filter((c) => c.provider === "samsara" && c.status !== "disconnected");
  return live.at(-1) ?? null;
}

/** What to tell the carrier after the token was accepted. */
export function connectResultMessage(result: SamsaraConnectResult): CallbackMessage {
  switch (result.sync_problem) {
    case "fleet_busy":
      return {
        tone: "warning",
        text: "Samsara is connected, but a spreadsheet import was saving, so nothing came in yet. Click Sync now in a minute.",
      };
    case "missing_permission":
    case "unauthorized":
      return {
        tone: "error",
        text: `Samsara is connected, but the token can't read your trucks and drivers. Create a new token with ${SAMSARA_PERMISSIONS.join(", ")}, then paste it below.`,
      };
    case "sync_failed":
      return {
        tone: "warning",
        text: "Samsara is connected, but bringing in your trucks and drivers didn't finish. Click Sync now to try again.",
      };
    default:
      return {
        tone: "success",
        text: result.sync ? `Samsara is connected. ${syncSummary(result.sync, "Samsara")}` : "Samsara is connected.",
      };
  }
}

/** Plain-English text for a failed Samsara request from the dashboard. */
export function samsaraErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "You've tried several times in the last minute. Wait a minute, then try again.";
    if (err.status === 404) return "Samsara isn't connected anymore. Refresh the page.";
    // 400 (token rejected), 409, 422 (not a token), 502 carry plain-English text from the API
    if ([400, 409, 422, 502].includes(err.status)) return err.message;
    return fallback;
  }
  return "Couldn't reach Automari. Check your internet connection and try again.";
}

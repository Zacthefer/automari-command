import { ApiError } from "@/lib/api";
import type { IntegrationConnection, MotiveSyncCounts } from "@/types";

// Every Motive message the carrier can see, in one place so the wording stays consistent.

export type Tone = "success" | "warning" | "error";

export interface CallbackMessage {
  tone: Tone;
  text: string;
}

const TRY_CONNECT_AGAIN = "Click Connect Motive to try again.";

/**
 * The backend sends the browser back to /integrations?motive=connected|error&reason=... after
 * the Motive login. Returns null when the URL isn't a Motive callback.
 */
export function callbackMessage(result: string | null, reason: string | null): CallbackMessage | null {
  if (result === "connected") {
    if (reason === "fleet_busy") {
      return {
        tone: "warning",
        text: "Motive is connected, but a spreadsheet import was saving, so nothing came in yet. Click Sync now in a minute.",
      };
    }
    if (reason === "sync_failed") {
      return {
        tone: "warning",
        text: "Motive is connected, but bringing in your trucks and drivers didn't finish. Click Sync now to try again.",
      };
    }
    return { tone: "success", text: "Motive is connected. Your trucks and drivers are now in Automari." };
  }
  if (result !== "error") return null;

  switch (reason) {
    case "expired":
      return { tone: "error", text: `That Motive login took too long or came from an old link. ${TRY_CONNECT_AGAIN}` };
    case "cancelled":
      return { tone: "warning", text: "Motive wasn't connected because the login was cancelled. Click Connect Motive whenever you're ready." };
    case "other_fleet_connected":
      return {
        tone: "error",
        text: "Your Automari account is already connected to a different Motive fleet. Disconnect it below, then connect the new one.",
      };
    case "token_rejected":
    case "unauthorized":
      return { tone: "error", text: `Motive didn't accept that login. ${TRY_CONNECT_AGAIN}` };
    case "unexpected_response":
    case "too_many_records":
      return {
        tone: "error",
        text: "Motive sent back something we didn't expect. Try again, and contact Automari support if it keeps happening.",
      };
    default:
      return { tone: "error", text: `Couldn't reach Motive. Try again in a few minutes.` };
  }
}

/** The carrier's live Motive connection, if any. Disconnected rows are history. */
export function activeMotiveConnection(connections: IntegrationConnection[]): IntegrationConnection | null {
  const live = connections.filter((c) => c.provider === "motive" && c.status !== "disconnected");
  return live.at(-1) ?? null;
}

function parts(entries: [number, string][]) {
  return entries.filter(([count]) => count > 0).map(([count, label]) => `${count} ${label}`);
}

/** "Trucks: 4 added, 2 updated. Drivers: 3 added." */
export function syncSummary(counts: MotiveSyncCounts): string {
  const trucks = parts([
    [counts.trucks_created, "added"],
    [counts.trucks_updated, "updated"],
    [counts.trucks_matched, "already in Automari"],
    [counts.trucks_skipped, "skipped (same unit number as one of yours, and no VIN to confirm it's the same truck)"],
  ]);
  const drivers = parts([
    [counts.drivers_created, "added"],
    [counts.drivers_updated, "updated"],
    [counts.drivers_matched, "already in Automari"],
  ]);
  if (!trucks.length && !drivers.length) return "Motive has no trucks or drivers to bring in yet.";
  return [
    trucks.length ? `Trucks: ${trucks.join(", ")}.` : null,
    drivers.length ? `Drivers: ${drivers.join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

/** Plain-English text for a failed Motive request from the dashboard. */
export function actionErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return "You've synced several times in the last minute. Wait a minute, then try again.";
    if (err.status === 404) return "Motive isn't connected anymore. Refresh the page.";
    // 409 (needs reconnecting, or a spreadsheet import is saving), 502 and 503 carry plain-English text
    if ([409, 502, 503].includes(err.status)) return err.message;
    return fallback;
  }
  return "Couldn't reach Automari. Check your internet connection and try again.";
}

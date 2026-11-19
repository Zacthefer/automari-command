import { formatDistanceStrict } from "date-fns";
import type { LiveMap, TruckMapStatus, TruckPosition } from "@/types";

// Everything Trucks Live shows in words, colors and marker HTML, in one place.

export const STATUS_META: Record<TruckMapStatus, { label: string; color: string; dot: string }> = {
  moving: { label: "Moving", color: "#059669", dot: "bg-emerald-600" },
  stopped: { label: "Stopped", color: "#d97706", dot: "bg-amber-600" },
  stale: { label: "No recent update", color: "#9ca3af", dot: "bg-gray-400" },
};

const PROVIDER_NAMES: Record<string, string> = { samsara: "Samsara", motive: "Motive", demo: "Demo" };

export function providerName(provider: string): string {
  return PROVIDER_NAMES[provider] ?? provider;
}

/** "Last seen 2 minutes ago"; "just now" under a minute. */
export function lastSeen(locatedAt: string, now: Date): string {
  const seconds = (now.getTime() - new Date(locatedAt).getTime()) / 1000;
  if (seconds < 60) return "Last seen just now";
  return `Last seen ${formatDistanceStrict(new Date(locatedAt), now)} ago`;
}

export function speedText(truck: Pick<TruckPosition, "speed_mph" | "status">): string | null {
  if (truck.status === "stale" || truck.speed_mph == null) return null;
  return `${Math.round(truck.speed_mph)} mph`;
}

/** The 🚚 emoji faces left; flip it when the truck is heading anywhere east. */
export function facesRight(heading: number | null): boolean {
  if (heading == null) return false;
  const normalized = ((heading % 360) + 360) % 360;
  return normalized > 0 && normalized < 180;
}

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Unit numbers are typed by carriers: never put them in marker HTML unescaped. */
export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => ESCAPES[char]);
}

/** HTML for one truck's map marker: 🚚 in a status-colored ring, a heading arrow, and the unit number. */
export function markerHtml(truck: TruckPosition, selected: boolean): string {
  const { color } = STATUS_META[truck.status];
  const flip = facesRight(truck.heading_deg) ? "scaleX(-1)" : "none";
  const arrow =
    truck.heading_deg != null && truck.status === "moving"
      ? `<span style="position:absolute;inset:-10px;transform:rotate(${Number(truck.heading_deg)}deg);pointer-events:none">` +
        `<span style="position:absolute;left:50%;top:0;margin-left:-5px;border-left:5px solid transparent;` +
        `border-right:5px solid transparent;border-bottom:8px solid ${color}"></span></span>`
      : "";
  const ring = selected ? `0 0 0 3px #fff, 0 0 0 6px ${color}` : "0 1px 4px rgba(0,0,0,.35)";
  return (
    `<div style="display:flex;flex-direction:column;align-items:center;opacity:${truck.status === "stale" ? 0.7 : 1}">` +
    `<div style="position:relative;width:40px;height:40px;border-radius:9999px;background:#fff;border:3px solid ${color};` +
    `box-shadow:${ring};display:flex;align-items:center;justify-content:center">` +
    `<span style="font-size:22px;line-height:1;transform:${flip}" aria-hidden="true">🚚</span>${arrow}</div>` +
    `<span style="margin-top:2px;padding:0 6px;border-radius:9999px;background:#fff;font:600 11px/16px system-ui,sans-serif;` +
    `color:#111827;box-shadow:0 1px 2px rgba(0,0,0,.25);white-space:nowrap">${escapeHtml(truck.unit_number)}</span></div>`
  );
}

export interface Notice {
  tone: "warning" | "info";
  text: string;
  /** Link to Integrations, where the fix happens. */
  fixOnIntegrations: boolean;
}

/** One line per ELD that needs attention, in plain English. */
export function providerNotices(map: LiveMap): Notice[] {
  const notices: Notice[] = [];
  for (const provider of map.providers) {
    const name = providerName(provider.provider);
    if (!provider.on_map) {
      notices.push({
        tone: "info",
        text: `${name} is connected. Its trucks will show here once ${name} approves Automari for live locations.`,
        fixOnIntegrations: false,
      });
    } else if (provider.status === "needs_reconnect") {
      notices.push({
        tone: "warning",
        text: `${name} stopped accepting our connection, so its trucks show their last known spot. Reconnect it on Integrations.`,
        fixOnIntegrations: true,
      });
    } else if (provider.last_error) {
      notices.push({
        tone: "warning",
        text: `Couldn't refresh ${name} just now, so its trucks show their last known spot. We'll try again automatically.`,
        fixOnIntegrations: false,
      });
    }
  }
  if (map.trucks_without_location > 0 && map.providers.some((p) => p.on_map && p.status === "connected")) {
    const count = map.trucks_without_location;
    notices.push({
      tone: "info",
      text: `${count} ${count === 1 ? "truck has" : "trucks have"} no location. Trucks added by hand or by spreadsheet only show here once they come in from your ELD: click Sync now on Integrations.`,
      fixOnIntegrations: true,
    });
  }
  return notices;
}

export interface TileConfig {
  url: string;
  attribution: string;
}

/** MapTiler when a key is set. Without one, OpenStreetMap's free tiles in dev and preview
 * builds only (their usage policy doesn't allow an app's production traffic). */
export function tileConfig(key: string | undefined, vercelEnv: string | undefined): TileConfig | null {
  if (key) {
    return {
      // 256 px tiles: Leaflet's default tile size
      url: `https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${encodeURIComponent(key)}`,
      attribution:
        '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">&copy; MapTiler</a> ' +
        '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">&copy; OpenStreetMap contributors</a>',
    };
  }
  if (vercelEnv === "production") return null;
  return {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
  };
}

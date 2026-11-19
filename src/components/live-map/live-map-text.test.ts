import { describe, expect, it } from "vitest";
import type { LiveMap, LiveMapProvider, TruckPosition } from "@/types";
import {
  escapeHtml,
  facesRight,
  lastSeen,
  markerHtml,
  providerName,
  providerNotices,
  speedText,
  tileConfig,
} from "./live-map-text";

function truck(overrides: Partial<TruckPosition> = {}): TruckPosition {
  return {
    truck_id: "t1", unit_number: "101", provider: "samsara", latitude: 30.33, longitude: -81.65,
    speed_mph: 62, heading_deg: 10, address: "Jacksonville, FL", located_at: "2026-11-18T12:00:00Z",
    status: "moving", driver_name: "Marcus Johnson", ...overrides,
  };
}

function provider(overrides: Partial<LiveMapProvider> = {}): LiveMapProvider {
  return { provider: "samsara", status: "connected", last_error: null, on_map: true, ...overrides };
}

function liveMap(overrides: Partial<LiveMap> = {}): LiveMap {
  return { trucks: [], trucks_without_location: 0, providers: [provider()], refresh_seconds: 30, stale_after_minutes: 30, ...overrides };
}

describe("markerHtml", () => {
  it("escapes the unit number so carrier-typed text can't inject markup", () => {
    const html = markerHtml(truck({ unit_number: '<img src=x onerror="alert(1)">' }), false);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
  });

  it("colors by status, shows a heading arrow only while moving, and fades stale trucks", () => {
    expect(markerHtml(truck(), false)).toContain("#059669");
    expect(markerHtml(truck(), false)).toContain("rotate(10deg)");
    expect(markerHtml(truck({ status: "stopped" }), false)).not.toContain("rotate(");
    expect(markerHtml(truck({ status: "stale" }), false)).toContain("opacity:0.7");
    expect(markerHtml(truck({ heading_deg: null }), false)).not.toContain("rotate(");
  });

  it("rings the selected truck", () => {
    expect(markerHtml(truck(), true)).toContain("0 0 0 6px #059669");
  });
});

describe("facesRight", () => {
  it("flips the truck for any eastward heading", () => {
    expect(facesRight(90)).toBe(true);
    expect(facesRight(10)).toBe(true);
    expect(facesRight(450)).toBe(true);
    expect(facesRight(270)).toBe(false);
    expect(facesRight(0)).toBe(false);
    expect(facesRight(180)).toBe(false);
    expect(facesRight(-90)).toBe(false);
    expect(facesRight(null)).toBe(false);
  });
});

describe("words", () => {
  it("says how long ago a truck reported", () => {
    const now = new Date("2026-11-18T12:05:00Z");
    expect(lastSeen("2026-11-18T12:04:30Z", now)).toBe("Last seen just now");
    expect(lastSeen("2026-11-18T12:00:00Z", now)).toBe("Last seen 5 minutes ago");
    expect(lastSeen("2026-11-18T10:05:00Z", now)).toBe("Last seen 2 hours ago");
  });

  it("shows speed only for moving trucks", () => {
    expect(speedText(truck({ speed_mph: 61.6 }))).toBe("62 mph");
    expect(speedText(truck({ status: "stale" }))).toBeNull();
    expect(speedText(truck({ status: "stopped", speed_mph: 0 }))).toBeNull();
    expect(speedText(truck({ speed_mph: null }))).toBeNull();
  });

  it("names providers, falling back to the raw value", () => {
    expect(providerName("samsara")).toBe("Samsara");
    expect(providerName("geotab")).toBe("geotab");
    expect(escapeHtml(`a&b'`)).toBe("a&amp;b&#39;");
  });
});

describe("providerNotices", () => {
  it("is quiet when every ELD is fine", () => {
    expect(providerNotices(liveMap())).toEqual([]);
  });

  it("explains a reconnect, a failed refresh, and an ELD not on the map yet", () => {
    const notices = providerNotices(liveMap({
      providers: [
        provider({ status: "needs_reconnect", last_error: "unauthorized" }),
        provider({ provider: "samsara", last_error: "http_500" }),
        provider({ provider: "motive", on_map: false }),
      ],
    }));
    expect(notices.map((n) => [n.tone, n.fixOnIntegrations])).toEqual([
      ["warning", true],
      ["warning", false],
      ["info", false],
    ]);
    expect(notices[0].text).toContain("Reconnect it on Integrations");
    expect(notices[2].text).toContain("Motive approves Automari");
  });

  it("counts trucks with no location only when an ELD on the map is connected", () => {
    expect(providerNotices(liveMap({ trucks_without_location: 1 }))[0].text).toMatch(/^1 truck has no location/);
    expect(providerNotices(liveMap({ trucks_without_location: 3 }))[0].text).toMatch(/^3 trucks have/);
    expect(providerNotices(liveMap({ trucks_without_location: 3, providers: [] }))).toEqual([]);
  });
});

describe("tileConfig", () => {
  it("uses MapTiler with the key when one is set", () => {
    const config = tileConfig("abc 123", "production");
    expect(config?.url).toBe("https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=abc%20123");
    expect(config?.attribution).toContain("OpenStreetMap contributors");
  });

  it("falls back to OpenStreetMap outside production, and to nothing in production", () => {
    expect(tileConfig(undefined, "preview")?.url).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(tileConfig("", "")?.url).toContain("openstreetmap");
    expect(tileConfig(undefined, "production")).toBeNull();
  });
});

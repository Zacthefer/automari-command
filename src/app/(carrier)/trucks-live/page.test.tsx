import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LazyMotion, MotionGlobalConfig, domAnimation } from "motion/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { LiveMap, TruckPosition } from "@/types";

const getLiveMap = vi.fn();
const mapProps: { trucks: TruckPosition[]; selectedId: string | null }[] = [];

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  getLiveMap: () => getLiveMap(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
// Leaflet needs a real browser; the page's own behavior is what's under test here
vi.mock("next/dynamic", () => ({
  default: () =>
    function MapStub(props: { trucks: TruckPosition[]; selectedId: string | null }) {
      mapProps.push(props);
      return <div data-testid="map">{props.trucks.length} markers</div>;
    },
}));

const api = await import("@/lib/api");
const { default: TrucksLivePage } = await import("./page");

const NOW = new Date("2026-11-18T12:05:00Z");

function truck(overrides: Partial<TruckPosition> = {}): TruckPosition {
  return {
    truck_id: "t1", unit_number: "1042", provider: "samsara", latitude: 30.33, longitude: -81.65,
    speed_mph: 62, heading_deg: 10, address: "I-95 N, Jacksonville, FL", located_at: "2026-11-18T12:00:00Z",
    status: "moving", driver_name: "Marcus Johnson", ...overrides,
  };
}

function liveMap(overrides: Partial<LiveMap> = {}): LiveMap {
  return {
    trucks: [
      truck(),
      truck({
        truck_id: "t2", unit_number: "1103", status: "stale", driver_name: null, address: null,
        located_at: "2026-11-18T10:05:00Z",
      }),
    ],
    trucks_without_location: 0,
    providers: [{ provider: "samsara", status: "connected", last_error: null, on_map: true }],
    refresh_seconds: 30,
    stale_after_minutes: 30,
    ...overrides,
  };
}

async function renderPage() {
  render(
    <LazyMotion features={domAnimation} strict>
      <TrucksLivePage />
    </LazyMotion>
  );
  await act(async () => {});
}

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
  getLiveMap.mockReset();
  mapProps.length = 0;
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("Trucks Live", () => {
  it("lists every truck with its status, speed, driver, place and last report", async () => {
    getLiveMap.mockResolvedValue(liveMap());
    await renderPage();

    expect(screen.getByText("2 trucks on the map")).toBeTruthy();
    expect(screen.getByTestId("map").textContent).toBe("2 markers");
    expect(screen.getByText("Truck 1042")).toBeTruthy();
    expect(screen.getByText(/Moving · 62 mph/)).toBeTruthy();
    expect(screen.getByText("Marcus Johnson")).toBeTruthy();
    expect(screen.getByText("I-95 N, Jacksonville, FL")).toBeTruthy();
    expect(screen.getByText("Last seen 5 minutes ago · via Samsara", { exact: false })).toBeTruthy();
    expect(screen.getByText("No recent update")).toBeTruthy();
    expect(screen.getByText("Last seen 2 hours ago · via Samsara", { exact: false })).toBeTruthy();
    expect(screen.getByText("No driver assigned")).toBeTruthy();
  });

  it("picking a truck in the list selects it on the map", async () => {
    getLiveMap.mockResolvedValue(liveMap());
    await renderPage();

    const row = screen.getByText("Truck 1103").closest("button")!;
    fireEvent.click(row);

    expect(row.getAttribute("aria-pressed")).toBe("true");
    expect(mapProps.at(-1)?.selectedId).toBe("t2");
  });

  it("refreshes on the API's schedule while the tab is visible", async () => {
    getLiveMap.mockResolvedValue(liveMap());
    await renderPage();
    expect(getLiveMap).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(getLiveMap).toHaveBeenCalledTimes(2);

    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(getLiveMap).toHaveBeenCalledTimes(2);
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  });

  it("points to Integrations when no ELD is connected", async () => {
    getLiveMap.mockResolvedValue(liveMap({ trucks: [], providers: [] }));
    await renderPage();

    expect(screen.getByText("Connect your ELD to see your trucks")).toBeTruthy();
    expect(screen.queryByTestId("map")).toBeNull();
    expect(screen.getAllByRole("link", { name: "Go to Integrations" })[0].getAttribute("href")).toBe("/integrations");
  });

  it("warns when an ELD needs reconnecting, and keeps showing the last positions", async () => {
    getLiveMap.mockResolvedValue(liveMap({
      providers: [{ provider: "samsara", status: "needs_reconnect", last_error: "unauthorized", on_map: true }],
    }));
    await renderPage();

    expect(screen.getByText(/Samsara stopped accepting our connection/)).toBeTruthy();
    expect(screen.getByText("2 trucks on the map")).toBeTruthy();
  });

  it("explains a non-carrier login instead of a blank page", async () => {
    getLiveMap.mockRejectedValue(new api.ApiError("Forbidden", 403));
    await renderPage();

    expect(screen.getByRole("alert").textContent).toContain("Sign in with a carrier login");
  });
});

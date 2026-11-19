"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertTriangle, Info, MapPin } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ErrorBanner } from "@/components/layout/error-banner";
import { Card, CardContent } from "@/components/ui/card";
import { BlurFadeStack } from "@/components/ui/blur-fade";
import {
  STATUS_META,
  lastSeen,
  providerName,
  providerNotices,
  speedText,
} from "@/components/live-map/live-map-text";
import { ApiError, getLiveMap } from "@/lib/api";
import type { LiveMap } from "@/types";

// Leaflet needs the browser's window, so the map never renders on the server
const TruckMap = dynamic(() => import("@/components/live-map/truck-map").then((m) => m.TruckMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted motion-reduce:animate-none" />,
});

const DEFAULT_REFRESH_SECONDS = 30;

export default function TrucksLivePage() {
  const [map, setMap] = useState<LiveMap | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const load = useCallback(
    () =>
      getLiveMap()
        .then((next) => {
          setMap(next);
          setError(null);
          setNow(new Date());
        })
        .catch((err) =>
          setError(
            err instanceof ApiError && err.status === 403
              ? "Trucks Live shows a carrier's own trucks. Sign in with a carrier login."
              : "Couldn't load your trucks' locations. We'll keep trying."
          )
        ),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  // Refresh while the tab is visible, and right away when the dispatcher comes back to it
  const refreshMs = (map?.refresh_seconds ?? DEFAULT_REFRESH_SECONDS) * 1000;
  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    const timer = window.setInterval(refreshIfVisible, refreshMs);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [load, refreshMs]);

  // Keeps "last seen" current between refreshes
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  if (map === null && !error) return <PageSkeleton />;

  const trucks = map?.trucks ?? [];
  const notices = map ? providerNotices(map) : [];
  const noEld = map !== null && map.providers.length === 0 && trucks.length === 0;

  return (
    <BlurFadeStack className="space-y-6">
      <PageHeader
        title="Trucks Live"
        description={`Where every truck is right now, from your ELD. Updates every ${map?.refresh_seconds ?? DEFAULT_REFRESH_SECONDS} seconds.`}
      />
      {error ? <ErrorBanner message={error} onRetry={load} /> : null}

      {notices.map((notice) => (
        <p
          key={notice.text}
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
            notice.tone === "warning"
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-border bg-muted/40 text-foreground"
          }`}
        >
          {notice.tone === "warning"
            ? <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            : <Info className="mt-0.5 size-4 shrink-0" aria-hidden />}
          <span>
            {notice.text}{" "}
            {notice.fixOnIntegrations ? (
              <Link href="/integrations" className="font-medium underline underline-offset-2">Go to Integrations</Link>
            ) : null}
          </span>
        </p>
      ))}

      {noEld ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-3 py-8">
            <MapPin className="size-6 text-[var(--brand-cyan)]" aria-hidden />
            <h2 className="text-base font-medium text-foreground">Connect your ELD to see your trucks</h2>
            <p className="max-w-prose text-sm text-muted-foreground">
              Trucks Live reads each truck&apos;s location from your ELD. Connect Samsara on Integrations and your
              trucks show up here within a minute.
            </p>
            <Link href="/integrations" className="text-sm font-medium text-[var(--brand-cyan)] underline underline-offset-2">
              Go to Integrations
            </Link>
          </CardContent>
        </Card>
      ) : map ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden p-0">
            <div className="h-[60vh] min-h-[360px]">
              <TruckMap trucks={trucks} selectedId={selectedId} onSelect={setSelectedId} />
            </div>
          </Card>

          <Card className="p-0">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-medium text-foreground">
                {trucks.length} {trucks.length === 1 ? "truck" : "trucks"} on the map
              </h2>
            </div>
            {trucks.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                No locations yet. Your ELD is connected; positions appear after its next report.
              </p>
            ) : (
              <ul className="max-h-[60vh] divide-y divide-border overflow-y-auto">
                {trucks.map((truck) => {
                  const status = STATUS_META[truck.status];
                  const speed = speedText(truck);
                  const selected = truck.truck_id === selectedId;
                  return (
                    <li key={truck.truck_id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(truck.truck_id)}
                        aria-pressed={selected}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none ${
                          selected ? "bg-muted/60" : ""
                        }`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-foreground">Truck {truck.unit_number}</span>
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className={`size-2 rounded-full ${status.dot}`} aria-hidden />
                            {status.label}
                            {speed ? ` · ${speed}` : ""}
                          </span>
                        </span>
                        <span className="mt-1 block text-muted-foreground">
                          {truck.driver_name ?? "No driver assigned"}
                        </span>
                        {truck.address ? <span className="mt-0.5 block text-muted-foreground">{truck.address}</span> : null}
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {lastSeen(truck.located_at, now)} · via {providerName(truck.provider)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      ) : null}
    </BlurFadeStack>
  );
}

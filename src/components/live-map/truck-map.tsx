"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import type { TruckPosition } from "@/types";
import { STATUS_META, markerHtml, tileConfig } from "./live-map-text";

// Continental US until the first trucks arrive
const US_CENTER: L.LatLngTuple = [39.5, -98.35];
const US_ZOOM = 4;
const TILES = tileConfig(process.env.NEXT_PUBLIC_MAPTILER_KEY, process.env.NEXT_PUBLIC_VERCEL_ENV);

interface TruckMapProps {
  trucks: TruckPosition[];
  selectedId: string | null;
  onSelect: (truckId: string) => void;
}

/** Frames every truck once when they first arrive, then flies to whichever truck is picked.
 * Refreshes never move the map, so a dispatcher's own panning isn't undone every 30 seconds. */
function Camera({ trucks, selectedId }: Pick<TruckMapProps, "trucks" | "selectedId">) {
  const map = useMap();
  const framed = useRef(false);

  useEffect(() => {
    if (framed.current || trucks.length === 0) return;
    framed.current = true;
    const bounds = L.latLngBounds(trucks.map((t) => [t.latitude, t.longitude]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 11 });
  }, [map, trucks]);

  const selected = trucks.find((t) => t.truck_id === selectedId);
  const target = selected ? `${selected.latitude},${selected.longitude}` : null;
  useEffect(() => {
    if (!selected) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    map.flyTo([selected.latitude, selected.longitude], Math.max(map.getZoom(), 10), { animate: !reduceMotion });
    // Only when the pick (or its position) changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedId, target]);

  return null;
}

function TruckMarker({ truck, selected, onSelect }: { truck: TruckPosition; selected: boolean; onSelect: TruckMapProps["onSelect"] }) {
  const icon = useMemo(
    () => L.divIcon({ html: markerHtml(truck, selected), className: "", iconSize: [40, 58], iconAnchor: [20, 20] }),
    [truck, selected]
  );
  return (
    <Marker
      position={[truck.latitude, truck.longitude]}
      icon={icon}
      title={`Truck ${truck.unit_number}: ${STATUS_META[truck.status].label}`}
      zIndexOffset={selected ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(truck.truck_id) }}
    />
  );
}

export function TruckMap({ trucks, selectedId, onSelect }: TruckMapProps) {
  if (!TILES) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center text-sm text-muted-foreground">
        The map isn&apos;t set up yet (no map key). Your trucks are listed alongside.
      </div>
    );
  }
  return (
    <MapContainer center={US_CENTER} zoom={US_ZOOM} className="h-full w-full" scrollWheelZoom worldCopyJump>
      <TileLayer url={TILES.url} attribution={TILES.attribution} />
      <Camera trucks={trucks} selectedId={selectedId} />
      {trucks.map((truck) => (
        <TruckMarker key={truck.truck_id} truck={truck} selected={truck.truck_id === selectedId} onSelect={onSelect} />
      ))}
    </MapContainer>
  );
}

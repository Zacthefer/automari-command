"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Link2 } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { BolStatusChip } from "@/components/bols/bol-status-chip";
import { getBol, getLoads, attachDocument } from "@/lib/api";
import type { BOL, LoadSummary } from "@/types";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function BolDetailPage() {
  const params = useParams();
  const [bol, setBol] = useState<BOL | null>(null);
  const [loading, setLoading] = useState(true);
  const [loads, setLoads] = useState<LoadSummary[]>([]);
  const [showAttach, setShowAttach] = useState(false);
  const [selectedLoadId, setSelectedLoadId] = useState("");
  const [attachKind, setAttachKind] = useState<"bol" | "pod">("bol");
  const [attachLoading, setAttachLoading] = useState(false);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [attachSuccess, setAttachSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      getBol(params.id as string)
        .then(setBol)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  function openAttach() {
    setShowAttach(true);
    setAttachError(null);
    setAttachSuccess(null);
    getLoads({ limit: 100 }).then(setLoads).catch(() => {});
  }

  async function handleAttach() {
    if (!selectedLoadId || !bol) return;
    setAttachLoading(true);
    setAttachError(null);
    try {
      await attachDocument(selectedLoadId, {
        bol_id: bol.id,
        kind: attachKind,
      });
      setAttachSuccess(
        `Attached as ${attachKind.toUpperCase()} to load ${
          loads.find((l) => l.id === selectedLoadId)?.load_number || selectedLoadId.slice(0, 8)
        }`
      );
      setShowAttach(false);
    } catch (err) {
      setAttachError(err instanceof Error ? err.message : "Failed to attach");
    } finally {
      setAttachLoading(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!bol) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[#d5e6f6]">BOL not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/bols"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {bol.pro_number || bol.bol_number || "BOL"}
            </h1>
            <BolStatusChip status={bol.status} />
          </div>
        </div>
        <Button variant="outline" onClick={openAttach}>
          <Link2 className="mr-2 h-4 w-4" />
          Attach to Load
        </Button>
      </div>

      {attachSuccess && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {attachSuccess}
        </div>
      )}

      {showAttach && (
        <Card className="border-[var(--brand-cyan)]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Attach to Load</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Select Load</Label>
              {loads.length === 0 ? (
                <p className="mt-1 text-sm text-[#8aa3bd]">
                  No loads found. Upload a rate confirmation first.
                </p>
              ) : (
                <select
                  value={selectedLoadId}
                  onChange={(e) => setSelectedLoadId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Choose a load…</option>
                  {loads.map((load) => (
                    <option key={load.id} value={load.id}>
                      {load.load_number || load.id.slice(0, 8)} —{" "}
                      {load.broker_name || "No broker"} —{" "}
                      {load.origin && load.destination
                        ? `${load.origin} → ${load.destination}`
                        : "No route"}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <Label>Document Type</Label>
              <div className="mt-2 flex gap-2">
                {(["bol", "pod"] as const).map((kind) => (
                  <button
                    key={kind}
                    onClick={() => setAttachKind(kind)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      attachKind === kind
                        ? "bg-[var(--brand-cyan-dim)] text-[var(--brand-cyan)]"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {kind.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            {attachError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {attachError}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleAttach}
                disabled={!selectedLoadId || attachLoading}
              >
                {attachLoading ? "Attaching…" : "Attach"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAttach(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="PRO Number" value={bol.pro_number} />
            <Field label="BOL Number" value={bol.bol_number} />
            <Field label="Shipper" value={bol.shipper_name} />
            <Field label="Consignee" value={bol.consignee_name} />
            <Field label="Commodity" value={bol.commodity} />
            <Field
              label="Weight"
              value={bol.weight ? `${bol.weight} lbs` : null}
            />
            <Field
              label="Pieces"
              value={bol.pieces ? String(bol.pieces) : null}
            />
            <Field label="Driver Phone" value={bol.driver_phone} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Processing Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Confidence"
              value={
                bol.confidence !== null
                  ? `${(bol.confidence * 100).toFixed(0)}%`
                  : null
              }
            />
            <Field
              label="Extraction Attempts"
              value={String(bol.extraction_attempts)}
            />
            <Separator />
            <Field
              label="Pickup Date"
              value={
                bol.pickup_date
                  ? format(new Date(bol.pickup_date), "MMM d, yyyy")
                  : null
              }
            />
            <Field
              label="Delivery Date"
              value={
                bol.delivery_date
                  ? format(new Date(bol.delivery_date), "MMM d, yyyy")
                  : null
              }
            />
            <Field
              label="Special Instructions"
              value={bol.special_instructions}
            />
            <Separator />
            <Field
              label="Received"
              value={format(new Date(bol.created_at), "MMM d, yyyy h:mm a")}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

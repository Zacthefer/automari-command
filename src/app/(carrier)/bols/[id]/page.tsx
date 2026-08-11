"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { BolStatusChip } from "@/components/bols/bol-status-chip";
import { getBol } from "@/lib/api";
import type { BOL } from "@/types";

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

export default function BolDetailPage() {
  const params = useParams();
  const [bol, setBol] = useState<BOL | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getBol(params.id as string)
        .then(setBol)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <PageSkeleton />;
  if (!bol) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">BOL not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/bols"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {bol.pro_number || bol.bol_number || "BOL"}
          </h1>
          <BolStatusChip status={bol.status} />
        </div>
      </div>

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

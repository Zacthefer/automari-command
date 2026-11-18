"use client";

import { useState, type FormEvent } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateTenant } from "@/lib/api";
import type { Tenant } from "@/types";

/** "+12695550142" → "(269) 555-0142"; anything else is shown as stored. */
export function formatTextNumber(phone: string | null): string {
  const match = phone?.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone ?? "";
}

export function TextNumberCard({
  tenantId,
  currentNumber,
  onSaved,
}: {
  tenantId: string;
  currentNumber: string | null;
  onSaved: (tenant: Tenant) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // What the server stored on the last save: undefined = nothing saved yet, null = cleared
  const [saved, setSaved] = useState<string | null | undefined>(undefined);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(undefined);

    const typed = (new FormData(e.currentTarget).get("text_number") as string).trim();
    try {
      // The backend stores it as +1XXXXXXXXXX and refuses a number another carrier already has
      const tenant = await updateTenant(tenantId, { twilio_phone: typed || null });
      onSaved(tenant);
      setSaved(tenant.twilio_phone);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the text number");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Text number
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Drivers text BOL photos to this number. Use a number bought in Twilio for this company only.
          </p>
          {!currentNumber && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              No text number yet. BOLs texted for this company can&apos;t be received until you add one.
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {saved !== undefined && (
            <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {saved
                ? `Saved. Drivers text BOLs to ${formatTextNumber(saved)}.`
                : "Saved. This company no longer has a text number."}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="text_number">Phone number</Label>
            <Input
              id="text_number"
              name="text_number"
              type="tel"
              placeholder="(269) 555-0142"
              defaultValue={formatTextNumber(currentNumber)}
              onChange={() => setSaved(undefined)}
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save number"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

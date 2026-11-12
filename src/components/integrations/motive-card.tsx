"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Cable, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlurFade } from "@/components/ui/blur-fade";
import { disconnectMotive, startMotiveConnect, syncMotive } from "@/lib/api";
import type { IntegrationConnection } from "@/types";
import { actionErrorMessage, syncSummary } from "./motive-text";

type Busy = "connecting" | "syncing" | "disconnecting" | null;

interface MotiveCardProps {
  connection: IntegrationConnection | null;
  /** Reload the connection after a sync or disconnect changed it. */
  onChanged: () => void;
}

const STATUS = {
  connected: { label: "Connected", icon: CheckCircle2, className: "text-emerald-700" },
  needs_reconnect: { label: "Needs reconnecting", icon: AlertTriangle, className: "text-amber-700" },
  not_connected: { label: "Not connected", icon: Circle, className: "text-muted-foreground" },
} as const;

export function MotiveCard({ connection, onChanged }: MotiveCardProps) {
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const state = connection?.status === "connected" || connection?.status === "needs_reconnect"
    ? connection.status
    : "not_connected";
  const status = STATUS[state];

  async function connect() {
    setError(null);
    setBusy("connecting");
    try {
      const { authorize_url } = await startMotiveConnect();
      window.location.assign(authorize_url);
    } catch (err) {
      setError(actionErrorMessage(err, "Couldn't start connecting Motive. Try again."));
      setBusy(null);
    }
  }

  async function sync() {
    setError(null);
    setResult(null);
    setBusy("syncing");
    try {
      setResult(syncSummary(await syncMotive()));
    } catch (err) {
      setError(actionErrorMessage(err, "The sync didn't finish. Try again."));
    } finally {
      setBusy(null);
      onChanged();
    }
  }

  async function disconnect() {
    setError(null);
    setBusy("disconnecting");
    try {
      await disconnectMotive();
      setConfirmingDisconnect(false);
      setResult(null);
      onChanged();
    } catch (err) {
      setError(actionErrorMessage(err, "Couldn't disconnect Motive. Try again."));
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-cyan-dim)]">
              <Cable className="size-5 text-[var(--brand-cyan)]" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-medium text-foreground">Motive</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Brings in your trucks and drivers from Motive. Read-only: we never change anything in Motive.
              </p>
            </div>
          </div>
          <p className={`flex items-center gap-1.5 text-sm font-medium ${status.className}`}>
            <status.icon className="size-4" aria-hidden />
            {status.label}
          </p>
        </div>

        {connection && state !== "not_connected" ? (
          <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">Motive fleet ID</dt>
            <dd className="text-foreground">{connection.external_account_id ?? "—"}</dd>
            <dt className="text-muted-foreground">Last synced</dt>
            <dd className="text-foreground">
              {connection.last_synced_at
                ? `${formatDistanceToNow(new Date(connection.last_synced_at))} ago`
                : "Not synced yet"}
            </dd>
          </dl>
        ) : null}

        {state === "needs_reconnect" ? (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            Motive asked us to log in again. Syncing is paused until you reconnect.
          </p>
        ) : null}

        {state === "connected" && connection?.last_error && !result && !error ? (
          <p className="text-sm text-amber-800">The last sync didn&apos;t finish. Click Sync now to try again.</p>
        ) : null}

        <div aria-live="polite">
          {result ? (
            <BlurFade key={result} yOffset={4} duration={0.2}>
              <p className="flex items-start gap-2 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                {result}
              </p>
            </BlurFade>
          ) : null}
          {error ? (
            <p role="alert" className="flex items-start gap-2 text-sm text-red-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}
        </div>

        {confirmingDisconnect ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm text-foreground">
              Disconnect Motive? Trucks and drivers already brought in stay in Automari. You can reconnect anytime.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="destructive" onClick={disconnect} disabled={busy !== null}>
                {busy === "disconnecting" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
                {busy === "disconnecting" ? "Disconnecting…" : "Disconnect"}
              </Button>
              <Button variant="ghost" onClick={() => setConfirmingDisconnect(false)} disabled={busy !== null}>
                Keep connected
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {state === "connected" ? (
              <Button onClick={sync} disabled={busy !== null}>
                {busy === "syncing" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
                {busy === "syncing" ? "Syncing…" : "Sync now"}
              </Button>
            ) : (
              <Button onClick={connect} disabled={busy !== null}>
                {busy === "connecting" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
                {busy === "connecting"
                  ? "Opening Motive…"
                  : state === "needs_reconnect"
                    ? "Reconnect Motive"
                    : "Connect Motive"}
              </Button>
            )}
            {state !== "not_connected" ? (
              <Button variant="ghost" onClick={() => setConfirmingDisconnect(true)} disabled={busy !== null}>
                Disconnect
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

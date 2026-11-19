"use client";

import { useState, type FormEvent } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Cable, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BlurFade } from "@/components/ui/blur-fade";
import { connectSamsara, disconnectSamsara, syncSamsara } from "@/lib/api";
import type { IntegrationConnection } from "@/types";
import { syncSummary, type CallbackMessage } from "./motive-text";
import { SAMSARA_PERMISSIONS, connectResultMessage, samsaraErrorMessage } from "./samsara-text";

type Busy = "connecting" | "syncing" | "disconnecting" | null;

interface SamsaraCardProps {
  connection: IntegrationConnection | null;
  /** Reload the connection after a connect, sync or disconnect changed it. */
  onChanged: () => void;
}

const STATUS = {
  connected: { label: "Connected", icon: CheckCircle2, className: "text-emerald-700" },
  needs_reconnect: { label: "Needs a new token", icon: AlertTriangle, className: "text-amber-700" },
  not_connected: { label: "Not connected", icon: Circle, className: "text-muted-foreground" },
} as const;

const TONE_CLASS = {
  success: "text-emerald-800",
  warning: "text-amber-800",
  error: "text-red-700",
} as const;

export function SamsaraCard({ connection, onChanged }: SamsaraCardProps) {
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [message, setMessage] = useState<CallbackMessage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const state = connection?.status === "connected" || connection?.status === "needs_reconnect"
    ? connection.status
    : "not_connected";
  const status = STATUS[state];

  async function connect(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setBusy("connecting");
    try {
      setMessage(connectResultMessage(await connectSamsara(token.trim())));
      setToken("");
      onChanged();
    } catch (err) {
      setError(samsaraErrorMessage(err, "Couldn't connect Samsara. Try again."));
    } finally {
      setBusy(null);
    }
  }

  async function sync() {
    setError(null);
    setMessage(null);
    setBusy("syncing");
    try {
      setMessage({ tone: "success", text: syncSummary(await syncSamsara(), "Samsara") });
    } catch (err) {
      setError(samsaraErrorMessage(err, "The sync didn't finish. Try again."));
    } finally {
      setBusy(null);
      onChanged();
    }
  }

  async function disconnect() {
    setError(null);
    setBusy("disconnecting");
    try {
      await disconnectSamsara();
      setConfirmingDisconnect(false);
      setMessage(null);
      onChanged();
    } catch (err) {
      setError(samsaraErrorMessage(err, "Couldn't disconnect Samsara. Try again."));
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
              <h2 className="text-base font-medium text-foreground">Samsara</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Brings in your trucks and drivers, and puts your trucks on Trucks Live. Read-only: we never change
                anything in Samsara.
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
            <dt className="text-muted-foreground">Samsara account ID</dt>
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
            Samsara stopped accepting the token (it was deleted, or is missing a permission). Paste a new one below.
          </p>
        ) : null}

        {state !== "connected" ? (
          <form onSubmit={connect} className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-sm text-foreground">
              <li>In Samsara, open <span className="font-medium">Settings → API Tokens</span> and click <span className="font-medium">Add an API Token</span>.</li>
              <li>Name it &quot;Automari&quot; and tick only these read permissions: {SAMSARA_PERMISSIONS.join(", ")}.</li>
              <li>Copy the token Samsara shows and paste it here.</li>
            </ol>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="samsara-token" className="sr-only">Samsara API token</label>
              <input
                id="samsara-token"
                type="password"
                autoComplete="off"
                spellCheck={false}
                value={token}
                onChange={(event) => setToken(event.target.value)}
                placeholder="Paste your Samsara API token"
                className="h-9 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-cyan)] sm:max-w-sm"
              />
              <Button type="submit" disabled={busy !== null || !token.trim()}>
                {busy === "connecting" ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}
                {busy === "connecting" ? "Checking token…" : state === "needs_reconnect" ? "Save new token" : "Connect Samsara"}
              </Button>
            </div>
          </form>
        ) : null}

        <div aria-live="polite">
          {message ? (
            <BlurFade key={message.text} yOffset={4} duration={0.2}>
              <p className={`flex items-start gap-2 text-sm ${TONE_CLASS[message.tone]}`}>
                {message.tone === "success"
                  ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
                  : <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />}
                {message.text}
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

        {state === "not_connected" ? null : confirmingDisconnect ? (
          <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-sm text-foreground">
              Disconnect Samsara? Trucks and drivers already brought in stay in Automari, and your trucks leave
              Trucks Live. Also delete the &quot;Automari&quot; token in Samsara under Settings → API Tokens.
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
            ) : null}
            <Button variant="ghost" onClick={() => setConfirmingDisconnect(true)} disabled={busy !== null}>
              Disconnect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CheckCircle2, PlugZap, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ErrorBanner } from "@/components/layout/error-banner";
import { EmptyState } from "@/components/layout/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMoneyBoard } from "@/lib/api";
import type { MoneyBoard, MoneyBucket, MoneyBucketKey, MoneyRow } from "@/types";
import { BlurFadeStack } from "@/components/ui/blur-fade";

const AGING_COLORS: Record<string, string> = {
  "0-30": "#10b981",
  "31-60": "#f59e0b",
  "61-90": "#f97316",
  "90+": "#ef4444",
};

// Boxes that need a person get a colored marker; the label always carries the meaning too
const BUCKET_TONE: Partial<Record<MoneyBucketKey, string>> = {
  past_due: "bg-red-500",
  action: "bg-amber-500",
  paid: "bg-emerald-500",
};

const CHIP_CLASS: Partial<Record<MoneyBucketKey, string>> = {
  past_due: "bg-red-50 text-red-700 hover:bg-red-50",
  action: "bg-amber-50 text-amber-800 hover:bg-amber-50",
  paid: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
};

const MISSING_SHOWN = 3;
const HEAD_CLASS = "text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground";

function wholeDollars(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function exactDollars(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function shortDate(iso: string): string {
  return format(new Date(iso), "MMM d");
}

function rowHref(row: { kind: "load" | "invoice"; id: string }): string {
  return row.kind === "load" ? `/loads/${row.id}` : `/invoices/${row.id}`;
}

function BucketTile({
  bucket,
  selected,
  onSelect,
}: {
  bucket: MoneyBucket;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = BUCKET_TONE[bucket.key];
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex h-full flex-col gap-2 rounded-2xl border bg-card p-4 text-left shadow-[var(--shadow-elevated-1)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-cyan)] ${
        selected ? "border-[var(--brand-cyan)]" : "border-border hover:border-[var(--brand-cyan)]/40"
      }`}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-foreground">
        {tone ? <span aria-hidden className={`size-2 shrink-0 rounded-full ${tone}`} /> : null}
        {bucket.label}
      </span>
      <span className="text-2xl font-medium leading-none tracking-[-0.02em] text-foreground tabular-nums">
        {wholeDollars(bucket.total ?? 0)}
      </span>
      <span className="text-xs text-subtle-foreground tabular-nums">
        {bucket.count} {bucket.count === 1 ? "item" : "items"}
      </span>
      <span className="mt-auto text-[11px] leading-snug text-muted-foreground">{bucket.source}</span>
    </button>
  );
}

function CoverageLine({ board }: { board: MoneyBoard }) {
  const { counted, total, missing } = board.coverage;
  if (total === 0) return null;
  const percent = Math.floor((counted / total) * 100);
  const { paid, confirmed } = board.confirmation;

  return (
    <div className="space-y-1.5 rounded-2xl border border-border bg-card px-5 py-4 text-sm shadow-[var(--shadow-elevated-1)]">
      {missing.length === 0 ? (
        <p className="flex items-center gap-2 text-foreground">
          <CheckCircle2 aria-hidden className="size-4 text-emerald-600" />
          Every amount counted: {total} of {total} (100%).
        </p>
      ) : (
        <p className="text-foreground">
          <span className="font-medium tabular-nums">
            Counting {counted} of {total} ({percent}%).
          </span>{" "}
          <span className="text-muted-foreground">
            {missing.length} {missing.length === 1 ? "amount isn't" : "amounts aren't"} in the totals yet:{" "}
          </span>
          {missing.slice(0, MISSING_SHOWN).map((item, i) => (
            <span key={`${item.kind}-${item.id}`}>
              {i > 0 ? "; " : ""}
              <Link href={rowHref(item)} className="font-mono text-[13px] text-[var(--brand-link)] hover:underline">
                {item.number || "Unnumbered"}
              </Link>{" "}
              <span className="text-muted-foreground">({item.reason})</span>
            </span>
          ))}
          {missing.length > MISSING_SHOWN ? (
            <span className="text-muted-foreground">; and {missing.length - MISSING_SHOWN} more</span>
          ) : null}
        </p>
      )}
      {paid > 0 ? (
        <p className="text-muted-foreground">
          Paid: {paid} marked paid by you. {confirmed} confirmed by your factoring company or bank
          {confirmed === 0 ? " yet" : ""}.
        </p>
      ) : null}
    </div>
  );
}

function NotConnectedCard({ buckets }: { buckets: MoneyBucket[] }) {
  if (buckets.length === 0) return null;
  return (
    <Card className="rounded-2xl border border-dashed border-border bg-card/60 shadow-none ring-0">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <PlugZap aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">From your factoring company: not connected yet</p>
            <p className="text-xs text-muted-foreground">
              These fill in once your factoring company is connected. Until then we show nothing rather than $0.
            </p>
          </div>
        </div>
        <ul className="flex flex-wrap gap-2">
          {buckets.map((b) => (
            <li key={b.key} className="rounded-lg bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              {b.label}: <span className="font-medium">Not connected</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DueCell({ row }: { row: MoneyRow }) {
  if (row.bucket === "paid") return row.paid_at ? <>Paid {shortDate(row.paid_at)}</> : <>Paid</>;
  if (!row.due_at) return <>—</>;
  if (row.bucket === "past_due") {
    return <span className="font-medium text-red-700">Past due since {shortDate(row.due_at)}</span>;
  }
  return <>Due {shortDate(row.due_at)}</>;
}

export default function MoneyBoardPage() {
  const [board, setBoard] = useState<MoneyBoard | null>(null);
  const [filter, setFilter] = useState<MoneyBucketKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback((signal?: AbortSignal) => {
    getMoneyBoard()
      .then((b) => {
        if (signal?.aborted) return;
        setBoard(b);
        setError(null);
      })
      .catch(() => {
        if (!signal?.aborted) setError("Couldn't load your money board. Check your connection and try again.");
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  function retry() {
    setLoading(true);
    fetchData();
  }

  if (loading) return <PageSkeleton />;

  const header = (
    <PageHeader
      title="Money Board"
      description={
        board
          ? `Where every dollar you've earned is right now. Updated ${format(new Date(board.as_of), "h:mm a")}.`
          : "Where every dollar you've earned is right now."
      }
    />
  );

  if (!board) {
    return (
      <BlurFadeStack className="space-y-6">
        {header}
        <ErrorBanner message={error ?? "Couldn't load your money board."} onRetry={retry} />
      </BlurFadeStack>
    );
  }

  const connected = board.buckets.filter((b) => b.connected);
  const notConnected = board.buckets.filter((b) => !b.connected);
  const labels = Object.fromEntries(board.buckets.map((b) => [b.key, b.label]));
  const rows = filter ? board.rows.filter((r) => r.bucket === filter) : board.rows;
  const agingTotal = board.aging_buckets.reduce((sum, b) => sum + b.total_amount, 0);
  const avgDays = board.avg_days_to_payment;

  return (
    <BlurFadeStack className="space-y-6">
      {header}

      {error ? <ErrorBanner message={error} onRetry={retry} /> : null}

      <p className="text-sm text-muted-foreground">
        You&apos;re owed{" "}
        <span className="font-medium text-foreground tabular-nums">{exactDollars(board.total_outstanding)}</span>
        {avgDays !== null ? (
          <>
            {" "}· payers take <span className="font-medium text-foreground tabular-nums">{Math.round(avgDays)} days</span>{" "}
            on average
          </>
        ) : null}
        .
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {connected.map((bucket) => (
          <BucketTile
            key={bucket.key}
            bucket={bucket}
            selected={filter === bucket.key}
            onSelect={() => setFilter(filter === bucket.key ? null : bucket.key)}
          />
        ))}
      </div>

      <CoverageLine board={board} />
      <NotConnectedCard buckets={notConnected} />

      {agingTotal > 0 ? (
        <Card className="rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)] ring-0">
          <CardHeader className="px-5 pt-1">
            <CardTitle className="text-base font-medium text-foreground">How long you&apos;ve been waiting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              {board.aging_buckets.map((bucket) =>
                bucket.total_amount > 0 ? (
                  <div
                    key={bucket.label}
                    style={{
                      width: `${(bucket.total_amount / agingTotal) * 100}%`,
                      backgroundColor: AGING_COLORS[bucket.label] ?? "#94a3b8",
                    }}
                  />
                ) : null
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {board.aging_buckets.map((bucket) => (
                <div key={bucket.label} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: AGING_COLORS[bucket.label] ?? "#94a3b8" }}
                  />
                  <div>
                    <p className="text-xs text-subtle-foreground">{bucket.label} days</p>
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {wholeDollars(bucket.total_amount)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        · {bucket.count} {bucket.count === 1 ? "item" : "items"}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {board.rows_total === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No money to track yet"
          description="When a load's POD comes in, it shows here as Not billed yet, then moves along as you submit it and get paid."
          actionLabel="Go to loads"
          actionHref="/loads"
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={`Nothing in ${filter ? labels[filter] : "this box"}`}
          description="Choose another box, or choose this one again to see everything."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>Load / Invoice</TableHead>
                <TableHead className={`${HEAD_CLASS} hidden md:table-cell`}>Broker</TableHead>
                <TableHead className={`${HEAD_CLASS} text-right`}>Amount</TableHead>
                <TableHead className={`${HEAD_CLASS} hidden text-right sm:table-cell`}>Days waiting</TableHead>
                <TableHead className={`${HEAD_CLASS} hidden lg:table-cell`}>Due</TableHead>
                <TableHead className={HEAD_CLASS}>Box</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.kind}-${row.id}`} className="group h-11">
                  <TableCell>
                    <Link
                      href={rowHref(row)}
                      className="font-mono text-[13px] font-medium text-foreground transition-colors group-hover:text-[var(--brand-link)]"
                    >
                      {row.number || row.id.slice(0, 8)}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-[13px] text-foreground md:table-cell">
                    {row.broker_name || "—"}
                  </TableCell>
                  <TableCell className="text-right text-[13px] font-medium text-foreground tabular-nums">
                    {row.amount !== null ? (
                      exactDollars(row.amount)
                    ) : (
                      <span className="font-normal text-muted-foreground">Amount unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-right text-[13px] text-subtle-foreground tabular-nums sm:table-cell">
                    {row.days !== null ? `${row.days}d` : "—"}
                  </TableCell>
                  <TableCell className="hidden text-[13px] text-subtle-foreground lg:table-cell">
                    <DueCell row={row} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={CHIP_CLASS[row.bucket] ?? ""}>
                      {labels[row.bucket] ?? row.bucket}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {board.rows.length < board.rows_total ? (
        <p className="text-xs text-subtle-foreground">
          Showing the {board.rows.length} most urgent of {board.rows_total}. The boxes above count all of them.
        </p>
      ) : null}
    </BlurFadeStack>
  );
}

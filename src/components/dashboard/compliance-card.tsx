import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ComplianceCardProps {
  total: number;
  expiringSoon: number;
  expired: number;
}

export function ComplianceCard({ total, expiringSoon, expired }: ComplianceCardProps) {
  const current = Math.max(total - expiringSoon - expired, 0);
  const rows = [
    { label: "Current", count: current, color: "#10b981" },
    { label: "Expiring soon", count: expiringSoon, color: "#f59e0b" },
    { label: "Expired", count: expired, color: "#ef4444" },
  ];

  return (
    <Card className="h-full rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)] ring-0">
      <CardHeader className="flex flex-row items-center justify-between px-5 pt-1">
        <CardTitle className="text-base font-medium text-foreground">Compliance</CardTitle>
        <Link href="/compliance" className="text-xs font-medium text-[var(--brand-link)] hover:underline">
          View documents
        </Link>
      </CardHeader>
      <CardContent className="space-y-5 px-5">
        <div>
          <p className="text-[28px] font-medium leading-none tracking-[-0.03em] text-foreground tabular-nums">
            {total}
          </p>
          <p className="mt-1 text-xs text-subtle-foreground">documents tracked</p>
        </div>

        {total === 0 ? (
          <p className="text-sm text-subtle-foreground">No documents uploaded yet</p>
        ) : (
          <>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-[var(--muted)]">
              {rows.map((row) =>
                row.count > 0 ? (
                  <div
                    key={row.label}
                    style={{ width: `${(row.count / total) * 100}%`, backgroundColor: row.color }}
                  />
                ) : null
              )}
            </div>
            <ul className="space-y-2.5">
              {rows.map((row) => (
                <li key={row.label} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-subtle-foreground">
                    <span className="size-2 rounded-full" style={{ backgroundColor: row.color }} />
                    {row.label}
                  </span>
                  <span className="font-medium text-foreground tabular-nums">{row.count}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-muted-foreground/40" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground max-w-sm mx-auto">
        {description}
      </p>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Link
            href={actionHref}
            className="mt-5 inline-flex items-center rounded-md bg-[var(--brand-navy)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-navy)]/90"
          >
            {actionLabel}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="mt-5 inline-flex items-center rounded-md bg-[var(--brand-navy)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-navy)]/90"
          >
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";

export default function CarrierError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center max-w-md">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Something went wrong
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <button
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-md bg-[var(--brand-navy)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-navy)]/90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

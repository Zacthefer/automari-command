"use client";

import { AlertTriangle } from "lucide-react";

export default function CarrierError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-700">
          <AlertTriangle className="size-6" />
        </span>
        <h2 className="mt-4 text-lg font-medium text-foreground">Something went wrong</h2>
        <p className="mt-2 text-sm text-subtle-foreground">
          This page hit an unexpected error. Try again, and if it keeps happening, contact support.
        </p>
        <button
          onClick={() => retry()}
          className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

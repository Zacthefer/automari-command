"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorBanner({ message, onRetry, retryLabel = "Retry" }: ErrorBannerProps) {
  // Track which message was dismissed so a new, different error still shows
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  if (dismissedMessage === message) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
    >
      <div className="flex min-w-0 items-center gap-2 text-sm text-red-800">
        <AlertTriangle className="size-4 shrink-0" />
        <span>{message}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {onRetry ? (
          <button
            onClick={onRetry}
            className="rounded-md bg-red-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-800"
          >
            {retryLabel}
          </button>
        ) : null}
        <button
          onClick={() => setDismissedMessage(message)}
          className="rounded-md p-1 text-red-700 transition-colors hover:bg-red-100"
          aria-label="Dismiss"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

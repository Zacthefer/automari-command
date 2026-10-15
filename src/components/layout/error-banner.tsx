"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm text-red-800 min-w-0">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{message}</span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="rounded-md p-1 text-red-400 hover:text-red-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

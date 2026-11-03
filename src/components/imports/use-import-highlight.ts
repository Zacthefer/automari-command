"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// After an import: reload the list (no skeleton), then glow the new rows for 1.6s.
// Shared by the Trucks and Drivers pages.

export const HIGHLIGHT_MS = 1600;

export function useImportHighlight(reload: () => Promise<unknown>) {
  const [highlight, setHighlight] = useState<Set<string>>(() => new Set());
  const timer = useRef<number | undefined>(undefined);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  const onImported = useCallback(
    async (createdIds: string[]) => {
      await reload();
      // The carrier may have left the page while the list reloaded
      if (!mounted.current) return;
      setHighlight(new Set(createdIds));
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setHighlight(new Set()), HIGHLIGHT_MS);
    },
    [reload]
  );

  return { highlight, onImported };
}

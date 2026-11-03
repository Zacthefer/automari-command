"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { CsvImport } from "@/components/imports/use-csv-import";

// Loads the review panel (motion, table, Sheet) only when an import starts. A manual
// loader instead of next/dynamic: smaller in the page bundle, and a failed chunk load
// becomes an inline error instead of falling into the route's error boundary.

type SheetComponent = ComponentType<{ importer: CsvImport }>;

let loaded: SheetComponent | null = null;
let loading: Promise<SheetComponent> | null = null;

export function loadImportSheet(): Promise<SheetComponent> {
  loading ??= import("@/components/imports/import-sheet").then(
    (mod) => (loaded = mod.default),
    (error) => {
      // Allow a later attempt once the connection is back
      loading = null;
      throw error;
    }
  );
  return loading;
}

export function LazyImportSheet({ importer }: { importer: CsvImport }) {
  const [Sheet, setSheet] = useState<SheetComponent | null>(() => loaded);
  const { panelLoadFailed } = importer;

  useEffect(() => {
    if (Sheet) return;
    let live = true;
    loadImportSheet().then(
      (component) => live && setSheet(() => component),
      () => live && panelLoadFailed()
    );
    return () => {
      live = false;
    };
  }, [Sheet, panelLoadFailed]);

  return Sheet ? <Sheet importer={importer} /> : null;
}

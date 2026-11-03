"use client";

import { useEffect, useRef } from "react";
import { LazyMotion, domAnimation } from "motion/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FleetDiffBar } from "@/components/imports/fleet-diff-bar";
import { ImportProgress } from "@/components/imports/import-progress";
import { PreviewTable } from "@/components/imports/preview-table";
import { ProblemGroups } from "@/components/imports/problem-groups";
import { doneText, importLabels, nounFor } from "@/components/imports/import-text";
import {
  importableCount,
  type CsvImport,
  type ImportState,
  type ShownError,
} from "@/components/imports/use-csv-import";
import type { ImportEntity } from "@/types/imports";

// The import review panel. Loaded only through LazyImportSheet (a manual import() loader),
// so motion and the table stay out of the page bundle. All state lives in useCsvImport;
// this only renders it.

function ErrorText({ error }: { error: ShownError }) {
  return (
    <div role="alert" className="text-sm">
      <p className="font-medium text-destructive">{error.message}</p>
      {error.fixHint ? <p className="mt-0.5 text-muted-foreground">{error.fixHint}</p> : null}
    </div>
  );
}

function progressSteps(entity: ImportEntity, state: ImportState) {
  if (state.status === "confirming") {
    const n = importableCount(state.preview);
    const done = state.result ? doneText(entity, state.result.counts.created, state.result.counts.filled) : "";
    return { steps: ["Uploading file", `Saving ${n} ${nounFor(entity, n)}`, done] as [string, string, string], active: state.shownStep };
  }
  if (state.status === "done") {
    const n = state.importing;
    return {
      steps: ["Uploading file", `Saving ${n} ${nounFor(entity, n)}`, doneText(entity, state.created, state.filled)] as [
        string,
        string,
        string,
      ],
      active: 2 as const,
    };
  }
  return null;
}

export default function ImportSheet({ importer }: { importer: CsvImport }) {
  const { state, entity } = importer;
  const keepRef = useRef<HTMLButtonElement>(null);
  const discardPrompt = state.status === "reviewing" && state.discardPrompt;
  const progress = progressSteps(entity, state);

  useEffect(() => {
    if (discardPrompt) keepRef.current?.focus();
  }, [discardPrompt]);

  return (
    <Sheet open onOpenChange={(open) => !open && importer.closeRequest()}>
      <SheetContent
        side="right"
        showCloseButton={state.status !== "confirming" && state.status !== "done"}
        className="gap-0 overflow-hidden p-0 data-[side=right]:w-full data-[side=right]:max-w-none data-[side=right]:sm:max-w-none md:data-[side=right]:w-[min(72rem,92vw)]"
      >
        <LazyMotion features={domAnimation} strict>
          <SheetHeader className="border-b border-border px-6 py-4 pr-14">
            <SheetTitle className="text-lg">Import {entity}</SheetTitle>
            <SheetDescription>Check what will change. Nothing is saved until you import.</SheetDescription>
            {state.status === "reviewing" && state.note ? (
              <p role="status" className="mt-2 rounded-lg bg-[var(--brand-cyan-dim)] px-3 py-2 text-sm text-foreground">
                {state.note}
              </p>
            ) : null}
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {state.status === "reviewing" ? (
              <div className="space-y-6">
                <FleetDiffBar counts={state.preview.counts} />
                {state.preview.ignored_columns > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {state.preview.ignored_columns} {state.preview.ignored_columns === 1 ? "column" : "columns"} ignored
                  </p>
                ) : null}
                <ProblemGroups errors={state.preview.errors} warnings={state.preview.warnings} />
                <PreviewTable parsed={state.parsed} preview={state.preview} />
              </div>
            ) : null}

            {progress ? (
              <div className="flex h-full items-center justify-center">
                <ImportProgress steps={progress.steps} activeStep={progress.active} />
              </div>
            ) : null}

            {state.status === "rechecking" ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-[var(--brand-cyan)] motion-reduce:animate-none" aria-hidden />
                <p role="status">Checking your file…</p>
              </div>
            ) : null}

            {state.status === "panelError" ? (
              <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 text-center">
                <ErrorText error={state.error} />
                <div className="flex gap-2">
                  <Button type="button" onClick={importer.repick}>
                    Choose another file
                  </Button>
                  <Button type="button" variant="outline" onClick={importer.closeRequest}>
                    Close
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {state.status === "reviewing" ? (
            <div className="border-t border-border bg-popover px-6 py-4">
              {discardPrompt ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    Discard this import? Nothing has been imported yet.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="destructive" onClick={importer.discard}>
                      Discard
                    </Button>
                    <Button ref={keepRef} type="button" variant="outline" onClick={importer.keep}>
                      Keep reviewing
                    </Button>
                  </div>
                </div>
              ) : (
                <ReviewFooter importer={importer} state={state} />
              )}
            </div>
          ) : null}
        </LazyMotion>
      </SheetContent>
    </Sheet>
  );
}

function ReviewFooter({ importer, state }: { importer: CsvImport; state: Extract<ImportState, { status: "reviewing" }> }) {
  const labels = importLabels(state.preview, importer.entity);
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">{state.error ? <ErrorText error={state.error} /> : null}</div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        {labels.showSecondary ? (
          <Button type="button" variant="outline" onClick={importer.repick}>
            Fix my file and re-upload
          </Button>
        ) : null}
        <Button type="button" disabled={labels.primaryDisabled} onClick={() => void importer.confirm()}>
          {labels.primary}
        </Button>
      </div>
    </div>
  );
}

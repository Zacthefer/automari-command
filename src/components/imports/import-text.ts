import { importableCount } from "@/components/imports/use-csv-import";
import { ENTITY_NOUN, type ImportEntity, type ImportResponse } from "@/types/imports";

// Labels only the review panel needs. Kept out of use-csv-import so they load with the
// panel, not with the page.

export const nounFor = (entity: ImportEntity, n: number) => ENTITY_NOUN[entity][n === 1 ? 0 : 1];

export function importLabels(preview: ImportResponse, entity: ImportEntity) {
  const { rows_total, skipped } = preview.counts;
  const n = importableCount(preview);
  if (skipped === 0) return { primary: `Import ${n} ${nounFor(entity, n)}`, primaryDisabled: false, showSecondary: false };
  if (skipped < rows_total) return { primary: `Import ${n} · Skip ${skipped}`, primaryDisabled: false, showSecondary: true };
  return { primary: "Nothing to import, fix your file", primaryDisabled: true, showSecondary: true };
}

export function doneText(entity: ImportEntity, created: number, filled: number) {
  if (created > 0) {
    return `${created} ${nounFor(entity, created)} added${filled > 0 ? `, ${filled} updated` : ""} ✓`;
  }
  if (filled > 0) return `${filled} ${nounFor(entity, filled)} updated ✓`;
  return "Your fleet is already up to date ✓";
}

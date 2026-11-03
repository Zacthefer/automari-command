import type { ImportProblemGroup } from "@/types/imports";

// The server's plain-English problem groups, shown exactly as sent. No code is ever
// mapped to frontend text, so new server codes need no change here.

export function ProblemGroups({ errors, warnings }: { errors: ImportProblemGroup[]; warnings: ImportProblemGroup[] }) {
  const groups = [...errors, ...warnings];
  if (groups.length === 0) return null;

  return (
    <ul className="space-y-2">
      {groups.map((group, i) => {
        const isError = group.severity === "error";
        return (
          <li
            key={`${group.severity}-${group.code}-${group.column ?? ""}-${i}`}
            data-severity={group.severity}
            className="rounded-xl border border-border bg-card p-3"
          >
            <span
              className={
                isError
                  ? "inline-block rounded-md bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive"
                  : "inline-block rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700"
              }
            >
              {isError ? "Will be skipped" : "Will import"}
            </span>
            <p className="mt-1.5 text-sm font-medium text-foreground">{group.message}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{group.fix_hint}</p>
            {/* Scrollable, so it must be focusable; a named group gives it a valid role */}
            <div
              role="group"
              tabIndex={0}
              aria-label={`${group.rows.length === 1 ? "Row" : "Rows"} for this problem`}
              className="mt-2 max-h-24 overflow-y-auto font-mono text-xs text-muted-foreground"
            >
              {group.rows.length === 1 ? "Row" : "Rows"} {group.rows.join(", ")}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

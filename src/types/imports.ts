// Mirrors automari-freight app/modules/imports/schemas.py (branch feature/csv-import). Update both together.

export type ImportEntity = "trucks" | "drivers";
export type ImportSeverity = "error" | "warning";
export type ImportRowAction = "create" | "fill" | "unchanged" | "skip_error";
export type ImportResponseStatus = "previewed" | "committed";

export interface ImportProblemGroup {
  code: string; // open set: new server codes need no frontend change
  severity: ImportSeverity;
  column: string | null; // canonical field name, never header text
  message: string;
  fix_hint: string;
  rows: number[]; // ascending, header = row 1
}

export interface ImportRowResult {
  row: number;
  action: ImportRowAction;
  record_id: string | null;
  matched_ids: string[];
  filled_fields: string[];
  error_codes: string[];
  warning_codes: string[];
  vin_dropped: boolean;
}

export interface ImportCounts {
  rows_total: number;
  created: number;
  filled: number;
  unchanged: number;
  skipped: number;
  warnings: number;
  errors: number;
}

export interface ImportResponse {
  job_id: string;
  entity: ImportEntity;
  dry_run: boolean;
  status: ImportResponseStatus;
  preview_token: string;
  ignored_columns: number;
  /** Python dict[int, str|None] → JSON object keys are STRINGS ("0","1",…): 0-based column position. */
  header_map: Record<string, string | null>;
  counts: ImportCounts;
  errors: ImportProblemGroup[]; // severity "error", sorted by first row
  warnings: ImportProblemGroup[];
  rows: ImportRowResult[]; // one per NON-BLANK data row, ascending; blank rows omitted but numbered
  created_ids: string[]; // confirm only; [] in preview
  filled_ids: string[];
}

/** Shape of HTTPException.detail from service.file_problem(). */
export interface ImportErrorDetail {
  code: string;
  message: string;
  fix_hint: string;
}

export const IMPORT_MAX_BYTES = 2 * 1024 * 1024; // constants.MAX_IMPORT_BYTES
export const IMPORT_MAX_ROWS = 5000; // constants.MAX_IMPORT_ROWS (non-blank data rows)
export const REPREVIEW_CODES = ["PREVIEW_STALE", "SKIP_ROWS_MISMATCH", "IMPORT_CONFLICT"] as const;
export const BUG_PATH_CODES = ["PREVIEW_TOKEN_REQUIRED", "INVALID_SKIP_ROWS", "INVALID_PREVIEW_TOKEN"] as const;

// Copy of constants.FIELD_LABELS; update both together. Unknown fields show their raw name.
export const FIELD_LABELS: Record<string, string> = {
  unit_number: "Unit number",
  vin: "VIN",
  year: "Year",
  make: "Make",
  model: "Model",
  status: "Status",
  notes: "Notes",
  first_name: "First name",
  last_name: "Last name",
  email: "Email",
  phone: "Phone",
  cdl_number: "CDL number",
  cdl_state: "CDL state",
};

export const ENTITY_NOUN = {
  trucks: ["truck", "trucks"],
  drivers: ["driver", "drivers"],
} as const;

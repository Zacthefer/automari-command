// Row rules shared by the parser (lazy) and the preview table (lazy panel). No papaparse here.

/** Same rule as the server's blank-row check: no cell has non-whitespace. */
export const isBlankRecord = (record: string[] | undefined) => !record || record.every((cell) => !cell.trim());

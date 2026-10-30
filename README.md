This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## CSV import

Carriers bring trucks and drivers in from a spreadsheet on the Trucks and Drivers pages (Upload CSV in the header, or the invite on an empty list).

**Flow:** pick a file → the browser reads it once and runs pre-checks → `POST /api/imports/{trucks|drivers}` with `dry_run=true` returns a read-only preview → the review panel shows the fleet diff, the server's problem groups and the rows → confirm sends the same bytes with `dry_run=false`, the `preview_token` and `skip_rows` (the preview's `skip_error` rows). A 409 (`PREVIEW_STALE`, `SKIP_ROWS_MISMATCH`, `IMPORT_CONFLICT`) or a lost confirm response re-runs the preview automatically; nothing is confirmed without a click. New rows glow cyan in the list after the import.

**Limits:** `.csv` files only, 2 MB, 5,000 non-blank data rows. Files over these are rejected in the browser before any request; the server enforces the same limits and more (columns, rate limits). Error text always comes from the server's `message` and `fix_hint`, so new server codes need no frontend change.

**Code:** `src/lib/api-imports.ts` (requests, `ImportApiError`, 60s timeout), `src/lib/csv-read.ts` (read, decode, parse), `src/components/imports/` (state machine hook, button, panel), `src/types/imports.ts` (mirrors the backend `schemas.py`; update both together).

**Bundle budget:** only the button and the state machine are in the page bundle. `motion` and the panel load with `next/dynamic` when an import starts; `papaparse` loads with `import()` when a file is picked (prefetched on hover/focus). Neither may appear in a route's initial JS.

**Privacy:** cell values, file bytes and the preview token live in React memory only, until the import is closed, a new file is picked, or the page is left. Never put them in `localStorage`/`sessionStorage`, never log them, and render cells as plain text (no `dangerouslySetInnerHTML`, no links).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

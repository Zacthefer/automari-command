/** Test Section is for local/dev demos only — never on production. */
export function isTestSectionEnabled() {
  if (process.env.NEXT_PUBLIC_ENABLE_TEST_SECTION === "0") return false;
  if (process.env.NEXT_PUBLIC_ENABLE_TEST_SECTION === "1") return true;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "development"
  );
}

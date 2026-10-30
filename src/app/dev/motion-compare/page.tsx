import { notFound } from "next/navigation";
import MotionCompareClient from "./motion-compare-client";

// TEMPORARY: side-by-side for Isaac's visual sign-off on the import loader.
// Delete src/app/dev before merge (job 005, AC34).

export default function MotionComparePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MotionCompareClient />;
}

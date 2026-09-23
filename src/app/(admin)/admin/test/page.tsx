import { redirect } from "next/navigation";
import { isTestSectionEnabled } from "@/lib/test-section";
import { TestSection } from "./test-section";

export default function AdminTestPage() {
  if (!isTestSectionEnabled()) {
    redirect("/dashboard");
  }

  return <TestSection />;
}

import type { User } from "@/types";
import { isTestSectionEnabled } from "@/lib/test-section";

/**
 * Who sees Integrations in the sidebar. Until Motive approves the app: Automari admins,
 * dev/preview builds, and the test logins listed in NEXT_PUBLIC_INTEGRATIONS_TEST_EMAILS
 * (comma-separated). To open it to every carrier, set NEXT_PUBLIC_INTEGRATIONS_ACCESS=all
 * on Vercel and redeploy. The page itself stays reachable, because Motive sends carriers
 * back to /integrations after they log in.
 */
export function canSeeIntegrations(user: Pick<User, "role" | "email"> | null): boolean {
  if (!user) return false;
  if (process.env.NEXT_PUBLIC_INTEGRATIONS_ACCESS === "all") return true;
  if (user.role === "admin" || isTestSectionEnabled()) return true;
  return testEmails().includes(user.email.trim().toLowerCase());
}

function testEmails(): string[] {
  return (process.env.NEXT_PUBLIC_INTEGRATIONS_TEST_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

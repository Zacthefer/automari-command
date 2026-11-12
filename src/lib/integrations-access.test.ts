import { afterEach, describe, expect, it, vi } from "vitest";
import { canSeeIntegrations } from "./integrations-access";

const carrier = { role: "carrier" as const, email: "owner@fleet.com" };

afterEach(() => vi.unstubAllEnvs());

function production() {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "production");
  vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_SECTION", "");
  vi.stubEnv("NEXT_PUBLIC_INTEGRATIONS_ACCESS", "");
  vi.stubEnv("NEXT_PUBLIC_INTEGRATIONS_TEST_EMAILS", "");
}

describe("canSeeIntegrations", () => {
  it("hides it from carriers in production by default", () => {
    production();
    expect(canSeeIntegrations(carrier)).toBe(false);
    expect(canSeeIntegrations(null)).toBe(false);
  });

  it("shows it to admins", () => {
    production();
    expect(canSeeIntegrations({ role: "admin", email: "admin@automari.ai" })).toBe(true);
  });

  it("shows it to listed test logins, ignoring case and spaces", () => {
    production();
    vi.stubEnv("NEXT_PUBLIC_INTEGRATIONS_TEST_EMAILS", "demo@automari.ai, Owner@Fleet.com ");
    expect(canSeeIntegrations(carrier)).toBe(true);
    expect(canSeeIntegrations({ role: "carrier", email: "other@fleet.com" })).toBe(false);
  });

  it("shows it on preview builds", () => {
    production();
    vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "preview");
    expect(canSeeIntegrations(carrier)).toBe(true);
  });

  it("shows it to every carrier once switched to all", () => {
    production();
    vi.stubEnv("NEXT_PUBLIC_INTEGRATIONS_ACCESS", "all");
    expect(canSeeIntegrations(carrier)).toBe(true);
  });
});

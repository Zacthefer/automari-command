"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/layout/brand-mark";
import { SignInOverlay } from "@/components/auth/signin-overlay";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, wakeApi } from "@/lib/api";

type Phase = "idle" | "waking" | "signing" | "routing";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    router.prefetch("/dashboard");

    (async () => {
      const ok = await wakeApi();
      if (!cancelled) setApiReady(ok);
    })();

    // Keep Render warm while the login page is open
    const keepAlive = window.setInterval(() => {
      void wakeApi();
    }, 4 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(keepAlive);
    };
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    setPhase("signing");
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    try {
      // Warm API in parallel with a short race so UI never feels frozen
      if (!apiReady) {
        setPhase("waking");
        const warmed = await Promise.race([
          wakeApi().then((ok) => ok),
          new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 8000)),
        ]);
        if (warmed) setApiReady(true);
      }

      setPhase("signing");
      await login(email, password);

      setPhase("routing");
      window.location.assign("/dashboard");
    } catch (err) {
      setPhase("idle");
      setLoading(false);
      setError(
        err instanceof Error ? err.message : "Invalid email or password"
      );
    }
  }

  const overlayCopy =
    phase === "waking"
      ? {
          status: "Waking command systems…",
          detail: "Backend may be cold-starting — usually under a minute.",
        }
      : phase === "routing"
        ? {
            status: "Launching dashboard…",
            detail: "Credentials verified. Loading your workspace.",
          }
        : {
            status: "Signing you in…",
            detail: "Securing your Automari.Ai session.",
          };

  return (
    <div className="flex min-h-screen bg-background">
      {loading ? (
        <SignInOverlay status={overlayCopy.status} detail={overlayCopy.detail} />
      ) : null}

      <div className="brand-surface relative hidden overflow-hidden lg:flex lg:w-[52%] flex-col justify-between p-12 text-white">
        <div className="brand-grid pointer-events-none absolute inset-0" />
        <div
          className="pointer-events-none absolute -left-24 top-1/4 h-80 w-80 rounded-full blur-3xl"
          style={{ background: "rgba(0,191,255,0.12)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl"
          style={{ background: "rgba(0,120,180,0.18)" }}
        />

        <div className="relative z-10">
          <BrandMark textClassName="text-white" size="md" />
        </div>

        <div className="relative z-10 max-w-xl space-y-8">
          <BrandMark size="lg" textClassName="text-white" className="scale-125 origin-left" />
          <div>
            <h2 className="text-[2.75rem] font-semibold leading-[1.1] tracking-[-0.04em] text-white">
              Freight operations,
              <br />
              <span className="text-[var(--brand-cyan)]">automated.</span>
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#8aa3bd]">
              BOL capture, invoicing, compliance, recruiting, and cost-per-mile
              — one command center for modern carriers.
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs tracking-wide text-[#5f7a96]">
          &copy; {new Date().getFullYear()} Automari.Ai · All rights reserved.
        </p>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 70% 20%, rgba(0,191,255,0.08), transparent 60%)",
          }}
        />
        <div className="relative z-10 w-full max-w-[400px] space-y-8">
          <div className="flex justify-center lg:hidden">
            <BrandMark size="md" textClassName="text-white" />
          </div>

          <div className="rounded-2xl border border-white/10 bg-[rgba(12,26,46,0.85)] p-8 shadow-[var(--shadow-elevated-3)] backdrop-blur-md">
            <div className="mb-8 space-y-2">
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                Sign in
              </h1>
              <p className="text-sm leading-relaxed text-[#8aa3bd]">
                Access your Automari.Ai command center.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} method="post" action="#" className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#c5d8eb]">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  disabled={loading}
                  placeholder="you@company.com"
                  className="h-11 border-white/10 bg-[#07111f]/70 text-white placeholder:text-[#5f7a96]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#c5d8eb]">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  placeholder="Enter your password"
                  className="h-11 border-white/10 bg-[#07111f]/70 text-white placeholder:text-[#5f7a96]"
                />
              </div>
              <Button
                type="submit"
                className="relative mt-2 h-11 w-full overflow-hidden bg-[var(--brand-cyan)] font-semibold text-[#001018] hover:bg-[var(--brand-cyan-soft)]"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="signin-dot h-1.5 w-1.5 rounded-full bg-[#001018]" />
                    <span className="signin-dot h-1.5 w-1.5 rounded-full bg-[#001018]" style={{ animationDelay: "0.12s" }} />
                    <span className="signin-dot h-1.5 w-1.5 rounded-full bg-[#001018]" style={{ animationDelay: "0.24s" }} />
                    <span>Signing in…</span>
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

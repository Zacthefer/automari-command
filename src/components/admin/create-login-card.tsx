"use client";

import { useState, type FormEvent } from "react";
import { Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createCarrierLogin } from "@/lib/api";
import { generatePassword } from "@/lib/password";

export function CreateLoginCard({
  tenantId,
  defaultEmail,
  defaultName,
}: {
  tenantId: string;
  defaultEmail: string;
  defaultName: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    // The backend matches emails exactly, so store them the way people type them at sign-in
    const email = (form.get("login_email") as string).trim().toLowerCase();
    const name = (form.get("login_name") as string).trim();
    // "required" lets a name of only spaces through
    if (!name) {
      setError("Enter a name for this login.");
      setLoading(false);
      return;
    }
    const password = generatePassword();

    try {
      await createCarrierLogin({ email, password, name, tenant_id: tenantId });
      setCreated({ email, password });
      setCopyState("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create login");
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword() {
    if (!created) return;
    // navigator.clipboard is missing outside secure contexts, so a missing API counts as a failed copy too
    try {
      await navigator.clipboard.writeText(created.password);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4" />
          Logins
        </CardTitle>
      </CardHeader>
      <CardContent>
        {created ? (
          <div className="space-y-4">
            <p className="text-sm text-foreground">
              Login created for <span className="font-medium">{created.email}</span>.
            </p>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-subtle-foreground">Password</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="select-all rounded bg-slate-100 px-3 py-1.5 text-sm font-mono text-slate-700">
                  {created.password}
                </code>
                <Button variant="outline" size="sm" onClick={copyPassword}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {copyState === "copied" ? "Copied" : "Copy"}
                </Button>
              </div>
              {copyState === "failed" && (
                <p className="mt-1 text-xs text-red-700">Couldn&apos;t copy. Select the password and copy it by hand.</p>
              )}
            </div>
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Save this password now. It won&apos;t be shown again, and there&apos;s no reset yet.
            </div>
            <Button type="button" onClick={() => setCreated(null)}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Give someone at this company a sign-in. We&apos;ll create a strong password you can send them.
            </p>
            {error && (
              <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="login_email">Email</Label>
                <Input
                  id="login_email"
                  name="login_email"
                  type="email"
                  required
                  defaultValue={defaultEmail}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login_name">Name</Label>
                <Input
                  id="login_name"
                  name="login_name"
                  required
                  defaultValue={defaultName}
                />
              </div>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create login"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

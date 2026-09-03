"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createApplicant } from "@/lib/api";

const cdlClasses = [
  { value: "A", label: "Class A" },
  { value: "B", label: "Class B" },
  { value: "C", label: "Class C" },
];

const endorsementOptions = [
  { value: "hazmat", label: "Hazmat" },
  { value: "tanker", label: "Tanker" },
  { value: "doubles_triples", label: "Doubles/Triples" },
  { value: "passenger", label: "Passenger" },
  { value: "school_bus", label: "School Bus" },
];

export default function NewApplicantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndorsements, setSelectedEndorsements] = useState<string[]>(
    []
  );

  function toggleEndorsement(value: string) {
    setSelectedEndorsements((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      await createApplicant({
        name: form.get("name") as string,
        phone: (form.get("phone") as string) || undefined,
        email: (form.get("email") as string) || undefined,
        cdl_class: (form.get("cdl_class") as string) || undefined,
        endorsements:
          selectedEndorsements.length > 0 ? selectedEndorsements : undefined,
        years_experience: form.get("years_experience")
          ? Number(form.get("years_experience"))
          : undefined,
        accident_history: (form.get("accident_history") as string) || undefined,
        preferred_routes: (form.get("preferred_routes") as string) || undefined,
        availability: (form.get("availability") as string) || undefined,
        notes: (form.get("notes") as string) || undefined,
      });
      router.push("/recruiting");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add applicant"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/recruiting"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Add Applicant
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="border border-white/10 bg-card shadow-[var(--shadow-elevated-1)]">
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" required placeholder="John Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" placeholder="561-555-0100" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john@example.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-white/10 bg-card shadow-[var(--shadow-elevated-1)]">
          <CardHeader>
            <CardTitle className="text-base">Qualifications</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cdl_class">CDL Class</Label>
              <select
                id="cdl_class"
                name="cdl_class"
                className="flex h-10 w-full rounded-md border border-white/10 bg-[#07111f]/70 px-3 text-foreground py-2 text-sm"
              >
                <option value="">Select class...</option>
                {cdlClasses.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="years_experience">Years Experience</Label>
              <Input
                id="years_experience"
                name="years_experience"
                type="number"
                min="0"
                placeholder="5"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Endorsements</Label>
              <div className="flex flex-wrap gap-2">
                {endorsementOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleEndorsement(opt.value)}
                    className={`rounded-full px-3 py-1 text-sm transition-colors ${
                      selectedEndorsements.includes(opt.value)
                        ? "bg-[var(--brand-cyan)] text-[#001018]"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="preferred_routes">Preferred Routes</Label>
              <Input
                id="preferred_routes"
                name="preferred_routes"
                placeholder="e.g. FL-GA corridor, regional OTR"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="availability">Availability</Label>
              <Input
                id="availability"
                name="availability"
                placeholder="e.g. Available immediately"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="accident_history">Accident History</Label>
              <Input
                id="accident_history"
                name="accident_history"
                placeholder="e.g. Clean record, 1 minor incident 2022"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Internal notes about this applicant"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Applicant"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

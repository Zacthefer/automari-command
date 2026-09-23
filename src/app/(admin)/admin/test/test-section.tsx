"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  downloadInvoicePdf,
  getBol,
  getComplianceSummary,
  getDashboardStats,
  getInvoices,
  updateInvoice,
  uploadBol,
} from "@/lib/api";
import { getFleetOverview, getTrucks } from "@/lib/api-cpm";

type StepState = "wait" | "run" | "pass" | "fail";

type Step = {
  label: string;
  state: StepState;
  detail?: string;
};

type Lane = {
  id: string;
  label: string;
  summary: string;
  image: string;
  expect: {
    shipper: string;
    consignee: string;
    pro: string;
    weight: number;
    commodity: string;
  };
};

const LANES: Lane[] = [
  {
    id: "produce",
    label: "Produce",
    summary: "Fresh Farms, Jacksonville, FL → Harbor Grocers, Savannah, GA",
    image: "/test-docs/lane-produce.png",
    expect: {
      shipper: "Fresh Farms",
      consignee: "Harbor Grocers",
      pro: "PRO-FL-GA-2401",
      weight: 42000,
      commodity: "Produce",
    },
  },
  {
    id: "retail",
    label: "Retail",
    summary: "Sunbelt Goods, Tampa, FL → Northline Warehouse, Atlanta, GA",
    image: "/test-docs/lane-retail.png",
    expect: {
      shipper: "Sunbelt Goods",
      consignee: "Northline",
      pro: "PRO-FL-GA-2402",
      weight: 28500,
      commodity: "Retail",
    },
  },
  {
    id: "building",
    label: "Building materials",
    summary: "Gulf Timber, Miami, FL → Ridge Supply, Charlotte, NC",
    image: "/test-docs/lane-building.png",
    expect: {
      shipper: "Gulf Timber",
      consignee: "Ridge Supply",
      pro: "PRO-FL-NC-2403",
      weight: 38600,
      commodity: "Building",
    },
  },
];

const TRUCKS = [
  { id: "1042", label: "Unit 1042 — Freightliner Cascadia" },
  { id: "1087", label: "Unit 1087 — Peterbilt 579" },
  { id: "1103", label: "Unit 1103 — Kenworth T680" },
];

const COMPANY_RATE = 1850;

function money(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function problem(err: unknown) {
  return err instanceof Error && err.message
    ? err.message
    : "This step failed.";
}

function includes(value: string | null | undefined, expected: string) {
  return (value || "").toLowerCase().includes(expected.toLowerCase());
}

function mark(steps: Step[], index: number, state: StepState, detail?: string): Step[] {
  return steps.map((step, i) =>
    i === index ? { ...step, state, detail: detail ?? step.detail } : step
  );
}

function asList<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export function TestSection() {
  const [laneId, setLaneId] = useState(LANES[0].id);
  const [truckId, setTruckId] = useState(TRUCKS[0].id);
  const [useCompanyRate, setUseCompanyRate] = useState(true);
  const [customRate, setCustomRate] = useState(String(COMPANY_RATE));
  const [accessorial, setAccessorial] = useState("0");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "running" | "passed" | "failed">(
    "idle"
  );
  const [steps, setSteps] = useState<Step[]>([]);
  const [sideNotes, setSideNotes] = useState<string[]>([]);

  const lane = useMemo(
    () => LANES.find((item) => item.id === laneId) ?? LANES[0],
    [laneId]
  );
  const truck = useMemo(
    () => TRUCKS.find((item) => item.id === truckId) ?? TRUCKS[0],
    [truckId]
  );
  const rate = useCompanyRate ? COMPANY_RATE : Number(customRate) || 0;
  const extra = Number(accessorial) || 0;

  async function runLoad() {
    setBusy(true);
    setStatus("running");
    setSideNotes([]);
    let current: Step[] = [
      { label: "Morning glance", state: "run" },
      { label: `Load the ${lane.label} bill`, state: "wait" },
      { label: "Upload the Bill of Lading", state: "wait" },
      { label: `Shipper is ${lane.expect.shipper}`, state: "wait" },
      { label: `Consignee is ${lane.expect.consignee}`, state: "wait" },
      { label: `PRO is ${lane.expect.pro}`, state: "wait" },
      { label: `Weight is ${lane.expect.weight.toLocaleString()} lbs`, state: "wait" },
      { label: "Set the price on the invoice", state: "wait" },
      { label: "Build the invoice PDF", state: "wait" },
    ];
    setSteps(current);

    try {
      const stats = await getDashboardStats();
      current = mark(
        current,
        0,
        "pass",
        `${stats.bols_total} bills · ${money(stats.total_outstanding)} outstanding · ${stats.compliance_expired} expired compliance docs · ${money(stats.fleet_avg_cpm)} per mile`
      );
      current = mark(current, 1, "run");
      setSteps([...current]);

      const fileResponse = await fetch(lane.image);
      if (!fileResponse.ok) {
        throw new Error("The sample Bill of Lading file did not load.");
      }
      const file = new File(
        [await fileResponse.blob()],
        `${lane.id}-bill-of-lading.png`,
        { type: "image/png" }
      );
      current = mark(
        current,
        1,
        "pass",
        `${lane.summary}. Truck ${truck.label}.`
      );
      current = mark(current, 2, "run");
      setSteps([...current]);

      const uploaded = await uploadBol(file);
      current = mark(current, 2, "pass", "The office has the paperwork.");
      setSteps([...current]);

      const bol = await getBol(uploaded.id);
      current = mark(
        current,
        3,
        includes(bol.shipper_name, lane.expect.shipper) ? "pass" : "fail",
        bol.shipper_name || "No shipper was read."
      );
      current = mark(
        current,
        4,
        includes(bol.consignee_name, lane.expect.consignee) ? "pass" : "fail",
        bol.consignee_name || "No consignee was read."
      );
      current = mark(
        current,
        5,
        includes(bol.pro_number, lane.expect.pro) ? "pass" : "fail",
        bol.pro_number || "No PRO number was read."
      );
      current = mark(
        current,
        6,
        bol.weight === lane.expect.weight ? "pass" : "fail",
        bol.weight ? `${bol.weight} lbs` : "No weight was read."
      );
      current = mark(current, 7, "run");
      setSteps([...current]);

      const invoices = asList(await getInvoices({ limit: 30 }));
      const invoice = invoices.find((item) => item.bol_id === bol.id);
      if (!invoice) {
        current = mark(
          current,
          7,
          "fail",
          "No invoice was created from this bill."
        );
        setSteps([...current]);
        setStatus("failed");
        return;
      }

      const priced = await updateInvoice(invoice.id, {
        rate,
        accessorial_charges: extra,
      });
      current = mark(
        current,
        7,
        "pass",
        `${priced.invoice_number}: ${money(priced.rate)} rate${extra > 0 ? ` + ${money(extra)} waiting time` : ""} = ${money(priced.total_amount)}.`
      );
      current = mark(current, 8, "run");
      setSteps([...current]);

      const pdf = await downloadInvoicePdf(priced.id);
      const url = URL.createObjectURL(pdf);
      const ready = pdf.size > 500;
      current = mark(
        current,
        8,
        ready ? "pass" : "fail",
        ready
          ? `${priced.invoice_number}.pdf|${url}`
          : "The PDF file was empty."
      );
      current.push({
        label: "Open the records",
        state: ready ? "pass" : "fail",
        detail: `Bill: /bols/${bol.id} · Invoice: /invoices/${priced.id}`,
      });
      setSteps([...current]);

      const notes: string[] = [];
      try {
        const compliance = await getComplianceSummary();
        notes.push(
          `Compliance: ${compliance.expired} expired, ${compliance.expiring_soon} expiring soon.`
        );
      } catch {
        notes.push("Compliance check was unavailable.");
      }
      try {
        const [fleet, trucks] = await Promise.all([
          getFleetOverview(),
          getTrucks(),
        ]);
        const units = asList(trucks)
          .map((item) => item.unit_number)
          .join(", ");
        notes.push(
          `Cost per mile: ${money(fleet.avg_cost_per_mile)} · trucks ${units || "none"}.`
        );
      } catch {
        notes.push("Cost per mile check was unavailable.");
      }
      setSideNotes(notes);

      const failed = current.some((step) => step.state === "fail");
      setStatus(failed ? "failed" : "passed");
    } catch (err) {
      const failedSteps =
        current.length > 0
          ? current.map((step) =>
              step.state === "run"
                ? { ...step, state: "fail" as const, detail: problem(err) }
                : step
            )
          : [{ label: "Run this load", state: "fail" as const, detail: problem(err) }];
      setSteps(failedSteps);
      setStatus("failed");
    } finally {
      setBusy(false);
    }
  }

  const badge =
    status === "passed"
      ? "Passed"
      : status === "failed"
        ? "Failed"
        : status === "running"
          ? "Working"
          : "Not run";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Test Section"
        description="Run one load the way an office would: pick the lane, truck, and price. The paper comes in, the fields are checked, and the invoice PDF is ready. Nothing here sends an email."
      />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle>Run a load</CardTitle>
            <span
              className={
                status === "passed"
                  ? "rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300"
                  : status === "failed"
                    ? "rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-300"
                    : "rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-[#8aa3bd]"
              }
            >
              {badge}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Lane</Label>
            <div className="grid gap-2">
              {LANES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLaneId(item.id)}
                  className={
                    laneId === item.id
                      ? "rounded-lg border border-[var(--brand-cyan)] bg-[var(--brand-cyan-dim)] px-3 py-3 text-left"
                      : "rounded-lg border border-white/10 px-3 py-3 text-left hover:bg-white/5"
                  }
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-xs text-[#8aa3bd]">{item.summary}</p>
                </button>
              ))}
            </div>
            <a
              href={lane.image}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm text-[var(--brand-cyan)] underline"
            >
              Open this Bill of Lading
            </a>
          </div>

          <div className="space-y-2">
            <Label htmlFor="truck">Truck</Label>
            <select
              id="truck"
              value={truckId}
              onChange={(e) => setTruckId(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
            >
              {TRUCKS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Price</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={useCompanyRate}
                    onChange={() => setUseCompanyRate(true)}
                  />
                  Company rate ({money(COMPANY_RATE)})
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={!useCompanyRate}
                    onChange={() => setUseCompanyRate(false)}
                  />
                  Custom rate
                </label>
                {!useCompanyRate ? (
                  <Input
                    type="number"
                    min={0}
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                  />
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accessorial">Waiting time / extra</Label>
              <Input
                id="accessorial"
                type="number"
                min={0}
                value={accessorial}
                onChange={(e) => setAccessorial(e.target.value)}
              />
              <p className="text-xs text-[#8aa3bd]">
                Total will be {money(rate + extra)}.
              </p>
            </div>
          </div>

          <Button onClick={runLoad} disabled={busy}>
            {busy ? "Working…" : "Run this load"}
          </Button>

          {steps.length > 0 ? (
            <ul className="space-y-2 border-t border-white/10 pt-4">
              {steps.map((step) => (
                <li key={step.label} className="text-sm">
                  <div className="flex items-start gap-2">
                    <StepMark state={step.state} />
                    <div>
                      <p>{step.label}</p>
                      <StepDetail detail={step.detail} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}

          {sideNotes.length > 0 ? (
            <div className="space-y-2 border-t border-white/10 pt-4 text-sm text-[#8aa3bd]">
              <p className="font-medium text-foreground">If they ask what else you watch</p>
              {sideNotes.map((note) => (
                <p key={note}>{note}</p>
              ))}
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/compliance" className="text-[var(--brand-cyan)] underline">
                  Open Compliance
                </Link>
                <Link href="/cost-per-mile" className="text-[var(--brand-cyan)] underline">
                  Open Cost per Mile
                </Link>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function StepMark({ state }: { state: StepState }) {
  if (state === "pass") {
    return <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />;
  }
  if (state === "fail") {
    return <X className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />;
  }
  return <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#8aa3bd]" />;
}

function StepDetail({ detail }: { detail?: string }) {
  if (!detail) return null;
  const splitAt = detail.indexOf("|");
  if (splitAt > 0 && detail.slice(splitAt + 1).startsWith("blob:")) {
    const filename = detail.slice(0, splitAt);
    const url = detail.slice(splitAt + 1);
    return (
      <a
        href={url}
        download={filename}
        className="mt-1 inline-block text-[var(--brand-cyan)] underline"
      >
        Download {filename}
      </a>
    );
  }
  if (detail.startsWith("Bill:")) {
    const bill = detail.match(/\/bols\/[a-z0-9-]+/i)?.[0];
    const invoice = detail.match(/\/invoices\/[a-z0-9-]+/i)?.[0];
    return (
      <p className="mt-1 flex flex-wrap gap-3">
        {bill ? (
          <Link href={bill} className="text-[var(--brand-cyan)] underline">
            Open this Bill of Lading
          </Link>
        ) : null}
        {invoice ? (
          <Link href={invoice} className="text-[var(--brand-cyan)] underline">
            Open this invoice
          </Link>
        ) : null}
      </p>
    );
  }
  return <p className="mt-0.5 text-[#8aa3bd]">{detail}</p>;
}

"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExpenseCategoryBreakdown } from "@/types/cost-per-mile";

interface ExpenseDonutChartProps {
  breakdown: ExpenseCategoryBreakdown[];
  totalExpenses: number;
}

const COLORS = [
  "#00bfff", // brand cyan
  "#38bdf8", // sky
  "#60a5fa", // blue-400
  "#93c5fd", // blue-300
  "#1d4ed8", // blue-700
  "#1e40af", // blue-800
  "#6366f1", // indigo-500
  "#818cf8", // indigo-400
  "#a78bfa", // violet-400
];

const categoryLabels: Record<string, string> = {
  fuel: "Fuel",
  maintenance: "Maintenance",
  insurance: "Insurance",
  truck_payment: "Truck Payment",
  tolls: "Tolls",
  tires: "Tires",
  permits: "Permits",
  driver_pay: "Driver Pay",
  other: "Other",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ExpenseDonutChart({
  breakdown,
  totalExpenses,
}: ExpenseDonutChartProps) {
  const data = breakdown.map((b) => ({
    name: categoryLabels[b.category] || b.category,
    value: b.total,
    percentage: b.percentage,
  }));

  return (
    <Card className="rounded-2xl border border-white/10 bg-card shadow-[var(--shadow-elevated-1)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Expense Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-sm text-slate-400">No expenses recorded</p>
          </div>
        ) : (
          <div className="relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((_, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: 12,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    fontSize: 13,
                  }}
                  formatter={(value) => [
                    formatCurrency(Number(value)),
                    "Amount",
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ paddingBottom: 40 }}>
              <div className="text-center">
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-lg font-semibold text-foreground tabular-nums">
                  {formatCurrency(totalExpenses)}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

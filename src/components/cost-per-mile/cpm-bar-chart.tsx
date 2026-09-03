"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CpmGroupRow } from "@/types/cost-per-mile";

interface CpmBarChartProps {
  rows: CpmGroupRow[];
  fleetAvgCpm: number;
  title?: string;
}

export function CpmBarChart({
  rows,
  fleetAvgCpm,
  title = "Cost Per Mile by Truck",
}: CpmBarChartProps) {
  const data = rows.map((row) => ({
    name: row.group_key,
    cpm: row.cost_per_mile,
    rpm: row.revenue_per_mile,
    profit: row.profit_per_mile,
  }));

  return (
    <Card className="rounded-2xl border border-white/10 bg-card shadow-[var(--shadow-elevated-1)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center">
            <p className="text-sm text-slate-400">No data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e2e8f0"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={{ stroke: "#e2e8f0" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v.toFixed(2)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "none",
                  borderRadius: 12,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  fontSize: 13,
                }}
                formatter={(value, name) => [
                  `$${Number(value).toFixed(4)}`,
                  name === "cpm"
                    ? "Cost/Mile"
                    : name === "rpm"
                      ? "Revenue/Mile"
                      : "Profit/Mile",
                ]}
              />
              <Bar dataKey="cpm" radius={[6, 6, 0, 0]} maxBarSize={48}>
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={
                      entry.cpm <= fleetAvgCpm ? "#22c55e" : "#f59e0b"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

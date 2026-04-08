"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { ExperimentTimeSeriesPoint } from "@/lib/types";

type Metric = "visitors" | "conversions" | "revenue" | "addToCart" | "recommendationClicks";

const options: Array<{ key: Metric; label: string }> = [
  { key: "visitors", label: "Visitors" },
  { key: "conversions", label: "Conversions" },
  { key: "revenue", label: "Revenue" },
  { key: "addToCart", label: "Add to cart" },
  { key: "recommendationClicks", label: "Recommendation clicks" }
];

export function GlobalKpiChart({ timeline }: { timeline: ExperimentTimeSeriesPoint[] }) {
  const [metric, setMetric] = useState<Metric>("conversions");

  return (
    <Card className="bg-white">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Global trendline</p>
          <p className="text-sm text-muted-foreground">Daily evolution across all tracked experiments in the current analytics window.</p>
        </div>
        <select
          className="h-10 rounded-full border border-border bg-white px-4 text-sm"
          value={metric}
          onChange={(event) => setMetric(event.target.value as Metric)}
        >
          {options.map((option) => (
            <option key={option.key} value={option.key}>{option.label}</option>
          ))}
        </select>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={timeline.map((point) => ({ ...point, label: point.date.slice(5) }))}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#6b6b63" />
            <YAxis stroke="#6b6b63" />
            <Tooltip />
            <Line type="monotone" dataKey={metric} stroke="#135c43" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

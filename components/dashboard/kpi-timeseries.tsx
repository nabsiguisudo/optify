"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { ExperimentStats, ExperimentTimeSeriesPoint } from "@/lib/types";

type RangePreset = "7d" | "30d" | "custom";
type MetricKey = keyof Pick<
  ExperimentTimeSeriesPoint,
  | "visitors"
  | "sessions"
  | "pageViews"
  | "clicks"
  | "ctaClicks"
  | "conversions"
  | "addToCart"
  | "checkoutStarts"
  | "purchases"
  | "revenue"
  | "recommendationClicks"
  | "rageClicks"
  | "formErrors"
  | "jsErrors"
>;

const metricOptions: Array<{ key: MetricKey; label: string }> = [
  { key: "visitors", label: "Visitors" },
  { key: "sessions", label: "Sessions" },
  { key: "pageViews", label: "Page views" },
  { key: "conversions", label: "Conversions" },
  { key: "revenue", label: "Revenue" },
  { key: "addToCart", label: "Add to cart" },
  { key: "checkoutStarts", label: "Checkout starts" },
  { key: "purchases", label: "Purchases" },
  { key: "recommendationClicks", label: "Recommendation clicks" },
  { key: "rageClicks", label: "Rage clicks" },
  { key: "formErrors", label: "Form errors" },
  { key: "jsErrors", label: "JS errors" }
];

export function KpiTimeSeries({
  experimentId,
  initialStats
}: {
  experimentId: string;
  initialStats: ExperimentStats;
}) {
  const [stats, setStats] = useState(initialStats);
  const [metric, setMetric] = useState<MetricKey>("conversions");
  const [preset, setPreset] = useState<RangePreset>("7d");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (preset === "7d") params.set("days", "7");
      if (preset === "30d") params.set("days", "30");
      if (preset === "custom") {
        if (from) params.set("from", from);
        if (to) params.set("to", to);
      }

      const response = await fetch(`/api/experiments/${experimentId}/stats?${params.toString()}`, {
        signal: controller.signal
      });
      const next = await response.json();
      if (response.ok) {
        setStats(next);
      }
      setLoading(false);
    }

    load().catch(() => setLoading(false));
    return () => controller.abort();
  }, [experimentId, preset, from, to]);

  const chartData = useMemo(
    () =>
      stats.timeline.map((point) => ({
        ...point,
        label: point.date.slice(5)
      })),
    [stats.timeline]
  );

  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Tracked data over time</p>
          <p className="text-sm text-muted-foreground">Daily evolution of the selected KPI with 7-day default, 30-day zoom, or a custom period.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="h-10 rounded-full border border-border bg-white px-4 text-sm"
            value={metric}
            onChange={(event) => setMetric(event.target.value as MetricKey)}
          >
            {metricOptions.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
          <button type="button" className={`rounded-full border px-4 py-2 text-sm ${preset === "7d" ? "border-primary bg-primary text-white" : "border-border bg-white"}`} onClick={() => setPreset("7d")}>
            7d
          </button>
          <button type="button" className={`rounded-full border px-4 py-2 text-sm ${preset === "30d" ? "border-primary bg-primary text-white" : "border-border bg-white"}`} onClick={() => setPreset("30d")}>
            30d
          </button>
          <button type="button" className={`rounded-full border px-4 py-2 text-sm ${preset === "custom" ? "border-primary bg-primary text-white" : "border-border bg-white"}`} onClick={() => setPreset("custom")}>
            Custom
          </button>
        </div>
      </div>

      {preset === "custom" ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <input className="h-10 rounded-2xl border border-border px-4 text-sm" type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input className="h-10 rounded-2xl border border-border px-4 text-sm" type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        </div>
      ) : null}

      <div className="mt-6 h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" stroke="#6b6b63" />
            <YAxis stroke="#6b6b63" />
            <Tooltip />
            <Line type="monotone" dataKey={metric} stroke="#135c43" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        {loading ? "Updating chart..." : `Showing ${metricOptions.find((option) => option.key === metric)?.label ?? metric} by day.`}
      </div>
    </Card>
  );
}

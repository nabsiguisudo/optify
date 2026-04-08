"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import type { ExperimentTimeSeriesPoint } from "@/lib/types";

type Metric = "sessions" | "visitors" | "pageViews" | "clicks" | "addToCart" | "purchases" | "revenue";

const options: Array<{ key: Metric; label: string; color: string }> = [
  { key: "sessions", label: "Sessions", color: "#ff5864" },
  { key: "visitors", label: "Visiteurs", color: "#7a6ff0" },
  { key: "pageViews", label: "Pages vues", color: "#ff9c59" },
  { key: "clicks", label: "Clics", color: "#f26a8d" },
  { key: "addToCart", label: "Ajouts au panier", color: "#ff7d6b" },
  { key: "purchases", label: "Achats", color: "#5f73ff" },
  { key: "revenue", label: "Chiffre d'affaires", color: "#db4f7f" }
];

function formatValue(metric: Metric, value: number) {
  if (metric === "revenue") {
    return `${Math.round(value).toLocaleString("fr-FR")} $`;
  }
  return value.toLocaleString("fr-FR");
}

export function GlobalKpiChart({ timeline }: { timeline: ExperimentTimeSeriesPoint[] }) {
  const [metric, setMetric] = useState<Metric>("sessions");
  const activeMetric = options.find((option) => option.key === metric) ?? options[0];
  const points = useMemo(
    () => timeline.map((point) => ({ ...point, label: new Date(point.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) })),
    [timeline]
  );
  const total = points.reduce((sum, point) => sum + point[metric], 0);
  const hasData = points.some((point) => point[metric] > 0);

  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Evolution du trafic</p>
          <p className="mt-1 text-sm text-muted-foreground">Une lecture simple de la tendance sur la periode observee.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full bg-secondary px-4 py-2 text-sm">
            Total: <span className="font-semibold">{formatValue(metric, total)}</span>
          </div>
          <select
            className="h-10 rounded-full border border-border bg-white px-4 text-sm outline-none"
            value={metric}
            onChange={(event) => setMetric(event.target.value as Metric)}
          >
            {options.map((option) => (
              <option key={option.key} value={option.key}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5 h-80 w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points}>
              <CartesianGrid vertical={false} stroke="#ece7f7" strokeDasharray="4 4" />
              <XAxis dataKey="label" stroke="#7b748c" tickLine={false} axisLine={false} />
              <YAxis stroke="#7b748c" tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => formatValue(metric, Number(value))}
                contentStyle={{
                  borderRadius: 18,
                  border: "1px solid #f0e8f6",
                  boxShadow: "0 18px 42px rgba(61, 43, 91, 0.12)"
                }}
              />
              <Line type="monotone" dataKey={metric} stroke={activeMetric.color} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-secondary/35 text-sm text-muted-foreground">
            Pas encore assez de donnees pour afficher une courbe utile.
          </div>
        )}
      </div>
    </Card>
  );
}

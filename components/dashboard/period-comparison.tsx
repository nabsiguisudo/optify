"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PeriodComparison, PeriodMetricComparison } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

function formatMetricValue(item: PeriodMetricComparison, asPercent: boolean) {
  if (asPercent) {
    return formatPercent(item.current);
  }
  return item.current.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

function formatPreviousValue(item: PeriodMetricComparison, asPercent: boolean) {
  if (asPercent) {
    return formatPercent(item.previous);
  }
  return item.previous.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

function MetricDelta({
  label,
  item,
  asPercent = false
}: {
  label: string;
  item: PeriodMetricComparison;
  asPercent?: boolean;
}) {
  const isPositive = item.relativeDelta > 0;
  const isNegative = item.relativeDelta < 0;
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;
  const tone = isPositive
    ? "bg-[#ffe8ec] text-[#d64056]"
    : isNegative
      ? "bg-[#fff1dc] text-[#af5b11]"
      : "bg-secondary text-secondary-foreground";

  return (
    <div className="rounded-[1.2rem] border border-border bg-[#fcfbff] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${tone}`}>
          <Icon className="h-3.5 w-3.5" />
          {formatPercent(Math.abs(item.relativeDelta))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <p className="text-2xl font-semibold">{formatMetricValue(item, asPercent)}</p>
        <p className="text-sm text-muted-foreground">Avant: {formatPreviousValue(item, asPercent)}</p>
      </div>
    </div>
  );
}

export function PeriodComparisonCard({ comparison }: { comparison: PeriodComparison }) {
  const metrics = [
    { label: "Visiteurs", item: comparison.metrics.visitors },
    { label: "Conversions", item: comparison.metrics.conversions },
    { label: "Chiffre d'affaires", item: comparison.metrics.revenue },
    { label: "Ajouts au panier", item: comparison.metrics.addToCart },
    { label: "CTR des recos", item: comparison.metrics.recommendationCtr, asPercent: true }
  ];

  const hasData = metrics.some(({ item }) => item.current > 0 || item.previous > 0);

  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Comparaison de période</p>
          <p className="mt-1 text-sm text-muted-foreground">Pour voir rapidement si le trafic et le commerce progressent par rapport à la période précédente.</p>
        </div>
        <div className="rounded-full bg-secondary px-4 py-2 text-sm">
          Période observée vs période précédente
        </div>
      </div>

      {hasData ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {metrics.map((metric) => (
            <MetricDelta key={metric.label} label={metric.label} item={metric.item} asPercent={metric.asPercent} />
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-[1.4rem] border border-dashed border-border bg-secondary/30 px-5 py-6">
          <p className="font-semibold">Pas encore de comparaison exploitable</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Optify ne voit pas encore assez d'événements pour comparer deux périodes. Si tu as déjà navigué sur la boutique, le snippet ou le pixel pointe peut-être vers un autre projet.
          </p>
        </div>
      )}
    </Card>
  );
}

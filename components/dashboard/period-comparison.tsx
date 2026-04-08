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
    <div className="rounded-[1.5rem] border border-border bg-white p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-2xl font-semibold">{formatMetricValue(item, asPercent)}</p>
        <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${tone}`}>
          <Icon className="h-4 w-4" />
          {formatPercent(Math.abs(item.relativeDelta))}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Periode precedente: {formatPreviousValue(item, asPercent)}</p>
    </div>
  );
}

export function PeriodComparisonCard({ comparison }: { comparison: PeriodComparison }) {
  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Comparaison de periode</p>
          <p className="mt-1 text-sm text-muted-foreground">Pour voir si le trafic et le commerce montent, stagnent ou ralentissent.</p>
        </div>
        <div className="rounded-full bg-secondary px-4 py-2 text-sm">
          Periode observee vs periode precedente
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <MetricDelta label="Visiteurs" item={comparison.metrics.visitors} />
        <MetricDelta label="Conversions" item={comparison.metrics.conversions} />
        <MetricDelta label="Chiffre d'affaires" item={comparison.metrics.revenue} />
        <MetricDelta label="Ajouts au panier" item={comparison.metrics.addToCart} />
        <MetricDelta label="CTR des recos" item={comparison.metrics.recommendationCtr} asPercent />
      </div>
    </Card>
  );
}

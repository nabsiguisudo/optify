"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PeriodComparison, PeriodMetricComparison } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

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
  const value = asPercent ? formatPercent(item.current) : item.current.toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <div className="min-w-0 rounded-3xl border border-border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-2xl font-semibold leading-none">{value}</p>
        <div className={`inline-flex w-fit items-center gap-1 rounded-full px-3 py-1 text-sm ${isPositive ? "bg-primary/10 text-primary" : isNegative ? "bg-destructive/10 text-destructive" : "bg-secondary text-secondary-foreground"}`}>
          <Icon className="h-4 w-4" />
          {formatPercent(Math.abs(item.relativeDelta))}
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">Previous: {asPercent ? formatPercent(item.previous) : item.previous.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
    </div>
  );
}

export function PeriodComparisonCard({ comparison }: { comparison: PeriodComparison }) {
  return (
    <Card className="bg-white">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Period comparison</p>
          <p className="text-sm text-muted-foreground">Compare this period vs the previous one across the key events that matter for growth and revenue.</p>
        </div>
        <div className="rounded-full bg-secondary px-4 py-2 text-sm">
          {comparison.currentLabel} vs {comparison.previousLabel}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricDelta label="Visitors" item={comparison.metrics.visitors} />
        <MetricDelta label="Conversions" item={comparison.metrics.conversions} />
        <MetricDelta label="Revenue" item={comparison.metrics.revenue} />
        <MetricDelta label="Add to cart" item={comparison.metrics.addToCart} />
        <MetricDelta label="Recommendation CTR" item={comparison.metrics.recommendationCtr} asPercent />
      </div>
    </Card>
  );
}

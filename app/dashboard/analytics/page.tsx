import { FunnelOverviewCard } from "@/components/dashboard/funnel-overview";
import { GlobalKpiChart } from "@/components/dashboard/global-kpi-chart";
import { PeriodComparisonCard } from "@/components/dashboard/period-comparison";
import { SegmentationPanel } from "@/components/dashboard/segmentation-panel";
import { StatsChart } from "@/components/dashboard/stats-chart";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAllExperiments, getExperimentStats, getGlobalAnalytics } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  resolveLocale((await searchParams).lang);
  const experiments = await getAllExperiments();
  const runningExperiment = experiments.find((experiment) => experiment.status === "running");
  const [globalAnalytics, runningStats] = await Promise.all([
    getGlobalAnalytics(),
    runningExperiment ? getExperimentStats(runningExperiment.id) : Promise.resolve(undefined)
  ]);

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <h1 className="text-3xl font-semibold">Analytics</h1>
        <p className="mt-2 text-muted-foreground">This page owns the measurement layer: business impact, temporal comparison, funnels, segmentation, and experiment evidence quality.</p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <PeriodComparisonCard comparison={globalAnalytics.periodComparison} />
        <Card className="bg-white">
          <p className="text-lg font-semibold">Revenue impact</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-[linear-gradient(135deg,#135c43_0%,#1d7c5b_100%)] p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Measured uplift</p>
              <p className="mt-2 text-3xl font-semibold">${formatNumber(Math.round(globalAnalytics.businessImpact.cumulativeRevenueUplift))}</p>
            </div>
            <div className="rounded-3xl bg-[linear-gradient(135deg,#fff2cf_0%,#f4d07a_100%)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Projected monthly</p>
              <p className="mt-2 text-3xl font-semibold">${formatNumber(Math.round(globalAnalytics.businessImpact.projectedMonthlyImpact))}</p>
            </div>
            <div className="rounded-3xl bg-[#f4f1e8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Launch-ready potential</p>
              <p className="mt-2 text-3xl font-semibold">${formatNumber(Math.round(globalAnalytics.businessImpact.launchReadyRevenuePotential))}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <GlobalKpiChart timeline={globalAnalytics.timeline} />
        <FunnelOverviewCard funnel={globalAnalytics.funnel} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SegmentationPanel segments={globalAnalytics.segments} />
        <Card className="bg-white">
          <p className="text-lg font-semibold">Stats engine health</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Running experiments: <span className="font-semibold">{globalAnalytics.experimentsSummary.running}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Stat winners: <span className="font-semibold">{globalAnalytics.experimentsSummary.winners}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Bounce rate: <span className="font-semibold">{formatPercent(globalAnalytics.kpis.bounceRate)}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Recommendation CTR: <span className="font-semibold">{formatPercent(globalAnalytics.kpis.recommendationCtr)}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Average order value: <span className="font-semibold">${formatNumber(Math.round(globalAnalytics.kpis.averageOrderValue))}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Global model: <span className="font-semibold">Wilson + z-test</span></div>
          </div>
        </Card>
      </div>

      <Card className="bg-white">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-lg font-semibold">Running experiment evidence</p>
            <p className="mt-2 text-sm text-muted-foreground">Read the currently active experiment without mixing it into the overview page.</p>
          </div>
          {runningStats?.winner ? <Badge className="bg-primary text-white">Winner {runningStats.winner}</Badge> : null}
        </div>
        {runningStats ? (
          <div className="mt-5">
            <StatsChart
              data={runningStats.variants.map((variant) => ({
                variant: variant.variantKey,
                conversionRate: Number((variant.conversionRate * 100).toFixed(1)),
                visitors: variant.visitors
              }))}
            />
          </div>
        ) : (
          <div className="mt-5 rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No live experiment is currently running.</div>
        )}
      </Card>
    </div>
  );
}

import { notFound } from "next/navigation";
import { FunnelOverviewCard } from "@/components/dashboard/funnel-overview";
import { GlobalKpiChart } from "@/components/dashboard/global-kpi-chart";
import { PeriodComparisonCard } from "@/components/dashboard/period-comparison";
import { SegmentationPanel } from "@/components/dashboard/segmentation-panel";
import { StatsChart } from "@/components/dashboard/stats-chart";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getExperimentStats, getExperimentsByProject, getProjectAnalytics, getProjectBehaviorInsights, getProjectById } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function SiteAnalyticsPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  resolveLocale((await searchParams).lang);
  const project = await getProjectById(projectId);
  if (!project) notFound();

  const experiments = await getExperimentsByProject(projectId);
  const runningExperiment = experiments.find((experiment) => experiment.status === "running");
  const [analytics, runningStats, behavior] = await Promise.all([
    getProjectAnalytics(projectId),
    runningExperiment ? getExperimentStats(runningExperiment.id) : Promise.resolve(undefined),
    getProjectBehaviorInsights(projectId)
  ]);

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Analytics</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Behavior and business outcomes for {project.name}. This page answers who clicked, where it happened, when it happened, how often it happened, and which paths actually converted.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-secondary px-4 py-2">Behavior intelligence</span>
            <span className="rounded-full bg-secondary px-4 py-2">Funnels</span>
            <span className="rounded-full bg-secondary px-4 py-2">Revenue impact</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Tracked sessions</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(behavior.totals.sessions)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Sessions with usable click and replay context.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Tracked clicks</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(behavior.totals.trackedClicks)}</p>
          <p className="mt-2 text-sm text-muted-foreground">CTA, merchandising, cart, checkout and conversion interactions.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Add to cart</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(analytics.kpis.addToCart)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Tracked `add_to_cart` events across the selected window.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Checkout starts</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(analytics.kpis.checkoutStarts)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Sessions that progressed from cart into checkout.</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <PeriodComparisonCard comparison={analytics.periodComparison} />
        <Card className="bg-white">
          <p className="text-lg font-semibold">Revenue impact</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-3xl bg-[linear-gradient(135deg,#135c43_0%,#1d7c5b_100%)] p-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Measured uplift</p>
              <p className="mt-2 text-3xl font-semibold">${formatNumber(Math.round(analytics.businessImpact.cumulativeRevenueUplift))}</p>
            </div>
            <div className="rounded-3xl bg-[linear-gradient(135deg,#fff2cf_0%,#f4d07a_100%)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Projected monthly</p>
              <p className="mt-2 text-3xl font-semibold">${formatNumber(Math.round(analytics.businessImpact.projectedMonthlyImpact))}</p>
            </div>
            <div className="rounded-3xl bg-[#f4f1e8] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Launch-ready potential</p>
              <p className="mt-2 text-3xl font-semibold">${formatNumber(Math.round(analytics.businessImpact.launchReadyRevenuePotential))}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <GlobalKpiChart timeline={analytics.timeline} />
        <FunnelOverviewCard funnel={analytics.funnel} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-white">
          <div className="mb-5">
            <p className="text-lg font-semibold">Top click zones</p>
            <p className="text-sm text-muted-foreground">Where users actually interact, on which page, and for which goal.</p>
          </div>
          <div className="space-y-3">
            {behavior.topInteractions.length > 0 ? behavior.topInteractions.map((item) => (
              <div key={item.key} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.pathname}</p>
                  </div>
                  <Badge>{item.goal}</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <div className="rounded-2xl bg-secondary/50 p-3 text-sm">Clicks <span className="font-semibold">{item.totalClicks}</span></div>
                  <div className="rounded-2xl bg-secondary/50 p-3 text-sm">Sessions <span className="font-semibold">{item.uniqueSessions}</span></div>
                  <div className="rounded-2xl bg-secondary/50 p-3 text-sm">Type <span className="font-semibold">{item.eventType.replaceAll("_", " ")}</span></div>
                  <div className="rounded-2xl bg-secondary/50 p-3 text-sm">Last seen <span className="font-semibold">{new Date(item.lastSeenAt).toLocaleString("fr-FR")}</span></div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{item.selector}</p>
              </div>
            )) : <div className="rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No click behavior available yet.</div>}
          </div>
        </Card>

        <Card className="bg-white">
          <div className="mb-5">
            <p className="text-lg font-semibold">Page intent and outcomes</p>
            <p className="text-sm text-muted-foreground">Which pages generate visits, add to cart events, conversions, and revenue.</p>
          </div>
          <div className="space-y-3">
            {behavior.topPages.length > 0 ? behavior.topPages.map((page) => (
              <div key={page.pathname} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <p className="font-semibold">{page.pathname}</p>
                  <div className="rounded-full bg-secondary px-3 py-1 text-sm">{page.clicks} actions</div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-secondary/50 p-3 text-sm">Visits <span className="font-semibold">{page.visits}</span></div>
                  <div className="rounded-2xl bg-secondary/50 p-3 text-sm">Add to cart <span className="font-semibold">{page.addToCart}</span></div>
                  <div className="rounded-2xl bg-secondary/50 p-3 text-sm">Conversions <span className="font-semibold">{page.conversions}</span></div>
                  <div className="rounded-2xl bg-secondary/50 p-3 text-sm">Revenue <span className="font-semibold">${formatNumber(Math.round(page.revenue))}</span></div>
                </div>
              </div>
            )) : <div className="rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No page-level outcomes available yet.</div>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <SegmentationPanel segments={analytics.segments} />
        <Card className="bg-white">
          <p className="text-lg font-semibold">Recent tracked events</p>
          <p className="mt-2 text-sm text-muted-foreground">Latest events captured by the tracker so you can verify what is actually coming in.</p>
          <div className="mt-5 space-y-3">
            {behavior.eventFeed.length > 0 ? behavior.eventFeed.map((item) => (
              <div key={item.id} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{item.headline}</p>
                  <Badge>{item.goal}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.detail || "No extra context captured."}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString("fr-FR")}</p>
              </div>
            )) : <div className="rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No recent behavior captured yet.</div>}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="bg-white">
          <p className="text-lg font-semibold">Tracking and experiment health</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Running experiments: <span className="font-semibold">{analytics.experimentsSummary.running}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Stat winners: <span className="font-semibold">{analytics.experimentsSummary.winners}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Bounce rate: <span className="font-semibold">{formatPercent(analytics.kpis.bounceRate)}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Recommendation CTR: <span className="font-semibold">{formatPercent(analytics.kpis.recommendationCtr)}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">AOV: <span className="font-semibold">${formatNumber(Math.round(analytics.kpis.averageOrderValue))}</span></div>
            <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Model: <span className="font-semibold">Wilson + z-test</span></div>
          </div>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">Running experiment evidence</p>
              <p className="mt-2 text-sm text-muted-foreground">Live A/B evidence for this site when an experiment is active.</p>
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
            <div className="mt-5 rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No live experiment is currently running for this site.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

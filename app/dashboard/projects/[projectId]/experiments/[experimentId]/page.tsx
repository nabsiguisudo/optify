import { notFound } from "next/navigation";
import { RecommendationGrid } from "@/components/dashboard/recommendation-grid";
import { KpiTimeSeries } from "@/components/dashboard/kpi-timeseries";
import { SessionDiagnostics } from "@/components/dashboard/session-diagnostics";
import { ExperimentQaPanel } from "@/components/dashboard/experiment-qa-panel";
import { ExperimentRolloutControls } from "@/components/dashboard/experiment-rollout-controls";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatsChart } from "@/components/dashboard/stats-chart";
import { getDetailedExperimentReport, getExperimentById, getExperimentStats, getProjectById, getRecommendations, getRecentProjectProductUrl, getSessionDiagnostics } from "@/lib/data";
import { getDictionary, localizeMetric, localizeStatus, resolveLocale } from "@/lib/i18n";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function ExperimentDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string; experimentId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { experimentId, projectId } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  const experiment = await getExperimentById(experimentId);
  if (!experiment) {
    notFound();
  }

  const [statsResult, reportResult, recommendationsResult, sessionDiagnosticsResult, projectResult, recentProductUrlResult] = await Promise.allSettled([
    getExperimentStats(experimentId),
    getDetailedExperimentReport(experimentId, locale),
    getRecommendations(experiment.projectId, locale),
    getSessionDiagnostics(experimentId),
    getProjectById(experiment.projectId),
    getRecentProjectProductUrl(experiment.projectId)
  ]);
  const stats = statsResult.status === "fulfilled" ? statsResult.value : undefined;
  const report = reportResult.status === "fulfilled" ? reportResult.value : undefined;
  const recommendations = recommendationsResult.status === "fulfilled" ? recommendationsResult.value : [];
  const sessionDiagnostics = sessionDiagnosticsResult.status === "fulfilled" ? sessionDiagnosticsResult.value : [];
  const project = projectResult.status === "fulfilled" ? projectResult.value : undefined;
  const recentProductUrl = recentProductUrlResult.status === "fulfilled" ? recentProductUrlResult.value : undefined;
  const storefrontBase = project?.domain ? `https://${project.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}` : "";
  const defaultQaUrl = experiment.recommendationConfig?.targetUrl
    ?? recentProductUrl
    ?? (storefrontBase && !experiment.pagePattern.includes("*") ? `${storefrontBase}${experiment.pagePattern}` : storefrontBase);

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <div className="flex items-start justify-between gap-6">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge className={experiment.status === "running" ? "bg-primary text-white" : ""}>{localizeStatus(experiment.status, locale)}</Badge>
              <Badge>{experiment.type ?? experiment.editorMode ?? "visual"}</Badge>
              {experiment.workflowState ? <Badge>{experiment.workflowState.replaceAll("_", " ")}</Badge> : null}
              {experiment.priority ? <Badge>{experiment.priority} priority</Badge> : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold">{experiment.name}</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">{experiment.hypothesis}</p>
          </div>
          {stats?.winner ? <Badge className="bg-primary text-white">{t.common.winner} {stats.winner}</Badge> : null}
        </div>
      </Card>

      <ExperimentQaPanel
        experimentId={experiment.id}
        defaultTargetUrl={defaultQaUrl}
      />

      <ExperimentRolloutControls
        projectId={projectId}
        experimentId={experiment.id}
        initialTrafficSplit={experiment.trafficSplit}
        initialStatus={experiment.status}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">{t.common.visitors}</p>
          <p className="mt-3 text-3xl font-semibold">{formatNumber(stats?.totalVisitors ?? 0)}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">{t.common.primaryMetric}</p>
          <p className="mt-3 text-3xl font-semibold">{localizeMetric(experiment.primaryMetric, locale)}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">{t.common.trafficSplit}</p>
          <p className="mt-3 text-3xl font-semibold">{experiment.trafficSplit}%</p>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Sessions</p>
          <p className="mt-3 text-3xl font-semibold">{formatNumber(stats?.kpis.sessions ?? 0)}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Bounce rate</p>
          <p className="mt-3 text-3xl font-semibold">{formatPercent(stats?.kpis.bounceRate ?? 0)}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Avg time on page</p>
          <p className="mt-3 text-3xl font-semibold">{Math.round((stats?.kpis.avgTimeOnPageMs ?? 0) / 1000)}s</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="mt-3 text-3xl font-semibold">${formatNumber(Math.round(stats?.kpis.revenue ?? 0))}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">AOV</p>
          <p className="mt-3 text-3xl font-semibold">${formatNumber(Math.round(stats?.kpis.averageOrderValue ?? 0))}</p>
        </Card>
      </div>

      <Card className="bg-white">
        <p className="text-lg font-semibold">Launch orchestration</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Workflow<div className="mt-1 font-semibold">{experiment.workflowState?.replaceAll("_", " ") ?? experiment.status}</div></div>
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Priority<div className="mt-1 font-semibold">{experiment.priority ?? "medium"}</div></div>
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Exclusion group<div className="mt-1 font-semibold">{experiment.exclusionGroup ?? "none"}</div></div>
          <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Scheduled for<div className="mt-1 font-semibold">{experiment.scheduledFor ? new Date(experiment.scheduledFor).toLocaleString("fr-FR") : "not scheduled"}</div></div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Add to cart</p>
          <p className="mt-3 text-3xl font-semibold">{formatNumber(stats?.kpis.addToCart ?? 0)}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Checkout</p>
          <p className="mt-3 text-3xl font-semibold">{formatNumber(stats?.kpis.checkoutStarts ?? 0)}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Reco CTR</p>
          <p className="mt-3 text-3xl font-semibold">{formatPercent(stats?.kpis.recommendationCtr ?? 0)}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Rage clicks</p>
          <p className="mt-3 text-3xl font-semibold">{formatNumber(stats?.kpis.rageClicks ?? 0)}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Form errors</p>
          <p className="mt-3 text-3xl font-semibold">{formatNumber(stats?.kpis.formErrors ?? 0)}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">JS errors</p>
          <p className="mt-3 text-3xl font-semibold">{formatNumber(stats?.kpis.jsErrors ?? 0)}</p>
        </Card>
      </div>

      <Card className="bg-white">
        <StatsChart
          data={(stats?.variants ?? []).map((variant) => ({
            variant: variant.variantKey,
            conversionRate: Number((variant.conversionRate * 100).toFixed(1)),
            visitors: variant.visitors
          }))}
        />
      </Card>

      {stats ? <KpiTimeSeries experimentId={experimentId} initialStats={stats} /> : null}

      {sessionDiagnostics.length > 0 ? <SessionDiagnostics sessions={sessionDiagnostics} /> : null}

      {(experiment.popupConfig || experiment.recommendationConfig) ? (
        <Card className="bg-white">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Campaign builder</p>
            <h2 className="mt-2 text-2xl font-semibold">Advanced campaign configuration</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {experiment.popupConfig ? (
              <div className="rounded-3xl bg-[#fff6e2] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Popup campaign</p>
                <p className="mt-3 text-2xl font-semibold">{experiment.popupConfig.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{experiment.popupConfig.body}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/80 px-3 py-1">{experiment.popupConfig.trigger.replaceAll("_", " ")}</span>
                  <span className="rounded-full bg-white/80 px-3 py-1">{experiment.popupConfig.placement.replaceAll("_", " ")}</span>
                  <span className="rounded-full bg-white/80 px-3 py-1">{experiment.popupConfig.frequencyCap.replaceAll("_", " ")}</span>
                  <span className="rounded-full bg-white/80 px-3 py-1">{experiment.popupConfig.delayMs} ms</span>
                </div>
              </div>
            ) : null}

            {experiment.recommendationConfig ? (
              <div className="rounded-3xl bg-[#eef4ef] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">Recommendation campaign</p>
                <p className="mt-3 text-2xl font-semibold">{experiment.recommendationConfig.title || "Recommendation module"}</p>
                <p className="mt-2 text-sm text-muted-foreground">{experiment.recommendationConfig.algorithmNotes || "No ranking notes provided."}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/80 px-3 py-1">{experiment.recommendationConfig.strategy.replaceAll("_", " ")}</span>
                  <span className="rounded-full bg-white/80 px-3 py-1">{experiment.recommendationConfig.placement.replaceAll("_", " ")}</span>
                  {experiment.recommendationConfig.trigger ? <span className="rounded-full bg-white/80 px-3 py-1">{experiment.recommendationConfig.trigger.replaceAll("_", " ")}</span> : null}
                  {experiment.recommendationConfig.audienceIntent ? <span className="rounded-full bg-white/80 px-3 py-1">{experiment.recommendationConfig.audienceIntent.replaceAll("_", " ")}</span> : null}
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {experiment.variants.map((variant) => {
          const variantStats = stats?.variants.find((item) => item.variantKey === variant.key);
          return (
            <Card key={variant.id} className="bg-white">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{variant.name}</p>
                {variantStats?.isWinner ? <Badge className="bg-primary text-white">{t.common.winner}</Badge> : null}
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">{t.common.conversionRate}</p>
                  <p className="mt-1 text-2xl font-semibold">{formatPercent(variantStats?.conversionRate ?? 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t.common.uplift}</p>
                  <p className="mt-1 text-2xl font-semibold">{formatPercent(variantStats?.uplift ?? 0)}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                  Confidence interval
                  <div className="mt-1 font-semibold">
                    {formatPercent(variantStats?.confidenceIntervalLow ?? 0)} to {formatPercent(variantStats?.confidenceIntervalHigh ?? 0)}
                  </div>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                  P(beat control)
                  <div className="mt-1 font-semibold">{formatPercent(variantStats?.probabilityToBeatControl ?? 0)}</div>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                  P-value
                  <div className="mt-1 font-semibold">{(variantStats?.pValue ?? 0).toFixed(3)}</div>
                </div>
                <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                  SRM drift
                  <div className="mt-1 font-semibold">{formatPercent(variantStats?.sampleRatioMismatch ?? 0)}</div>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {variant.changes.length === 0 ? (
                  <div className="rounded-2xl bg-secondary/50 p-3 text-sm text-muted-foreground">{t.common.noDomChanges}</div>
                ) : (
                  variant.changes.map((change, index) => (
                    <div key={`${change.selector}-${index}`} className="rounded-2xl bg-secondary/50 p-3 text-sm">
                      <span className="font-medium">{change.type}</span> {t.common.onSelector} <code>{change.selector}</code>
                    </div>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {report ? (
        <Card className="bg-white">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t.common.aiReports}</p>
              <h2 className="mt-2 text-2xl font-semibold">{t.common.detailedExperimentAnalysis}</h2>
            </div>
            <Badge>{t.common.actionable}</Badge>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="rounded-3xl bg-secondary/50 p-5">
                <p className="font-medium">{t.common.executiveSummary}</p>
                <p className="mt-2 text-sm text-muted-foreground">{report.executiveSummary}</p>
              </div>
              <div className="rounded-3xl bg-secondary/50 p-5">
                <p className="font-medium">{t.common.winnerNarrative}</p>
                <p className="mt-2 text-sm text-muted-foreground">{report.winnerNarrative}</p>
              </div>
              <div className="rounded-3xl bg-secondary/50 p-5">
                <p className="font-medium">{t.common.audienceInsights}</p>
                <div className="mt-3 space-y-2">
                  {report.audienceInsights.map((item) => (
                    <p key={item} className="text-sm text-muted-foreground">{item}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-3xl bg-secondary/50 p-5">
                <p className="font-medium">{t.common.insights}</p>
                <div className="mt-3 space-y-2">
                  {report.insights.map((item) => (
                    <p key={item} className="text-sm text-muted-foreground">{item}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-secondary/50 p-5">
                <p className="font-medium">{t.common.nextActions}</p>
                <div className="mt-3 space-y-2">
                  {report.nextActions.map((item) => (
                    <p key={item} className="text-sm text-muted-foreground">{item}</p>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-secondary/50 p-5">
                <p className="font-medium">{t.common.risksToWatch}</p>
                <div className="mt-3 space-y-2">
                  {report.risks.map((item) => (
                    <p key={item} className="text-sm text-muted-foreground">{item}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="bg-white">
        <p className="text-2xl font-semibold">{t.common.productRecommendations}</p>
        <p className="mt-2 text-muted-foreground">{t.dashboard.recommendationBody}</p>
        <div className="mt-6">
          <RecommendationGrid items={recommendations} locale={locale} />
        </div>
      </Card>
    </div>
  );
}

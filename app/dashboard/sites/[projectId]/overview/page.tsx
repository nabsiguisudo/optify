import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bot, Clapperboard, MousePointerClick, Rocket, ShoppingCart, TrendingUp, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAiCopilotInsights, getAiExperimentQueue, getExperimentStats, getExperimentsByProject, getOnboardingProgress, getProjectAnalytics, getProjectBehaviorInsights, getProjectById, getProjectLaunchCenter, getProjectSessionDiagnostics } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function SiteOverviewPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const project = await getProjectById(projectId);
  if (!project) notFound();

  const experiments = await getExperimentsByProject(projectId);
  const runningExperiment = experiments.find((experiment) => experiment.status === "running");
  const [analytics, behavior, aiQueue, aiCopilot, launchCenter, onboarding, runningStats, sessions] = await Promise.all([
    getProjectAnalytics(projectId),
    getProjectBehaviorInsights(projectId),
    getAiExperimentQueue(locale),
    getAiCopilotInsights(locale),
    getProjectLaunchCenter(projectId, locale),
    getOnboardingProgress(projectId, locale),
    runningExperiment ? getExperimentStats(runningExperiment.id) : Promise.resolve(undefined),
    getProjectSessionDiagnostics(projectId, 4)
  ]);

  const topOpportunity = aiCopilot[0];
  const topPage = behavior.topPages[0];
  const topInteraction = behavior.topInteractions[0];
  const trafficSummary = [
    { label: "Sessions", value: formatNumber(analytics.kpis.sessions), note: `${formatNumber(behavior.totals.trackedPages)} tracked pages`, icon: TrendingUp },
    { label: "Page views", value: formatNumber(analytics.kpis.pageViews), note: `${formatPercent(analytics.kpis.bounceRate)} bounce rate`, icon: Workflow },
    { label: "Add to carts", value: formatNumber(analytics.kpis.addToCart), note: `${formatPercent(analytics.kpis.uniqueVisitors === 0 ? 0 : analytics.kpis.addToCart / analytics.kpis.uniqueVisitors)} ATC / visitor`, icon: ShoppingCart },
    { label: "Tracked clicks", value: formatNumber(behavior.totals.trackedClicks), note: `${formatNumber(behavior.totals.conversionSessions)} converting sessions`, icon: MousePointerClick }
  ];

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#201d35_0%,#2a2347_42%,#ff5864_95%,#ffb36a_140%)] text-white shadow-[0_28px_90px_rgba(58,43,95,0.24)]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-white/12 text-white">{project.platform}</Badge>
              <Badge className="bg-white/12 text-white">{project.domain}</Badge>
              <Badge className="bg-white/12 text-white">Observe + Decide + Act</Badge>
            </div>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-3 max-w-3xl text-sm text-white/78">
              A clear command center for your store traffic: what people visit, where they click, what adds to cart, and what Optify thinks you should ship next.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-white text-[#2a2347] hover:bg-white/90">
              <Link href={withLang(`/dashboard/sites/${projectId}/ai`, locale)}>Open AI copilot</Link>
            </Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/16">
              <Link href={withLang(`/dashboard/sites/${projectId}/experiments`, locale)}>Open experiments</Link>
            </Button>
          </div>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {trafficSummary.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="rounded-[1.5rem] border border-white/12 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-white/72">{item.label}</p>
                  <Icon className="h-4 w-4 text-white/72" />
                </div>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                <p className="mt-2 text-sm text-white/72">{item.note}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="bg-[linear-gradient(180deg,#ffffff_0%,#f8f7ff_100%)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">Traffic overview</p>
              <p className="mt-1 text-sm text-muted-foreground">The fastest read on what is happening on the store right now.</p>
            </div>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}>Open analytics</Link>
            </Button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-[1.4rem] border border-border bg-white p-4">
              <p className="text-sm text-muted-foreground">Best-performing page</p>
              <p className="mt-2 text-lg font-semibold">{topPage?.pathname ?? "No page yet"}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {topPage ? `${formatNumber(topPage.visits)} visits, ${formatNumber(topPage.clicks)} clicks, ${formatNumber(topPage.addToCart)} add to carts` : "Traffic will appear here as soon as the first visits are captured."}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-white p-4">
              <p className="text-sm text-muted-foreground">Top interaction</p>
              <p className="mt-2 text-lg font-semibold">{topInteraction?.label ?? "No interaction yet"}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {topInteraction ? `${formatNumber(topInteraction.totalClicks)} clicks on ${topInteraction.pathname} for ${topInteraction.goal}` : "Optify will surface the most-clicked area here."}
              </p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-white p-4">
              <p className="text-sm text-muted-foreground">Revenue tracked</p>
              <p className="mt-2 text-2xl font-semibold">${formatNumber(Math.round(analytics.kpis.revenue))}</p>
              <p className="mt-2 text-sm text-muted-foreground">Cumulative purchase value seen by Optify.</p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-white p-4">
              <p className="text-sm text-muted-foreground">Launch pressure</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(launchCenter.counts.running + launchCenter.counts.approved + launchCenter.counts.scheduled)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Experiences already running or ready to go live.</p>
            </div>
          </div>
        </Card>

        <Card className="bg-[linear-gradient(180deg,#fff7f7_0%,#ffffff_100%)]">
          <p className="text-lg font-semibold">What needs attention</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.4rem] border border-[#ffd8dd] bg-white p-4">
              <p className="text-sm text-muted-foreground">AI queue</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(aiQueue.ready)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Recommendations ready to review right now.</p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-white p-4">
              <p className="text-sm text-muted-foreground">Replays captured</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(sessions.length)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Sessions available in replay and diagnostics.</p>
            </div>
            <div className="rounded-[1.4rem] border border-border bg-white p-4">
              <p className="text-sm text-muted-foreground">Onboarding state</p>
              <p className="mt-2 text-lg font-semibold">{Math.round((onboarding?.completionRatio ?? 0) * 100)}% complete</p>
              <p className="mt-2 text-sm text-muted-foreground">{onboarding?.currentStepLabel ?? "Install this site to begin."}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="bg-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(255,88,100,0.12)_0%,rgba(255,179,106,0.18)_100%)] p-3">
              <Clapperboard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">Observe</p>
              <p className="text-sm text-muted-foreground">Understand the current site, real behavior and friction.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="rounded-2xl bg-secondary/40 p-4">Replayable sessions: <span className="font-semibold">{sessions.length}</span></div>
            <div className="rounded-2xl bg-secondary/40 p-4">Bounce rate: <span className="font-semibold">{formatPercent(analytics.kpis.bounceRate)}</span></div>
            <div className="rounded-2xl bg-secondary/40 p-4">Top click zones tracked: <span className="font-semibold">{behavior.topInteractions.length}</span></div>
          </div>
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link href={withLang(`/dashboard/sites/${projectId}/sessions`, locale)}>Open sessions</Link>
          </Button>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(255,88,100,0.12)_0%,rgba(255,179,106,0.18)_100%)] p-3">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">Decide</p>
              <p className="text-sm text-muted-foreground">Let AI analyze the site, the flow and what to test next.</p>
            </div>
          </div>
          {topOpportunity ? (
            <div className="mt-5 rounded-2xl border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Top AI recommendation</p>
              <p className="mt-3 font-semibold">{topOpportunity.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{topOpportunity.narrative}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-secondary px-3 py-1">{topOpportunity.recommendedType.replaceAll("_", " ")}</span>
                <span className="rounded-full bg-secondary px-3 py-1">{topOpportunity.expectedImpact} impact</span>
                <span className="rounded-full bg-secondary px-3 py-1">{topOpportunity.primaryMetric.replaceAll("_", " ")}</span>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-2xl bg-secondary/40 p-4 text-sm text-muted-foreground">No AI recommendation is ready yet for this site.</div>
          )}
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link href={withLang(`/dashboard/sites/${projectId}/ai`, locale)}>Open AI copilot</Link>
          </Button>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[linear-gradient(135deg,rgba(255,88,100,0.12)_0%,rgba(255,179,106,0.18)_100%)] p-3">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold">Act</p>
              <p className="text-sm text-muted-foreground">Launch experiments, personalized features and rollout decisions.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            <div className="rounded-2xl bg-secondary/40 p-4">Ready for review: <span className="font-semibold">{launchCenter.counts.readyForReview}</span></div>
            <div className="rounded-2xl bg-secondary/40 p-4">Approved or scheduled: <span className="font-semibold">{launchCenter.counts.approved + launchCenter.counts.scheduled}</span></div>
            <div className="rounded-2xl bg-secondary/40 p-4">Running experiments: <span className="font-semibold">{launchCenter.counts.running}</span></div>
          </div>
          <Button asChild variant="outline" className="mt-5 w-full">
            <Link href={withLang(`/dashboard/sites/${projectId}/experiments`, locale)}>Open execution</Link>
          </Button>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-white">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold">What the AI thinks should happen next</p>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/ai`, locale)}>See all recommendations</Link>
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {aiCopilot.slice(0, 3).map((insight) => (
              <div key={insight.id} className="rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{insight.recommendedType.replaceAll("_", " ")}</Badge>
                  <Badge>{insight.expectedImpact} impact</Badge>
                  <Badge>{insight.risk} risk</Badge>
                </div>
                <p className="mt-3 font-semibold">{insight.title}</p>
                <p className="mt-2 text-sm text-muted-foreground">{insight.narrative}</p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  {insight.actionLabel}
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold">Top pages and actions</p>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}>Open analytics</Link>
            </Button>
          </div>
          <div className="mt-5 space-y-3">
            {behavior.topPages.slice(0, 4).map((page) => (
              <div key={page.pathname} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{page.pathname}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{formatNumber(page.visits)} visits · {formatNumber(page.clicks)} clicks · {formatNumber(page.addToCart)} add to carts</p>
                  </div>
                  <Badge>{page.conversions} conv.</Badge>
                </div>
              </div>
            ))}
            {runningExperiment && runningStats ? (
              <div className="rounded-2xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Live experiment</p>
                <p className="mt-2 font-semibold">{runningExperiment.name}</p>
                <p className="mt-2 text-sm text-muted-foreground">{runningExperiment.hypothesis}</p>
                <p className="mt-2 text-sm text-muted-foreground">Best live conversion rate: {formatPercent(Math.max(...runningStats.variants.map((variant) => variant.conversionRate)))}</p>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    </div>
  );
}

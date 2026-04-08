import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bot, Clapperboard, Rocket } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{project.platform}</Badge>
              <Badge>{project.domain}</Badge>
              <Badge className="bg-primary/10 text-primary">Dynamic Yield + FullStory + AI</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{project.name}</h1>
            <p className="mt-3 max-w-4xl text-sm text-muted-foreground">
              Optify observes what users really do, decides what should change with AI, and helps launch experiments or features without jumping between separate tools.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/ai`, locale)}>Open AI copilot</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/experiments`, locale)}>Open experiments</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Observe</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(behavior.totals.sessions || analytics.kpis.sessions)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Sessions captured across analytics, replay and heatmaps.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Decide</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(aiQueue.ready)}</p>
          <p className="mt-2 text-sm text-muted-foreground">AI recommendations ready for review right now.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Act</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(launchCenter.counts.running + launchCenter.counts.scheduled + launchCenter.counts.approved)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Experiments and launches already moving through execution.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Onboarding</p>
          <p className="mt-2 text-3xl font-semibold">{Math.round((onboarding?.completionRatio ?? 0) * 100)}%</p>
          <p className="mt-2 text-sm text-muted-foreground">{onboarding?.currentStepLabel ?? "Install this site to begin."}</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="bg-white">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-secondary p-3">
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
            <div className="rounded-2xl bg-secondary p-3">
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
            <div className="rounded-2xl bg-secondary p-3">
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
            <p className="text-lg font-semibold">Current business pulse</p>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}>Open analytics</Link>
            </Button>
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Revenue tracked</p>
              <p className="mt-2 text-2xl font-semibold">${formatNumber(Math.round(analytics.kpis.revenue))}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Add to cart rate</p>
              <p className="mt-2 text-2xl font-semibold">{formatPercent(analytics.kpis.uniqueVisitors === 0 ? 0 : analytics.kpis.addToCart / analytics.kpis.uniqueVisitors)}</p>
            </div>
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm text-muted-foreground">Revenue uplift identified</p>
              <p className="mt-2 text-2xl font-semibold">${formatNumber(Math.round(analytics.businessImpact.cumulativeRevenueUplift))}</p>
            </div>
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

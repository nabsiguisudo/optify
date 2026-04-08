import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperimentTable } from "@/components/dashboard/experiment-table";
import { LaunchCenter } from "@/components/dashboard/launch-center";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getExperimentStats, getExperimentsByProject, getProjectById, getProjectLaunchCenter } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function SiteExperimentsPage({
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
  const [experiments, launchCenter] = await Promise.all([
    getExperimentsByProject(projectId),
    getProjectLaunchCenter(projectId, locale)
  ]);
  const statsEntries = await Promise.all(experiments.map(async (experiment) => [experiment.id, await getExperimentStats(experiment.id)] as const));
  const statsByExperiment = Object.fromEntries(statsEntries);
  const aggregate = Object.values(statsByExperiment).reduce(
    (acc, stats) => {
      if (!stats) return acc;
      acc.visitors += stats.kpis.uniqueVisitors;
      acc.addToCart += stats.kpis.addToCart;
      acc.checkout += stats.kpis.checkoutStarts;
      acc.purchases += stats.kpis.purchases;
      acc.revenue += stats.kpis.revenue;
      return acc;
    },
    { visitors: 0, addToCart: 0, checkout: 0, purchases: 0, revenue: 0 }
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary">Act</Badge>
              <Badge>Dynamic Yield execution layer</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold">Experiments and rollout</h1>
            <p className="mt-3 text-muted-foreground">
              This is the execution layer of Optify: the place where AI recommendations, personalization ideas and site changes become live experiments, controlled launches and measurable business outcomes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={withLang(`/dashboard/projects/${project.id}/experiments/new`, locale)}>Create experience</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/ai`, locale)}>Open AI copilot</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Portfolio</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(experiments.length)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Experiments, rollouts and launch items tracked for this site.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Ready to launch</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(launchCenter.counts.readyForReview + launchCenter.counts.approved + launchCenter.counts.scheduled)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Items already close to execution.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Running now</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(launchCenter.counts.running)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Live experiences currently learning on the storefront.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Revenue influenced</p>
          <p className="mt-2 text-3xl font-semibold">${formatNumber(Math.round(aggregate.revenue))}</p>
          <p className="mt-2 text-sm text-muted-foreground">Tracked revenue across the active experiment portfolio.</p>
        </Card>
      </div>

      <LaunchCenter snapshot={launchCenter} />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white">
          <p className="text-lg font-semibold">Execution funnel</p>
          <p className="mt-2 text-sm text-muted-foreground">A simple business view of what current experiences influence from traffic to purchase.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Visitors</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(aggregate.visitors)}</p>
            </div>
            <div className="rounded-3xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Add to cart</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(aggregate.addToCart)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatPercent(aggregate.visitors === 0 ? 0 : aggregate.addToCart / aggregate.visitors)}</p>
            </div>
            <div className="rounded-3xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Checkout</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(aggregate.checkout)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatPercent(aggregate.addToCart === 0 ? 0 : aggregate.checkout / aggregate.addToCart)}</p>
            </div>
            <div className="rounded-3xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Purchases</p>
              <p className="mt-2 text-2xl font-semibold">{formatNumber(aggregate.purchases)}</p>
              <p className="mt-1 text-sm text-muted-foreground">${formatNumber(Math.round(aggregate.revenue))}</p>
            </div>
          </div>
        </Card>
        <Card className="bg-white">
          <p className="text-lg font-semibold">Execution states</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-3xl border border-border p-4 text-sm">Ready for review: <span className="font-semibold">{launchCenter.counts.readyForReview}</span></div>
            <div className="rounded-3xl border border-border p-4 text-sm">Approved: <span className="font-semibold">{launchCenter.counts.approved}</span></div>
            <div className="rounded-3xl border border-border p-4 text-sm">Scheduled: <span className="font-semibold">{launchCenter.counts.scheduled}</span></div>
            <div className="rounded-3xl border border-border p-4 text-sm">Running: <span className="font-semibold">{launchCenter.counts.running}</span></div>
          </div>
        </Card>
      </section>

      <ExperimentTable experiments={experiments} statsByExperiment={statsByExperiment} locale={locale} />
    </div>
  );
}

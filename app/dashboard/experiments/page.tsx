import Link from "next/link";
import { ExperimentTable } from "@/components/dashboard/experiment-table";
import { LaunchCenter } from "@/components/dashboard/launch-center";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAllExperiments, getAudienceInsights, getExperimentStats, getLaunchCenter, getProjects } from "@/lib/data";
import { getDictionary, resolveLocale, withLang } from "@/lib/i18n";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function ExperimentsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  const projects = await getProjects();
  const experiments = await getAllExperiments();
  const launchCenter = await getLaunchCenter(locale);
  const statsEntries = await Promise.all(experiments.map(async (experiment) => [experiment.id, await getExperimentStats(experiment.id)] as const));
  const statsByExperiment = Object.fromEntries(statsEntries);
  const audience = await getAudienceInsights(locale);
  const createHref = projects[0] ? withLang(`/dashboard/projects/${projects[0].id}/experiments/new`, locale) : withLang("/dashboard/projects/new", locale);
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
          <div>
            <h1 className="text-3xl font-semibold">{t.common.allExperiments}</h1>
            <p className="mt-2 text-muted-foreground">This page now owns launch operations. Review the queue, approve and launch campaigns, then inspect the full portfolio below.</p>
          </div>
          <Button asChild>
            <Link href={createHref}>Create experience</Link>
          </Button>
        </div>
      </Card>

      <LaunchCenter snapshot={launchCenter} />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="bg-white">
          <p className="text-lg font-semibold">Global funnel</p>
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
          <p className="text-lg font-semibold">Segmentation pulse</p>
          <div className="mt-5 space-y-3">
            {audience.slice(0, 3).map((segment) => (
              <div key={segment.segment} className="rounded-3xl border border-border p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{segment.segment}</p>
                  <span className="rounded-full bg-secondary px-3 py-1 text-sm">Best {segment.bestVariant}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{segment.note}</p>
                <p className="mt-3 text-sm text-muted-foreground">Share {formatPercent(segment.share)} · CR {formatPercent(segment.conversionRate)}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <ExperimentTable experiments={experiments} statsByExperiment={statsByExperiment} locale={locale} />
    </div>
  );
}

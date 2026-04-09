import Link from "next/link";
import { notFound } from "next/navigation";
import { ExperimentTable } from "@/components/dashboard/experiment-table";
import {
  DashboardKpiCard,
  DashboardKpiGrid,
  DashboardMetricList,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatusBadge
} from "@/components/dashboard/site-dashboard-primitives";
import { Button } from "@/components/ui/button";
import { getExperimentStats, getExperimentsByProject, getProjectById } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import { formatDashboardCurrency, formatDashboardNumber, formatDashboardPercent, getSiteDashboardCopy } from "@/lib/site-dashboard";

export default async function SiteExperimentsPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const copy = getSiteDashboardCopy(locale);
  const projectPromise = getProjectById(projectId);
  const experimentsPromise = getExperimentsByProject(projectId);
  const project = await projectPromise;
  if (!project) notFound();

  const experiments = await experimentsPromise;
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

  const byState = {
    draft: experiments.filter((experiment) => experiment.workflowState === "draft").length,
    ready: experiments.filter((experiment) => experiment.workflowState === "ready_for_review").length,
    approved: experiments.filter((experiment) => experiment.workflowState === "approved").length,
    scheduled: experiments.filter((experiment) => experiment.workflowState === "scheduled").length,
    running: experiments.filter((experiment) => experiment.status === "running").length
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={copy.pages.experiments.title}
        title={project.name}
        description={copy.pages.experiments.description}
        actions={(
          <>
            <Button asChild>
              <Link href={withLang(`/dashboard/projects/${project.id}/experiments/new`, locale)}>{copy.pages.experiments.createAction}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/ai`, locale)}>{copy.pages.experiments.secondaryAction}</Link>
            </Button>
          </>
        )}
        meta={(
          <>
            <DashboardStatusBadge label={`${formatDashboardNumber(byState.running, locale)} en cours`} tone="good" />
            <DashboardStatusBadge label={`${formatDashboardNumber(byState.ready + byState.approved + byState.scheduled, locale)} pretes`} tone="muted" />
          </>
        )}
      />

      <DashboardSection title={copy.pages.experiments.portfolioTitle} description={copy.pages.experiments.portfolioDescription}>
        <DashboardKpiGrid>
          <DashboardKpiCard label="Portefeuille" value={formatDashboardNumber(experiments.length, locale)} />
          <DashboardKpiCard label="Pretes a lancer" value={formatDashboardNumber(byState.ready + byState.approved + byState.scheduled, locale)} tone="soft" />
          <DashboardKpiCard label="En cours" value={formatDashboardNumber(byState.running, locale)} tone="warm" />
          <DashboardKpiCard label="Revenu influence" value={formatDashboardCurrency(Math.round(aggregate.revenue), locale)} />
        </DashboardKpiGrid>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <DashboardSection title={copy.pages.experiments.funnelTitle} description={copy.pages.experiments.funnelDescription}>
          <DashboardMetricList
            items={[
              {
                label: "Visiteurs",
                value: formatDashboardNumber(aggregate.visitors, locale),
                note: "Volume total vu par les experiences."
              },
              {
                label: "Ajouts au panier",
                value: formatDashboardNumber(aggregate.addToCart, locale),
                note: formatDashboardPercent(aggregate.visitors === 0 ? 0 : aggregate.addToCart / aggregate.visitors, locale)
              },
              {
                label: "Checkouts",
                value: formatDashboardNumber(aggregate.checkout, locale),
                note: formatDashboardPercent(aggregate.addToCart === 0 ? 0 : aggregate.checkout / aggregate.addToCart, locale)
              },
              {
                label: "Achats",
                value: formatDashboardNumber(aggregate.purchases, locale),
                note: formatDashboardCurrency(Math.round(aggregate.revenue), locale)
              }
            ]}
          />
        </DashboardSection>

        <DashboardSection title={copy.pages.experiments.statesTitle} description={copy.pages.experiments.statesDescription}>
          <DashboardMetricList
            items={[
              { label: "Brouillons", value: formatDashboardNumber(byState.draft, locale) },
              { label: "Pretes pour revue", value: formatDashboardNumber(byState.ready, locale) },
              { label: "Approuvees", value: formatDashboardNumber(byState.approved, locale) },
              { label: "Planifiees", value: formatDashboardNumber(byState.scheduled, locale) },
              { label: "En cours", value: formatDashboardNumber(byState.running, locale) }
            ]}
          />
        </DashboardSection>
      </div>

      <ExperimentTable experiments={experiments} statsByExperiment={statsByExperiment} locale={locale} />
    </div>
  );
}

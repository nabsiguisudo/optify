import { notFound } from "next/navigation";
import { FunnelOverviewCard } from "@/components/dashboard/funnel-overview";
import { GlobalKpiChart } from "@/components/dashboard/global-kpi-chart";
import { PeriodComparisonCard } from "@/components/dashboard/period-comparison";
import { SegmentationPanel } from "@/components/dashboard/segmentation-panel";
import { StatsChart } from "@/components/dashboard/stats-chart";
import {
  DashboardEmpty,
  DashboardKpiCard,
  DashboardKpiGrid,
  DashboardMetricList,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatusBadge
} from "@/components/dashboard/site-dashboard-primitives";
import { getExperimentStats, getExperimentsByProject, getProjectAnalytics, getProjectBehaviorInsights, getProjectById } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";
import {
  formatDashboardCurrency,
  formatDashboardDateTime,
  formatDashboardNumber,
  formatDashboardPercent,
  formatEventLabel,
  getSiteDashboardCopy
} from "@/lib/site-dashboard";

function formatPageLabel(pathname: string) {
  if (pathname === "/" || pathname === "/home") return "Accueil";
  return pathname;
}

export default async function SiteAnalyticsPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const copy = getSiteDashboardCopy(locale);
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
      <DashboardPageHeader
        eyebrow={copy.pages.analytics.title}
        title={project.name}
        description={copy.pages.analytics.description}
        meta={(
          <>
            <DashboardStatusBadge label={`${formatDashboardNumber(behavior.totals.sessions, locale)} sessions suivies`} tone="good" />
            <DashboardStatusBadge label={`${formatDashboardNumber(behavior.totals.trackedClicks, locale)} clics suivis`} tone="muted" />
            <DashboardStatusBadge label={`${formatDashboardNumber(analytics.kpis.purchases, locale)} achats`} />
          </>
        )}
      />

      <DashboardSection title={copy.pages.analytics.trafficTitle} description={copy.pages.analytics.trafficDescription}>
        <DashboardKpiGrid>
          <DashboardKpiCard label={copy.common.visitors} value={formatDashboardNumber(analytics.kpis.uniqueVisitors, locale)} />
          <DashboardKpiCard label={copy.common.sessions} value={formatDashboardNumber(analytics.kpis.sessions, locale)} tone="soft" />
          <DashboardKpiCard label={copy.common.addToCart} value={formatDashboardNumber(analytics.kpis.addToCart, locale)} tone="warm" />
          <DashboardKpiCard label={copy.common.purchases} value={formatDashboardNumber(analytics.kpis.purchases, locale)} hint={formatDashboardCurrency(Math.round(analytics.kpis.revenue), locale)} />
        </DashboardKpiGrid>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <GlobalKpiChart timeline={analytics.timeline} />
        <DashboardSection title={copy.pages.analytics.comparisonTitle} description={copy.pages.analytics.comparisonDescription}>
          <PeriodComparisonCard comparison={analytics.periodComparison} />
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <FunnelOverviewCard funnel={analytics.funnel} />
        <DashboardSection title="Lecture business" description="Quelques ratios simples a lire sans jargon ni code couleur trompeur.">
          <DashboardMetricList
            items={[
              {
                label: "Taux d'ajout au panier",
                value: formatDashboardPercent(analytics.kpis.uniqueVisitors === 0 ? 0 : analytics.kpis.addToCart / analytics.kpis.uniqueVisitors, locale),
                note: `${formatDashboardNumber(analytics.kpis.addToCart, locale)} ajouts pour ${formatDashboardNumber(analytics.kpis.uniqueVisitors, locale)} visiteurs`
              },
              {
                label: "Taux de passage en checkout",
                value: formatDashboardPercent(analytics.kpis.addToCart === 0 ? 0 : analytics.kpis.checkoutStarts / analytics.kpis.addToCart, locale),
                note: `${formatDashboardNumber(analytics.kpis.checkoutStarts, locale)} checkouts demarres`
              },
              {
                label: "Taux d'achat",
                value: formatDashboardPercent(analytics.kpis.checkoutStarts === 0 ? 0 : analytics.kpis.purchases / analytics.kpis.checkoutStarts, locale),
                note: `${formatDashboardCurrency(Math.round(analytics.kpis.revenue), locale)} de revenu observe`
              },
              {
                label: "Panier moyen",
                value: formatDashboardCurrency(Math.round(analytics.kpis.averageOrderValue), locale),
                note: `${formatDashboardNumber(analytics.kpis.purchases, locale)} achats suivis`
              }
            ]}
          />
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardSection title={copy.pages.analytics.pageTableTitle} description={copy.pages.analytics.pageTableDescription}>
          {behavior.topPages.length > 0 ? (
            <DashboardMetricList
              items={behavior.topPages.slice(0, 6).map((page) => ({
                label: formatPageLabel(page.pathname),
                value: `${formatDashboardNumber(page.visits, locale)} visites`,
                note: `${formatDashboardNumber(page.clicks, locale)} clics, ${formatDashboardNumber(page.addToCart, locale)} paniers, ${formatDashboardCurrency(Math.round(page.revenue), locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty title="Pas encore de pages utiles" body="Cette section deviendra utile des que la boutique aura accumule assez de visites et d'actions." />
          )}
        </DashboardSection>

        <DashboardSection title={copy.pages.analytics.interactionTableTitle} description={copy.pages.analytics.interactionTableDescription}>
          {behavior.topInteractions.length > 0 ? (
            <DashboardMetricList
              items={behavior.topInteractions.slice(0, 6).map((item) => ({
                label: item.label || item.selector || "Element sans libelle",
                value: `${formatDashboardNumber(item.totalClicks, locale)} clics`,
                note: `${formatPageLabel(item.pathname)} - ${formatEventLabel(item.eventType, locale)} - ${formatDashboardDateTime(item.lastSeenAt, locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty title="Aucune zone d'interaction claire" body="Des que suffisamment de clics seront enregistres, cette zone montrera les elements qui concentrent l'attention." />
          )}
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SegmentationPanel segments={analytics.segments} />
        <DashboardSection title={copy.pages.analytics.qualityTitle} description={copy.pages.analytics.qualityDescription}>
          <DashboardMetricList
            items={[
              {
                label: "Evenements recents",
                value: formatDashboardNumber(behavior.eventFeed.length, locale),
                note: behavior.eventFeed[0] ? `Dernier signal: ${formatDashboardDateTime(behavior.eventFeed[0].timestamp, locale)}` : "Aucun signal recent."
              },
              {
                label: "Taux de rebond",
                value: formatDashboardPercent(analytics.kpis.bounceRate, locale),
                note: `${formatDashboardNumber(analytics.kpis.pageViews, locale)} vues de page observees`
              },
              {
                label: "CTR des recommandations",
                value: formatDashboardPercent(analytics.kpis.recommendationCtr, locale),
                note: `${formatDashboardNumber(analytics.kpis.recommendationClicks, locale)} clics pour ${formatDashboardNumber(analytics.kpis.recommendationImpressions, locale)} impressions`
              },
              {
                label: "Erreurs JS",
                value: formatDashboardNumber(analytics.kpis.jsErrors, locale),
                note: analytics.kpis.jsErrors > 0 ? "Des erreurs front ont ete detectees." : "Aucune erreur JS remontee sur la periode."
              }
            ]}
          />
        </DashboardSection>
      </div>

      {runningStats ? (
        <DashboardSection
          title="Experience en cours"
          description="Si un test est actif, voici un mini point de lecture sur sa performance."
          aside={runningStats.winner ? <DashboardStatusBadge label={`Gagnant: ${runningStats.winner}`} tone="good" /> : undefined}
        >
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <DashboardMetricList
              items={runningStats.variants.map((variant) => ({
                label: variant.variantKey,
                value: formatDashboardPercent(variant.conversionRate, locale),
                note: `${formatDashboardNumber(variant.visitors, locale)} visiteurs, ${formatDashboardNumber(variant.conversions, locale)} conversions`
              }))}
            />
            <StatsChart
              data={runningStats.variants.map((variant) => ({
                variant: variant.variantKey,
                conversionRate: Number((variant.conversionRate * 100).toFixed(1)),
                visitors: variant.visitors
              }))}
            />
          </div>
        </DashboardSection>
      ) : null}
    </div>
  );
}

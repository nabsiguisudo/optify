import Link from "next/link";
import { notFound } from "next/navigation";
import { AnalyticsPersonalization } from "@/components/dashboard/analytics-personalization";
import { FunnelOverviewCard } from "@/components/dashboard/funnel-overview";
import { GlobalKpiChart } from "@/components/dashboard/global-kpi-chart";
import { PeriodComparisonCard } from "@/components/dashboard/period-comparison";
import { Button } from "@/components/ui/button";
import {
  DashboardCompactList,
  DashboardEmpty,
  DashboardKpiCard,
  DashboardKpiGrid,
  DashboardPageHeader,
  DashboardStatusBadge,
  DashboardWidget,
  DashboardWidgetGrid
} from "@/components/dashboard/site-dashboard-primitives";
import {
  getExperimentStats,
  getExperimentsByProject,
  getProjectAnalytics,
  getProjectBehaviorInsights,
  getProjectById,
  getProjectSessionDiagnostics
} from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
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

function formatDeviceLabel(deviceType: "desktop" | "tablet" | "mobile" | "unknown") {
  if (deviceType === "mobile") return "Mobile";
  if (deviceType === "tablet") return "Tablette";
  if (deviceType === "desktop") return "Desktop";
  return "Inconnu";
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
  const projectPromise = getProjectById(projectId);
  const experimentsPromise = getExperimentsByProject(projectId);
  const project = await projectPromise;
  if (!project) notFound();

  const experiments = await experimentsPromise;
  const runningExperiment = experiments.find((experiment) => experiment.status === "running");
  const [analytics, runningStats, behavior, sessions] = await Promise.all([
    getProjectAnalytics(projectId),
    runningExperiment ? getExperimentStats(runningExperiment.id) : Promise.resolve(undefined),
    getProjectBehaviorInsights(projectId),
    getProjectSessionDiagnostics(projectId, 6)
  ]);

  const hasAnalyticsData = analytics.timeline.some((point) => (
    point.sessions > 0 ||
    point.visitors > 0 ||
    point.pageViews > 0 ||
    point.addToCart > 0 ||
    point.purchases > 0
  ));

  const topPages = behavior.topPages.slice(0, 5);
  const topInteractions = behavior.topInteractions.slice(0, 5);
  const recentSignals = behavior.eventFeed.slice(0, 5);
  const deviceBreakdown = [
    { label: "Mobile", value: sessions.filter((session) => session.deviceType === "mobile").length },
    { label: "Desktop", value: sessions.filter((session) => session.deviceType === "desktop").length },
    { label: "Tablette", value: sessions.filter((session) => session.deviceType === "tablet").length },
    { label: "Inconnu", value: sessions.filter((session) => session.deviceType === "unknown").length }
  ].filter((item) => item.value > 0);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={copy.pages.analytics.title}
        title={project.name}
        description="Une lecture plus proche d'un dashboard d'analyse comportementale: KPIs en haut, courbe de trafic, sessions, pages, zones cliquées et qualité de collecte."
        actions={(
          <>
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/sessions`, locale)}>Voir les sessions</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/segments`, locale)}>Voir les segments</Link>
            </Button>
          </>
        )}
        meta={(
          <>
            <DashboardStatusBadge label={`${formatDashboardNumber(analytics.kpis.uniqueVisitors, locale)} visiteurs`} tone="good" />
            <DashboardStatusBadge label={`${formatDashboardNumber(behavior.totals.trackedClicks, locale)} clics suivis`} tone="muted" />
            <DashboardStatusBadge label={`${formatDashboardNumber(analytics.kpis.purchases, locale)} achats`} tone="warn" />
          </>
        )}
      />

      <DashboardKpiGrid>
        <DashboardKpiCard label="Visiteurs" value={formatDashboardNumber(analytics.kpis.uniqueVisitors, locale)} />
        <DashboardKpiCard label="Sessions" value={formatDashboardNumber(analytics.kpis.sessions, locale)} tone="soft" />
        <DashboardKpiCard label="Conversions" value={formatDashboardNumber(analytics.kpis.conversions, locale)} tone="warm" />
        <DashboardKpiCard
          label="Chiffre d'affaires"
          value={formatDashboardCurrency(Math.round(analytics.kpis.revenue), locale)}
          hint={`${formatDashboardPercent(analytics.kpis.checkoutStarts === 0 ? 0 : analytics.kpis.purchases / analytics.kpis.checkoutStarts, locale)} après checkout`}
        />
      </DashboardKpiGrid>

      <AnalyticsPersonalization
        projectId={projectId}
        segmentsHref={withLang(`/dashboard/sites/${projectId}/segments`, locale)}
      />

      {!hasAnalyticsData ? (
        <DashboardWidget title="Pourquoi Analytics est vide" description="On préfère un état clair à un faux dashboard rempli de cartes mortes.">
          <DashboardEmpty
            title="Pas encore assez de données pour ce projet"
            body="Si tu as déjà navigué sur la boutique, vérifie que le snippet Liquid et le custom pixel pointent bien vers ce projectId, puis recharge la boutique et refais quelques visites, clics et ajouts au panier."
          />
        </DashboardWidget>
      ) : null}

      <DashboardWidgetGrid className="xl:grid-cols-[1.08fr_0.92fr]">
        <GlobalKpiChart timeline={analytics.timeline} />
        <DashboardWidget
          title="Sessions récentes"
          description="La meilleure entrée pour relier immédiatement le trafic aux vraies visites."
          aside={<DashboardStatusBadge label={`${formatDashboardNumber(sessions.length, locale)} visibles`} tone="good" />}
        >
          {sessions.length > 0 ? (
            <DashboardCompactList
              items={sessions.slice(0, 5).map((session) => ({
                label: session.anonymousId || session.sessionId,
                value: formatDeviceLabel(session.deviceType),
                note: `${formatDashboardDateTime(session.startedAt, locale)} · ${session.pages} pages · ${session.rageClicks} rage clicks · ${session.deadClicks} clics sans effet`
              }))}
            />
          ) : (
            <DashboardEmpty title="Aucune session récente" body="Dès que la boutique remontera plus de visites, elles apparaîtront ici en premier." />
          )}
        </DashboardWidget>
      </DashboardWidgetGrid>

      <DashboardWidgetGrid className="xl:grid-cols-[0.94fr_1.06fr]">
        <PeriodComparisonCard comparison={analytics.periodComparison} />
        <FunnelOverviewCard funnel={analytics.funnel} />
      </DashboardWidgetGrid>

      <DashboardWidgetGrid>
        <DashboardWidget title="Top pages" description="Les pages qui concentrent le trafic et l'intention d'achat.">
          {topPages.length > 0 ? (
            <DashboardCompactList
              items={topPages.map((page) => ({
                label: formatPageLabel(page.pathname),
                value: `${formatDashboardNumber(page.visits, locale)} visites`,
                note: `${formatDashboardNumber(page.clicks, locale)} clics · ${formatDashboardNumber(page.addToCart, locale)} ajouts au panier · ${formatDashboardCurrency(Math.round(page.revenue), locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty title="Aucune page forte" body="Cette liste s'affichera dès que le projet aura accumulé plus de trafic utile." />
          )}
        </DashboardWidget>

        <DashboardWidget title="Zones cliquées" description="Les éléments qui attirent vraiment l'attention sur le site.">
          {topInteractions.length > 0 ? (
            <DashboardCompactList
              items={topInteractions.map((item) => ({
                label: item.label || item.selector || "Élément sans libellé",
                value: `${formatDashboardNumber(item.totalClicks, locale)} clics`,
                note: `${formatPageLabel(item.pathname)} · ${formatEventLabel(item.eventType, locale)} · ${formatDashboardDateTime(item.lastSeenAt, locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty title="Aucune zone cliquée dominante" body="Les zones les plus sollicitées apparaîtront ici dès que le volume de clics sera suffisant." />
          )}
        </DashboardWidget>
      </DashboardWidgetGrid>

      <DashboardWidgetGrid>
        <DashboardWidget title="Qualité de collecte" description="Pour vérifier rapidement si la data est exploitable.">
          <DashboardCompactList
            items={[
              {
                label: "Événements récents",
                value: formatDashboardNumber(recentSignals.length, locale),
                note: recentSignals[0] ? `Dernier signal: ${formatDashboardDateTime(recentSignals[0].timestamp, locale)}` : "Aucun signal récent."
              },
              {
                label: "CTR des recommandations",
                value: formatDashboardPercent(analytics.kpis.recommendationCtr, locale),
                note: `${formatDashboardNumber(analytics.kpis.recommendationClicks, locale)} clics pour ${formatDashboardNumber(analytics.kpis.recommendationImpressions, locale)} impressions`
              },
              {
                label: "Erreurs JavaScript",
                value: formatDashboardNumber(analytics.kpis.jsErrors, locale),
                note: analytics.kpis.jsErrors > 0 ? "Des erreurs front ont été remontées sur la période." : "Aucune erreur JS remontée."
              },
              {
                label: "Taux de rebond",
                value: formatDashboardPercent(analytics.kpis.bounceRate, locale),
                note: `${formatDashboardNumber(analytics.kpis.pageViews, locale)} vues de page observées`
              }
            ]}
          />
        </DashboardWidget>

        <DashboardWidget title="Répartition du trafic" description="Un résumé simple par device, utile avant d'ouvrir les sessions.">
          {deviceBreakdown.length > 0 ? (
            <DashboardCompactList
              items={deviceBreakdown.map((item) => ({
                label: item.label,
                value: formatDashboardNumber(item.value, locale),
                note: `${formatDashboardPercent(sessions.length === 0 ? 0 : item.value / sessions.length, locale)} des sessions récentes`
              }))}
            />
          ) : (
            <DashboardEmpty title="Répartition device indisponible" body="Dès que les sessions enregistrées auront assez de volume, la ventilation mobile, desktop et tablette apparaîtra ici." />
          )}
        </DashboardWidget>
      </DashboardWidgetGrid>

      <DashboardWidgetGrid className="xl:grid-cols-[0.92fr_1.08fr]">
        <DashboardWidget
          title="Segments à suivre"
          description="Le prochain cran FullStory-like: créer puis épingler des segments utiles au dashboard."
          aside={(
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/segments`, locale)}>Ouvrir Segments</Link>
            </Button>
          )}
        >
          <DashboardCompactList
            items={[
              {
                label: "Visiteurs à forte intention",
                value: `${formatDashboardNumber(analytics.kpis.addToCart, locale)} actions`,
                note: "Tous les visiteurs qui ajoutent au panier ou démarrent un checkout."
              },
              {
                label: "Visiteurs en friction",
                value: `${formatDashboardNumber(analytics.kpis.rageClicks + analytics.kpis.deadClicks, locale)} signaux`,
                note: "Rage clicks, clics sans effet ou sessions avec erreurs."
              },
              {
                label: "Entrées sur page clé",
                value: topPages[0] ? formatPageLabel(topPages[0].pathname) : "Aucune",
                note: "Un segment prêt à être épinglé dans un futur dashboard personnalisé."
              }
            ]}
          />
        </DashboardWidget>

        <DashboardWidget title="Lecture business" description="Quelques ratios lisibles sans jargon ni storytelling creux.">
          <DashboardCompactList
            items={[
              {
                label: "Taux d'ajout au panier",
                value: formatDashboardPercent(analytics.kpis.uniqueVisitors === 0 ? 0 : analytics.kpis.addToCart / analytics.kpis.uniqueVisitors, locale),
                note: `${formatDashboardNumber(analytics.kpis.addToCart, locale)} ajouts pour ${formatDashboardNumber(analytics.kpis.uniqueVisitors, locale)} visiteurs`
              },
              {
                label: "Passage au checkout",
                value: formatDashboardPercent(analytics.kpis.addToCart === 0 ? 0 : analytics.kpis.checkoutStarts / analytics.kpis.addToCart, locale),
                note: `${formatDashboardNumber(analytics.kpis.checkoutStarts, locale)} checkouts démarrés`
              },
              {
                label: "Taux d'achat",
                value: formatDashboardPercent(analytics.kpis.checkoutStarts === 0 ? 0 : analytics.kpis.purchases / analytics.kpis.checkoutStarts, locale),
                note: `${formatDashboardNumber(analytics.kpis.purchases, locale)} achats suivis`
              },
              {
                label: "Panier moyen",
                value: formatDashboardCurrency(Math.round(analytics.kpis.averageOrderValue), locale),
                note: `${formatDashboardCurrency(Math.round(analytics.kpis.revenue), locale)} de revenu observé`
              }
            ]}
          />
        </DashboardWidget>
      </DashboardWidgetGrid>

      {runningStats ? (
        <DashboardWidget
          title="Expérience actuellement en diffusion"
          description="Un rappel rapide du test actif pour ne pas mélanger analytics comportemental et lecture A/B."
          aside={runningStats.winner ? <DashboardStatusBadge label={`Gagnant: ${runningStats.winner}`} tone="good" /> : undefined}
        >
          <DashboardCompactList
            items={runningStats.variants.map((variant) => ({
              label: variant.variantKey,
              value: formatDashboardPercent(variant.conversionRate, locale),
              note: `${formatDashboardNumber(variant.visitors, locale)} visiteurs · ${formatDashboardNumber(variant.conversions, locale)} conversions`
            }))}
          />
        </DashboardWidget>
      ) : null}
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getAiCopilotInsights, getExperimentStats, getExperimentsByProject, getOnboardingProgress, getProjectAnalytics, getProjectBehaviorInsights, getProjectById, getProjectSessionDiagnostics } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import {
  formatDashboardCurrency,
  formatDashboardDateTime,
  formatDashboardNumber,
  formatDashboardPercent,
  formatDashboardStatus,
  getSiteDashboardCopy
} from "@/lib/site-dashboard";
import {
  DashboardBarList,
  DashboardEmpty,
  DashboardKpiCard,
  DashboardKpiGrid,
  DashboardMetricList,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatusBadge
} from "@/components/dashboard/site-dashboard-primitives";

function formatPageLabel(pathname?: string) {
  if (!pathname) return null;
  if (pathname === "/" || pathname === "/home") return "Accueil";
  return pathname;
}

export default async function SiteOverviewPage({
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
  const [analytics, behavior, suggestions, onboarding, runningStats, sessions] = await Promise.all([
    getProjectAnalytics(projectId),
    getProjectBehaviorInsights(projectId),
    getAiCopilotInsights(locale),
    getOnboardingProgress(projectId, locale),
    runningExperiment ? getExperimentStats(runningExperiment.id) : Promise.resolve(undefined),
    getProjectSessionDiagnostics(projectId, 4)
  ]);

  const topPage = behavior.topPages[0];
  const topInteraction = behavior.topInteractions[0];
  const recentSignals = behavior.eventFeed.slice(0, 4);
  const trackedRevenue = formatDashboardCurrency(Math.round(analytics.kpis.revenue), locale);
  const bestPageLabel = formatPageLabel(topPage?.pathname);
  const interactionLabel = topInteraction?.label || topInteraction?.selector || null;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={copy.pages.overview.title}
        title={project.name}
        description={`${copy.pages.overview.description} ${project.domain}`}
        actions={(
          <>
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}>{copy.pages.overview.primaryAction}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/experiments`, locale)}>{copy.pages.overview.secondaryAction}</Link>
            </Button>
          </>
        )}
        meta={(
          <>
            <DashboardStatusBadge label={project.platform} />
            <DashboardStatusBadge label={project.domain} tone="muted" />
            <DashboardStatusBadge label={`${formatDashboardNumber(analytics.kpis.sessions, locale)} ${copy.common.sessions.toLowerCase()}`} tone="good" />
          </>
        )}
      />

      <DashboardSection title={copy.pages.overview.summaryTitle} description={copy.pages.overview.summaryDescription}>
        <DashboardKpiGrid>
          <DashboardKpiCard
            label={copy.common.sessions}
            value={formatDashboardNumber(analytics.kpis.sessions, locale)}
            hint={`${formatDashboardNumber(analytics.kpis.uniqueVisitors, locale)} ${copy.common.visitors.toLowerCase()}`}
          />
          <DashboardKpiCard
            label={copy.common.pageViews}
            value={formatDashboardNumber(analytics.kpis.pageViews, locale)}
            hint={`${formatDashboardPercent(analytics.kpis.bounceRate, locale)} de rebond`}
            tone="soft"
          />
          <DashboardKpiCard
            label={copy.common.addToCart}
            value={formatDashboardNumber(analytics.kpis.addToCart, locale)}
            hint={`${formatDashboardNumber(analytics.kpis.checkoutStarts, locale)} checkouts`}
            tone="warm"
          />
          <DashboardKpiCard
            label={copy.pages.overview.trackedRevenue}
            value={trackedRevenue}
            hint={`${formatDashboardNumber(analytics.kpis.purchases, locale)} achats suivis`}
          />
        </DashboardKpiGrid>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <DashboardSection title={copy.pages.overview.topPagesTitle} description={copy.pages.overview.topPagesDescription}>
          {behavior.topPages.length > 0 ? (
            <DashboardBarList
              items={behavior.topPages.slice(0, 5).map((page) => ({
                label: formatPageLabel(page.pathname) ?? copy.common.noData,
                value: page.visits,
                displayValue: `${formatDashboardNumber(page.visits, locale)} visites`,
                note: `${formatDashboardNumber(page.clicks, locale)} clics, ${formatDashboardNumber(page.addToCart, locale)} paniers, ${formatDashboardCurrency(Math.round(page.revenue), locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty
              title={copy.pages.overview.bestPageEmpty}
              body="Des que les premieres visites seront capturees, cette section montrera quelles pages apportent vraiment de la valeur."
            />
          )}
        </DashboardSection>

        <DashboardSection title={copy.pages.overview.activeTestsTitle} description={copy.pages.overview.activeTestsDescription}>
          <DashboardMetricList
            items={[
              {
                label: copy.pages.overview.bestPage,
                value: bestPageLabel ?? copy.pages.overview.bestPageEmpty,
                note: topPage ? `${formatDashboardNumber(topPage.visits, locale)} visites et ${formatDashboardNumber(topPage.addToCart, locale)} ajouts au panier` : undefined
              },
              {
                label: copy.pages.overview.strongestInteraction,
                value: interactionLabel ?? copy.pages.overview.strongestInteractionEmpty,
                note: topInteraction ? `${formatDashboardNumber(topInteraction.totalClicks, locale)} clics sur ${formatPageLabel(topInteraction.pathname) ?? topInteraction.pathname}` : undefined
              },
              {
                label: copy.pages.overview.liveTests,
                value: runningExperiment ? runningExperiment.name : copy.pages.overview.noRunningTest,
                note: runningExperiment && runningStats ? `Meilleure variante: ${formatDashboardPercent(Math.max(...runningStats.variants.map((variant) => variant.conversionRate)), locale)}` : "Aucun test en cours pour le moment."
              }
            ]}
          />
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardSection title={copy.pages.overview.setupTitle} description={copy.pages.overview.setupDescription}>
          <DashboardMetricList
            items={[
              {
                label: copy.pages.overview.setupProgress,
                value: onboarding ? `${Math.round(onboarding.completionRatio * 100)}%` : copy.pages.overview.setupPending,
                note: onboarding?.currentStepLabel
              },
              {
                label: "Sessions rejouables",
                value: formatDashboardNumber(sessions.length, locale),
                note: `${formatDashboardNumber(behavior.totals.trackedClicks, locale)} clics suivis sur ${formatDashboardNumber(behavior.totals.trackedPages, locale)} pages`
              },
              {
                label: "Qualite de collecte",
                value: analytics.kpis.pageViews > 0 ? "OK" : "A verifier",
                note: analytics.kpis.pageViews > 0 ? "Des evenements remontent bien depuis le site." : "Le site semble encore trop peu alimente pour une lecture fiable."
              }
            ]}
          />
        </DashboardSection>

        <DashboardSection title={copy.pages.overview.recentSignalsTitle} description={copy.pages.overview.recentSignalsDescription}>
          {recentSignals.length > 0 ? (
            <DashboardMetricList
              items={recentSignals.map((item) => ({
                label: item.headline,
                value: item.goal,
                note: `${item.detail || "Sans detail supplementaire"} - ${formatDashboardDateTime(item.timestamp, locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty
              title="Pas encore de signaux recents"
              body="Cette zone affichera les derniers evenements vraiment utiles pour comprendre ce qui se passe sur la boutique."
            />
          )}
        </DashboardSection>
      </div>

      <DashboardSection
        title={copy.pages.overview.recommendationsTitle}
        description={copy.pages.overview.recommendationsDescription}
        aside={<DashboardStatusBadge label="Pas de faux IA" tone="warn" />}
      >
        {suggestions.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-3">
            {suggestions.slice(0, 3).map((suggestion) => (
              <div key={suggestion.id} className="rounded-[1.5rem] border border-[#ece3d7] bg-[#fffdfa] p-5">
                <p className="text-sm font-semibold text-[#2f261c]">{suggestion.title}</p>
                <p className="mt-2 text-sm leading-6 text-[#6a614f]">{suggestion.narrative}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <DashboardStatusBadge label={suggestion.recommendedType.replaceAll("_", " ")} tone="muted" />
                  <DashboardStatusBadge label={suggestion.expectedImpact} tone="good" />
                  <DashboardStatusBadge label={suggestion.primaryMetric.replaceAll("_", " ")} tone="default" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <DashboardEmpty title="Aucune suggestion disponible" body={copy.pages.overview.recommendationsDisclaimer} />
        )}
      </DashboardSection>
    </div>
  );
}

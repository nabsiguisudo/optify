import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getExperimentsByProject, getOnboardingProgress, getProjectAnalytics, getProjectBehaviorInsights, getProjectById, getProjectSessionDiagnostics } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import {
  formatDashboardCurrency,
  formatDashboardDateTime,
  formatDashboardNumber,
  formatDashboardPercent,
  getSiteDashboardCopy
} from "@/lib/site-dashboard";
import {
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
  const [analytics, behavior, onboarding, sessions] = await Promise.all([
    getProjectAnalytics(projectId),
    getProjectBehaviorInsights(projectId),
    getOnboardingProgress(projectId, locale),
    getProjectSessionDiagnostics(projectId, 4)
  ]);

  const topPage = behavior.topPages[0];
  const topInteraction = behavior.topInteractions[0];
  const recentSignals = behavior.eventFeed.slice(0, 4);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={copy.pages.overview.title}
        title={project.name}
        description={copy.pages.overview.description}
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
          </>
        )}
      />

      <DashboardSection title="Lecture immédiate" description="Quatre chiffres à regarder avant tout le reste.">
        <DashboardKpiGrid>
          <DashboardKpiCard label="Visiteurs" value={formatDashboardNumber(analytics.kpis.uniqueVisitors, locale)} />
          <DashboardKpiCard label="Vues de page" value={formatDashboardNumber(analytics.kpis.pageViews, locale)} tone="soft" />
          <DashboardKpiCard label="Ajouts au panier" value={formatDashboardNumber(analytics.kpis.addToCart, locale)} tone="warm" />
          <DashboardKpiCard label="Revenu observé" value={formatDashboardCurrency(Math.round(analytics.kpis.revenue), locale)} />
        </DashboardKpiGrid>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardSection
          title="Suite Analytics"
          description="La partie FullStory / analytics : trafic, clics, sessions, segments et lecture comportementale."
          aside={<DashboardStatusBadge label="Analyse comportementale" tone="good" />}
        >
          <DashboardMetricList
            items={[
              {
                label: "Analytics",
                value: `${formatDashboardNumber(analytics.kpis.pageViews, locale)} vues`,
                note: "Le hub de lecture du trafic, du funnel, des pages et des zones cliquées."
              },
              {
                label: "Sessions",
                value: `${formatDashboardNumber(sessions.length, locale)} replays`,
                note: "Accès aux replays, heatmaps, clics morts, rage clicks et diagnostics."
              },
              {
                label: "Segments",
                value: topPage ? formatPageLabel(topPage.pathname) ?? "Pages clés" : "À configurer",
                note: "Créer des vues ciblées à partir des pages, clics et étapes du funnel."
              }
            ]}
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}>Ouvrir Analytics</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/sessions`, locale)}>Ouvrir Sessions</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/segments`, locale)}>Ouvrir Segments</Link>
            </Button>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Suite Activation"
          description="La partie Dynamic Yield : suggestions, A/B tests, personnalisation, installation et mise en ligne."
          aside={<DashboardStatusBadge label="Tests & activation" tone="warn" />}
        >
          <DashboardMetricList
            items={[
              {
                label: "Expériences",
                value: `${formatDashboardNumber(experiments.length, locale)} créées`,
                note: runningExperiment ? `${runningExperiment.name} tourne actuellement.` : "Aucun test en cours pour le moment."
              },
              {
                label: "Installation",
                value: onboarding ? `${Math.round(onboarding.completionRatio * 100)}%` : "0%",
                note: onboarding?.currentStepLabel ?? "SDK et pixel à finaliser."
              },
              {
                label: "Suggestions",
                value: "Opportunités produit",
                note: "Cette zone doit servir à prioriser quoi lancer ensuite, sans surpromesse IA."
              }
            ]}
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/experiments`, locale)}>Ouvrir Expériences</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/installation`, locale)}>Ouvrir Installation</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/ai`, locale)}>Ouvrir Suggestions</Link>
            </Button>
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardSection title="Ce qui marche en ce moment" description="Des signaux simples, sans labels marketing flous.">
          {topPage || topInteraction ? (
            <DashboardMetricList
              items={[
                {
                  label: "Page la plus utile",
                  value: formatPageLabel(topPage?.pathname) ?? "Aucune",
                  note: topPage ? `${formatDashboardNumber(topPage.visits, locale)} visites, ${formatDashboardNumber(topPage.addToCart, locale)} ajouts au panier` : "Pas encore de page dominante."
                },
                {
                  label: "Interaction la plus forte",
                  value: topInteraction?.label || topInteraction?.selector || "Aucune",
                  note: topInteraction ? `${formatDashboardNumber(topInteraction.totalClicks, locale)} clics sur ${formatPageLabel(topInteraction.pathname) ?? topInteraction.pathname}` : "Pas encore d'interaction dominante."
                },
                {
                  label: "Taux de rebond",
                  value: formatDashboardPercent(analytics.kpis.bounceRate, locale),
                  note: "Permet de voir si les visiteurs décrochent trop tôt."
                }
              ]}
            />
          ) : (
            <DashboardEmpty title="Pas encore assez de signal" body="Dès que la boutique remontera plus de trafic, cette zone affichera ce qui fonctionne vraiment." />
          )}
        </DashboardSection>

        <DashboardSection title="Derniers signaux capturés" description="Les derniers événements utiles pour vérifier que le site vit vraiment.">
          {recentSignals.length > 0 ? (
            <DashboardMetricList
              items={recentSignals.map((item) => ({
                label: item.headline,
                value: item.goal,
                note: `${item.detail || "Sans détail supplémentaire"} — ${formatDashboardDateTime(item.timestamp, locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty title="Aucun signal récent" body="Cette zone affichera les derniers événements réellement remontés depuis la boutique." />
          )}
        </DashboardSection>
      </div>
    </div>
  );
}

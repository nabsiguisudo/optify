import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getExperimentsByProject,
  getOnboardingProgress,
  getProjectAnalytics,
  getProjectBehaviorInsights,
  getProjectById,
  getProjectSessionDiagnostics
} from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import {
  formatDashboardCurrency,
  formatDashboardDateTime,
  formatDashboardDuration,
  formatDashboardNumber,
  formatDashboardPercent,
  getSiteDashboardCopy
} from "@/lib/site-dashboard";
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

function formatPageLabel(pathname?: string) {
  if (!pathname) return "Non définie";
  if (pathname === "/" || pathname === "/home") return "Accueil";
  return pathname;
}

function formatDeviceLabel(deviceType: "desktop" | "tablet" | "mobile" | "unknown") {
  if (deviceType === "mobile") return "Mobile";
  if (deviceType === "tablet") return "Tablette";
  if (deviceType === "desktop") return "Desktop";
  return "Inconnu";
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
  const projectPromise = getProjectById(projectId);
  const experimentsPromise = getExperimentsByProject(projectId);
  const project = await projectPromise;
  if (!project) notFound();

  const experiments = await experimentsPromise;
  const runningExperiment = experiments.find((experiment) => experiment.status === "running");
  const [analytics, behavior, onboarding, sessions] = await Promise.all([
    getProjectAnalytics(projectId),
    getProjectBehaviorInsights(projectId),
    getOnboardingProgress(projectId, locale),
    getProjectSessionDiagnostics(projectId, 5)
  ]);

  const topPages = behavior.topPages.slice(0, 5);
  const topInteractions = behavior.topInteractions.slice(0, 5);
  const recentSignals = behavior.eventFeed.slice(0, 5);
  const sessionPlaylist = sessions.slice(0, 5);
  const frictionSessions = sessions.filter((session) => session.rageClicks > 0 || session.deadClicks > 0 || session.jsErrors > 0);
  const mobileSessions = sessions.filter((session) => session.deviceType === "mobile").length;
  const desktopSessions = sessions.filter((session) => session.deviceType === "desktop").length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={copy.pages.overview.title}
        title={project.name}
        description="Un dashboard plus lisible, inspiré des outils d'analyse comportementale: trafic en haut, sessions visibles tout de suite, puis pages, frictions et activation."
        actions={(
          <>
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}>Ouvrir Analytics</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/experiments`, locale)}>Ouvrir Expériences</Link>
            </Button>
          </>
        )}
        meta={(
          <>
            <DashboardStatusBadge label={project.platform} />
            <DashboardStatusBadge label={project.domain} tone="muted" />
            <DashboardStatusBadge label={`${formatDashboardNumber(experiments.length, locale)} expériences`} tone="warn" />
          </>
        )}
      />

      <DashboardKpiGrid>
        <DashboardKpiCard label="Visiteurs" value={formatDashboardNumber(analytics.kpis.uniqueVisitors, locale)} />
        <DashboardKpiCard label="Sessions" value={formatDashboardNumber(analytics.kpis.sessions, locale)} tone="soft" />
        <DashboardKpiCard label="Ajouts au panier" value={formatDashboardNumber(analytics.kpis.addToCart, locale)} tone="warm" />
        <DashboardKpiCard
          label="Chiffre d'affaires observé"
          value={formatDashboardCurrency(Math.round(analytics.kpis.revenue), locale)}
          hint={`${formatDashboardNumber(analytics.kpis.purchases, locale)} achats suivis`}
        />
      </DashboardKpiGrid>

      <DashboardWidgetGrid className="xl:grid-cols-[1.08fr_0.92fr]">
        <DashboardWidget
          title="Sessions récentes"
          description="Une playlist compacte des dernières visites pour voir tout de suite si le trafic est réel."
          aside={<DashboardStatusBadge label={`${formatDashboardNumber(sessionPlaylist.length, locale)} visibles`} tone="good" />}
        >
          {sessionPlaylist.length > 0 ? (
            <DashboardCompactList
              items={sessionPlaylist.map((session) => ({
                label: session.anonymousId || session.sessionId,
                value: formatDeviceLabel(session.deviceType),
                note: `${formatDashboardDateTime(session.startedAt, locale)} · ${session.pages} pages · ${formatDashboardDuration(session.durationMs, locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty
              title="Aucune session visible"
              body="Dès que la boutique remonte des visites, la playlist de sessions apparaîtra ici comme point d'entrée principal."
            />
          )}
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/sessions`, locale)}>Voir toutes les sessions</Link>
            </Button>
          </div>
        </DashboardWidget>

        <DashboardWidget
          title="État du trafic"
          description="Les signaux essentiels à lire avant d'aller plus loin dans Analytics."
          aside={<DashboardStatusBadge label={`${formatDashboardPercent(analytics.kpis.bounceRate, locale)} de rebond`} tone="muted" />}
        >
          <DashboardCompactList
            items={[
              {
                label: "Page d'entrée principale",
                value: topPages[0] ? formatPageLabel(topPages[0].pathname) : "Aucune",
                note: topPages[0] ? `${formatDashboardNumber(topPages[0].visits, locale)} visites observées` : "Pas encore assez de trafic sur la période."
              },
              {
                label: "Interaction dominante",
                value: topInteractions[0]?.label || topInteractions[0]?.selector || "Aucune",
                note: topInteractions[0]
                  ? `${formatDashboardNumber(topInteractions[0].totalClicks, locale)} clics sur ${formatPageLabel(topInteractions[0].pathname)}`
                  : "Aucune zone d'interaction n'émerge encore."
              },
              {
                label: "Sessions avec friction",
                value: formatDashboardNumber(frictionSessions.length, locale),
                note: `${formatDashboardNumber(sessions.reduce((sum, session) => sum + session.rageClicks + session.deadClicks, 0), locale)} signaux de blocage détectés`
              },
              {
                label: "Répartition device",
                value: `${formatDashboardNumber(mobileSessions, locale)} mobile / ${formatDashboardNumber(desktopSessions, locale)} desktop`,
                note: "Pour voir rapidement si le trafic récent vient surtout du mobile ou du desktop."
              }
            ]}
          />
        </DashboardWidget>
      </DashboardWidgetGrid>

      <DashboardWidgetGrid>
        <DashboardWidget
          title="Pages qui concentrent l'attention"
          description="Les pages les plus visitées et celles qui transforment vraiment en intention."
        >
          {topPages.length > 0 ? (
            <DashboardCompactList
              items={topPages.map((page) => ({
                label: formatPageLabel(page.pathname),
                value: `${formatDashboardNumber(page.visits, locale)} visites`,
                note: `${formatDashboardNumber(page.clicks, locale)} clics · ${formatDashboardNumber(page.addToCart, locale)} ajouts au panier · ${formatDashboardCurrency(Math.round(page.revenue), locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty title="Pas encore de pages fortes" body="Cette zone mettra en avant les pages qui concentrent trafic, clics et revenu dès que le volume sera suffisant." />
          )}
        </DashboardWidget>

        <DashboardWidget
          title="Derniers signaux remontés"
          description="Un flux court pour valider que la collecte tourne et comprendre ce qui se passe maintenant."
        >
          {recentSignals.length > 0 ? (
            <DashboardCompactList
              items={recentSignals.map((signal) => ({
                label: signal.headline,
                value: signal.goal,
                note: `${signal.detail || "Sans détail"} · ${formatDashboardDateTime(signal.timestamp, locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty title="Aucun signal récent" body="Cette zone affichera les derniers événements utiles dès que la boutique enverra plus d'activité." />
          )}
        </DashboardWidget>
      </DashboardWidgetGrid>

      <DashboardWidgetGrid className="xl:grid-cols-[0.95fr_1.05fr]">
        <DashboardWidget
          title="Analyse et lecture"
          description="Le versant FullStory: sessions, pages, clics, segments et compréhension du trafic."
          aside={<DashboardStatusBadge label="Analyse" tone="good" />}
        >
          <DashboardCompactList
            items={[
              {
                label: "Analytics",
                value: `${formatDashboardNumber(analytics.kpis.pageViews, locale)} pages vues`,
                note: "Trafic, funnel, pages, zones cliquées et qualité de collecte."
              },
              {
                label: "Sessions",
                value: `${formatDashboardNumber(sessions.length, locale)} replays`,
                note: "Lecteur de session, heatmaps et signaux de friction."
              },
              {
                label: "Segments",
                value: "À construire",
                note: "Créer des vues ciblées par page, source, device, clic ou étape du parcours."
              }
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}>Ouvrir Analytics</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/segments`, locale)}>Ouvrir Segments</Link>
            </Button>
          </div>
        </DashboardWidget>

        <DashboardWidget
          title="Activation et tests"
          description="Le versant Dynamic Yield: expériences, personnalisation, installation et mise en ligne."
          aside={<DashboardStatusBadge label="Activation" tone="warn" />}
        >
          <DashboardCompactList
            items={[
              {
                label: "Expérience en cours",
                value: runningExperiment?.name || "Aucune",
                note: runningExperiment ? "Un test est actuellement en diffusion sur la boutique." : "Aucun test en cours pour le moment."
              },
              {
                label: "Installation Shopify",
                value: onboarding ? `${Math.round(onboarding.completionRatio * 100)}%` : "0%",
                note: onboarding?.currentStepLabel ?? "Snippet, pixel et vérifications à finaliser."
              },
              {
                label: "Suggestions",
                value: "Heuristiques produit",
                note: "Cette zone doit rester honnête: pas de faux label IA tant qu'aucun moteur réel n'alimente ces recommandations."
              }
            ]}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/experiments`, locale)}>Ouvrir Expériences</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/installation`, locale)}>Ouvrir Installation</Link>
            </Button>
          </div>
        </DashboardWidget>
      </DashboardWidgetGrid>
    </div>
  );
}

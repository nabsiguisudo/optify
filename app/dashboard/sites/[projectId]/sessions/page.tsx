import { notFound } from "next/navigation";
import { PageHeatmaps } from "@/components/dashboard/page-heatmaps";
import { ReplayHub } from "@/components/dashboard/replay-hub";
import { SessionInbox } from "@/components/dashboard/session-inbox";
import {
  DashboardEmpty,
  DashboardKpiCard,
  DashboardKpiGrid,
  DashboardMetricList,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatusBadge
} from "@/components/dashboard/site-dashboard-primitives";
import { getExperimentsByProject, getProjectBehaviorInsights, getProjectById, getProjectPageHeatmaps, getProjectReplayOpportunities, getProjectSessionDiagnostics } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";
import { formatDashboardNumber, getSiteDashboardCopy } from "@/lib/site-dashboard";

export default async function SiteSessionsPage({
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
  const [sessions, opportunities, behavior, heatmaps] = await Promise.all([
    getProjectSessionDiagnostics(projectId, 6),
    getProjectReplayOpportunities(projectId),
    getProjectBehaviorInsights(projectId),
    getProjectPageHeatmaps(projectId)
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={copy.pages.sessions.title}
        title={project.name}
        description={copy.pages.sessions.description}
        meta={(
          <>
            <DashboardStatusBadge label={`${formatDashboardNumber(sessions.length, locale)} replays`} tone="good" />
            <DashboardStatusBadge label={`${formatDashboardNumber(behavior.topInteractions.length, locale)} hotspots`} tone="muted" />
          </>
        )}
      />

      {sessions.length > 0 ? (
        <>
          <DashboardSection title={copy.pages.sessions.replayTitle} description={copy.pages.sessions.replayDescription}>
            <DashboardKpiGrid>
              <DashboardKpiCard label="Sessions rejouables" value={formatDashboardNumber(sessions.length, locale)} />
              <DashboardKpiCard label="Hotspots de clic" value={formatDashboardNumber(behavior.topInteractions.length, locale)} tone="soft" />
              <DashboardKpiCard label="Rage clicks" value={formatDashboardNumber(sessions.reduce((sum, session) => sum + session.rageClicks, 0), locale)} tone="warm" />
              <DashboardKpiCard label="Clics sans effet" value={formatDashboardNumber(sessions.reduce((sum, session) => sum + session.deadClicks, 0), locale)} />
            </DashboardKpiGrid>
          </DashboardSection>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <DashboardSection title={copy.pages.sessions.diagnosticsTitle} description={copy.pages.sessions.diagnosticsDescription}>
              <DashboardMetricList
                items={[
                  {
                    label: "Couverture actuelle",
                    value: "Replay + heatmaps",
                    note: "Le lecteur actuel enregistre les pages, clics, scrolls et signaux de friction. Il ne faut pas le vendre comme un clone pixel perfect de Clarity tant que ce n'est pas le cas."
                  },
                  {
                    label: "Sessions avec friction",
                    value: formatDashboardNumber(sessions.filter((session) => session.rageClicks > 0 || session.deadClicks > 0).length, locale),
                    note: "Visiteurs qui ont montre des signes de blocage ou d'hesitation."
                  },
                  {
                    label: "Conversions dans les replays",
                    value: formatDashboardNumber(sessions.reduce((sum, session) => sum + session.conversions, 0), locale),
                    note: "Nombre total de conversions observees dans l'echantillon recent."
                  }
                ]}
              />
            </DashboardSection>

            <DashboardSection title={copy.pages.sessions.hotspotsTitle} description={copy.pages.sessions.hotspotsDescription}>
              {behavior.topInteractions.length > 0 ? (
                <DashboardMetricList
                  items={behavior.topInteractions.slice(0, 5).map((item) => ({
                    label: item.label || item.selector || "Element sans libelle",
                    value: `${formatDashboardNumber(item.totalClicks, locale)} clics`,
                    note: `${item.pathname} - ${item.goal}`
                  }))}
                />
              ) : (
                <DashboardEmpty title="Aucun hotspot clair" body="Les hotspots apparaitront ici des que suffisamment de clics seront enregistres sur la boutique." />
              )}
            </DashboardSection>
          </div>

          {heatmaps.length > 0 ? <PageHeatmaps pages={heatmaps} /> : null}
          <SessionInbox projectId={projectId} sessions={sessions} />
          <ReplayHub experimentName={runningExperiment?.name} sessions={sessions.slice(0, 3)} opportunities={opportunities} />
        </>
      ) : (
        <DashboardSection title={copy.pages.sessions.replayTitle} description={copy.pages.sessions.replayDescription}>
          <DashboardEmpty title="Pas encore de replay" body={copy.pages.sessions.noReplay} />
        </DashboardSection>
      )}
    </div>
  );
}

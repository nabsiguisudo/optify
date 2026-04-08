import { notFound } from "next/navigation";
import {
  DashboardEmpty,
  DashboardKpiCard,
  DashboardKpiGrid,
  DashboardMetricList,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatusBadge
} from "@/components/dashboard/site-dashboard-primitives";
import { getOnboardingProgress, getProjectBehaviorInsights, getProjectById, getProjectLaunchAuditTrail, getSdkDiagnostics } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";
import { formatDashboardDateTime, formatDashboardNumber, formatDashboardStatus, getSiteDashboardCopy } from "@/lib/site-dashboard";

export default async function SiteActivityPage({
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

  const [auditTrail, onboarding, sdkDiagnostics, behavior] = await Promise.all([
    getProjectLaunchAuditTrail(projectId, 18),
    getOnboardingProgress(projectId, locale),
    getSdkDiagnostics(projectId),
    getProjectBehaviorInsights(projectId)
  ]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={copy.pages.activity.title}
        title={project.name}
        description={copy.pages.activity.description}
        meta={(
          <>
            <DashboardStatusBadge label={sdkDiagnostics ? formatDashboardStatus(sdkDiagnostics.status, locale) : "Inconnu"} tone="good" />
            <DashboardStatusBadge label={`${formatDashboardNumber(auditTrail.length, locale)} actions`} tone="muted" />
          </>
        )}
      />

      <DashboardSection title={copy.pages.activity.onboardingTitle} description={copy.pages.activity.onboardingDescription}>
        <DashboardKpiGrid>
          <DashboardKpiCard label="Progression" value={onboarding ? `${Math.round(onboarding.completionRatio * 100)}%` : "0%"} />
          <DashboardKpiCard label="Statut SDK" value={sdkDiagnostics ? formatDashboardStatus(sdkDiagnostics.status, locale) : "Inconnu"} tone="soft" />
          <DashboardKpiCard label="Evenements recents" value={formatDashboardNumber(sdkDiagnostics?.transport.recentEventCount ?? 0, locale)} tone="warm" />
          <DashboardKpiCard label="Historique workflow" value={formatDashboardNumber(auditTrail.length, locale)} />
        </DashboardKpiGrid>
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardSection title={copy.pages.activity.sdkTitle} description={copy.pages.activity.sdkDescription}>
          <DashboardMetricList
            items={[
              {
                label: "Dernier evenement",
                value: sdkDiagnostics?.transport.lastEventAt ? formatDashboardDateTime(sdkDiagnostics.transport.lastEventAt, locale) : "Aucun",
                note: "Le dernier signal recu par la couche de collecte."
              },
              {
                label: "Taux d'erreur",
                value: `${Math.round((sdkDiagnostics?.transport.errorRate ?? 0) * 100)}%`,
                note: "Plus ce taux est bas, plus la collecte est fiable."
              },
              {
                label: "Taux de doublons",
                value: `${Math.round((sdkDiagnostics?.transport.duplicateRate ?? 0) * 100)}%`,
                note: `${formatDashboardNumber(behavior.totals.trackedPages, locale)} pages suivies aujourd'hui`
              }
            ]}
          />
        </DashboardSection>

        <DashboardSection title={copy.pages.activity.feedTitle} description={copy.pages.activity.feedDescription}>
          {behavior.eventFeed.length > 0 ? (
            <DashboardMetricList
              items={behavior.eventFeed.slice(0, 6).map((item) => ({
                label: item.headline,
                value: item.goal,
                note: `${item.detail || "Sans detail"} - ${formatDashboardDateTime(item.timestamp, locale)}`
              }))}
            />
          ) : (
            <DashboardEmpty title="Pas encore d'activite brute" body="Cette zone montrera les derniers evenements recus pour que tu puisses verifier la collecte." />
          )}
        </DashboardSection>
      </div>

      <DashboardSection title={copy.pages.activity.auditTitle} description={copy.pages.activity.auditDescription}>
        {auditTrail.length > 0 ? (
          <DashboardMetricList
            items={auditTrail.map((entry) => ({
              label: entry.note,
              value: formatDashboardStatus(entry.action, locale),
              note: formatDashboardDateTime(entry.timestamp, locale)
            }))}
          />
        ) : (
          <DashboardEmpty title="Aucune action historique" body="Les validations, lancements et changements d'etat apparaitront ici." />
        )}
      </DashboardSection>
    </div>
  );
}

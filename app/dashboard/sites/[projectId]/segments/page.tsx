import { notFound } from "next/navigation";
import { SegmentsStudio } from "@/components/dashboard/segments-studio";
import { DashboardPageHeader, DashboardStatusBadge } from "@/components/dashboard/site-dashboard-primitives";
import { getProjectBehaviorInsights, getProjectById } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import { formatDashboardNumber, getSiteDashboardCopy } from "@/lib/site-dashboard";

export default async function SiteSegmentsPage({
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

  const behavior = await getProjectBehaviorInsights(projectId);

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={copy.pages.segments.title}
        title={project.name}
        description="Un vrai studio de segments pour construire des vues comportementales riches: filtres user, filtres events, groupes AND / OR, éléments sauvegardés et épinglage vers Analytics."
        meta={(
          <>
            <DashboardStatusBadge label="Segment builder" tone="good" />
            <DashboardStatusBadge label={`${formatDashboardNumber(behavior.topPages.length, locale)} pages utiles`} tone="muted" />
            <DashboardStatusBadge label={`${formatDashboardNumber(behavior.topInteractions.length, locale)} interactions clés`} />
          </>
        )}
      />

      <SegmentsStudio
        projectId={projectId}
        analyticsHref={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}
      />
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getOnboardingProgress, getProjectBehaviorInsights, getProjectById, getProjectLaunchAuditTrail, getSdkDiagnostics } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";

export default async function SiteActivityPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  const locale = resolveLocale((await searchParams).lang);
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
      <Card className="bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Activity</h1>
            <p className="mt-2 max-w-3xl text-muted-foreground">
              Operational and technical state for {project.name}. Use this page for onboarding progress, SDK transport, workflow history, and the raw stream of recent site activity. Use Analytics for interpretation and KPI reading.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/installation`, locale)}>Open installation</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}>Open analytics</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Onboarding</p>
          <p className="mt-2 text-3xl font-semibold">{onboarding ? `${Math.round(onboarding.completionRatio * 100)}%` : "0%"}</p>
          <p className="mt-2 text-sm text-muted-foreground">{onboarding?.currentStepLabel ?? "No onboarding state available."}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">SDK status</p>
          <p className="mt-2 text-3xl font-semibold">{sdkDiagnostics?.status ?? "unknown"}</p>
          <p className="mt-2 text-sm text-muted-foreground">Current transport health and delivery confidence.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Recent events</p>
          <p className="mt-2 text-3xl font-semibold">{sdkDiagnostics?.transport.recentEventCount ?? 0}</p>
          <p className="mt-2 text-sm text-muted-foreground">Events seen recently by the SDK transport.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Workflow actions</p>
          <p className="mt-2 text-3xl font-semibold">{auditTrail.length}</p>
          <p className="mt-2 text-sm text-muted-foreground">Launch, approval and workflow state changes recorded.</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-white">
          <p className="text-lg font-semibold">Onboarding status</p>
          {onboarding ? (
            <div className="mt-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{onboarding.currentStepLabel}</p>
                <Badge className="bg-primary text-white">{Math.round(onboarding.completionRatio * 100)}%</Badge>
              </div>
              <div className="mt-3 h-3 rounded-full bg-secondary">
                <div className="h-3 rounded-full bg-primary" style={{ width: `${Math.round(onboarding.completionRatio * 100)}%` }} />
              </div>
              <div className="mt-4 space-y-3">
                {onboarding.checklist.map((item) => (
                  <div key={item.key} className="rounded-3xl border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.title}</p>
                      <Badge className={item.status === "complete" ? "bg-primary text-white" : item.status === "current" ? "bg-[#f4d07a] text-[#11291f]" : ""}>{item.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No onboarding state available.</div>
          )}
        </Card>

        <Card className="bg-white">
          <p className="text-lg font-semibold">SDK transport snapshot</p>
          {sdkDiagnostics ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-secondary/50 p-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="mt-2 text-xl font-semibold">{sdkDiagnostics.status}</p>
                </div>
                <div className="rounded-3xl bg-secondary/50 p-4">
                  <p className="text-sm text-muted-foreground">Recent events</p>
                  <p className="mt-2 text-xl font-semibold">{sdkDiagnostics.transport.recentEventCount}</p>
                </div>
                <div className="rounded-3xl bg-secondary/50 p-4">
                  <p className="text-sm text-muted-foreground">Last event</p>
                  <p className="mt-2 text-sm font-semibold">{sdkDiagnostics.transport.lastEventAt ? new Date(sdkDiagnostics.transport.lastEventAt).toLocaleString("fr-FR") : "No event yet"}</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Error rate <span className="font-semibold">{Math.round((sdkDiagnostics.transport.errorRate ?? 0) * 100)}%</span></div>
                <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Duplicate rate <span className="font-semibold">{Math.round((sdkDiagnostics.transport.duplicateRate ?? 0) * 100)}%</span></div>
                <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Observed pages <span className="font-semibold">{behavior.totals.trackedPages}</span></div>
              </div>
              <div className="rounded-3xl bg-[#11291f] p-5 text-[#f8f3e6]">
                <p className="text-sm font-medium">Top event types</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sdkDiagnostics.eventTypes.length > 0 ? sdkDiagnostics.eventTypes.map((item) => (
                    <span key={item.type} className="rounded-full bg-white/10 px-3 py-1 text-sm">{item.type} - {item.count}</span>
                  )) : <span className="text-sm text-[#f8f3e6]/70">No events yet.</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No SDK snapshot available yet.</div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="bg-white">
          <p className="text-lg font-semibold">Live activity feed</p>
          <p className="mt-2 text-sm text-muted-foreground">Raw recent events, useful for debugging collection and understanding what just happened on the site.</p>
          <div className="mt-5 space-y-3">
            {behavior.eventFeed.length > 0 ? behavior.eventFeed.map((item) => (
              <div key={item.id} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{item.headline}</p>
                  <Badge>{item.goal}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.detail || "No extra context captured."}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(item.timestamp).toLocaleString("fr-FR")}</p>
              </div>
            )) : <div className="rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No raw activity available yet.</div>}
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-lg font-semibold">Launch and workflow history</p>
          <p className="mt-2 text-sm text-muted-foreground">Human and system actions around experiments, approvals and launches.</p>
          <div className="mt-5 space-y-3">
            {auditTrail.length > 0 ? auditTrail.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{entry.note}</p>
                  <Badge>{entry.action.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{new Date(entry.timestamp).toLocaleString("fr-FR")}</p>
              </div>
            )) : <div className="rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No actions recorded for this site yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

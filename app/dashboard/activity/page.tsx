import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLaunchAuditTrail, getOnboardingProgress, getProjects, getSdkDiagnostics } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const projects = await getProjects();
  const primaryProject = projects[0];
  const [auditTrail, onboarding, sdkDiagnostics] = await Promise.all([
    getLaunchAuditTrail(18),
    primaryProject ? getOnboardingProgress(primaryProject.id, locale) : Promise.resolve(undefined),
    primaryProject ? getSdkDiagnostics(primaryProject.id) : Promise.resolve(undefined)
  ]);

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Activity</h1>
            <p className="mt-2 text-muted-foreground">This page owns operational history: launch actions, onboarding progress and SDK health. It keeps audit traces out of the main overview.</p>
          </div>
          {primaryProject ? (
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/projects/${primaryProject.id}/installation`, locale)}>Open installation</Link>
            </Button>
          ) : null}
        </div>
      </Card>

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
            <div className="mt-5 rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">Create a project to unlock onboarding tracking.</div>
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

      <Card className="bg-white">
        <p className="text-lg font-semibold">Launch and workflow history</p>
        <div className="mt-5 space-y-3">
          {auditTrail.length > 0 ? auditTrail.map((entry) => (
            <div key={entry.id} className="rounded-3xl border border-border p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{entry.note}</p>
                <Badge>{entry.action.replaceAll("_", " ")}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{new Date(entry.timestamp).toLocaleString("fr-FR")}</p>
            </div>
          )) : <div className="rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No actions have been recorded yet.</div>}
        </div>
      </Card>
    </div>
  );
}

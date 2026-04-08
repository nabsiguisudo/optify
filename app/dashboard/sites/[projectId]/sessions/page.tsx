import { notFound } from "next/navigation";
import { PageHeatmaps } from "@/components/dashboard/page-heatmaps";
import { ReplayHub } from "@/components/dashboard/replay-hub";
import { SessionInbox } from "@/components/dashboard/session-inbox";
import { Card } from "@/components/ui/card";
import { getExperimentsByProject, getProjectBehaviorInsights, getProjectById, getProjectPageHeatmaps, getProjectReplayOpportunities, getProjectSessionDiagnostics } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";

export default async function SiteSessionsPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  resolveLocale((await searchParams).lang);
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
      <Card className="bg-white">
        <h1 className="text-3xl font-semibold">Sessions</h1>
        <p className="mt-2 text-muted-foreground">Browse recent visitors, open any replay with one click, and inspect click heatmaps plus scroll heatmaps for {project.name}.</p>
      </Card>
      {sessions.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="bg-white">
              <p className="text-sm text-muted-foreground">Replayable sessions</p>
              <p className="mt-2 text-3xl font-semibold">{sessions.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">Sessions with enough tracked events to inspect.</p>
            </Card>
            <Card className="bg-white">
              <p className="text-sm text-muted-foreground">Click hotspots</p>
              <p className="mt-2 text-3xl font-semibold">{behavior.topInteractions.length}</p>
              <p className="mt-2 text-sm text-muted-foreground">Top tracked selectors and elements clicked by users.</p>
            </Card>
            <Card className="bg-white">
              <p className="text-sm text-muted-foreground">Rage clicks</p>
              <p className="mt-2 text-3xl font-semibold">{sessions.reduce((sum, session) => sum + session.rageClicks, 0)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Detected frustration signals across the recent sample.</p>
            </Card>
            <Card className="bg-white">
              <p className="text-sm text-muted-foreground">Dead clicks</p>
              <p className="mt-2 text-3xl font-semibold">{sessions.reduce((sum, session) => sum + session.deadClicks, 0)}</p>
              <p className="mt-2 text-sm text-muted-foreground">Clicks on elements that did not progress the journey.</p>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card className="bg-white">
              <p className="text-lg font-semibold">Current scope</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Available now: recorded storefront player, frame-by-frame timeline, playback speed controls, click overlays, scroll position markers, click heatmaps, scroll heatmaps, rage clicks, dead clicks.</div>
                <div className="rounded-2xl bg-secondary/50 p-4 text-sm">Still improving vs Clarity: cursor trails between frames, richer DOM mutation interpolation, and more exact visual fidelity between captures.</div>
              </div>
            </Card>
            <Card className="bg-white">
              <p className="text-lg font-semibold">Top click hotspots</p>
              <div className="mt-4 space-y-3">
                {behavior.topInteractions.slice(0, 4).map((item) => (
                  <div key={item.key} className="rounded-2xl border border-border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{item.pathname}</p>
                      </div>
                      <div className="rounded-full bg-secondary px-3 py-1 text-sm">{item.totalClicks} clicks</div>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{item.selector}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {heatmaps.length > 0 ? <PageHeatmaps pages={heatmaps} /> : null}
          <SessionInbox projectId={projectId} sessions={sessions} />
          <ReplayHub experimentName={runningExperiment?.name} sessions={sessions.slice(0, 3)} opportunities={opportunities} />
        </>
      ) : (
        <Card className="bg-white">
          <p className="text-lg font-semibold">No replay data yet</p>
          <p className="mt-2 text-sm text-muted-foreground">No site sessions have been captured yet. Reload the storefront with the SDK installed, generate a few events, then replay and diagnostics will appear here.</p>
        </Card>
      )}
    </div>
  );
}

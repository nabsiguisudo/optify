import { ReplayHub } from "@/components/dashboard/replay-hub";
import { SessionDiagnostics } from "@/components/dashboard/session-diagnostics";
import { Card } from "@/components/ui/card";
import { getAllExperiments, getReplayOpportunities, getSessionDiagnostics } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";

export default async function SessionsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  resolveLocale((await searchParams).lang);
  const experiments = await getAllExperiments();
  const runningExperiment = experiments.find((experiment) => experiment.status === "running");
  const [sessions, opportunities] = runningExperiment
    ? await Promise.all([getSessionDiagnostics(runningExperiment.id, 6), getReplayOpportunities(runningExperiment.id)])
    : [[], []];

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <h1 className="text-3xl font-semibold">Sessions</h1>
        <p className="mt-2 text-muted-foreground">This page owns replay and UX diagnostics. Keep it separate from the overview so the product feels closer to a real FullStory-like module.</p>
      </Card>

      {runningExperiment && sessions.length > 0 ? (
        <>
          <ReplayHub experimentName={runningExperiment.name} sessions={sessions.slice(0, 3)} opportunities={opportunities} />
          <SessionDiagnostics sessions={sessions} />
        </>
      ) : (
        <Card className="bg-white">
          <p className="text-lg font-semibold">No replay data yet</p>
          <p className="mt-2 text-sm text-muted-foreground">Launch a running experiment to unlock the replay hub and the navigable diagnostics view here.</p>
        </Card>
      )}
    </div>
  );
}

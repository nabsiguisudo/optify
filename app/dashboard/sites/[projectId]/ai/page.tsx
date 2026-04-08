import Link from "next/link";
import { notFound } from "next/navigation";
import { AiCopilotPanel } from "@/components/dashboard/ai-copilot-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAiCopilotInsights, getAiExperimentQueue, getProjectBehaviorInsights, getProjectById, getProjectSessionDiagnostics } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import { formatNumber } from "@/lib/utils";

export default async function SiteAiPage({
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
  const [aiQueue, aiCopilot, behavior, sessions] = await Promise.all([
    getAiExperimentQueue(locale),
    getAiCopilotInsights(locale),
    getProjectBehaviorInsights(projectId),
    getProjectSessionDiagnostics(projectId, 6)
  ]);

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-primary/10 text-primary">Decide</Badge>
              <Badge>AI-native strategist</Badge>
            </div>
            <h1 className="mt-4 text-3xl font-semibold">AI copilot</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              This is where Optify behaves like the brain of the product: it reads the site, the traffic, the friction, and the sessions, then turns that into concrete tests or feature ideas to launch next.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/experiments`, locale)}>Move to execution</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/sessions`, locale)}>Review evidence</Link>
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Recommendations</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(aiQueue.total)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Ideas generated across tests, layout changes, pricing and funnel improvements.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Ready now</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(aiQueue.ready)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Suggestions mature enough to be reviewed and pushed toward launch.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Behavior signals</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(behavior.topInteractions.length)}</p>
          <p className="mt-2 text-sm text-muted-foreground">High-signal interactions currently feeding the copilot logic.</p>
        </Card>
        <Card className="bg-white">
          <p className="text-sm text-muted-foreground">Replay sample</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(sessions.length)}</p>
          <p className="mt-2 text-sm text-muted-foreground">Recent sessions the copilot can use as behavioral evidence.</p>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="bg-white">
          <div className="flex items-center justify-between gap-3">
            <p className="text-lg font-semibold">What the copilot should do</p>
            <Badge>{"Observe -> Decide -> Act"}</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary/40 p-4 text-sm">
              <p className="font-semibold">1. Read the site</p>
              <p className="mt-2 text-muted-foreground">Understand page structure, conversion flow, messaging, catalog and current UX patterns.</p>
            </div>
            <div className="rounded-2xl bg-secondary/40 p-4 text-sm">
              <p className="font-semibold">2. Read behavior</p>
              <p className="mt-2 text-muted-foreground">Use sessions, funnels, heatmaps, friction signals and click patterns as proof, not decoration.</p>
            </div>
            <div className="rounded-2xl bg-secondary/40 p-4 text-sm">
              <p className="font-semibold">3. Recommend action</p>
              <p className="mt-2 text-muted-foreground">Propose the best next test, feature, page change or message, with impact, risk and rationale.</p>
            </div>
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-lg font-semibold">Current AI mix</p>
          <div className="mt-5 space-y-3">
            {aiQueue.types.map(([type, count]) => (
              <div key={type} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm">
                <span>{type.replaceAll("_", " ")}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="bg-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-lg font-semibold">AI recommendation queue</p>
          <Button asChild variant="outline">
            <Link href={withLang(`/dashboard/sites/${projectId}/experiments`, locale)}>Turn recommendation into experiment</Link>
          </Button>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {aiQueue.suggestions.map((suggestion) => (
            <div key={`${suggestion.title}-${suggestion.type}`} className="rounded-3xl border border-border p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{suggestion.type.replaceAll("_", " ")}</Badge>
                <Badge className={suggestion.approvalState === "ready_for_review" ? "bg-primary text-white" : ""}>{(suggestion.approvalState ?? "draft").replaceAll("_", " ")}</Badge>
                <Badge>{suggestion.expectedImpact} impact</Badge>
              </div>
              <p className="mt-4 text-lg font-semibold">{suggestion.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{suggestion.hypothesis}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-secondary px-3 py-1">Metric {suggestion.primaryMetric ?? "conversion"}</span>
                <span className="rounded-full bg-secondary px-3 py-1">Target {suggestion.targetSelector ?? "homepage hero"}</span>
              </div>
              <div className="mt-4 space-y-2">
                {suggestion.changes.slice(0, 3).map((change) => (
                  <div key={change} className="rounded-2xl bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
                    {change}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <AiCopilotPanel insights={aiCopilot} />
    </div>
  );
}

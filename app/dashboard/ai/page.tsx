import Link from "next/link";
import { AiCopilotPanel } from "@/components/dashboard/ai-copilot-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAiCopilotInsights, getAiExperimentQueue, getProjects } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import { formatNumber } from "@/lib/utils";

export default async function AiPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const [aiQueue, aiCopilot, projects] = await Promise.all([
    getAiExperimentQueue(locale),
    getAiCopilotInsights(locale),
    getProjects()
  ]);
  const projectId = projects[0]?.id ?? "proj_1";

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">AI workspace</h1>
            <p className="mt-2 text-muted-foreground">This page owns AI-generated experimentation: queue, rationale, prioritization, test types and direct review paths.</p>
          </div>
          <Button asChild>
            <Link href={withLang(`/dashboard/projects/${projectId}/suggestions`, locale)}>Open project AI inbox</Link>
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="bg-[linear-gradient(135deg,#135c43_0%,#1d7c5b_100%)] text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Generated tests</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(aiQueue.total)}</p>
        </Card>
        <Card className="bg-[linear-gradient(135deg,#fff2cf_0%,#f4d07a_100%)]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ready for review</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(aiQueue.ready)}</p>
        </Card>
        <Card className="bg-[#f4f1e8]">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Test families</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(aiQueue.types.length)}</p>
        </Card>
      </div>

      <Card className="bg-white">
        <p className="text-lg font-semibold">AI-generated test queue</p>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {aiQueue.suggestions.map((suggestion) => (
            <div key={`${suggestion.title}-${suggestion.type}`} className="rounded-3xl border border-border p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{suggestion.type.replaceAll("_", " ")}</Badge>
                <Badge className={suggestion.approvalState === "ready_for_review" ? "bg-primary text-white" : ""}>{(suggestion.approvalState ?? "draft").replaceAll("_", " ")}</Badge>
              </div>
              <p className="mt-4 text-lg font-semibold">{suggestion.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{suggestion.hypothesis}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-secondary px-3 py-1">Metric {suggestion.primaryMetric ?? "conversion"}</span>
                <span className="rounded-full bg-secondary px-3 py-1">Target {suggestion.targetSelector ?? "homepage hero"}</span>
                <span className="rounded-full bg-secondary px-3 py-1">Impact {suggestion.expectedImpact}</span>
              </div>
              <div className="mt-4 space-y-2">
                {suggestion.changes.slice(0, 2).map((change) => (
                  <div key={change} className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">{change}</div>
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

"use client";

import { BrainCircuit, Sparkles, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { AiCopilotInsight } from "@/lib/types";

const impactTone: Record<string, string> = {
  low: "bg-secondary text-secondary-foreground",
  medium: "bg-[#f4d07a] text-black",
  high: "bg-primary text-white"
};

export function AiCopilotPanel({ insights }: { insights: AiCopilotInsight[] }) {
  return (
    <Card className="bg-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <BrainCircuit className="h-4 w-4" />
            AI rationale
          </div>
          <h2 className="mt-3 text-2xl font-semibold">Why the AI believes these tests deserve attention</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            This card explains the reasoning before a test reaches the launch center: segment, expected impact, risk, and recommended format.
          </p>
        </div>
        <Sparkles className="h-5 w-5 text-primary" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-3xl border border-border p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={impactTone[insight.expectedImpact] ?? impactTone.low}>{insight.expectedImpact} impact</Badge>
              <Badge>{insight.recommendedType.replaceAll("_", " ")}</Badge>
              <Badge>{insight.segment}</Badge>
            </div>
            <p className="mt-4 text-lg font-semibold">{insight.title}</p>
            <p className="mt-3 text-sm text-muted-foreground">{insight.narrative}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                Primary metric
                <div className="mt-1 font-semibold">{insight.primaryMetric.replaceAll("_", " ")}</div>
              </div>
              <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                Risk
                <div className="mt-1 flex items-center gap-2 font-semibold">
                  {insight.risk === "high" ? <TriangleAlert className="h-4 w-4 text-primary" /> : null}
                  {insight.risk}
                </div>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-[#11291f] px-4 py-3 text-sm text-white">
              {insight.actionLabel}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

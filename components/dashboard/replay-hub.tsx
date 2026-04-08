"use client";

import { Film, MousePointerClick } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ReplayOpportunity, SessionDiagnostic } from "@/lib/types";

export function ReplayHub({
  experimentName,
  sessions,
  opportunities
}: {
  experimentName?: string;
  sessions: SessionDiagnostic[];
  opportunities: ReplayOpportunity[];
}) {
  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Film className="h-4 w-4" />
            Session replays
          </div>
          <h2 className="mt-3 text-2xl font-semibold">Understand friction from real user sessions</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Use recent sessions to spot friction, isolate high-intent visitors, and decide what to improve next. This is replay plus diagnostics, not yet a full Clarity-style video recorder.
          </p>
        </div>
        {experimentName ? <div className="rounded-full bg-secondary px-4 py-2 text-sm">{experimentName}</div> : null}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.sessionId} className="rounded-3xl border border-border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{session.sessionId}</p>
                  <p className="text-sm text-muted-foreground">{session.anonymousId}</p>
                </div>
                <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                  {Math.round(session.durationMs / 1000)}s
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">Friction {session.diagnostics?.frictionScore ?? 0}</div>
                <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">Intent {session.diagnostics?.intentScore ?? 0}</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>{session.rageClicks} rage clicks</span>
                <span>{session.deadClicks} dead clicks</span>
                <span>{session.jsErrors} JS errors</span>
                <span>{session.conversions} conversions</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {opportunities.map((item) => (
            <div key={item.sessionId} className="rounded-3xl bg-[#f7f1df] p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <MousePointerClick className="h-4 w-4" />
                AI next action from replay
              </div>
              <p className="mt-3 text-lg font-semibold">{item.opportunityTitle}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-white/80 px-3 py-1">Session {item.sessionId}</span>
                <span className="rounded-full bg-white/80 px-3 py-1">Type {item.recommendedType.replaceAll("_", " ")}</span>
                <span className="rounded-full bg-white/80 px-3 py-1">Friction {item.frictionScore}</span>
                <span className="rounded-full bg-white/80 px-3 py-1">Intent {item.intentScore}</span>
              </div>
              <div className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm">{item.nextAction}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

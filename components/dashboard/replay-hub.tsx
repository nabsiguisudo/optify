"use client";

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
          <p className="text-lg font-semibold">Lecture des replays</p>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Cette zone sert a lire rapidement les sessions les plus utiles. On parle ici de replays et de diagnostics, pas d'une promesse FullStory ou Clarity si le moteur n'est pas encore complet.
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
                <span>{session.deadClicks} clics sans effet</span>
                <span>{session.jsErrors} erreurs JS</span>
                <span>{session.conversions} conversions</span>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {opportunities.map((item) => (
            <div key={item.sessionId} className="rounded-3xl bg-[#fff6e8] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9b6b27]">Piste a regarder</p>
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

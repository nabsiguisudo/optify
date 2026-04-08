import Link from "next/link";
import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatDashboardDateTime, formatDashboardDuration } from "@/lib/site-dashboard";
import type { SessionDiagnostic } from "@/lib/types";

function formatDevice(deviceType: SessionDiagnostic["deviceType"]) {
  if (deviceType === "mobile") return "Mobile";
  if (deviceType === "tablet") return "Tablette";
  if (deviceType === "desktop") return "Desktop";
  return "Inconnu";
}

export function SessionInbox({ projectId, sessions }: { projectId: string; sessions: SessionDiagnostic[] }) {
  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Liste des sessions</p>
          <p className="mt-1 text-sm text-muted-foreground">Une entree par visiteur recent, avec un acces direct au replay.</p>
        </div>
        <div className="rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">{sessions.length} sessions recentes</div>
      </div>

      <div className="mt-5 space-y-3">
        {sessions.map((session) => (
          <div key={session.sessionId} className="rounded-[1.6rem] border border-border bg-[#fcfaf4] p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold">{session.anonymousId || session.sessionId}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-muted-foreground">{formatDevice(session.deviceType)}</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-muted-foreground">{session.pages} pages</span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-muted-foreground">{formatDashboardDuration(session.durationMs, "fr")}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Debut {formatDashboardDateTime(session.startedAt, "fr")} - {session.rageClicks} rage clicks - {session.deadClicks} clics sans effet - {session.conversions} conversions
                </p>
              </div>

              <Link
                href={`/dashboard/sites/${projectId}/sessions/${encodeURIComponent(session.sessionId)}`}
                className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ff5864_0%,#ff8c61_100%)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-95"
              >
                <Play className="h-4 w-4" />
                Lire
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

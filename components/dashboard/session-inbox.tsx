import Link from "next/link";
import { Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SessionDiagnostic } from "@/lib/types";

function formatDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function formatDevice(deviceType: SessionDiagnostic["deviceType"]) {
  if (deviceType === "mobile") return "Mobile";
  if (deviceType === "tablet") return "Tablet";
  if (deviceType === "desktop") return "Desktop";
  return "Unknown device";
}

export function SessionInbox({ projectId, sessions }: { projectId: string; sessions: SessionDiagnostic[] }) {
  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Session inbox</p>
          <p className="mt-1 text-sm text-muted-foreground">Browse recent users, spot friction quickly, then open a dedicated replay page for each journey.</p>
        </div>
        <div className="rounded-full bg-secondary px-4 py-2 text-sm text-muted-foreground">{sessions.length} recent sessions</div>
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
                  <span className="rounded-full bg-white px-3 py-1 text-xs text-muted-foreground">{formatDuration(session.durationMs)}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Started {session.startedAt.replace("T", " ").slice(0, 19)} · {session.rageClicks} rage clicks · {session.deadClicks} dead clicks · {session.conversions} conversions
                </p>
              </div>

              <Link
                href={`/dashboard/sites/${projectId}/sessions/${encodeURIComponent(session.sessionId)}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#11291f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#163528]"
              >
                <Play className="h-4 w-4" />
                Play
              </Link>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

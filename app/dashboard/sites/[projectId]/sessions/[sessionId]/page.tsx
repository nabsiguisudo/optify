import { notFound } from "next/navigation";
import { SessionDiagnostics } from "@/components/dashboard/session-diagnostics";
import { Card } from "@/components/ui/card";
import { getProjectById, getProjectSessionDiagnosticById } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";

export default async function SessionReplayDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string; sessionId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId, sessionId } = await params;
  resolveLocale((await searchParams).lang);

  const project = await getProjectById(projectId);
  if (!project) notFound();

  const decodedSessionId = decodeURIComponent(sessionId);
  const session = await getProjectSessionDiagnosticById(projectId, decodedSessionId);
  if (!session) notFound();

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <h1 className="text-3xl font-semibold">Session replay</h1>
        <p className="mt-2 text-muted-foreground">
          Full replay for {session.anonymousId || session.sessionId} on {project.name}. The player automatically uses a {session.deviceType} canvas when the session was recorded on that device type.
        </p>
      </Card>

      <SessionDiagnostics
        sessions={[session]}
        showSessionList={false}
        backHref={`/dashboard/sites/${projectId}/sessions`}
      />
    </div>
  );
}

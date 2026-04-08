import { NextResponse } from "next/server";
import { getSdkDiagnostics } from "@/lib/data";

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const diagnostic = await getSdkDiagnostics(projectId);

  if (!diagnostic) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(diagnostic);
}

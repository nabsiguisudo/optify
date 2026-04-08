import { NextResponse } from "next/server";
import { getExperimentStats } from "@/lib/data";

export async function GET(request: Request, { params }: { params: Promise<{ experimentId: string }> }) {
  const { experimentId } = await params;
  const { searchParams } = new URL(request.url);
  const days = searchParams.get("days");
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  const stats = await getExperimentStats(experimentId, {
    days: days ? Number(days) : undefined,
    from,
    to
  });
  if (!stats) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  return NextResponse.json(stats);
}

import { NextResponse } from "next/server";
import { updateExperimentRollout, updateExperimentRolloutSchema } from "@/lib/mutations";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; experimentId: string }> }
) {
  try {
    const { projectId, experimentId } = await params;
    const body = updateExperimentRolloutSchema.parse({
      ...(await request.json()),
      projectId,
      experimentId
    });
    const experiment = await updateExperimentRollout(body);
    return NextResponse.json({ experiment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update experiment rollout" },
      { status: 400 }
    );
  }
}

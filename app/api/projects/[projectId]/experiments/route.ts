import { NextResponse } from "next/server";
import { createExperiment, createExperimentSchema } from "@/lib/mutations";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = createExperimentSchema.parse({ ...(await request.json()), projectId });
    const experiment = await createExperiment(body);
    return NextResponse.json({ experiment });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create experiment" },
      { status: 400 }
    );
  }
}

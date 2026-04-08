import { NextResponse } from "next/server";
import { createExperiment, createExperimentSchema } from "@/lib/mutations";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    const body = createExperimentSchema.parse({ ...(await request.json()), projectId });
    const experiment = await createExperiment(body);
    return NextResponse.json({ experiment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create experiment";
    if (message.includes("experiments_primary_metric_check")) {
      return NextResponse.json(
        {
          error: "La base Supabase doit être mise à jour pour accepter cette métrique. Exécute la migration du champ primary_metric puis réessaie."
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: message },
      { status: 400 }
    );
  }
}

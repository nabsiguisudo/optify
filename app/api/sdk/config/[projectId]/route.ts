import { NextResponse } from "next/server";
import { withCors, corsPreflight } from "@/lib/cors";
import { getExperimentsByProject, getProjectById } from "@/lib/data";
import type { Variant } from "@/lib/types";

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const project = await getProjectById(projectId);
  if (!project) {
    return withCors(NextResponse.json({ error: "Project not found" }, { status: 404 }));
  }

  const experiments = (await getExperimentsByProject(projectId))
    .filter((experiment) => experiment.status === "running")
    .map((experiment) => ({
      id: experiment.id,
      pagePattern: experiment.pagePattern,
      trafficSplit: experiment.trafficSplit,
      type: experiment.type ?? "visual",
      editorMode: experiment.editorMode ?? "visual",
      customCode: experiment.customCode ?? "",
      targeting: experiment.targeting ?? null,
      recommendationConfig: experiment.recommendationConfig ?? null,
      priority: experiment.priority ?? "medium",
      exclusionGroup: experiment.exclusionGroup ?? null,
      variants: experiment.variants.map((variant: Variant) => ({
        key: variant.key,
        allocation: variant.allocation,
        changes: variant.changes
      }))
    }));

  return withCors(NextResponse.json({
    projectId: project.id,
    publicKey: project.publicKey,
    experiments
  }));
}

export function OPTIONS() {
  return corsPreflight();
}

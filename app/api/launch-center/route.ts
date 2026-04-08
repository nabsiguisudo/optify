import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { updateDevExperimentWorkflow } from "@/lib/dev-store";
import type { CampaignPriority, WorkflowState } from "@/lib/types";

const allowedStates: WorkflowState[] = ["draft", "ready_for_review", "approved", "scheduled", "running", "paused"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const experimentId = typeof body?.experimentId === "string" ? body.experimentId : "";
  const workflowState = typeof body?.workflowState === "string" ? body.workflowState as WorkflowState : undefined;
  const scheduledFor = typeof body?.scheduledFor === "string" ? body.scheduledFor : undefined;
  const priority = typeof body?.priority === "string" ? body.priority as CampaignPriority : undefined;
  const exclusionGroup = typeof body?.exclusionGroup === "string" ? body.exclusionGroup : undefined;
  const note = typeof body?.note === "string" ? body.note : undefined;

  if (!experimentId || !workflowState || !allowedStates.includes(workflowState)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!hasSupabaseEnv()) {
    const experiment = await updateDevExperimentWorkflow({ experimentId, workflowState, scheduledFor, priority, exclusionGroup, note });
    return NextResponse.json({ experiment });
  }

  const supabase = createSupabaseAdminClient();
  const status = workflowState === "running" ? "running" : workflowState === "paused" ? "paused" : "draft";
  const { data, error } = await supabase
    .from("experiments")
    .update({
      status,
      workflow_state: workflowState,
      scheduled_for: scheduledFor ?? null,
      priority: priority ?? null,
      exclusion_group: exclusionGroup ?? null
    })
    .eq("id", experimentId)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ experiment: data });
}

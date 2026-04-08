import { NextResponse } from "next/server";
import { deleteDevProject } from "@/lib/dev-store";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;

    if (!hasSupabaseEnv()) {
      await deleteDevProject(projectId);
      return NextResponse.json({ ok: true });
    }

    const supabase = createSupabaseAdminClient();
    await supabase.from("experiments").delete().eq("project_id", projectId);
    const { error } = await supabase.from("projects").delete().eq("id", projectId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to delete project" },
      { status: 400 }
    );
  }
}

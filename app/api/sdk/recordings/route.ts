import { NextResponse } from "next/server";
import { z } from "zod";
import { withCors, corsPreflight } from "@/lib/cors";
import { insertRecordingChunk, readDevStore } from "@/lib/dev-store";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseEnv } from "@/lib/env";

const frameSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  pathname: z.string(),
  eventType: z.enum([
    "session_start",
    "page_view",
    "page_exit",
    "click",
    "cta_click",
    "outbound_click",
    "rage_click",
    "dead_click",
    "conversion",
    "scroll_depth",
    "time_on_page",
    "form_start",
    "field_focus",
    "field_blur",
    "form_submit",
    "form_error",
    "form_abandon",
    "product_view",
    "search_submitted",
    "add_to_cart",
    "remove_from_cart",
    "checkout_start",
    "purchase",
    "recommendation_impression",
    "recommendation_click",
    "video_start",
    "video_progress",
    "video_complete",
    "js_error",
    "experiment_impression",
    "performance"
  ]),
  title: z.string().optional(),
  selector: z.string().optional(),
  scrollOffsetY: z.number().optional(),
  documentHeight: z.number().optional(),
  clickX: z.number().optional(),
  clickY: z.number().optional(),
  viewportWidth: z.number().optional(),
  viewportHeight: z.number().optional(),
  htmlSnapshot: z.string().optional(),
  baseHref: z.string().optional()
});

const recordingSchema = z.object({
  projectId: z.string().min(1),
  anonymousId: z.string().min(1),
  sessionId: z.string().min(1),
  startedAt: z.string().min(1),
  endedAt: z.string().min(1),
  chunkIndex: z.number().int().min(0),
  frames: z.array(frameSchema).min(1)
});

export async function POST(request: Request) {
  const payload = recordingSchema.parse(await request.json());

  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    const projectExists = store.projects.some((project) => project.id === payload.projectId);
    if (!projectExists) {
      return withCors(NextResponse.json({ ok: true, ignored: true, reason: "unknown_project" }));
    }

    const record = await insertRecordingChunk({
      projectId: payload.projectId,
      anonymousId: payload.anonymousId,
      sessionId: payload.sessionId,
      startedAt: payload.startedAt,
      endedAt: payload.endedAt,
      chunkIndex: payload.chunkIndex,
      frameCount: payload.frames.length,
      frames: payload.frames
    });

    return withCors(NextResponse.json({ ok: true, id: record.id, accepted: payload.frames.length, mode: "dev-store" }));
  }

  const supabase = createSupabaseAdminClient();
  const row = {
    project_id: payload.projectId,
    anonymous_id: payload.anonymousId,
    session_id: payload.sessionId,
    started_at: payload.startedAt,
    ended_at: payload.endedAt,
    chunk_index: payload.chunkIndex,
    frame_count: payload.frames.length,
    frames: payload.frames
  };
  const { error } = await supabase.from("session_recordings").upsert(row, { onConflict: "project_id,session_id,chunk_index", ignoreDuplicates: true });

  if (error) {
    return withCors(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCors(NextResponse.json({ ok: true, accepted: payload.frames.length }));
}

export function OPTIONS() {
  return corsPreflight();
}

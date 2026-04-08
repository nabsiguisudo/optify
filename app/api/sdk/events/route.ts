import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { withCors, corsPreflight } from "@/lib/cors";
import { insertDevEvent, readDevStore } from "@/lib/dev-store";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseEnv } from "@/lib/env";

function normalizeUuid(value?: string | null) {
  if (!value) return randomUUID();
  return z.string().uuid().safeParse(value).success ? value : randomUUID();
}

const jsonValueSchema: z.ZodTypeAny = z.lazy(() => z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(jsonValueSchema),
  z.record(z.string(), jsonValueSchema)
]));

const eventSchema = z.object({
  clientEventId: z.string().optional(),
  anonymousId: z.string(),
  sessionId: z.string().optional(),
  experimentId: z.string(),
  variantKey: z.string(),
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
  pathname: z.string(),
  projectId: z.string(),
  context: z.record(z.string(), jsonValueSchema).optional()
});

const payloadSchema = z.union([
  eventSchema,
  z.object({
    events: z.array(eventSchema).min(1)
  })
]);

export async function POST(request: Request) {
  const parsed = payloadSchema.parse(await request.json());
  const events = "events" in parsed ? parsed.events : [parsed];

  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    const knownProjectIds = new Set(store.projects.map((project) => project.id));
    const acceptedEvents = events.filter((payload) => knownProjectIds.has(payload.projectId));

    if (acceptedEvents.length === 0) {
      return withCors(NextResponse.json({ ok: true, ignored: true, accepted: 0, mode: "dev-store" }));
    }

    const records = await Promise.all(acceptedEvents.map((payload) => insertDevEvent({
      clientEventId: payload.clientEventId,
      projectId: payload.projectId,
      anonymousId: payload.anonymousId,
      sessionId: payload.sessionId,
      experimentId: payload.experimentId,
      variantKey: payload.variantKey,
      eventType: payload.eventType,
      pathname: payload.pathname,
      context: payload.context
    })));
    return withCors(NextResponse.json({ ok: true, ids: records.map((record) => record.id), accepted: records.length, mode: "dev-store" }));
  }

  const supabase = createSupabaseAdminClient();
  const normalizeExperimentId = (experimentId: string) => {
    if (!experimentId || experimentId.startsWith("__")) {
      return null;
    }
    return experimentId;
  };
  const rows = events.map((payload) => ({
    id: normalizeUuid(payload.clientEventId),
    project_id: payload.projectId,
    anonymous_id: payload.anonymousId,
    session_id: payload.sessionId ?? null,
    experiment_id: normalizeExperimentId(payload.experimentId),
    variant_key: payload.variantKey,
    event_type: payload.eventType,
    pathname: payload.pathname,
    context: payload.context ?? {}
  }));
  const { error } = await supabase.from("events").upsert(rows, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    return withCors(NextResponse.json({ error: error.message }, { status: 500 }));
  }

  return withCors(NextResponse.json({ ok: true, accepted: rows.length }));
}

export function OPTIONS() {
  return corsPreflight();
}

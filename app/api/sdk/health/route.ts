import { NextResponse } from "next/server";
import { z } from "zod";
import { withCors, corsPreflight } from "@/lib/cors";
import { insertSdkHealthReport, readDevStore } from "@/lib/dev-store";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseEnv } from "@/lib/env";

const healthSchema = z.object({
  projectId: z.string().min(1),
  pathname: z.string().min(1),
  origin: z.string().min(1),
  sdkVersion: z.string().min(1),
  anonymousId: z.string().optional(),
  sessionId: z.string().optional(),
  userAgent: z.string().optional(),
  capabilities: z.object({
    beacon: z.boolean(),
    fetch: z.boolean(),
    intersectionObserver: z.boolean(),
    localStorage: z.boolean(),
    sessionStorage: z.boolean()
  })
});

export async function POST(request: Request) {
  const payload = healthSchema.parse(await request.json());

  if (hasSupabaseEnv()) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("projects").select("id").eq("id", payload.projectId).maybeSingle();
    if (!data) {
      return withCors(NextResponse.json({ ok: true, ignored: true, reason: "unknown_project" }));
    }
    return withCors(NextResponse.json({ ok: true, mode: "supabase_noop" }));
  }

  const store = await readDevStore();
  const projectExists = store.projects.some((project) => project.id === payload.projectId);
  if (!projectExists) {
    return withCors(NextResponse.json({ ok: true, ignored: true, reason: "unknown_project" }));
  }
  const report = await insertSdkHealthReport(payload);
  return withCors(NextResponse.json({ ok: true, report }));
}

export function OPTIONS() {
  return corsPreflight();
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env, hasSupabaseClientEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createSupabaseBrowserClient() {
  if (!hasSupabaseClientEnv()) {
    return null;
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      env.supabaseUrl!,
      env.supabaseAnonKey!
    );
  }

  return browserClient;
}

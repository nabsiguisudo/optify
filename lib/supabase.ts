import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseClientEnv, getSupabaseServerEnv, hasSupabaseClientEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  if (!hasSupabaseClientEnv()) {
    return null;
  }

  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseClientEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components can read auth cookies but cannot always persist refreshed ones.
          // Route Handlers and Server Actions remain responsible for durable cookie writes.
        }
      }
    }
  });
}

export function createSupabaseAdminClient() {
  const { url, serviceRoleKey } = getSupabaseServerEnv();
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

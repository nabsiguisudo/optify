import { NextResponse } from "next/server";
import { readDevStore } from "@/lib/dev-store";
import { fetchShopifyCatalog } from "@/lib/shopify";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseEnv } from "@/lib/env";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const connection = hasSupabaseEnv()
      ? await (async () => {
        const supabase = createSupabaseAdminClient();
        const { data } = await supabase.from("shopify_connections").select("shop_domain, admin_access_token").eq("project_id", projectId).maybeSingle();
        return data ? { shopDomain: data.shop_domain, adminAccessToken: data.admin_access_token } : null;
      })()
      : (() => null)();
    const devConnection = connection ?? (() => null)() ?? (await readDevStore()).shopifyConnections.find((item) => item.projectId === projectId);
    const resolvedConnection = devConnection;
    if (!resolvedConnection?.adminAccessToken || !resolvedConnection?.shopDomain) {
      return NextResponse.json({ error: "Shopify connection not available" }, { status: 404 });
    }

    const catalog = await fetchShopifyCatalog({
      shopDomain: resolvedConnection.shopDomain,
      accessToken: resolvedConnection.adminAccessToken
    });

    return NextResponse.json(catalog);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch Shopify catalog" },
      { status: 400 }
    );
  }
}

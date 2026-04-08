import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertShopifyConnection } from "@/lib/dev-store";
import { validateShopifyConnection } from "@/lib/shopify";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseEnv } from "@/lib/env";

const schema = z.object({
  projectId: z.string().min(1),
  shopDomain: z.string().min(3),
  adminAccessToken: z.string().min(8)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const connection = await validateShopifyConnection({
      shopDomain: payload.shopDomain,
      accessToken: payload.adminAccessToken
    });

    const nextConnection = {
      ...connection,
      projectId: payload.projectId,
      adminAccessToken: payload.adminAccessToken
    };

    const persisted = hasSupabaseEnv()
      ? await (async () => {
        const supabase = createSupabaseAdminClient();
        const { error } = await supabase.from("shopify_connections").upsert({
          project_id: nextConnection.projectId,
          status: nextConnection.status,
          shop_domain: nextConnection.shopDomain,
          admin_access_token: nextConnection.adminAccessToken,
          shop_name: nextConnection.shopName ?? null,
          storefront_domain: nextConnection.storefrontDomain ?? null,
          plan_name: nextConnection.planName ?? null,
          currency_code: nextConnection.currencyCode ?? null,
          primary_locale: nextConnection.primaryLocale ?? null,
          connected_at: nextConnection.connectedAt ?? null,
          last_synced_at: new Date().toISOString(),
          scopes: nextConnection.scopes,
          page_types_tracked: nextConnection.pageTypesTracked,
          active_theme: nextConnection.activeTheme ?? null,
          themes: nextConnection.themes,
          install_mode: nextConnection.installMode
        });
        if (error) throw new Error(error.message);
        return nextConnection;
      })()
      : await upsertShopifyConnection(nextConnection);

    return NextResponse.json({
      connection: {
        ...persisted,
        adminAccessToken: undefined
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to connect Shopify store" },
      { status: 400 }
    );
  }
}

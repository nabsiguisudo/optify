import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertShopifyConnection } from "@/lib/dev-store";
import { validateShopifyConnection } from "@/lib/shopify";

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

    const persisted = await upsertShopifyConnection({
      ...connection,
      projectId: payload.projectId,
      adminAccessToken: payload.adminAccessToken
    });

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

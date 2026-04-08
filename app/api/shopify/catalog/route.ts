import { NextResponse } from "next/server";
import { readDevStore } from "@/lib/dev-store";
import { fetchShopifyCatalog } from "@/lib/shopify";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }

    const store = await readDevStore();
    const connection = store.shopifyConnections.find((item) => item.projectId === projectId);
    if (!connection?.adminAccessToken || !connection.shopDomain) {
      return NextResponse.json({ error: "Shopify connection not available" }, { status: 404 });
    }

    const catalog = await fetchShopifyCatalog({
      shopDomain: connection.shopDomain,
      accessToken: connection.adminAccessToken
    });

    return NextResponse.json(catalog);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to fetch Shopify catalog" },
      { status: 400 }
    );
  }
}

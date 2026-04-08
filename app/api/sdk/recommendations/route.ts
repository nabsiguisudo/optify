import { NextResponse } from "next/server";
import { withCors, corsPreflight } from "@/lib/cors";
import { getExperimentById, getProjectById, getShopifyConnection } from "@/lib/data";
import { fetchRecommendationProducts } from "@/lib/shopify";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const projectId = url.searchParams.get("projectId");
    const experimentId = url.searchParams.get("experimentId");

    if (!projectId || !experimentId) {
      return withCors(NextResponse.json({ error: "projectId and experimentId are required" }, { status: 400 }));
    }

    const project = await getProjectById(projectId);
    if (!project) {
      return withCors(NextResponse.json({ error: "Project not found" }, { status: 404 }));
    }

    const experiment = await getExperimentById(experimentId);
    if (!experiment || experiment.projectId !== projectId || experiment.type !== "recommendation" || !experiment.recommendationConfig) {
      return withCors(NextResponse.json({ error: "Recommendation experience not found" }, { status: 404 }));
    }

    const connection = await getShopifyConnection(projectId);
    const accessToken = connection?.adminAccessToken;
    if (!connection?.shopDomain || !accessToken) {
      return withCors(NextResponse.json({ error: "Shopify connection not available" }, { status: 404 }));
    }

    const recommendationConfig = experiment.recommendationConfig;
    const items = await fetchRecommendationProducts({
      shopDomain: connection.shopDomain,
      accessToken,
      sourceMode: recommendationConfig.sourceMode ?? "auto",
      selectedProductIds: recommendationConfig.selectedProductIds ?? [],
      selectedCollectionIds: recommendationConfig.selectedCollectionIds ?? [],
      maxProducts: recommendationConfig.maxProducts ?? 3
    });

    return withCors(NextResponse.json({
      experimentId: experiment.id,
      title: recommendationConfig.title ?? experiment.name,
      strategy: recommendationConfig.strategy,
      placement: recommendationConfig.placement,
      items
    }));
  } catch (error) {
    return withCors(NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resolve recommendation products" },
      { status: 400 }
    ));
  }
}

export function OPTIONS() {
  return corsPreflight();
}

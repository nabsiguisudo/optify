import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { withCors, corsPreflight } from "@/lib/cors";
import { insertDevEvent, readDevStore } from "@/lib/dev-store";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { hasSupabaseEnv } from "@/lib/env";

function normalizeUuid(value?: string | null) {
  if (!value) return randomUUID();
  return z.string().uuid().safeParse(value).success ? value : randomUUID();
}

const shopifyPixelSchema = z.object({
  projectId: z.string().min(1),
  eventName: z.string().min(1),
  id: z.string().optional(),
  clientId: z.string().optional(),
  timestamp: z.string().optional(),
  context: z.record(z.string(), z.any()).optional(),
  data: z.record(z.string(), z.any()).optional()
});

function readLocation(context: Record<string, any> | undefined) {
  const location = context?.document?.location ?? {};
  const href = typeof location.href === "string" ? location.href : "";
  const pathname = typeof location.pathname === "string"
    ? location.pathname
    : href
      ? new URL(href).pathname
      : "/";
  return { href, pathname };
}

function mapEventType(eventName: string) {
  switch (eventName) {
    case "page_viewed":
      return "page_view" as const;
    case "product_viewed":
      return "product_view" as const;
    case "product_added_to_cart":
      return "add_to_cart" as const;
    case "product_removed_from_cart":
      return "remove_from_cart" as const;
    case "checkout_started":
      return "checkout_start" as const;
    case "checkout_completed":
      return "purchase" as const;
    case "search_submitted":
      return "search_submitted" as const;
    default:
      return "page_view" as const;
  }
}

function inferPageType(eventName: string, pathname: string) {
  if (eventName === "product_viewed" || pathname.startsWith("/products/")) return "product";
  if (eventName === "collection_viewed" || pathname.startsWith("/collections/")) return "collection";
  if (eventName === "cart_viewed" || pathname === "/cart") return "cart";
  if (eventName === "search_submitted" || pathname.startsWith("/search")) return "search";
  if (eventName.startsWith("checkout_") || pathname.includes("/checkouts") || pathname.startsWith("/checkout")) return "checkout";
  if (pathname === "/") return "index";
  return "page";
}

export async function POST(request: Request) {
  try {
    const payload = shopifyPixelSchema.parse(await request.json());
    const { href, pathname } = readLocation(payload.context);
    const pageType = inferPageType(payload.eventName, pathname);
    const data = payload.data ?? {};
    const context = payload.context ?? {};
    const mappedEventType = mapEventType(payload.eventName);
    const eventContext = {
      pageType,
      templateName: pageType,
      shopifyEventName: payload.eventName,
      shopDomain: typeof context.document?.location?.host === "string" ? context.document.location.host : undefined,
      referrer: typeof context.document?.referrer === "string" ? context.document.referrer : undefined,
      pageTitle: typeof context.document?.title === "string" ? context.document.title : undefined,
      productId: data.productVariant?.product?.id ?? data.productVariant?.id ?? data.product?.id,
      productName: data.productVariant?.product?.title ?? data.product?.title,
      currency: data.checkout?.currencyCode ?? data.cartLine?.cost?.totalAmount?.currencyCode,
      revenue: Number(data.checkout?.totalPrice?.amount ?? 0) || undefined,
      value: Number(data.checkout?.totalPrice?.amount ?? data.cartLine?.cost?.totalAmount?.amount ?? 0) || undefined,
      quantity: Number(data.cartLine?.quantity ?? 1) || 1,
      searchQuery: typeof data.searchResult?.query === "string" ? data.searchResult.query : undefined,
      custom: {
        href
      }
    };

    if (hasSupabaseEnv()) {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.from("events").upsert({
        id: normalizeUuid(payload.id),
        project_id: payload.projectId,
        anonymous_id: payload.clientId ?? "shopify_customer",
        session_id: typeof context.session?.id === "string" ? context.session.id : null,
        experiment_id: null,
        variant_key: "storefront",
        event_type: mappedEventType,
        pathname,
        context: eventContext
      }, { onConflict: "id", ignoreDuplicates: true });

      if (error) {
        return withCors(NextResponse.json({ error: error.message }, { status: 500 }));
      }

      return withCors(NextResponse.json({ ok: true, mode: "supabase" }));
    }

    const store = await readDevStore();
    const projectExists = store.projects.some((project) => project.id === payload.projectId);
    if (!projectExists) {
      return withCors(NextResponse.json({ ok: true, ignored: true, reason: "unknown_project" }));
    }

    const record = await insertDevEvent({
      clientEventId: payload.id,
      projectId: payload.projectId,
      anonymousId: payload.clientId ?? "shopify_customer",
      sessionId: typeof context.session?.id === "string" ? context.session.id : undefined,
      experimentId: "__shopify__",
      variantKey: "storefront",
      eventType: mappedEventType,
      pathname,
      context: eventContext
    });

    return withCors(NextResponse.json({ ok: true, id: record.id, mode: "dev-store" }));
  } catch (error) {
    return withCors(NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to ingest Shopify pixel event" },
      { status: 400 }
    ));
  }
}

export function OPTIONS() {
  return corsPreflight();
}

import { env } from "@/lib/env";
import type { RecommendationConfig, ShopifyCatalogItem, ShopifyCollectionItem, ShopifyConnection, ShopifyInstallAssets, ShopifyThemeSummary } from "@/lib/types";

const SHOPIFY_ADMIN_VERSION = "2025-10";

function normalizeShopDomain(input: string) {
  const trimmed = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return trimmed.endsWith(".myshopify.com") ? trimmed : `${trimmed}.myshopify.com`;
}

export function maskAccessToken(token: string) {
  if (token.length <= 8) return "••••••••";
  return `${token.slice(0, 4)}••••${token.slice(-4)}`;
}

async function shopifyAdminRequest<T>({
  shopDomain,
  accessToken,
  query,
  variables
}: {
  shopDomain: string;
  accessToken: string;
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const response = await fetch(`https://${shopDomain}/admin/api/${SHOPIFY_ADMIN_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken
    },
    body: JSON.stringify({ query, variables })
  });

  if (!response.ok) {
    throw new Error(`Shopify connection failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message ?? "Shopify GraphQL request failed");
  }

  return payload.data as T;
}

export async function validateShopifyConnection(input: { shopDomain: string; accessToken: string }): Promise<ShopifyConnection> {
  const shopDomain = normalizeShopDomain(input.shopDomain);
  const data = await shopifyAdminRequest<{
    shop: {
      name: string;
      myshopifyDomain: string;
      currencyCode?: string;
      primaryDomain?: { host?: string; url?: string } | null;
      plan?: { displayName?: string | null } | null;
      billingAddress?: { countryCodeV2?: string | null } | null;
    };
    themes: {
      nodes: Array<{ id: string; name: string; role: string }>;
    };
  }>({
    shopDomain,
    accessToken: input.accessToken,
    query: `
      query OptifyShopPreview {
        shop {
          name
          myshopifyDomain
          currencyCode
          primaryDomain {
            host
            url
          }
          plan {
            displayName
          }
          billingAddress {
            countryCodeV2
          }
        }
        themes(first: 8) {
          nodes {
            id
            name
            role
          }
        }
      }
    `
  });

  const themes: ShopifyThemeSummary[] = (data.themes?.nodes ?? []).map((theme) => ({
    id: theme.id,
    name: theme.name,
    role: theme.role
  }));
  const activeTheme = themes.find((theme) => theme.role.toLowerCase() === "main") ?? themes[0];

  return {
    projectId: "",
    status: "connected",
    shopDomain: data.shop.myshopifyDomain ?? shopDomain,
    shopName: data.shop.name,
    storefrontDomain: data.shop.primaryDomain?.host ?? undefined,
    planName: data.shop.plan?.displayName ?? undefined,
    currencyCode: data.shop.currencyCode ?? undefined,
    primaryLocale: data.shop.billingAddress?.countryCodeV2 ?? undefined,
    connectedAt: new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    scopes: ["read_products", "read_themes", "read_orders"],
    pageTypesTracked: ["index", "product", "collection", "cart", "search", "page", "blog", "article", "checkout"],
    activeTheme,
    themes,
    installMode: "manual_token"
  };
}

export async function fetchShopifyCatalog(input: { shopDomain: string; accessToken: string }) {
  const shopDomain = normalizeShopDomain(input.shopDomain);
  const data = await shopifyAdminRequest<{
    products: { nodes: Array<{ id: string; title: string; handle: string; featuredImage?: { url?: string | null } | null; priceRangeV2?: { minVariantPrice?: { amount?: string | null; currencyCode?: string | null } | null } | null }> };
    collections: { nodes: Array<{ id: string; title: string; handle: string; image?: { url?: string | null } | null }> };
  }>({
    shopDomain,
    accessToken: input.accessToken,
    query: `
      query OptifyCatalogPreview {
        products(first: 24, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            id
            title
            handle
            featuredImage {
              url
            }
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
        collections(first: 24, sortKey: UPDATED_AT, reverse: true) {
          nodes {
            id
            title
            handle
            image {
              url
            }
          }
        }
      }
    `
  });

  const products: ShopifyCatalogItem[] = (data.products?.nodes ?? []).map((product) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    image: product.featuredImage?.url ?? undefined,
    price: product.priceRangeV2?.minVariantPrice?.amount
      ? `${Number(product.priceRangeV2.minVariantPrice.amount).toFixed(2)} ${product.priceRangeV2.minVariantPrice.currencyCode ?? ""}`.trim()
      : undefined
  }));

  const collections: ShopifyCollectionItem[] = (data.collections?.nodes ?? []).map((collection) => ({
    id: collection.id,
    title: collection.title,
    handle: collection.handle,
    image: collection.image?.url ?? undefined
  }));

  return { products, collections };
}

export async function fetchRecommendationProducts(input: {
  shopDomain: string;
  accessToken: string;
  sourceMode: NonNullable<RecommendationConfig["sourceMode"]>;
  selectedProductIds: string[];
  selectedCollectionIds: string[];
  maxProducts: number;
}) {
  const shopDomain = normalizeShopDomain(input.shopDomain);
  const limit = Math.max(1, Math.min(input.maxProducts || 3, 12));

  if (input.sourceMode === "manual_products" && input.selectedProductIds.length > 0) {
    const data = await shopifyAdminRequest<{
      nodes: Array<{
        __typename: string;
        id: string;
        title?: string;
        handle?: string;
        featuredImage?: { url?: string | null } | null;
        priceRangeV2?: { minVariantPrice?: { amount?: string | null; currencyCode?: string | null } | null } | null;
      } | null>;
    }>({
      shopDomain,
      accessToken: input.accessToken,
      query: `
        query OptifyRecommendationProducts($ids: [ID!]!) {
          nodes(ids: $ids) {
            __typename
            ... on Product {
              id
              title
              handle
              featuredImage {
                url
              }
              priceRangeV2 {
                minVariantPrice {
                  amount
                  currencyCode
                }
              }
            }
          }
        }
      `,
      variables: { ids: input.selectedProductIds.slice(0, limit) }
    });

    return (data.nodes ?? [])
      .filter((node): node is NonNullable<typeof node> => !!node && node.__typename === "Product")
      .slice(0, limit)
      .map((product) => ({
        id: product.id,
        title: product.title ?? "Product",
        handle: product.handle ?? "",
        image: product.featuredImage?.url ?? undefined,
        price: product.priceRangeV2?.minVariantPrice?.amount
          ? `${Number(product.priceRangeV2.minVariantPrice.amount).toFixed(2)} ${product.priceRangeV2.minVariantPrice.currencyCode ?? ""}`.trim()
          : undefined
      }));
  }

  if (input.sourceMode === "manual_collections" && input.selectedCollectionIds.length > 0) {
    const data = await shopifyAdminRequest<{
      nodes: Array<{
        __typename: string;
        products?: {
          nodes: Array<{
            id: string;
            title: string;
            handle: string;
            featuredImage?: { url?: string | null } | null;
            priceRangeV2?: { minVariantPrice?: { amount?: string | null; currencyCode?: string | null } | null } | null;
          }>;
        } | null;
      } | null>;
    }>({
      shopDomain,
      accessToken: input.accessToken,
      query: `
        query OptifyRecommendationCollections($ids: [ID!]!, $limit: Int!) {
          nodes(ids: $ids) {
            __typename
            ... on Collection {
              products(first: $limit, sortKey: BEST_SELLING) {
                nodes {
                  id
                  title
                  handle
                  featuredImage {
                    url
                  }
                  priceRangeV2 {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: { ids: input.selectedCollectionIds.slice(0, 4), limit }
    });

    const seen = new Set<string>();
    return (data.nodes ?? [])
      .flatMap((collection) => collection?.products?.nodes ?? [])
      .filter((product) => {
        if (!product?.id || seen.has(product.id)) return false;
        seen.add(product.id);
        return true;
      })
      .slice(0, limit)
      .map((product) => ({
        id: product.id,
        title: product.title,
        handle: product.handle,
        image: product.featuredImage?.url ?? undefined,
        price: product.priceRangeV2?.minVariantPrice?.amount
          ? `${Number(product.priceRangeV2.minVariantPrice.amount).toFixed(2)} ${product.priceRangeV2.minVariantPrice.currencyCode ?? ""}`.trim()
          : undefined
      }));
  }

  const fallback = await fetchShopifyCatalog({ shopDomain, accessToken: input.accessToken });
  return fallback.products.slice(0, limit);
}

export function buildShopifyInstallAssets(input: { projectId: string; scriptUrl: string }): ShopifyInstallAssets {
  const scriptTag = `<script src="${input.scriptUrl.replace("https://cdn.optify.ai/sdk.js", "/optify-sdk.js")}" data-project="${input.projectId}"></script>`;
  const liquidSnippet = [
    `<script>`,
    `  window.__OPTIFY_SHOPIFY_CONTEXT = {`,
    `    shopDomain: {{ shop.permanent_domain | json }},`,
    `    storefrontDomain: {{ shop.secure_url | json }},`,
    `    themeId: {{ theme.id | json }},`,
    `    themeName: {{ theme.name | json }},`,
    `    pageType: {{ template.name | json }},`,
    `    templateName: {{ template.name | json }},`,
    `    country: {% if localization.country %}{{ localization.country.iso_code | json }}{% else %}null{% endif %},`,
    `    region: null,`,
    `    city: null,`,
    `    product: {% if product %}{ id: {{ product.id | json }}, title: {{ product.title | json }}, handle: {{ product.handle | json }} }{% else %}null{% endif %},`,
    `    collection: {% if collection %}{ id: {{ collection.id | json }}, title: {{ collection.title | json }}, handle: {{ collection.handle | json }} }{% else %}null{% endif %},`,
    `    cartCurrency: {% if cart %}{{ cart.currency.iso_code | json }}{% else %}null{% endif %}`,
    `  };`,
    `</script>`,
    `<script`,
    `  src="${input.scriptUrl.replace("https://cdn.optify.ai/sdk.js", "/optify-sdk.js")}"`,
    `  data-project="${input.projectId}"`,
    `  data-shopify-shop="{{ shop.permanent_domain }}"`,
    `  data-shopify-theme="{{ theme.id }}"`,
    `  data-shopify-theme-name="{{ theme.name | escape }}"`,
    `  data-shopify-template="{{ template.name }}"`,
    `  data-shopify-page-type="{{ template.name }}"`,
    `></script>`
  ].join("\n");
  const pixelEndpoint = `${env.appUrl.replace(/\/$/, "")}/api/shopify/pixel`;
  const customPixelCode = [
    `const OPTIFY_PROJECT_ID = "${input.projectId}";`,
    `const OPTIFY_ENDPOINT = "${pixelEndpoint}";`,
    ``,
    `analytics.subscribe("all_standard_events", async (event) => {`,
    `  await fetch(OPTIFY_ENDPOINT, {`,
    `    method: "POST",`,
    `    headers: { "Content-Type": "application/json", "ngrok-skip-browser-warning": "true" },`,
    `    body: JSON.stringify({`,
    `      projectId: OPTIFY_PROJECT_ID,`,
    `      eventName: event.name,`,
    `      id: event.id,`,
    `      clientId: event.clientId,`,
    `      timestamp: event.timestamp,`,
    `      context: event.context,`,
    `      data: event.data`,
    `    }),`,
    `    keepalive: true`,
    `  });`,
    `});`
  ].join("\n");

  return {
    scriptTag,
    liquidSnippet,
    customPixelCode
  };
}

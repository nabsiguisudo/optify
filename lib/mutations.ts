import { randomUUID } from "crypto";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { createDevExperiment, createDevProject } from "@/lib/dev-store";
import { getCurrentUser } from "@/lib/data";
import { hasSupabaseEnv } from "@/lib/env";
import type {
  AudienceRule,
  ChangeType,
  Experiment,
  ExperimentTargetingCondition,
  ExperimentTargetingGroup,
  ExperimentTargetingNode,
  ExperimentType,
  Platform,
  PopupConfig,
  Project,
  RecommendationConfig
} from "@/lib/types";

export const createProjectSchema = z.object({
  name: z.string().min(2),
  domain: z.string().min(3),
  platform: z.enum(["shopify", "webflow", "woocommerce", "salesforce", "custom"])
});

const targetingConditionSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("condition"),
  attribute: z.enum([
    "country",
    "region",
    "city",
    "device",
    "device_family",
    "browser",
    "os",
    "language",
    "source",
    "medium",
    "campaign",
    "term",
    "content",
    "referrer",
    "page_path",
    "page_url",
    "page_type",
    "query_string",
    "visitor_type",
    "pages_in_session",
    "viewport_width",
    "viewport_height"
  ]),
  operator: z.enum([
    "is",
    "is_not",
    "contains",
    "not_contains",
    "starts_with",
    "ends_with",
    "matches_regex",
    "gt",
    "gte",
    "lt",
    "lte",
    "between",
    "exists",
    "not_exists"
  ]),
  value: z.string().optional(),
  secondValue: z.string().optional()
});

const targetingNodeSchema: z.ZodTypeAny = z.lazy(() =>
  z.union([
    targetingConditionSchema,
    z.object({
      id: z.string().min(1),
      kind: z.literal("group"),
      combinator: z.enum(["and", "or"]),
      children: z.array(targetingNodeSchema).default([])
    })
  ])
);

const targetingGroupSchema = z.object({
  id: z.string().min(1),
  kind: z.literal("group"),
  combinator: z.enum(["and", "or"]),
  children: z.array(targetingNodeSchema).default([])
});

export const createExperimentSchema = z
  .object({
    projectId: z.string().min(1),
    name: z.string().min(2),
    pagePattern: z.string().min(1),
    hypothesis: z.string().min(8),
    type: z.enum(["visual", "custom_code", "popup", "recommendation"]).default("visual"),
    selector: z.string().optional().default(""),
    primaryMetric: z.enum(["page_view", "click", "conversion", "add_to_cart"]),
    status: z.enum(["draft", "running", "paused"]),
    editorMode: z.enum(["visual", "custom_code"]).default("visual"),
    customCode: z.string().optional().default(""),
    audienceDevice: z.string().optional().default("all"),
    audienceSource: z.string().optional().default("all"),
    targeting: targetingGroupSchema.optional(),
    trafficSplit: z.coerce.number().min(1).max(100),
    variantCount: z.coerce.number().min(2).max(3),
    variantBText: z.string().optional().default(""),
    variantCText: z.string().optional().default(""),
    variantBStyle: z.string().optional().default(""),
    variantCStyle: z.string().optional().default(""),
    popupTitle: z.string().optional().default(""),
    popupBody: z.string().optional().default(""),
    popupCta: z.string().optional().default(""),
    popupTrigger: z.enum(["time_on_page", "scroll_depth", "exit_intent", "cta_click"]).optional().default("time_on_page"),
    popupPlacement: z.enum(["modal_center", "slide_in_right", "sticky_bottom_bar"]).optional().default("modal_center"),
    popupDelayMs: z.coerce.number().min(0).max(30000).optional().default(6000),
    popupFrequencyCap: z.enum(["once_per_session", "once_per_day", "always"]).optional().default("once_per_session"),
    popupTheme: z.enum(["light", "dark", "accent"]).optional().default("accent"),
    popupGoal: z.enum(["conversion", "lead_capture", "click"]).optional().default("conversion"),
    recommendationStrategy: z.enum(["trending", "frequently_bought_together", "high_margin", "personalized"]).optional().default("frequently_bought_together"),
    recommendationPlacement: z.enum(["pdp_sidebar", "cart_drawer", "checkout", "homepage"]).optional().default("pdp_sidebar"),
    recommendationMaxProducts: z.coerce.number().min(1).max(8).optional().default(3),
    recommendationTitle: z.string().optional().default(""),
    recommendationAlgorithmNotes: z.string().optional().default(""),
    recommendationFallback: z.enum(["best_sellers", "recently_viewed", "manual"]).optional().default("best_sellers"),
    recommendationTrigger: z.enum(["page_view", "add_to_cart", "checkout_start"]).optional().default("page_view"),
    recommendationAudienceIntent: z.enum(["all", "new", "returning", "high_intent"]).optional().default("all"),
    recommendationSourceMode: z.enum(["auto", "manual_products", "manual_collections"]).optional().default("auto"),
    recommendationSelectedProductIds: z.array(z.string()).optional().default([]),
    recommendationSelectedCollectionIds: z.array(z.string()).optional().default([]),
    recommendationTargetUrl: z.string().optional().default(""),
    recommendationPlacementSelector: z.string().optional().default(""),
    recommendationInjectionMode: z.enum(["replace", "before", "after", "append"]).optional().default("append"),
    recommendationLayout: z.enum(["grid", "carousel", "stack"]).optional().default("grid"),
    recommendationCardTitleLines: z.coerce.number().min(1).max(4).optional().default(2),
    recommendationImageRatio: z.enum(["portrait", "square", "landscape"]).optional().default("square"),
    recommendationSpacingPx: z.coerce.number().min(0).max(64).optional().default(16),
    recommendationPaddingPx: z.coerce.number().min(0).max(64).optional().default(16),
    recommendationShowPrice: z.boolean().optional().default(true),
    recommendationShowCompareAtPrice: z.boolean().optional().default(false),
    recommendationShowCta: z.boolean().optional().default(true),
    recommendationCtaLabel: z.string().optional().default("Shop now"),
    priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
    exclusionGroup: z.string().optional().default("")
  })
  .superRefine((value, ctx) => {
    if ((value.type === "visual" || value.type === "custom_code") && !value.selector.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Selector is required for visual and custom-code experiments.",
        path: ["selector"]
      });
    }

    if ((value.type === "visual" || value.type === "custom_code") && !value.variantBText.trim() && !value.variantBStyle.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variant B needs at least one visual change.",
        path: ["variantBText"]
      });
    }

    if (value.variantCount === 3 && (value.type === "visual" || value.type === "custom_code") && !value.variantCText.trim() && !value.variantCStyle.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Variant C needs at least one visual change when 3 variants are selected.",
        path: ["variantCText"]
      });
    }

    if (value.type === "popup" && (!value.popupTitle.trim() || !value.popupBody.trim() || !value.popupCta.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Popup title, body, and CTA are required for popup experiments.",
        path: ["popupTitle"]
      });
    }

    function walk(node: ExperimentTargetingNode) {
      if (node.kind === "group") {
        node.children.forEach(walk);
        return;
      }

      if (!["exists", "not_exists"].includes(node.operator) && !node.value?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each targeting condition needs a value.",
          path: ["targeting"]
        });
      }

      if (node.operator === "between" && !node.secondValue?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Between targeting conditions require a second value.",
          path: ["targeting"]
        });
      }
    }

    if (value.targeting) {
      walk(value.targeting);
    }
  });

function buildLegacyAudienceRules(targeting?: ExperimentTargetingGroup): AudienceRule[] {
  if (!targeting) return [];
  const rules: AudienceRule[] = [];

  function walk(node: ExperimentTargetingNode) {
    if (node.kind === "group") {
      node.children.forEach(walk);
      return;
    }

    if (node.attribute === "device" && node.operator === "is" && node.value) {
      rules.push({ attribute: "device", operator: "is", value: node.value });
    }

    if (node.attribute === "source" && (node.operator === "is" || node.operator === "contains") && node.value) {
      rules.push({ attribute: "source", operator: "contains", value: node.value });
    }
  }

  walk(targeting);
  return rules;
}

export async function createProject(input: z.infer<typeof createProjectSchema>): Promise<Project> {
  const payload = createProjectSchema.parse(input);
  const user = await getCurrentUser();

  if (!hasSupabaseEnv()) {
    return createDevProject({
      ownerId: user.id,
      name: payload.name,
      domain: payload.domain,
      platform: payload.platform as Platform
    });
  }

  const supabase = createSupabaseAdminClient();
  const projectId = randomUUID();
  const publicKey = `pub_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const { error } = await supabase.from("projects").insert({
    id: projectId,
    owner_id: user.id,
    workspace_id: user.id,
    name: payload.name,
    domain: payload.domain,
    platform: payload.platform,
    public_key: publicKey
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: projectId,
    name: payload.name,
    domain: payload.domain,
    platform: payload.platform as Platform,
    publicKey,
    workspaceId: user.id,
    scriptUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/optify-sdk.js`
  };
}

function buildPopupCode(payload: z.infer<typeof createExperimentSchema>) {
  const placementStyles =
    payload.popupPlacement === "slide_in_right"
      ? "align-items:flex-end;justify-content:flex-end;"
      : payload.popupPlacement === "sticky_bottom_bar"
        ? "align-items:flex-end;justify-content:center;"
        : "align-items:center;justify-content:center;";
  const shellRadius = payload.popupPlacement === "sticky_bottom_bar" ? "28px 28px 0 0" : "28px";
  const shellWidth = payload.popupPlacement === "sticky_bottom_bar" ? "min(960px,100%)" : "min(520px,100%)";
  const themeStyles =
    payload.popupTheme === "dark"
      ? "background:#11291f;color:#f8f3e7;"
      : payload.popupTheme === "light"
        ? "background:#ffffff;color:#11291f;"
        : "background:#fff2d6;color:#11291f;";
  const titleColor = payload.popupTheme === "dark" ? "#f8f3e7" : "#11291f";
  const bodyColor = payload.popupTheme === "dark" ? "rgba(248,243,231,.78)" : "#4d5a52";
  return [
    "if (!document.getElementById('optify-popup')) {",
    "  var overlay = document.createElement('div');",
    "  overlay.id = 'optify-popup';",
    "  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(17,41,31,.48);z-index:9999;display:flex;" + placementStyles + "padding:24px;';",
    "  overlay.innerHTML = " + JSON.stringify(
      "<div style=\"max-width:" + shellWidth + ";width:100%;" + themeStyles + "border-radius:" + shellRadius + ";padding:28px;box-shadow:0 30px 80px rgba(17,41,31,.22);font-family:inherit;\">" +
        `<p style="font-size:28px;font-weight:700;color:${titleColor};margin:0 0 12px;">${payload.popupTitle}</p>` +
        `<p style="font-size:16px;line-height:1.6;color:${bodyColor};margin:0 0 20px;">${payload.popupBody}</p>` +
        `<button id="optify-popup-cta" data-optify-track="cta_click conversion" style="background:#135c43;color:white;border:none;border-radius:999px;padding:14px 20px;font-size:15px;font-weight:600;cursor:pointer;">${payload.popupCta}</button>` +
        `<button id="optify-popup-close" style="margin-left:12px;background:transparent;border:none;color:${bodyColor};font-size:15px;cursor:pointer;">Close</button>` +
      "</div>"
    ) + ";",
    "  document.body.appendChild(overlay);",
    "  overlay.addEventListener('click', function (event) {",
    "    if (event.target && (event.target.id === 'optify-popup-close' || event.target === overlay)) {",
    "      overlay.remove();",
    "    }",
    "  });",
    "}"
  ].join("\n");
}

function buildVariants(payload: z.infer<typeof createExperimentSchema>, experimentId: string) {
  const visualVariants =
    payload.type === "visual" || payload.type === "custom_code"
      ? [
          { text: payload.variantBText, style: payload.variantBStyle },
          { text: payload.variantCText, style: payload.variantCStyle }
        ].slice(0, payload.variantCount - 1)
      : payload.type === "popup"
        ? [{ text: payload.popupCta || "Open offer", style: "" }]
        : [{ text: payload.recommendationTitle || "Recommendation module", style: "" }];
  const totalVariants = 1 + visualVariants.filter((item) => item.text || item.style).length;
  const baseAllocation = Math.floor(100 / totalVariants);
  const remainder = 100 - baseAllocation * totalVariants;

  return [
    {
      id: randomUUID(),
      experiment_id: experimentId,
      name: "Control",
      key: "A",
      allocation: baseAllocation + remainder,
      is_control: true,
      changes: []
    },
    ...visualVariants.filter((item) => item.text || item.style).map((variantInput, index) => ({
      id: randomUUID(),
      experiment_id: experimentId,
      name:
        payload.type === "popup"
          ? index === 0
            ? "Popup CTA"
            : `Popup Variant ${String.fromCharCode(66 + index)}`
          : payload.type === "recommendation"
            ? index === 0
              ? "Recommendation Module"
              : `Recommendation Variant ${String.fromCharCode(66 + index)}`
            : `Variant ${String.fromCharCode(66 + index)}`,
      key: String.fromCharCode(66 + index),
      allocation: baseAllocation,
      is_control: false,
      changes:
        payload.type === "recommendation"
          ? []
          : payload.type === "popup"
            ? [{ selector: "body", type: "cta" as ChangeType, value: variantInput.text }]
            : [
                ...(variantInput.text ? [{ selector: payload.selector, type: "text" as ChangeType, value: variantInput.text }] : []),
                ...(variantInput.style ? [{ selector: payload.selector, type: "style" as ChangeType, value: variantInput.style }] : [])
              ]
    }))
  ];
}

export async function createExperiment(input: z.infer<typeof createExperimentSchema>): Promise<Experiment> {
  const payload = createExperimentSchema.parse(input);
  const fallbackTargeting: ExperimentTargetingGroup = {
    id: "root",
    kind: "group",
    combinator: "and",
    children: [
      ...(payload.audienceDevice !== "all"
        ? [{ id: "legacy-device", kind: "condition", attribute: "device", operator: "is", value: payload.audienceDevice } as ExperimentTargetingCondition]
        : []),
      ...(payload.audienceSource !== "all"
        ? [{ id: "legacy-source", kind: "condition", attribute: "source", operator: "contains", value: payload.audienceSource } as ExperimentTargetingCondition]
        : [])
    ]
  };
  const targeting = payload.targeting ?? fallbackTargeting;
  const audienceRules = buildLegacyAudienceRules(targeting);

  const recommendationConfig: RecommendationConfig | undefined =
    payload.type === "recommendation"
      ? {
          strategy: payload.recommendationStrategy,
          placement: payload.recommendationPlacement,
          maxProducts: payload.recommendationMaxProducts,
          title: payload.recommendationTitle,
          algorithmNotes: payload.recommendationAlgorithmNotes,
          fallbackStrategy: payload.recommendationFallback,
          trigger: payload.recommendationTrigger,
          audienceIntent: payload.recommendationAudienceIntent,
          sourceMode: payload.recommendationSourceMode,
          selectedProductIds: payload.recommendationSelectedProductIds,
          selectedCollectionIds: payload.recommendationSelectedCollectionIds,
          targetUrl: payload.recommendationTargetUrl,
          placementSelector: payload.recommendationPlacementSelector,
          injectionMode: payload.recommendationInjectionMode,
          layout: payload.recommendationLayout,
          cardTitleLines: payload.recommendationCardTitleLines,
          imageRatio: payload.recommendationImageRatio,
          spacingPx: payload.recommendationSpacingPx,
          paddingPx: payload.recommendationPaddingPx,
          showPrice: payload.recommendationShowPrice,
          showCompareAtPrice: payload.recommendationShowCompareAtPrice,
          showCta: payload.recommendationShowCta,
          ctaLabel: payload.recommendationCtaLabel
        }
      : {
          strategy: "frequently_bought_together",
          placement: "pdp_sidebar",
          maxProducts: 3
        };
  const popupConfig: PopupConfig | undefined =
    payload.type === "popup"
      ? {
          title: payload.popupTitle,
          body: payload.popupBody,
          cta: payload.popupCta,
          trigger: payload.popupTrigger,
          placement: payload.popupPlacement,
          delayMs: payload.popupDelayMs,
          frequencyCap: payload.popupFrequencyCap,
          theme: payload.popupTheme,
          goal: payload.popupGoal
        }
      : undefined;

  const editorMode = payload.type === "custom_code" ? "custom_code" : "visual";
  const customCode = payload.type === "popup" ? buildPopupCode(payload) : payload.customCode;

  if (!hasSupabaseEnv()) {
    return createDevExperiment({
      projectId: payload.projectId,
      name: payload.name,
      pagePattern: payload.pagePattern,
      hypothesis: payload.hypothesis,
      type: payload.type as ExperimentType,
      primaryMetric: payload.primaryMetric,
      status: payload.status,
      selector: payload.selector || "body",
      trafficSplit: payload.trafficSplit,
      variantInputs:
        payload.type === "visual" || payload.type === "custom_code"
          ? [
              { text: payload.variantBText, style: payload.variantBStyle },
              { text: payload.variantCText, style: payload.variantCStyle }
            ].slice(0, payload.variantCount - 1)
          : [{ text: payload.popupCta || "Open offer", style: "" }],
      editorMode,
      customCode,
      audienceRules,
      targeting,
      popupConfig,
      recommendationConfig,
      priority: payload.priority,
      exclusionGroup: payload.exclusionGroup || undefined
    });
  }

  const supabase = createSupabaseAdminClient();
  const experimentId = randomUUID();
  const variants = buildVariants(payload, experimentId);

  const { error } = await supabase.from("experiments").insert({
    id: experimentId,
    project_id: payload.projectId,
    name: payload.name,
    hypothesis: payload.hypothesis,
    page_pattern: payload.pagePattern,
    traffic_split: payload.trafficSplit,
    status: payload.status,
    experiment_type: payload.type,
    primary_metric: payload.primaryMetric,
    editor_mode: editorMode,
    custom_code: customCode,
    audience_rules: audienceRules,
    targeting_rules: targeting,
    popup_config: popupConfig,
    recommendation_config: recommendationConfig
  });

  if (error) {
    throw new Error(error.message);
  }

  const { error: variantError } = await supabase.from("variants").insert(variants);
  if (variantError) {
    throw new Error(variantError.message);
  }

  return {
    id: experimentId,
    projectId: payload.projectId,
    name: payload.name,
    hypothesis: payload.hypothesis,
    pagePattern: payload.pagePattern,
    trafficSplit: payload.trafficSplit,
    status: payload.status,
    workflowState: payload.status === "running" ? "running" : payload.status === "paused" ? "paused" : "draft",
    priority: payload.priority,
    exclusionGroup: payload.exclusionGroup || undefined,
    type: payload.type as ExperimentType,
    primaryMetric: payload.primaryMetric,
    createdAt: new Date().toISOString(),
    editorMode: editorMode,
    customCode,
    audienceRules,
    targeting,
    popupConfig,
    recommendationConfig,
    variants: variants.map((variant) => ({
      id: variant.id,
      experimentId,
      name: variant.name,
      key: variant.key,
      allocation: variant.allocation,
      isControl: variant.is_control,
      changes: variant.changes
    }))
  };
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Code2, LayoutTemplate, Plus, Sparkles, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VisualEditorCanvas } from "@/components/forms/visual-editor-canvas";
import type { ExperimentTargetingCondition, ExperimentTargetingGroup, ExperimentTargetingNode, ShopifyCatalogItem, ShopifyCollectionItem, TargetingAttribute, TargetingOperator } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getDictionary, resolveLocale, withLang } from "@/lib/i18n";

type ExperienceType = "visual" | "custom_code" | "popup" | "recommendation";

const attributes: Array<{ value: TargetingAttribute; label: string; type: "text" | "number" | "select"; options?: string[] }> = [
  { value: "country", label: "Country", type: "text" },
  { value: "region", label: "Region / State", type: "text" },
  { value: "city", label: "City", type: "text" },
  { value: "device", label: "Device", type: "select", options: ["desktop", "mobile", "tablet"] },
  { value: "device_family", label: "Phone / Device family", type: "select", options: ["iphone", "ipad", "android", "windows", "mac", "generic"] },
  { value: "browser", label: "Browser", type: "select", options: ["chrome", "safari", "firefox", "edge"] },
  { value: "os", label: "OS", type: "select", options: ["ios", "android", "windows", "macos", "linux"] },
  { value: "language", label: "Language", type: "text" },
  { value: "source", label: "UTM source", type: "text" },
  { value: "medium", label: "UTM medium", type: "text" },
  { value: "campaign", label: "UTM campaign", type: "text" },
  { value: "term", label: "UTM term", type: "text" },
  { value: "content", label: "UTM content", type: "text" },
  { value: "referrer", label: "Referrer", type: "text" },
  { value: "page_path", label: "Page path", type: "text" },
  { value: "page_url", label: "Page URL", type: "text" },
  { value: "page_type", label: "Shopify page type", type: "select", options: ["index", "product", "collection", "cart", "checkout", "search", "page", "blog"] },
  { value: "query_string", label: "Query string", type: "text" },
  { value: "visitor_type", label: "Visitor type", type: "select", options: ["new", "returning"] },
  { value: "pages_in_session", label: "Pages in session", type: "number" },
  { value: "viewport_width", label: "Viewport width", type: "number" },
  { value: "viewport_height", label: "Viewport height", type: "number" }
];

const textOps: TargetingOperator[] = ["is", "is_not", "contains", "not_contains", "starts_with", "ends_with", "matches_regex", "exists", "not_exists"];
const numberOps: TargetingOperator[] = ["gt", "gte", "lt", "lte", "between", "is", "is_not"];

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`;
}

function createCondition(attribute: TargetingAttribute = "page_path"): ExperimentTargetingCondition {
  return { id: createId(), kind: "condition", attribute, operator: attribute.includes("viewport") || attribute === "pages_in_session" ? "gte" : "contains", value: attribute === "page_path" ? "/products" : "" };
}

function createGroup(): ExperimentTargetingGroup {
  return { id: createId(), kind: "group", combinator: "and", children: [createCondition()] };
}

function getAttributeMeta(attribute: TargetingAttribute) {
  return attributes.find((item) => item.value === attribute) ?? attributes[0];
}

function updateNode(node: ExperimentTargetingNode, nodeId: string, updater: (node: ExperimentTargetingNode) => ExperimentTargetingNode): ExperimentTargetingNode {
  if (node.id === nodeId) return updater(node);
  if (node.kind === "group") return { ...node, children: node.children.map((child) => updateNode(child, nodeId, updater)) };
  return node;
}

function removeNode(group: ExperimentTargetingGroup, nodeId: string): ExperimentTargetingGroup {
  return { ...group, children: group.children.filter((child) => child.id !== nodeId).map((child) => child.kind === "group" ? removeNode(child, nodeId) : child) };
}

function appendToGroup(group: ExperimentTargetingGroup, groupId: string, child: ExperimentTargetingNode): ExperimentTargetingGroup {
  if (group.id === groupId) return { ...group, children: [...group.children, child] };
  return { ...group, children: group.children.map((node) => node.kind === "group" ? appendToGroup(node, groupId, child) : node) };
}

function RuleNode({
  node,
  depth,
  onChange,
  onDelete,
  onAddCondition,
  onAddGroup
}: {
  node: ExperimentTargetingNode;
  depth: number;
  onChange: (nodeId: string, updater: (node: ExperimentTargetingNode) => ExperimentTargetingNode) => void;
  onDelete: (nodeId: string) => void;
  onAddCondition: (groupId: string) => void;
  onAddGroup: (groupId: string) => void;
}) {
  if (node.kind === "condition") {
    const meta = getAttributeMeta(node.attribute);
    const ops = meta.type === "number" ? numberOps : textOps;
    return (
      <div className="rounded-2xl border border-border bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
          <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={node.attribute} onChange={(event) => onChange(node.id, () => createCondition(event.target.value as TargetingAttribute))}>
            {attributes.map((attribute) => <option key={attribute.value} value={attribute.value}>{attribute.label}</option>)}
          </select>
          <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={node.operator} onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, operator: event.target.value as TargetingOperator } : current)}>
            {ops.map((op) => <option key={op} value={op}>{op.replaceAll("_", " ")}</option>)}
          </select>
          {node.operator === "exists" || node.operator === "not_exists" ? (
            <div className="flex h-11 items-center rounded-2xl border border-dashed border-border px-4 text-sm text-muted-foreground">No value needed</div>
          ) : meta.type === "select" ? (
            <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={node.value ?? ""} onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, value: event.target.value } : current)}>
              <option value="">Select value</option>
              {meta.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <Input type={meta.type === "number" ? "number" : "text"} value={node.value ?? ""} onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, value: event.target.value } : current)} placeholder="Value" />
          )}
          <button type="button" onClick={() => onDelete(node.id)} className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-4 text-muted-foreground hover:bg-secondary">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
        {node.operator === "between" ? <div className="mt-3"><Input type="number" value={node.secondValue ?? ""} onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, secondValue: event.target.value } : current)} placeholder="Second value" /></div> : null}
      </div>
    );
  }

  return (
    <div className="rounded-[1.6rem] border border-border bg-[#fcfaf4] p-4" style={{ marginLeft: depth * 12 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary">Group</Badge>
          <select className="h-10 rounded-2xl border border-border px-4 text-sm" value={node.combinator} onChange={(event) => onChange(node.id, (current) => current.kind === "group" ? { ...current, combinator: event.target.value as "and" | "or" } : current)}>
            <option value="and">ALL rules (AND)</option>
            <option value="or">ANY rule (OR)</option>
          </select>
        </div>
        {depth > 0 ? <button type="button" onClick={() => onDelete(node.id)} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-secondary"><Trash2 className="h-4 w-4" />Remove group</button> : null}
      </div>
      <div className="mt-4 space-y-3">
        {node.children.map((child) => <RuleNode key={child.id} node={child} depth={depth + 1} onChange={onChange} onDelete={onDelete} onAddCondition={onAddCondition} onAddGroup={onAddGroup} />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onAddCondition(node.id)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium hover:bg-secondary"><Plus className="h-4 w-4" />Add condition</button>
        <button type="button" onClick={() => onAddGroup(node.id)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium hover:bg-secondary"><Plus className="h-4 w-4" />Add group</button>
      </div>
    </div>
  );
}

export function ExperimentForm({ projectId, locale = "fr" }: { projectId: string; locale?: string }) {
  const currentLocale = resolveLocale(locale);
  const t = getDictionary(currentLocale);
  const router = useRouter();
  const [experienceType, setExperienceType] = useState<ExperienceType>("visual");
  const [variants, setVariants] = useState(2);
  const [name, setName] = useState("");
  const [pagePattern, setPagePattern] = useState("/products/*");
  const [hypothesis, setHypothesis] = useState("");
  const [selector, setSelector] = useState("[data-optify='hero-cta']");
  const [variantBText, setVariantBText] = useState("Get it before tonight's sell-out");
  const [variantCText, setVariantCText] = useState("Unlock the offer before it disappears");
  const [variantBStyle, setVariantBStyle] = useState("");
  const [variantCStyle, setVariantCStyle] = useState("");
  const [primaryMetric, setPrimaryMetric] = useState("conversion");
  const [status, setStatus] = useState("draft");
  const [customCode, setCustomCode] = useState("document.querySelector(\"[data-optify='hero-cta']\")?.classList.add('optify-highlight');");
  const [popupTitle, setPopupTitle] = useState("Unlock 10% off now");
  const [popupBody, setPopupBody] = useState("Catch attention at the right moment with a concise conversion-focused offer.");
  const [popupCta, setPopupCta] = useState("Reveal the offer");
  const [popupTrigger, setPopupTrigger] = useState("time_on_page");
  const [popupPlacement, setPopupPlacement] = useState("modal_center");
  const [popupDelayMs, setPopupDelayMs] = useState(6000);
  const [popupFrequencyCap, setPopupFrequencyCap] = useState("once_per_session");
  const [popupTheme, setPopupTheme] = useState("accent");
  const [popupGoal, setPopupGoal] = useState("conversion");
  const [recommendationStrategy, setRecommendationStrategy] = useState("frequently_bought_together");
  const [recommendationPlacement, setRecommendationPlacement] = useState("pdp_sidebar");
  const [recommendationMaxProducts, setRecommendationMaxProducts] = useState(3);
  const [recommendationTitle, setRecommendationTitle] = useState("Complete the bundle");
  const [recommendationAlgorithmNotes, setRecommendationAlgorithmNotes] = useState("Balance attach rate, margin, and current page intent.");
  const [recommendationFallback, setRecommendationFallback] = useState("best_sellers");
  const [recommendationTrigger, setRecommendationTrigger] = useState("page_view");
  const [recommendationAudienceIntent, setRecommendationAudienceIntent] = useState("all");
  const [recommendationSourceMode, setRecommendationSourceMode] = useState("auto");
  const [recommendationTargetUrl, setRecommendationTargetUrl] = useState("");
  const [recommendationPlacementSelector, setRecommendationPlacementSelector] = useState("");
  const [recommendationInjectionMode, setRecommendationInjectionMode] = useState("append");
  const [recommendationLayout, setRecommendationLayout] = useState("grid");
  const [recommendationCardTitleLines, setRecommendationCardTitleLines] = useState(2);
  const [recommendationImageRatio, setRecommendationImageRatio] = useState("square");
  const [recommendationSpacingPx, setRecommendationSpacingPx] = useState(16);
  const [recommendationPaddingPx, setRecommendationPaddingPx] = useState(16);
  const [recommendationShowPrice, setRecommendationShowPrice] = useState(true);
  const [recommendationShowCompareAtPrice, setRecommendationShowCompareAtPrice] = useState(false);
  const [recommendationShowCta, setRecommendationShowCta] = useState(true);
  const [recommendationCtaLabel, setRecommendationCtaLabel] = useState("Shop now");
  const [pickerStatus, setPickerStatus] = useState("No live storefront placement selected yet.");
  const [catalogProducts, setCatalogProducts] = useState<ShopifyCatalogItem[]>([]);
  const [catalogCollections, setCatalogCollections] = useState<ShopifyCollectionItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<string[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [priority, setPriority] = useState("medium");
  const [exclusionGroup, setExclusionGroup] = useState("");
  const [targeting, setTargeting] = useState<ExperimentTargetingGroup>({ id: "root", kind: "group", combinator: "and", children: [createCondition()] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const summaryAudience = `${targeting.children.length} rule${targeting.children.length > 1 ? "s" : ""} on root ${targeting.combinator.toUpperCase()}`;
  const templates = [
    { key: "visual" as const, icon: LayoutTemplate, title: "Visual edit", body: "Edit CTA, copy, visibility or style on existing selectors." },
    { key: "custom_code" as const, icon: Code2, title: "Custom code", body: "Inject custom DOM logic for advanced behavior." },
    { key: "popup" as const, icon: BellRing, title: "Popup", body: "Drive urgency or offers at a key moment." },
    { key: "recommendation" as const, icon: Sparkles, title: "Product recommendations", body: "Configure Dynamic Yield-style placements." }
  ];

  useEffect(() => {
    if (experienceType !== "recommendation") return;
    if (catalogProducts.length > 0 || catalogCollections.length > 0) return;

    setCatalogLoading(true);
    fetch(`/api/shopify/catalog?projectId=${projectId}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Shopify catalog unavailable")))
      .then((payload) => {
        setCatalogProducts(payload.products ?? []);
        setCatalogCollections(payload.collections ?? []);
      })
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, [catalogCollections.length, catalogProducts.length, experienceType, projectId]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (!data || data.type !== "optify-builder-selection") return;
      setRecommendationPlacementSelector(data.selector || "");
      setRecommendationTargetUrl(data.url || "");
      if (data.pathname) {
        setPagePattern(data.pathname);
      }
      setPickerStatus(data.selector ? `Selected ${data.selector}` : "Selection received.");
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function toggleProduct(id: string) {
    setSelectedProductIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleCollection(id: string) {
    setSelectedCollectionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function openLivePicker() {
    if (!recommendationTargetUrl.trim()) {
      setPickerStatus("Add a Shopify URL first, then open the live picker.");
      return;
    }

    try {
      const url = new URL(recommendationTargetUrl);
      url.searchParams.set("optify_builder", "1");
      url.searchParams.set("optify_builder_origin", window.location.origin);
      window.open(url.toString(), "_blank", "popup=yes,width=1440,height=960");
      setPickerStatus("Picker opened in Shopify. Click an element in the storefront to bring the selector back here.");
    } catch {
      setPickerStatus("The target URL is invalid.");
    }
  }

  async function submit() {
    setLoading(true);
    setError("");
    const response = await fetch(`/api/projects/${projectId}/experiments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: experienceType,
        name,
        pagePattern,
        hypothesis,
        selector,
        primaryMetric,
        status,
        editorMode: experienceType === "custom_code" ? "custom_code" : "visual",
        customCode,
        targeting,
        audienceDevice: "all",
        audienceSource: "all",
        trafficSplit: 100,
        variantCount: experienceType === "recommendation" || experienceType === "popup" ? 2 : variants,
        variantBText,
        variantCText,
        variantBStyle,
        variantCStyle,
        popupTitle,
        popupBody,
        popupCta,
        popupTrigger,
        popupPlacement,
        popupDelayMs,
        popupFrequencyCap,
        popupTheme,
        popupGoal,
        recommendationStrategy,
        recommendationPlacement,
        recommendationMaxProducts,
        recommendationTitle,
        recommendationAlgorithmNotes,
        recommendationFallback,
        recommendationTrigger,
        recommendationAudienceIntent,
        recommendationSourceMode,
        recommendationSelectedProductIds: selectedProductIds,
        recommendationSelectedCollectionIds: selectedCollectionIds,
        recommendationTargetUrl,
        recommendationPlacementSelector,
        recommendationInjectionMode,
        recommendationLayout,
        recommendationCardTitleLines,
        recommendationImageRatio,
        recommendationSpacingPx,
        recommendationPaddingPx,
        recommendationShowPrice,
        recommendationShowCompareAtPrice,
        recommendationShowCta,
        recommendationCtaLabel,
        priority,
        exclusionGroup
      })
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? t.common.createExperiment);
      setLoading(false);
      return;
    }
    router.push(withLang(`/dashboard/projects/${projectId}/experiments/${data.experiment.id}`, currentLocale));
  }

  return (
    <Card className="overflow-hidden border-0 bg-[linear-gradient(180deg,#fffefb_0%,#ffffff_42%,#f7f4ea_100%)] shadow-[0_24px_80px_rgba(17,41,31,0.08)]">
      <div className="space-y-6">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#11291f_0%,#135c43_58%,#f4d07a_140%)] px-6 py-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#f4d07a]">Campaign builder</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">{t.experimentForm.title}</p>
          <p className="mt-2 max-w-3xl text-sm text-white/75">{t.experimentForm.body}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-4">
          {templates.map((template) => {
            const Icon = template.icon;
            return (
              <button key={template.key} type="button" onClick={() => setExperienceType(template.key)} className={cn("rounded-[1.8rem] border p-5 text-left transition", experienceType === template.key ? "border-transparent bg-[linear-gradient(135deg,#135c43_0%,#1e7a5c_100%)] text-white" : "border-border bg-white hover:bg-[#faf7ef]")}>
                <Icon className={cn("h-5 w-5", experienceType === template.key ? "text-white" : "text-primary")} />
                <p className="mt-4 font-semibold">{template.title}</p>
                <p className={cn("mt-2 text-sm", experienceType === template.key ? "text-white/80" : "text-muted-foreground")}>{template.body}</p>
              </button>
            );
          })}
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <Input placeholder="Experience name" value={name} onChange={(event) => setName(event.target.value)} />
            <Input placeholder="/products/*" value={pagePattern} onChange={(event) => setPagePattern(event.target.value)} />
            <Textarea placeholder={t.experimentForm.hypothesisPlaceholder} value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} />

            {(experienceType === "visual" || experienceType === "custom_code") ? (
              <>
                <VisualEditorCanvas locale={currentLocale} selector={selector} variantText={variantBText} variantStyle={variantBStyle} onSelectorChange={setSelector} onVariantTextChange={setVariantBText} onVariantStyleChange={setVariantBStyle} />
                <Input placeholder="[data-optify='hero-cta']" value={selector} onChange={(event) => setSelector(event.target.value)} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Input placeholder={t.experimentForm.variantB} value={variantBText} onChange={(event) => setVariantBText(event.target.value)} />
                  {variants === 3 ? <Input placeholder={t.experimentForm.variantC} value={variantCText} onChange={(event) => setVariantCText(event.target.value)} /> : null}
                </div>
                <Textarea placeholder="Optional CSS for Variant B." value={variantBStyle} onChange={(event) => setVariantBStyle(event.target.value)} />
                {variants === 3 ? <Textarea placeholder="Optional CSS for Variant C." value={variantCStyle} onChange={(event) => setVariantCStyle(event.target.value)} /> : null}
                <input className="block w-full" type="range" min={2} max={3} step={1} value={variants} onChange={(event) => setVariants(Number(event.target.value))} />
              </>
            ) : null}

            {experienceType === "custom_code" ? <Textarea value={customCode} onChange={(event) => setCustomCode(event.target.value)} placeholder={t.experimentForm.customDomCode} /> : null}
            {experienceType === "popup" ? <><Input value={popupTitle} onChange={(event) => setPopupTitle(event.target.value)} /><Textarea value={popupBody} onChange={(event) => setPopupBody(event.target.value)} /><Input value={popupCta} onChange={(event) => setPopupCta(event.target.value)} /></> : null}
            {experienceType === "recommendation" ? (
              <div className="space-y-4">
                <Input value={recommendationTitle} onChange={(event) => setRecommendationTitle(event.target.value)} placeholder="Module title" />
                <Input value={recommendationTargetUrl} onChange={(event) => setRecommendationTargetUrl(event.target.value)} placeholder="Target URL on the Shopify store" />
                <div className="flex flex-wrap items-center gap-3">
                  <button type="button" onClick={openLivePicker} className="inline-flex items-center gap-2 rounded-full bg-[#11291f] px-4 py-2 text-sm text-white">
                    <Plus className="h-4 w-4" />
                    Open live Shopify picker
                  </button>
                  <p className="text-sm text-muted-foreground">{pickerStatus}</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input value={recommendationPlacementSelector} onChange={(event) => setRecommendationPlacementSelector(event.target.value)} placeholder="Placement selector on page" />
                  <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={recommendationInjectionMode} onChange={(event) => setRecommendationInjectionMode(event.target.value)}>
                    <option value="append">Append inside element</option>
                    <option value="before">Insert before element</option>
                    <option value="after">Insert after element</option>
                    <option value="replace">Replace element</option>
                  </select>
                  <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={recommendationSourceMode} onChange={(event) => setRecommendationSourceMode(event.target.value)}>
                    <option value="auto">Auto ranking</option>
                    <option value="manual_products">Manual products</option>
                    <option value="manual_collections">Manual collections</option>
                  </select>
                  <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={recommendationLayout} onChange={(event) => setRecommendationLayout(event.target.value)}>
                    <option value="grid">Grid</option>
                    <option value="carousel">Carousel</option>
                    <option value="stack">Stack</option>
                  </select>
                  <Input type="number" value={recommendationMaxProducts} onChange={(event) => setRecommendationMaxProducts(Number(event.target.value))} placeholder="Number of products" />
                  <Input type="number" value={recommendationSpacingPx} onChange={(event) => setRecommendationSpacingPx(Number(event.target.value))} placeholder="Spacing (px)" />
                  <Input type="number" value={recommendationPaddingPx} onChange={(event) => setRecommendationPaddingPx(Number(event.target.value))} placeholder="Padding (px)" />
                  <Input type="number" value={recommendationCardTitleLines} onChange={(event) => setRecommendationCardTitleLines(Number(event.target.value))} placeholder="Title lines" />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={recommendationStrategy} onChange={(event) => setRecommendationStrategy(event.target.value)}>
                    <option value="frequently_bought_together">Frequently bought together</option>
                    <option value="high_margin">High margin</option>
                    <option value="trending">Trending</option>
                    <option value="personalized">Personalized</option>
                  </select>
                  <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={recommendationPlacement} onChange={(event) => setRecommendationPlacement(event.target.value)}>
                    <option value="pdp_sidebar">PDP sidebar</option>
                    <option value="cart_drawer">Cart drawer</option>
                    <option value="checkout">Checkout</option>
                    <option value="homepage">Homepage</option>
                  </select>
                  <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={recommendationImageRatio} onChange={(event) => setRecommendationImageRatio(event.target.value)}>
                    <option value="square">Square image</option>
                    <option value="portrait">Portrait image</option>
                    <option value="landscape">Landscape image</option>
                  </select>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={recommendationShowPrice} onChange={(event) => setRecommendationShowPrice(event.target.checked)} />Show price</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={recommendationShowCompareAtPrice} onChange={(event) => setRecommendationShowCompareAtPrice(event.target.checked)} />Show compare-at price</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={recommendationShowCta} onChange={(event) => setRecommendationShowCta(event.target.checked)} />Show CTA</label>
                  <Input value={recommendationCtaLabel} onChange={(event) => setRecommendationCtaLabel(event.target.value)} placeholder="CTA label" />
                </div>
                <Textarea value={recommendationAlgorithmNotes} onChange={(event) => setRecommendationAlgorithmNotes(event.target.value)} placeholder="Explain ranking, merchandising, exclusions and layout intent." />

                {(recommendationSourceMode === "manual_products" || recommendationSourceMode === "manual_collections") ? (
                  <div className="rounded-[1.6rem] border border-border bg-[#fcfaf4] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">Shopify catalog picker</p>
                      <div className="text-sm text-muted-foreground">{catalogLoading ? "Loading catalog..." : `${catalogProducts.length} products · ${catalogCollections.length} collections`}</div>
                    </div>
                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      {(recommendationSourceMode === "manual_products" ? catalogProducts : catalogCollections).slice(0, 12).map((item) => {
                        const active = recommendationSourceMode === "manual_products" ? selectedProductIds.includes(item.id) : selectedCollectionIds.includes(item.id);
                        return (
                          <button key={item.id} type="button" onClick={() => recommendationSourceMode === "manual_products" ? toggleProduct(item.id) : toggleCollection(item.id)} className={cn("rounded-2xl border p-3 text-left transition", active ? "border-primary bg-primary/5" : "border-border bg-white hover:bg-secondary/40")}>
                            <p className="font-medium">{item.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">/{item.handle}</p>
                            {recommendationSourceMode === "manual_products" && (item as ShopifyCatalogItem).price ? (
                              <p className="mt-2 text-sm text-muted-foreground">{(item as ShopifyCatalogItem).price}</p>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[1.6rem] border border-border bg-[#f8fbf8] p-4">
                  <p className="text-sm font-semibold">Recommendation module preview</p>
                  <div className="mt-4 rounded-[1.4rem] bg-white p-4" style={{ padding: recommendationPaddingPx }}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{recommendationTitle || "Complete the bundle"}</p>
                      <span className="rounded-full bg-secondary px-3 py-1 text-xs">{recommendationLayout}</span>
                    </div>
                    <div className={cn("mt-4 grid", recommendationLayout === "stack" ? "grid-cols-1" : recommendationLayout === "carousel" ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-3")} style={{ gap: recommendationSpacingPx }}>
                      {Array.from({ length: Math.max(1, Math.min(recommendationMaxProducts, 4)) }).map((_, index) => (
                        <div key={index} className="rounded-3xl border border-border p-3">
                          <div className={cn("rounded-2xl bg-secondary/60", recommendationImageRatio === "portrait" ? "aspect-[3/4]" : recommendationImageRatio === "landscape" ? "aspect-[4/3]" : "aspect-square")} />
                          <p className="mt-3 text-sm font-medium">{`Product card ${index + 1}`}</p>
                          {recommendationShowPrice ? <p className="mt-1 text-sm text-muted-foreground">$49.00</p> : null}
                          {recommendationShowCompareAtPrice ? <p className="text-xs text-muted-foreground line-through">$69.00</p> : null}
                          {recommendationShowCta ? <div className="mt-3 rounded-full bg-primary px-3 py-2 text-center text-xs text-primary-foreground">{recommendationCtaLabel || "Shop now"}</div> : null}
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">Placement: {recommendationInjectionMode} {recommendationPlacementSelector || "selected DOM anchor"} on {recommendationTargetUrl || "selected page URL"}.</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#fff5d9_0%,#ffffff_100%)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Simple summary</p>
              <p className="mt-3 text-xl font-semibold">{name || "Name your campaign"}</p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>Type: {experienceType.replaceAll("_", " ")}</p>
                <p>Primary metric: {primaryMetric.replaceAll("_", " ")}</p>
                <p>Targeting: {summaryAudience}</p>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-border bg-white p-5">
              <p className="text-sm font-medium">Launch orchestration</p>
              <div className="mt-4 grid gap-4">
                <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option></select>
                <Input placeholder="Exclusion group" value={exclusionGroup} onChange={(event) => setExclusionGroup(event.target.value)} />
                <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={primaryMetric} onChange={(event) => setPrimaryMetric(event.target.value)}><option value="conversion">{t.common.conversion}</option><option value="click">{t.common.click}</option><option value="page_view">{t.common.pageView}</option><option value="add_to_cart">Add to cart</option></select>
                <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">{t.common.draft}</option><option value="running">{t.common.running}</option><option value="paused">{t.common.paused}</option></select>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-border bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Audience targeting builder</p>
                  <p className="mt-1 text-sm text-muted-foreground">Dynamic Yield-style conditions, nested groups, and strict AND / OR logic.</p>
                </div>
                <Badge className="bg-primary/10 text-primary">Advanced targeting</Badge>
              </div>
              <div className="mt-4">
                <RuleNode
                  node={targeting}
                  depth={0}
                  onChange={(nodeId, updater) => setTargeting((current) => updateNode(current, nodeId, updater) as ExperimentTargetingGroup)}
                  onDelete={(nodeId) => setTargeting((current) => {
                    const next = removeNode(current, nodeId);
                    return next.children.length ? next : { ...next, children: [createCondition()] };
                  })}
                  onAddCondition={(groupId) => setTargeting((current) => appendToGroup(current, groupId, createCondition()))}
                  onAddGroup={(groupId) => setTargeting((current) => appendToGroup(current, groupId, createGroup()))}
                />
              </div>
              <div className="mt-4 rounded-2xl bg-secondary/40 p-4 text-sm text-muted-foreground">Country works immediately when Shopify localization data is available. Region and city are already supported by the engine and will match as soon as those values are available in storefront context.</div>
            </div>

            <Button disabled={loading} onClick={submit} className="h-12 text-base shadow-glow">{loading ? t.common.loadingExperiment : t.common.createExperiment}</Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}

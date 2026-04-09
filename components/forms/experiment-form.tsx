"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Code2, LayoutTemplate, MousePointerClick, Plus, Sparkles, Trash2 } from "lucide-react";
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
  { value: "country", label: "Pays", type: "text" },
  { value: "region", label: "Region", type: "text" },
  { value: "city", label: "Ville", type: "text" },
  { value: "device", label: "Appareil", type: "select", options: ["desktop", "mobile", "tablet"] },
  { value: "device_family", label: "Famille d'appareil", type: "select", options: ["iphone", "ipad", "android", "windows", "mac", "generic"] },
  { value: "browser", label: "Navigateur", type: "select", options: ["chrome", "safari", "firefox", "edge"] },
  { value: "os", label: "OS", type: "select", options: ["ios", "android", "windows", "macos", "linux"] },
  { value: "language", label: "Langue", type: "text" },
  { value: "source", label: "Source UTM", type: "text" },
  { value: "medium", label: "Medium UTM", type: "text" },
  { value: "campaign", label: "Campagne UTM", type: "text" },
  { value: "referrer", label: "Referrer", type: "text" },
  { value: "page_path", label: "Chemin de page", type: "text" },
  { value: "page_url", label: "URL de page", type: "text" },
  { value: "page_type", label: "Type de page Shopify", type: "select", options: ["index", "product", "collection", "cart", "checkout", "search", "page", "blog"] },
  { value: "visitor_type", label: "Type de visiteur", type: "select", options: ["new", "returning"] },
  { value: "pages_in_session", label: "Pages dans la session", type: "number" },
  { value: "day_of_week", label: "Jour de semaine", type: "select", options: ["0", "1", "2", "3", "4", "5", "6"] },
  { value: "hour_of_day", label: "Heure", type: "number" },
  { value: "viewport_width", label: "Largeur viewport", type: "number" },
  { value: "viewport_height", label: "Hauteur viewport", type: "number" }
];

const textOps: TargetingOperator[] = ["is", "is_not", "contains", "not_contains", "starts_with", "ends_with", "matches_regex", "exists", "not_exists"];
const numberOps: TargetingOperator[] = ["gt", "gte", "lt", "lte", "between", "is", "is_not"];

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`;
}

function createCondition(attribute: TargetingAttribute = "page_path"): ExperimentTargetingCondition {
  return {
    id: createId(),
    kind: "condition",
    attribute,
    operator: ["pages_in_session", "hour_of_day", "viewport_width", "viewport_height"].includes(attribute) ? "gte" : attribute === "day_of_week" ? "is" : "contains",
    value: attribute === "page_path" ? "/products" : ""
  };
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

function RuleNode({ node, depth, onChange, onDelete, onAddCondition, onAddGroup }: {
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
      <div className="rounded-2xl border border-[#e6d8c5] bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.9fr_1fr_auto]">
          <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={node.attribute} onChange={(event) => onChange(node.id, () => createCondition(event.target.value as TargetingAttribute))}>
            {attributes.map((attribute) => <option key={attribute.value} value={attribute.value}>{attribute.label}</option>)}
          </select>
          <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={node.operator} onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, operator: event.target.value as TargetingOperator } : current)}>
            {ops.map((op) => <option key={op} value={op}>{op.replaceAll("_", " ")}</option>)}
          </select>
          {node.operator === "exists" || node.operator === "not_exists" ? (
            <div className="flex h-11 items-center rounded-2xl border border-dashed border-[#d9ccb8] px-4 text-sm text-[#786d5f]">Aucune valeur</div>
          ) : meta.type === "select" ? (
            <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={node.value ?? ""} onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, value: event.target.value } : current)}>
              <option value="">Choisir</option>
              {meta.options?.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <Input type={meta.type === "number" ? "number" : "text"} value={node.value ?? ""} onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, value: event.target.value } : current)} placeholder="Valeur" />
          )}
          <button type="button" onClick={() => onDelete(node.id)} className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d9ccb8] px-4 text-[#786d5f] hover:bg-[#faf4ea]"><Trash2 className="h-4 w-4" /></button>
        </div>
        {node.operator === "between" ? <div className="mt-3"><Input type="number" value={node.secondValue ?? ""} onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, secondValue: event.target.value } : current)} placeholder="Seconde valeur" /></div> : null}
      </div>
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-[#e8dbc9] bg-[#fcf8f1] p-4" style={{ marginLeft: depth * 12 }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-[#f5e8d6] text-[#7d5a30]">Groupe</Badge>
          <select className="h-10 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={node.combinator} onChange={(event) => onChange(node.id, (current) => current.kind === "group" ? { ...current, combinator: event.target.value as "and" | "or" } : current)}>
            <option value="and">Toutes les regles (AND)</option>
            <option value="or">Une des regles (OR)</option>
          </select>
        </div>
        {depth > 0 ? <button type="button" onClick={() => onDelete(node.id)} className="inline-flex items-center gap-2 rounded-full border border-[#d9ccb8] px-3 py-2 text-sm text-[#786d5f] hover:bg-white"><Trash2 className="h-4 w-4" />Supprimer</button> : null}
      </div>
      <div className="mt-4 space-y-3">
        {node.children.map((child) => <RuleNode key={child.id} node={child} depth={depth + 1} onChange={onChange} onDelete={onDelete} onAddCondition={onAddCondition} onAddGroup={onAddGroup} />)}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onAddCondition(node.id)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium hover:bg-[#f5efe4]"><Plus className="h-4 w-4" />Ajouter une condition</button>
        <button type="button" onClick={() => onAddGroup(node.id)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium hover:bg-[#f5efe4]"><Plus className="h-4 w-4" />Ajouter un groupe</button>
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
  const [visualTargetUrl, setVisualTargetUrl] = useState("");
  const [visualSelectionLabel, setVisualSelectionLabel] = useState("");
  const [visualPickerStatus, setVisualPickerStatus] = useState("Aucun element Shopify selectionne.");
  const [variantBText, setVariantBText] = useState("");
  const [variantCText, setVariantCText] = useState("");
  const [variantBStyle, setVariantBStyle] = useState("");
  const [variantCStyle, setVariantCStyle] = useState("");
  const [primaryMetric, setPrimaryMetric] = useState("conversion");
  const [status, setStatus] = useState("draft");
  const [trafficSplit, setTrafficSplit] = useState(100);
  const [customCode, setCustomCode] = useState("document.querySelector(\"[data-optify='hero-cta']\")?.classList.add('optify-highlight');");
  const [popupTitle, setPopupTitle] = useState("Debloquez -10 % maintenant");
  const [popupBody, setPopupBody] = useState("Un message court, declenche au bon moment, pour recuperer une intention hesitante.");
  const [popupCta, setPopupCta] = useState("Voir l'offre");
  const [popupTrigger, setPopupTrigger] = useState("time_on_page");
  const [popupPlacement, setPopupPlacement] = useState("modal_center");
  const [popupDelayMs, setPopupDelayMs] = useState(6000);
  const [popupFrequencyCap, setPopupFrequencyCap] = useState("once_per_session");
  const [popupTheme, setPopupTheme] = useState("accent");
  const [popupGoal, setPopupGoal] = useState("conversion");
  const [recommendationStrategy, setRecommendationStrategy] = useState("frequently_bought_together");
  const [recommendationPlacement, setRecommendationPlacement] = useState("pdp_sidebar");
  const [recommendationMaxProducts, setRecommendationMaxProducts] = useState(3);
  const [recommendationTitle, setRecommendationTitle] = useState("Completer cette commande");
  const [recommendationAlgorithmNotes, setRecommendationAlgorithmNotes] = useState("Pousser des produits coherents avec l'intention de la page.");
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
  const [recommendationCtaLabel, setRecommendationCtaLabel] = useState("Acheter");
  const [pickerStatus, setPickerStatus] = useState("Aucun placement live selectionne.");
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
      if (data.scope === "experience") {
        setSelector(data.selector || "");
        setVisualTargetUrl(data.url || "");
        setVisualSelectionLabel(data.label || "");
        if (typeof data.variantText === "string") setVariantBText(data.variantText);
        if (typeof data.variantStyle === "string") setVariantBStyle(data.variantStyle);
        if (data.pathname) setPagePattern(data.pathname);
        setVisualPickerStatus(data.selector ? `Element relie a Shopify: ${data.selector}` : "Selection recue depuis Shopify.");
        return;
      }
      setRecommendationPlacementSelector(data.selector || "");
      setRecommendationTargetUrl(data.url || "");
      if (data.pathname) setPagePattern(data.pathname);
      setPickerStatus(data.selector ? `Placement selectionne: ${data.selector}` : "Selection recue.");
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  function applyBlueCartPreset() {
    setExperienceType("visual");
    setName("Bouton panier bleu sur PDP");
    setPagePattern("/products/*");
    setHypothesis("Un bouton d'ajout au panier plus contraste sur la page produit devrait augmenter les ajouts au panier.");
    setSelector("form[action*='/cart/add'] [type='submit'], [name='add'], button[data-add-to-cart], [data-add-to-cart]");
    setVisualSelectionLabel("Bouton d'ajout au panier");
    setVisualPickerStatus("Preset applique. Ouvre l'editeur live si tu veux viser un autre bouton.");
    setVariantBStyle("background:#2563eb !important;color:#ffffff !important;border-color:#2563eb !important;");
    setVariantBText("");
    setPrimaryMetric("add_to_cart");
    setTrafficSplit(100);
    setStatus("running");
  }

  function toggleProduct(id: string) {
    setSelectedProductIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function toggleCollection(id: string) {
    setSelectedCollectionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function openBuilderWindow(targetUrl: string, scope: "experience" | "recommendation") {
    if (!targetUrl.trim()) {
      if (scope === "experience") {
        setVisualPickerStatus("Ajoute d'abord une URL Shopify.");
      } else {
        setPickerStatus("Ajoute d'abord une URL Shopify.");
      }
      return;
    }
    try {
      const url = new URL(targetUrl);
      url.searchParams.set("optify_builder", "1");
      url.searchParams.set("optify_builder_scope", scope);
      url.searchParams.set("optify_builder_origin", window.location.origin);
      if (scope === "experience") {
        url.searchParams.set("optify_builder_selector", selector);
        if (variantBText.trim()) url.searchParams.set("optify_builder_text", variantBText);
        if (variantBStyle.trim()) url.searchParams.set("optify_builder_style", variantBStyle);
      }
      window.open(url.toString(), "_blank", "popup=yes,width=1440,height=960");
      if (scope === "experience") {
        setVisualPickerStatus("Editeur live ouvert. Clique un element dans Shopify puis valide depuis le panneau.");
      } else {
        setPickerStatus("Picker ouvert. Clique un element dans Shopify.");
      }
    } catch {
      if (scope === "experience") {
        setVisualPickerStatus("L'URL cible est invalide.");
      } else {
        setPickerStatus("L'URL cible est invalide.");
      }
    }
  }

  function openLivePicker() {
    openBuilderWindow(recommendationTargetUrl, "recommendation");
  }

  function openVisualEditor() {
    openBuilderWindow(visualTargetUrl, "experience");
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
        trafficSplit,
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
    <Card className="overflow-hidden border border-[#eadfce] bg-[linear-gradient(180deg,#fffdfa_0%,#fff8ef_36%,#ffffff_100%)] shadow-[0_24px_80px_rgba(73,56,26,0.08)]">
      <div className="space-y-6">
        <div className="rounded-[2rem] bg-[linear-gradient(135deg,#ff5f6d_0%,#ff7f50_45%,#ffb36b_100%)] px-6 py-7 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Web experiences</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">Creer une experience Shopify exploitable</p>
          <p className="mt-2 max-w-3xl text-sm text-white/80">Une structure plus proche de Dynamic Yield: type de campagne, contenu, audience, trafic, puis lancement.</p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
          <div className="space-y-6">
            <div className="rounded-[1.8rem] border border-[#eadfce] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a96532]">Type d'experience</p>
              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                {[
                  { key: "visual" as const, icon: LayoutTemplate, title: "Visual edit", body: "Modifier un element du DOM existant." },
                  { key: "custom_code" as const, icon: Code2, title: "Custom code", body: "Injecter du CSS ou du JavaScript cible." },
                  { key: "popup" as const, icon: BellRing, title: "Overlay", body: "Declencher un message a un moment precis." },
                  { key: "recommendation" as const, icon: Sparkles, title: "Recommandations", body: "Inserer un bloc merchandising sur Shopify." }
                ].map((template) => {
                  const Icon = template.icon;
                  return (
                    <button key={template.key} type="button" onClick={() => setExperienceType(template.key)} className={cn("rounded-[1.6rem] border p-5 text-left transition", experienceType === template.key ? "border-[#ff9c73] bg-[#fff2ea]" : "border-[#eadfce] bg-[#fffdfa] hover:bg-[#fff6ef]")}>
                      <Icon className={cn("h-5 w-5", experienceType === template.key ? "text-[#d95e4e]" : "text-[#7d5a30]")} />
                      <p className="mt-4 font-semibold text-[#241b13]">{template.title}</p>
                      <p className="mt-2 text-sm text-[#6f6458]">{template.body}</p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 rounded-[1.4rem] border border-[#f1d2c5] bg-[#fff5ef] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-[#241b13]">Preset recommande</p>
                    <p className="mt-1 text-sm text-[#6f6458]">Pre-remplir un test simple 50/50 sur le bouton d'ajout au panier.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={applyBlueCartPreset}>Pre-remplir le test ATC bleu</Button>
                </div>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-[#eadfce] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a96532]">Fondamentaux</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <Input placeholder="Nom de l'experience" value={name} onChange={(event) => setName(event.target.value)} />
                <Input placeholder="/products/*" value={pagePattern} onChange={(event) => setPagePattern(event.target.value)} />
              </div>
              <div className="mt-4"><Textarea placeholder="Hypothese business et comportementale" value={hypothesis} onChange={(event) => setHypothesis(event.target.value)} /></div>
            </div>

            {(experienceType === "visual" || experienceType === "custom_code") ? (
              <div className="rounded-[1.8rem] border border-[#eadfce] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a96532]">Visual experience</p>
                <div className="mt-5 space-y-4">
                  <VisualEditorCanvas
                    targetUrl={visualTargetUrl}
                    onTargetUrlChange={setVisualTargetUrl}
                    onOpenEditor={openVisualEditor}
                    pickerStatus={visualPickerStatus}
                    selectedLabel={visualSelectionLabel}
                    selector={selector}
                  />
                  <Input placeholder="Selecteur CSS" value={selector} onChange={(event) => setSelector(event.target.value)} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input placeholder="Texte variante B" value={variantBText} onChange={(event) => setVariantBText(event.target.value)} />
                    {variants === 3 ? <Input placeholder="Texte variante C" value={variantCText} onChange={(event) => setVariantCText(event.target.value)} /> : null}
                  </div>
                  <Textarea placeholder="CSS variante B" value={variantBStyle} onChange={(event) => setVariantBStyle(event.target.value)} />
                  {variants === 3 ? <Textarea placeholder="CSS variante C" value={variantCStyle} onChange={(event) => setVariantCStyle(event.target.value)} /> : null}
                  {experienceType === "custom_code" ? <Textarea placeholder="JavaScript custom" value={customCode} onChange={(event) => setCustomCode(event.target.value)} /> : null}
                  <div className="rounded-[1.4rem] border border-[#eadfce] bg-[#fcf8f1] p-4">
                    <div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-[#3f3528]">Nombre de variantes</p><p className="text-sm font-semibold text-[#241b13]">{variants}</p></div>
                    <input className="mt-4 block w-full" type="range" min={2} max={3} step={1} value={variants} onChange={(event) => setVariants(Number(event.target.value))} />
                  </div>
                </div>
              </div>
            ) : null}

            {experienceType === "popup" ? (
              <div className="rounded-[1.8rem] border border-[#eadfce] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a96532]">Overlay</p>
                <div className="mt-5 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2"><Input value={popupTitle} onChange={(event) => setPopupTitle(event.target.value)} /><Input value={popupCta} onChange={(event) => setPopupCta(event.target.value)} /></div>
                  <Textarea value={popupBody} onChange={(event) => setPopupBody(event.target.value)} />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={popupTrigger} onChange={(event) => setPopupTrigger(event.target.value)}><option value="time_on_page">Temps sur page</option><option value="scroll_depth">Scroll depth</option><option value="exit_intent">Intention de sortie</option><option value="cta_click">Apres clic CTA</option></select>
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={popupPlacement} onChange={(event) => setPopupPlacement(event.target.value)}><option value="modal_center">Modal centre</option><option value="slide_in_right">Slide-in droite</option><option value="sticky_bottom_bar">Barre basse</option></select>
                    <Input type="number" value={popupDelayMs} onChange={(event) => setPopupDelayMs(Number(event.target.value))} />
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={popupFrequencyCap} onChange={(event) => setPopupFrequencyCap(event.target.value)}><option value="once_per_session">1 fois / session</option><option value="once_per_day">1 fois / jour</option><option value="always">Toujours</option></select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={popupTheme} onChange={(event) => setPopupTheme(event.target.value)}><option value="accent">Accent</option><option value="light">Clair</option><option value="dark">Sombre</option></select>
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={popupGoal} onChange={(event) => setPopupGoal(event.target.value)}><option value="conversion">Conversion</option><option value="lead_capture">Lead capture</option><option value="click">Click</option></select>
                  </div>
                </div>
              </div>
            ) : null}

            {experienceType === "recommendation" ? (
              <div className="rounded-[1.8rem] border border-[#eadfce] bg-white p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a96532]">Recommendation experience</p>
                <div className="mt-5 space-y-4">
                  <Input value={recommendationTitle} onChange={(event) => setRecommendationTitle(event.target.value)} placeholder="Titre du module" />
                  <Input value={recommendationTargetUrl} onChange={(event) => setRecommendationTargetUrl(event.target.value)} placeholder="URL Shopify cible" />
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={openLivePicker} className="inline-flex items-center gap-2 rounded-full bg-[#241b13] px-4 py-2 text-sm text-white"><MousePointerClick className="h-4 w-4" />Ouvrir le picker Shopify</button>
                    <p className="text-sm text-[#6f6458]">{pickerStatus}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input value={recommendationPlacementSelector} onChange={(event) => setRecommendationPlacementSelector(event.target.value)} placeholder="Selecteur d'ancrage" />
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={recommendationInjectionMode} onChange={(event) => setRecommendationInjectionMode(event.target.value)}><option value="append">Append</option><option value="before">Before</option><option value="after">After</option><option value="replace">Replace</option></select>
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={recommendationSourceMode} onChange={(event) => setRecommendationSourceMode(event.target.value)}><option value="auto">Auto</option><option value="manual_products">Produits manuels</option><option value="manual_collections">Collections manuelles</option></select>
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={recommendationLayout} onChange={(event) => setRecommendationLayout(event.target.value)}><option value="grid">Grid</option><option value="carousel">Carousel</option><option value="stack">Stack</option></select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={recommendationStrategy} onChange={(event) => setRecommendationStrategy(event.target.value)}><option value="frequently_bought_together">Frequently bought together</option><option value="high_margin">High margin</option><option value="trending">Trending</option><option value="personalized">Personalized</option></select>
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={recommendationPlacement} onChange={(event) => setRecommendationPlacement(event.target.value)}><option value="pdp_sidebar">Sidebar PDP</option><option value="cart_drawer">Cart drawer</option><option value="checkout">Checkout</option><option value="homepage">Homepage</option></select>
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={recommendationTrigger} onChange={(event) => setRecommendationTrigger(event.target.value)}><option value="page_view">Page load</option><option value="add_to_cart">Apres ATC</option><option value="checkout_start">Debut checkout</option></select>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Input type="number" value={recommendationMaxProducts} onChange={(event) => setRecommendationMaxProducts(Number(event.target.value))} placeholder="Nb produits" />
                    <Input type="number" value={recommendationSpacingPx} onChange={(event) => setRecommendationSpacingPx(Number(event.target.value))} placeholder="Espacement" />
                    <Input type="number" value={recommendationPaddingPx} onChange={(event) => setRecommendationPaddingPx(Number(event.target.value))} placeholder="Padding" />
                    <Input type="number" value={recommendationCardTitleLines} onChange={(event) => setRecommendationCardTitleLines(Number(event.target.value))} placeholder="Lignes titre" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={recommendationImageRatio} onChange={(event) => setRecommendationImageRatio(event.target.value)}><option value="square">Square</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select>
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={recommendationAudienceIntent} onChange={(event) => setRecommendationAudienceIntent(event.target.value)}><option value="all">Tout le monde</option><option value="new">Nouveaux</option><option value="returning">Recurrents</option><option value="high_intent">Intent fort</option></select>
                    <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={recommendationFallback} onChange={(event) => setRecommendationFallback(event.target.value)}><option value="best_sellers">Best sellers</option><option value="recently_viewed">Recently viewed</option><option value="manual">Manual</option></select>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="flex items-center gap-2 text-sm text-[#3f3528]"><input type="checkbox" checked={recommendationShowPrice} onChange={(event) => setRecommendationShowPrice(event.target.checked)} />Afficher le prix</label>
                    <label className="flex items-center gap-2 text-sm text-[#3f3528]"><input type="checkbox" checked={recommendationShowCompareAtPrice} onChange={(event) => setRecommendationShowCompareAtPrice(event.target.checked)} />Afficher le compare-at</label>
                    <label className="flex items-center gap-2 text-sm text-[#3f3528]"><input type="checkbox" checked={recommendationShowCta} onChange={(event) => setRecommendationShowCta(event.target.checked)} />Afficher le CTA</label>
                    <Input value={recommendationCtaLabel} onChange={(event) => setRecommendationCtaLabel(event.target.value)} placeholder="Texte CTA" />
                  </div>
                  <Textarea value={recommendationAlgorithmNotes} onChange={(event) => setRecommendationAlgorithmNotes(event.target.value)} placeholder="Notes merchandising" />
                  {(recommendationSourceMode === "manual_products" || recommendationSourceMode === "manual_collections") ? (
                    <div className="rounded-[1.5rem] border border-[#eadfce] bg-[#fcf8f1] p-4">
                      <div className="flex items-center justify-between gap-3"><p className="font-medium text-[#241b13]">Selection Shopify</p><div className="text-sm text-[#6f6458]">{catalogLoading ? "Chargement..." : `${catalogProducts.length} produits · ${catalogCollections.length} collections`}</div></div>
                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        {(recommendationSourceMode === "manual_products" ? catalogProducts : catalogCollections).slice(0, 12).map((item) => {
                          const active = recommendationSourceMode === "manual_products" ? selectedProductIds.includes(item.id) : selectedCollectionIds.includes(item.id);
                          const productItem = item as ShopifyCatalogItem;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => recommendationSourceMode === "manual_products" ? toggleProduct(item.id) : toggleCollection(item.id)}
                              className={cn("rounded-2xl border p-3 text-left transition", active ? "border-[#ff9c73] bg-[#fff2ea]" : "border-[#eadfce] bg-white hover:bg-[#faf4eb]")}
                            >
                              <p className="font-medium text-[#241b13]">{item.title}</p>
                              <p className="mt-1 text-xs text-[#6f6458]">/{item.handle}</p>
                              {recommendationSourceMode === "manual_products" && productItem.price ? (
                                <p className="mt-2 text-sm text-[#6f6458]">{productItem.price}</p>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="rounded-[1.8rem] border border-[#eadfce] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a96532]">Orchestration</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.4rem] border border-[#eadfce] bg-[#fcf8f1] p-4"><div className="flex items-center justify-between gap-4"><p className="text-sm font-medium text-[#3f3528]">Traffic split</p><p className="text-sm font-semibold text-[#241b13]">{trafficSplit}%</p></div><input className="mt-4 block w-full" type="range" min={10} max={100} step={10} value={trafficSplit} onChange={(event) => setTrafficSplit(Number(event.target.value))} /></div>
                <div className="rounded-[1.4rem] border border-[#eadfce] bg-[#fcf8f1] p-4 text-sm text-[#6f6458]"><p className="font-medium text-[#241b13]">Lecture runtime</p><div className="mt-3 space-y-2"><p>Audience enrolee: {trafficSplit}% du trafic qualifie.</p><p>Repartition des variantes: {experienceType === "visual" || experienceType === "custom_code" ? (variants === 3 ? "A/B/C" : "A/B") : "A/B"}.</p><p>Declenchement: {experienceType === "popup" ? popupTrigger.replaceAll("_", " ") : experienceType === "recommendation" ? recommendationTrigger.replaceAll("_", " ") : "page load"}.</p></div></div>
                <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Priorite basse</option><option value="medium">Priorite moyenne</option><option value="high">Priorite haute</option></select>
                <Input placeholder="Groupe d'exclusion" value={exclusionGroup} onChange={(event) => setExclusionGroup(event.target.value)} />
                <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={primaryMetric} onChange={(event) => setPrimaryMetric(event.target.value)}><option value="conversion">{t.common.conversion}</option><option value="click">{t.common.click}</option><option value="page_view">{t.common.pageView}</option><option value="add_to_cart">Add to cart</option></select>
                <select className="h-11 rounded-2xl border border-[#d9ccb8] px-4 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}><option value="draft">{t.common.draft}</option><option value="running">{t.common.running}</option><option value="paused">{t.common.paused}</option></select>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-[#eadfce] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a96532]">Audience</p>
              <p className="mt-2 text-sm text-[#6f6458]">Pays, ville, page, source, viewport, jour, heure. Le tout combinable avec des groupes AND / OR.</p>
              <div className="mt-5">
                <RuleNode node={targeting} depth={0} onChange={(nodeId, updater) => setTargeting((current) => updateNode(current, nodeId, updater) as ExperimentTargetingGroup)} onDelete={(nodeId) => setTargeting((current) => { const next = removeNode(current, nodeId); return next.children.length ? next : { ...next, children: [createCondition()] }; })} onAddCondition={(groupId) => setTargeting((current) => appendToGroup(current, groupId, createCondition()))} onAddGroup={(groupId) => setTargeting((current) => appendToGroup(current, groupId, createGroup()))} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[1.8rem] border border-[#eadfce] bg-[linear-gradient(180deg,#fff5ef_0%,#ffffff_100%)] p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a96532]">Resume</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-[#241b13]">{name || "Nommer l'experience"}</p>
              <div className="mt-5 space-y-3 text-sm text-[#6f6458]">
                <div className="flex items-start justify-between gap-3"><span>Type</span><span className="font-medium text-[#241b13]">{experienceType.replaceAll("_", " ")}</span></div>
                <div className="flex items-start justify-between gap-3"><span>Page</span><span className="font-medium text-[#241b13]">{pagePattern}</span></div>
                <div className="flex items-start justify-between gap-3"><span>Trafic enrole</span><span className="font-medium text-[#241b13]">{trafficSplit}%</span></div>
                <div className="flex items-start justify-between gap-3"><span>Metrique</span><span className="font-medium text-[#241b13]">{primaryMetric.replaceAll("_", " ")}</span></div>
                <div className="flex items-start justify-between gap-3"><span>Statut</span><span className="font-medium text-[#241b13]">{status}</span></div>
                <div className="flex items-start justify-between gap-3"><span>Audience</span><span className="text-right font-medium text-[#241b13]">{targeting.children.length} regle(s) · {targeting.combinator.toUpperCase()}</span></div>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-[#eadfce] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a96532]">Premier test</p>
              <p className="mt-3 text-xl font-semibold text-[#241b13]">Bouton panier bleu 50/50</p>
              <p className="mt-2 text-sm leading-6 text-[#6f6458]">Le flow minimum qu'on voulait vraiment voir fonctionner dans Optify: control vs variante bleue sur la page produit.</p>
              <Button className="mt-5 h-11 w-full" onClick={applyBlueCartPreset}>Pre-remplir ce test</Button>
            </div>

            <Button disabled={loading} onClick={submit} className="h-12 text-base shadow-[0_18px_36px_rgba(255,111,97,0.25)]">{loading ? t.common.loadingExperiment : "Creer l'experience"}</Button>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}


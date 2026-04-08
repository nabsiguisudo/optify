"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2, WandSparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  createSegmentElementsStorageKey,
  createSegmentStorageKey,
  dateOperators,
  getSegmentMeta,
  numberOperators,
  textOperators,
  type SavedSegmentElement,
  type SegmentCondition,
  type SegmentDefinition,
  type SegmentGroup,
  type SegmentNode,
  type SegmentOperator,
  type SegmentScope
} from "@/lib/segments";

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `id-${Math.random().toString(36).slice(2)}`;
}

function createCondition(scope: SegmentScope, attribute?: string): SegmentCondition {
  const defaultAttribute = attribute ?? (scope === "user" ? "country" : "visited_page");
  return {
    id: createId(),
    kind: "condition",
    scope,
    attribute: defaultAttribute,
    operator: defaultAttribute.includes("time") || ["total_sessions", "cls", "fid", "inp", "tti", "tbt", "ttfb", "fcp", "lcp", "dom_content_loaded"].includes(defaultAttribute) ? "gte" : "contains",
    value: scope === "event" && defaultAttribute === "visited_page" ? "/products" : ""
  };
}

function createGroup(scope: SegmentScope): SegmentGroup {
  return {
    id: createId(),
    kind: "group",
    combinator: "and",
    children: [createCondition(scope)]
  };
}

function createSegmentDefinition(): SegmentDefinition {
  return {
    id: createId(),
    name: "",
    description: "",
    pinned: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userFilters: createGroup("user"),
    eventFilters: createGroup("event")
  };
}

function updateNode(node: SegmentNode, nodeId: string, updater: (node: SegmentNode) => SegmentNode): SegmentNode {
  if (node.id === nodeId) return updater(node);
  if (node.kind === "group") {
    return {
      ...node,
      children: node.children.map((child) => updateNode(child, nodeId, updater))
    };
  }
  return node;
}

function removeNode(group: SegmentGroup, nodeId: string): SegmentGroup {
  return {
    ...group,
    children: group.children
      .filter((child) => child.id !== nodeId)
      .map((child) => child.kind === "group" ? removeNode(child, nodeId) : child)
  };
}

function appendToGroup(group: SegmentGroup, groupId: string, child: SegmentNode): SegmentGroup {
  if (group.id === groupId) {
    return { ...group, children: [...group.children, child] };
  }
  return {
    ...group,
    children: group.children.map((child) => child.kind === "group" ? appendToGroup(child, groupId, child.id === groupId ? child : child) : child)
  };
}

function countConditions(node: SegmentNode): number {
  if (node.kind === "condition") return 1;
  return node.children.reduce((sum, child) => sum + countConditions(child), 0);
}

function summarizeNode(node: SegmentGroup) {
  return `${countConditions(node)} filtre${countConditions(node) > 1 ? "s" : ""} en ${node.combinator.toUpperCase()}`;
}

function RuleNode({
  node,
  scope,
  depth,
  savedElements,
  onChange,
  onDelete,
  onAddCondition,
  onAddGroup
}: {
  node: SegmentNode;
  scope: SegmentScope;
  depth: number;
  savedElements: SavedSegmentElement[];
  onChange: (nodeId: string, updater: (node: SegmentNode) => SegmentNode) => void;
  onDelete: (nodeId: string) => void;
  onAddCondition: (groupId: string) => void;
  onAddGroup: (groupId: string) => void;
}) {
  if (node.kind === "condition") {
    const groupedAttributes: Array<[string, string[]]> = scope === "user"
      ? [
          ["Identité", ["user_id", "user_name", "user_email"]],
          ["Temps & sessions", ["total_active_time", "total_time", "avg_session_active_time", "avg_session_length", "first_seen", "last_seen", "total_sessions"]],
          ["Contexte", ["backend_string", "locale_string", "country", "city", "device_type", "browser"]]
        ]
      : [
          ["Navigation", ["visited_page", "visited_url", "event_type", "click_text", "click_selector", "saved_element", "input_name"]],
          ["Friction & erreurs", ["friction_signal", "error_type", "compliance_signal"]],
          ["Performance", ["dom_content_loaded", "cls", "fid", "inp", "tti", "tbt", "ttfb", "fcp", "lcp"]]
        ];

    const meta = getSegmentMeta(scope, node.attribute, savedElements);
    const operators =
      meta.type === "number" ? numberOperators
        : meta.type === "date" ? dateOperators
          : textOperators;

    const resolvedOptions = node.attribute === "saved_element"
      ? savedElements.map((element) => ({ label: element.name, value: element.id }))
      : (meta.options ?? []).map((option) => ({ label: option, value: option }));

    return (
      <div className="rounded-[1rem] border border-[#eadfd2] bg-white p-4">
        <div className="grid gap-3 xl:grid-cols-[1.15fr_0.9fr_1fr_auto]">
          <select
            className="h-11 rounded-2xl border border-border px-4 text-sm"
            value={node.attribute}
            onChange={(event) => onChange(node.id, () => createCondition(scope, event.target.value))}
          >
            {groupedAttributes.map(([label, values]) => (
              <optgroup key={label} label={label}>
                {values.map((value) => (
                  <option key={value} value={value}>
                    {getSegmentMeta(scope, value, savedElements).label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <select
            className="h-11 rounded-2xl border border-border px-4 text-sm"
            value={node.operator}
            onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, operator: event.target.value as SegmentOperator } : current)}
          >
            {operators.map((operator) => (
              <option key={operator} value={operator}>
                {operator.replaceAll("_", " ")}
              </option>
            ))}
          </select>

          {node.operator === "exists" || node.operator === "not_exists" ? (
            <div className="flex h-11 items-center rounded-2xl border border-dashed border-border px-4 text-sm text-muted-foreground">
              Pas de valeur requise
            </div>
          ) : resolvedOptions.length > 0 ? (
            <select
              className="h-11 rounded-2xl border border-border px-4 text-sm"
              value={node.value ?? ""}
              onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, value: event.target.value } : current)}
            >
              <option value="">Choisir une valeur</option>
              {resolvedOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <Input
              type={meta.type === "number" ? "number" : meta.type === "date" ? "date" : "text"}
              value={node.value ?? ""}
              onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, value: event.target.value } : current)}
              placeholder="Valeur"
            />
          )}

          <button
            type="button"
            onClick={() => onDelete(node.id)}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-border px-4 text-muted-foreground transition hover:bg-secondary"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {node.operator === "between" ? (
          <div className="mt-3">
            <Input
              type={meta.type === "number" ? "number" : meta.type === "date" ? "date" : "text"}
              value={node.secondValue ?? ""}
              onChange={(event) => onChange(node.id, (current) => current.kind === "condition" ? { ...current, secondValue: event.target.value } : current)}
              placeholder="Seconde valeur"
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn("rounded-[1.4rem] border border-[#eadfd2] bg-[#fcfaf4] p-4", depth > 0 && "ml-3")}
      style={{ marginLeft: depth * 12 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/10 text-primary">{scope === "user" ? "User filters" : "Event filters"}</Badge>
          <select
            className="h-10 rounded-2xl border border-border px-4 text-sm"
            value={node.combinator}
            onChange={(event) => onChange(node.id, (current) => current.kind === "group" ? { ...current, combinator: event.target.value as "and" | "or" } : current)}
          >
            <option value="and">TOUS (AND)</option>
            <option value="or">AU MOINS UN (OR)</option>
          </select>
        </div>
        {depth > 0 ? (
          <button type="button" onClick={() => onDelete(node.id)} className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary">
            <Trash2 className="h-4 w-4" />
            Supprimer le groupe
          </button>
        ) : null}
      </div>
      <div className="mt-4 space-y-3">
        {node.children.map((child) => (
          <RuleNode
            key={child.id}
            node={child}
            scope={scope}
            depth={depth + 1}
            savedElements={savedElements}
            onChange={onChange}
            onDelete={onDelete}
            onAddCondition={onAddCondition}
            onAddGroup={onAddGroup}
          />
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => onAddCondition(node.id)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium transition hover:bg-secondary">
          <Plus className="h-4 w-4" />
          Ajouter un filtre
        </button>
        <button type="button" onClick={() => onAddGroup(node.id)} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium transition hover:bg-secondary">
          <Plus className="h-4 w-4" />
          Ajouter un groupe
        </button>
      </div>
    </div>
  );
}

export function SegmentsStudio({
  projectId,
  analyticsHref
}: {
  projectId: string;
  analyticsHref: string;
}) {
  const [segments, setSegments] = useState<SegmentDefinition[]>([]);
  const [savedElements, setSavedElements] = useState<SavedSegmentElement[]>([]);
  const [draft, setDraft] = useState<SegmentDefinition>(() => createSegmentDefinition());
  const [elementDraft, setElementDraft] = useState({
    name: "",
    description: "",
    role: "",
    targetUrl: "",
    device: "desktop" as SavedSegmentElement["device"],
    selector: "",
    elementText: ""
  });
  const [builderOpen, setBuilderOpen] = useState(false);
  const [pickerStatus, setPickerStatus] = useState("Aucun élément sélectionné dans la boutique pour l'instant.");

  useEffect(() => {
    try {
      const savedSegments = window.localStorage.getItem(createSegmentStorageKey(projectId));
      const savedElementsRaw = window.localStorage.getItem(createSegmentElementsStorageKey(projectId));
      if (savedSegments) setSegments(JSON.parse(savedSegments) as SegmentDefinition[]);
      if (savedElementsRaw) setSavedElements(JSON.parse(savedElementsRaw) as SavedSegmentElement[]);
    } catch {
      setSegments([]);
      setSavedElements([]);
    }
  }, [projectId]);

  useEffect(() => {
    window.localStorage.setItem(createSegmentStorageKey(projectId), JSON.stringify(segments));
  }, [projectId, segments]);

  useEffect(() => {
    window.localStorage.setItem(createSegmentElementsStorageKey(projectId), JSON.stringify(savedElements));
  }, [projectId, savedElements]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const data = event.data as {
        type?: string;
        selector?: string;
        elementText?: string;
        targetUrl?: string;
      };

      if (!data || data.type !== "optify-builder-selection") return;
      setElementDraft((current) => ({
        ...current,
        selector: data.selector ?? current.selector,
        elementText: data.elementText ?? current.elementText,
        targetUrl: data.targetUrl ?? current.targetUrl
      }));
      setPickerStatus(`Élément capturé: ${data.selector ?? "sélecteur inconnu"}`);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const pinnedSegments = useMemo(() => segments.filter((segment) => segment.pinned), [segments]);

  function persistSegment() {
    if (!draft.name.trim()) return;
    const nextSegment: SegmentDefinition = {
      ...draft,
      updatedAt: new Date().toISOString()
    };
    setSegments((current) => [nextSegment, ...current.filter((segment) => segment.id !== nextSegment.id)]);
    setDraft(createSegmentDefinition());
    setBuilderOpen(false);
  }

  function removeSegment(segmentId: string) {
    setSegments((current) => current.filter((segment) => segment.id !== segmentId));
  }

  function togglePinned(segmentId: string) {
    setSegments((current) => current.map((segment) => segment.id === segmentId ? { ...segment, pinned: !segment.pinned, updatedAt: new Date().toISOString() } : segment));
  }

  function saveElement() {
    if (!elementDraft.name.trim() || !elementDraft.targetUrl.trim()) return;
    const nextElement: SavedSegmentElement = {
      id: createId(),
      name: elementDraft.name.trim(),
      description: elementDraft.description.trim(),
      role: elementDraft.role.trim(),
      targetUrl: elementDraft.targetUrl.trim(),
      device: elementDraft.device,
      selector: elementDraft.selector.trim(),
      elementText: elementDraft.elementText.trim(),
      createdAt: new Date().toISOString()
    };
    setSavedElements((current) => [nextElement, ...current]);
    setElementDraft({
      name: "",
      description: "",
      role: "",
      targetUrl: "",
      device: "desktop",
      selector: "",
      elementText: ""
    });
    setPickerStatus("Élément sauvegardé. Tu peux maintenant l'utiliser comme filtre dans les events.");
  }

  function openPicker() {
    if (!elementDraft.targetUrl.trim()) {
      setPickerStatus("Ajoute d'abord une URL de page pour ouvrir le picker.");
      return;
    }

    try {
      const url = new URL(elementDraft.targetUrl);
      url.searchParams.set("optify_builder", "1");
      url.searchParams.set("optify_builder_origin", window.location.origin);
      const popup = window.open(url.toString(), "_blank", "noopener,noreferrer");
      setPickerStatus(popup ? "Picker ouvert dans la boutique. Clique un élément pour récupérer le sélecteur." : "Impossible d'ouvrir le picker.");
    } catch {
      setPickerStatus("URL invalide pour le picker.");
    }
  }

  function updateGroup(scope: SegmentScope, updater: (group: SegmentGroup) => SegmentGroup) {
    setDraft((current) => ({
      ...current,
      [scope === "user" ? "userFilters" : "eventFilters"]: updater(scope === "user" ? current.userFilters : current.eventFilters)
    }));
  }

  return (
    <div className="space-y-6">
      <Card className="border border-[#ebe3d5] bg-white shadow-[0_14px_34px_rgba(73,56,26,0.05)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-[#221b10]">Segments personnalisés</h2>
            <p className="mt-2 text-sm text-[#6b6255]">
              Une base plus proche de FullStory: filtres utilisateur, filtres événements, groupes AND / OR, éléments sauvegardés et segments épinglables dans Analytics.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setBuilderOpen((current) => !current)}>
              <Plus className="h-4 w-4" />
              Nouveau segment
            </Button>
            <Button asChild variant="outline">
              <a href={analyticsHref}>Retour à Analytics</a>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.2rem] border border-[#ece4d8] bg-white p-4">
            <p className="text-sm text-[#7a705f]">Segments créés</p>
            <p className="mt-2 text-3xl font-semibold text-[#221b10]">{segments.length}</p>
          </div>
          <div className="rounded-[1.2rem] border border-[#ece7de] bg-[#faf8f3] p-4">
            <p className="text-sm text-[#7a705f]">Segments épinglés</p>
            <p className="mt-2 text-3xl font-semibold text-[#221b10]">{pinnedSegments.length}</p>
          </div>
          <div className="rounded-[1.2rem] border border-[#ead9bc] bg-[#fff7eb] p-4">
            <p className="text-sm text-[#7a705f]">Éléments sauvegardés</p>
            <p className="mt-2 text-3xl font-semibold text-[#221b10]">{savedElements.length}</p>
          </div>
        </div>
      </Card>

      {builderOpen ? (
        <Card className="border border-[#ebe3d5] bg-white shadow-[0_14px_34px_rgba(73,56,26,0.05)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6d3f]">Segment builder</p>
              <h3 className="mt-2 text-2xl font-semibold text-[#221b10]">Composer un segment</h3>
            </div>
            <Badge className="bg-primary/10 text-primary">User + Events</Badge>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <Input placeholder="Nom du segment" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
            <label className="flex items-center gap-2 rounded-2xl border border-border px-4">
              <input type="checkbox" checked={draft.pinned} onChange={(event) => setDraft((current) => ({ ...current, pinned: event.target.checked }))} />
              <span className="text-sm">Épingler dans Analytics</span>
            </label>
          </div>
          <div className="mt-4">
            <Textarea placeholder="Description du segment" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[#221b10]">User filters</p>
                  <p className="text-sm text-[#6b6255]">Identité, temps, sessions, first seen, backend strings, device, pays, ville, etc.</p>
                </div>
                <Badge className="bg-secondary text-secondary-foreground">{summarizeNode(draft.userFilters)}</Badge>
              </div>
              <RuleNode
                node={draft.userFilters}
                scope="user"
                depth={0}
                savedElements={savedElements}
                onChange={(nodeId, updater) => updateGroup("user", (group) => updateNode(group, nodeId, updater) as SegmentGroup)}
                onDelete={(nodeId) => updateGroup("user", (group) => group.id === nodeId ? group : removeNode(group, nodeId))}
                onAddCondition={(groupId) => updateGroup("user", (group) => appendToGroup(group, groupId, createCondition("user")))}
                onAddGroup={(groupId) => updateGroup("user", (group) => appendToGroup(group, groupId, createGroup("user")))}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[#221b10]">Event filters</p>
                  <p className="text-sm text-[#6b6255]">Pages visitées, clics, inputs, friction, erreurs, performance, compliance, éléments sauvegardés.</p>
                </div>
                <Badge className="bg-secondary text-secondary-foreground">{summarizeNode(draft.eventFilters)}</Badge>
              </div>
              <RuleNode
                node={draft.eventFilters}
                scope="event"
                depth={0}
                savedElements={savedElements}
                onChange={(nodeId, updater) => updateGroup("event", (group) => updateNode(group, nodeId, updater) as SegmentGroup)}
                onDelete={(nodeId) => updateGroup("event", (group) => group.id === nodeId ? group : removeNode(group, nodeId))}
                onAddCondition={(groupId) => updateGroup("event", (group) => appendToGroup(group, groupId, createCondition("event")))}
                onAddGroup={(groupId) => updateGroup("event", (group) => appendToGroup(group, groupId, createGroup("event")))}
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={persistSegment} disabled={!draft.name.trim()}>
              <Save className="h-4 w-4" />
              Sauvegarder le segment
            </Button>
            <Button variant="outline" onClick={() => { setDraft(createSegmentDefinition()); setBuilderOpen(false); }}>
              Annuler
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border border-[#ebe3d5] bg-white shadow-[0_14px_34px_rgba(73,56,26,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-[#221b10]">Éléments sauvegardés</h3>
              <p className="mt-2 text-sm text-[#6b6255]">
                Crée un élément réutilisable à partir d'une URL de boutique, d'un device et d'un sélecteur capturé. Tu pourras ensuite l'utiliser dans les filtres de clic.
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary">Picker Shopify</Badge>
          </div>

          <div className="mt-5 space-y-4">
            <Input placeholder="Nom de l'élément" value={elementDraft.name} onChange={(event) => setElementDraft((current) => ({ ...current, name: event.target.value }))} />
            <Textarea placeholder="Description" value={elementDraft.description} onChange={(event) => setElementDraft((current) => ({ ...current, description: event.target.value }))} />
            <div className="grid gap-4 lg:grid-cols-[1fr_180px]">
              <Input placeholder="URL cible de la boutique" value={elementDraft.targetUrl} onChange={(event) => setElementDraft((current) => ({ ...current, targetUrl: event.target.value }))} />
              <select className="h-11 rounded-2xl border border-border px-4 text-sm" value={elementDraft.device} onChange={(event) => setElementDraft((current) => ({ ...current, device: event.target.value as SavedSegmentElement["device"] }))}>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablette</option>
                <option value="any">Any</option>
              </select>
            </div>
            <Input placeholder="Rôle de l'élément" value={elementDraft.role} onChange={(event) => setElementDraft((current) => ({ ...current, role: event.target.value }))} />
            <Input placeholder="Sélecteur CSS" value={elementDraft.selector} onChange={(event) => setElementDraft((current) => ({ ...current, selector: event.target.value }))} />
            <Input placeholder="Texte visible de l'élément" value={elementDraft.elementText} onChange={(event) => setElementDraft((current) => ({ ...current, elementText: event.target.value }))} />

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={openPicker}>
                <WandSparkles className="h-4 w-4" />
                Ouvrir le picker
              </Button>
              <Button type="button" variant="outline" onClick={saveElement} disabled={!elementDraft.name.trim() || !elementDraft.targetUrl.trim()}>
                <Save className="h-4 w-4" />
                Sauvegarder l'élément
              </Button>
            </div>
            <p className="text-sm text-[#6b6255]">{pickerStatus}</p>
          </div>

          <div className="mt-6 space-y-3">
            {savedElements.length > 0 ? savedElements.map((element) => (
              <div key={element.id} className="rounded-[1rem] border border-[#efe7db] bg-[#fcfaf6] px-4 py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#3f3528]">{element.name}</p>
                    <p className="mt-1 text-xs text-[#7a705f]">
                      {element.role || "Sans rôle"} · {element.device} · {element.selector || "Sélecteur à compléter"}
                    </p>
                    {element.description ? <p className="mt-1 text-xs text-[#7a705f]">{element.description}</p> : null}
                  </div>
                  <button type="button" onClick={() => setSavedElements((current) => current.filter((item) => item.id !== element.id))} className="text-muted-foreground transition hover:text-foreground">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )) : (
              <div className="rounded-[1rem] border border-dashed border-[#dfd5c4] bg-[#fbf8f2] px-4 py-5 text-sm text-[#746956]">
                Aucun élément sauvegardé pour le moment.
              </div>
            )}
          </div>
        </Card>

        <Card className="border border-[#ebe3d5] bg-white shadow-[0_14px_34px_rgba(73,56,26,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-[#221b10]">Bibliothèque de segments</h3>
              <p className="mt-2 text-sm text-[#6b6255]">
                Les segments sauvegardés ici servent de base à une personnalisation de la lecture analytics. Tu peux les épingler pour les retrouver directement dans Analytics.
              </p>
            </div>
            <Badge className="bg-secondary text-secondary-foreground">{segments.length} segments</Badge>
          </div>

          <div className="mt-5 space-y-3">
            {segments.length > 0 ? segments.map((segment) => (
              <div key={segment.id} className="rounded-[1.1rem] border border-[#efe7db] bg-[#fcfaf6] px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-[#3f3528]">{segment.name}</p>
                      {segment.pinned ? <Badge className="bg-primary/10 text-primary">Épinglé</Badge> : null}
                    </div>
                    {segment.description ? <p className="mt-1 text-sm text-[#7a705f]">{segment.description}</p> : null}
                    <p className="mt-2 text-xs text-[#7a705f]">
                      {summarizeNode(segment.userFilters)} · {summarizeNode(segment.eventFilters)} · mis à jour {new Date(segment.updatedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => togglePinned(segment.id)}>
                      {segment.pinned ? "Désépingler" : "Épingler"}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => { setDraft(segment); setBuilderOpen(true); }}>
                      Modifier
                    </Button>
                    <Button type="button" variant="outline" onClick={() => removeSegment(segment.id)}>
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-[1rem] border border-dashed border-[#dfd5c4] bg-[#fbf8f2] px-4 py-5 text-sm text-[#746956]">
                Aucun segment n'a encore été créé. Commence par le bouton <span className="font-medium">Nouveau segment</span>.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

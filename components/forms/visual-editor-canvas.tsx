"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, MoveUpRight, Palette, Radius, Type, Waypoints } from "lucide-react";

type OverlayRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type EditableType = "text" | "button" | "link" | "media" | "container";

type StyleDraft = {
  width: string;
  height: string;
  backgroundColor: string;
  color: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
};

const emptyStyleDraft: StyleDraft = {
  width: "",
  height: "",
  backgroundColor: "",
  color: "",
  borderColor: "",
  borderWidth: "",
  borderRadius: ""
};

function ensureEditorId(element: HTMLElement) {
  if (!element.dataset.optifyEditorId) {
    element.dataset.optifyEditorId = `optify-node-${Math.random().toString(36).slice(2, 10)}`;
  }
  return element.dataset.optifyEditorId;
}

function buildSelector(element: HTMLElement) {
  return `[data-optify-editor-id='${ensureEditorId(element)}']`;
}

function getEditableType(element: Element): EditableType {
  const tag = element.tagName.toLowerCase();
  if (["h1", "h2", "h3", "h4", "p", "span", "strong", "label", "li"].includes(tag)) return "text";
  if (tag === "button") return "button";
  if (tag === "a") return "link";
  if (["img", "video"].includes(tag)) return "media";
  return "container";
}

function rgbToHex(value: string) {
  const match = value.match(/\d+/g);
  if (!match || match.length < 3) return "";
  return `#${match.slice(0, 3).map((item) => Number(item).toString(16).padStart(2, "0")).join("")}`;
}

function parseStyleString(styleValue: string): StyleDraft {
  if (!styleValue.trim()) return { ...emptyStyleDraft };
  const next = { ...emptyStyleDraft };

  styleValue
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((rule) => {
      const [rawKey, ...rawValueParts] = rule.split(":");
      if (!rawKey || rawValueParts.length === 0) return;
      const key = rawKey.trim().toLowerCase();
      const value = rawValueParts.join(":").trim();
      if (key === "width") next.width = value;
      if (key === "height") next.height = value;
      if (key === "background" || key === "background-color") next.backgroundColor = value;
      if (key === "color") next.color = value;
      if (key === "border-color") next.borderColor = value;
      if (key === "border-width") next.borderWidth = value;
      if (key === "border-radius") next.borderRadius = value;
    });

  return next;
}

function serializeStyleDraft(styleDraft: StyleDraft) {
  return [
    styleDraft.width ? `width:${styleDraft.width}` : "",
    styleDraft.height ? `height:${styleDraft.height}` : "",
    styleDraft.backgroundColor ? `background-color:${styleDraft.backgroundColor}` : "",
    styleDraft.color ? `color:${styleDraft.color}` : "",
    styleDraft.borderColor ? `border-color:${styleDraft.borderColor}` : "",
    styleDraft.borderWidth ? `border-width:${styleDraft.borderWidth}` : "",
    styleDraft.borderWidth ? "border-style:solid" : "",
    styleDraft.borderRadius ? `border-radius:${styleDraft.borderRadius}` : ""
  ]
    .filter(Boolean)
    .join(";");
}

function inspectElementStyle(element: HTMLElement): StyleDraft {
  const computed = window.getComputedStyle(element);
  return {
    width: `${Math.round(element.getBoundingClientRect().width)}px`,
    height: `${Math.round(element.getBoundingClientRect().height)}px`,
    backgroundColor: computed.backgroundColor.startsWith("rgb") ? rgbToHex(computed.backgroundColor) : "",
    color: computed.color.startsWith("rgb") ? rgbToHex(computed.color) : "",
    borderColor: computed.borderColor.startsWith("rgb") ? rgbToHex(computed.borderColor) : "",
    borderWidth: computed.borderWidth !== "0px" ? computed.borderWidth : "",
    borderRadius: computed.borderRadius !== "0px" ? computed.borderRadius : ""
  };
}

function getElementLabel(element: HTMLElement) {
  return (element.textContent || element.getAttribute("aria-label") || element.tagName)
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80) || element.tagName.toLowerCase();
}

function shouldBeEditable(element: HTMLElement) {
  const tag = element.tagName.toLowerCase();
  if (["html", "body", "head", "meta", "style", "script", "link"].includes(tag)) return false;
  if (element.dataset.optify === "ignore") return false;
  const rect = element.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) return false;
  const text = (element.textContent || "").trim();
  return Boolean(
    element.dataset.optify ||
      text ||
      ["img", "video", "button", "a", "section", "article", "div", "aside", "header", "footer", "input"].includes(tag)
  );
}

export function VisualEditorCanvas({
  locale,
  selector,
  variantText,
  variantStyle,
  onSelectorChange,
  onVariantTextChange,
  onVariantStyleChange
}: {
  locale: string;
  selector: string;
  variantText: string;
  variantStyle: string;
  onSelectorChange: (selector: string) => void;
  onVariantTextChange?: (value: string) => void;
  onVariantStyleChange?: (value: string) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const selectedElementRef = useRef<HTMLElement | null>(null);
  const hoveredElementRef = useRef<HTMLElement | null>(null);
  const lastExternalStyleRef = useRef(variantStyle);
  const resizingRef = useRef(false);
  const resizeOriginRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [selectedRect, setSelectedRect] = useState<OverlayRect | null>(null);
  const [selectedType, setSelectedType] = useState<EditableType | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [hoverLabel, setHoverLabel] = useState("");
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [styleDraft, setStyleDraft] = useState<StyleDraft>(parseStyleString(variantStyle));
  const [selectionStack, setSelectionStack] = useState<HTMLElement[]>([]);
  const [selectedStackIndex, setSelectedStackIndex] = useState(0);
  const [editableCount, setEditableCount] = useState(0);
  const serializedDraft = useMemo(() => serializeStyleDraft(styleDraft), [styleDraft]);
  const supportsTextEditing = selectedType === "text" || selectedType === "button" || selectedType === "link";

  function getDoc() {
    return iframeRef.current?.contentDocument ?? null;
  }

  function getSurfaceRect(target: HTMLElement | null): OverlayRect | null {
    const iframe = iframeRef.current;
    const surface = surfaceRef.current;
    if (!iframe || !surface || !target) return null;
    const iframeRect = iframe.getBoundingClientRect();
    const surfaceRect = surface.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    return {
      top: iframeRect.top - surfaceRect.top + targetRect.top,
      left: iframeRect.left - surfaceRect.left + targetRect.left,
      width: targetRect.width,
      height: targetRect.height
    };
  }

  function updateSelectedOverlay(target: HTMLElement | null) {
    setSelectedRect(getSurfaceRect(target));
  }

  function applyDraftToElement(element: HTMLElement, draft: StyleDraft) {
    element.style.width = draft.width || "";
    element.style.height = draft.height || "";
    element.style.backgroundColor = draft.backgroundColor || "";
    element.style.color = draft.color || "";
    element.style.borderColor = draft.borderColor || "";
    element.style.borderWidth = draft.borderWidth || "";
    element.style.borderStyle = draft.borderWidth ? "solid" : "";
    element.style.borderRadius = draft.borderRadius || "";
  }

  function buildElementStack(element: HTMLElement | null) {
    const stack: HTMLElement[] = [];
    let current = element;
    while (current && current.tagName.toLowerCase() !== "body") {
      if (shouldBeEditable(current)) {
        ensureEditorId(current);
        stack.push(current);
      }
      current = current.parentElement;
    }
    return stack;
  }

  function selectElement(element: HTMLElement, stack = buildElementStack(element), index = 0, options?: { revealInspector?: boolean }) {
    const resolved = stack[index] ?? element;
    selectedElementRef.current = resolved;
    setSelectionStack(stack);
    setSelectedStackIndex(index);
    onSelectorChange(buildSelector(resolved));
    setSelectedType(getEditableType(resolved));
    setSelectedLabel(getElementLabel(resolved));
    setStyleDraft(inspectElementStyle(resolved));
    updateSelectedOverlay(resolved);
    if (options?.revealInspector) {
      setInspectorOpen(true);
    }
  }

  function syncSelectionFromSelector(nextSelector: string) {
    const doc = getDoc();
    if (!doc || !nextSelector) return;
    let element: HTMLElement | null = null;
    try {
      element = doc.querySelector(nextSelector) as HTMLElement | null;
    } catch {
      element = null;
    }
    if (!element) return;
    selectedElementRef.current = element;
    setSelectedType(getEditableType(element));
    setSelectedLabel(getElementLabel(element));
    setSelectionStack(buildElementStack(element));
    setSelectedStackIndex(0);
    updateSelectedOverlay(element);
  }

  function stepSelection(direction: -1 | 1) {
    if (selectionStack.length === 0) return;
    const nextIndex = Math.min(Math.max(selectedStackIndex + direction, 0), selectionStack.length - 1);
    if (nextIndex === selectedStackIndex) return;
    selectElement(selectionStack[nextIndex], selectionStack, nextIndex, { revealInspector: true });
  }

  useEffect(() => {
    if (variantStyle !== lastExternalStyleRef.current) {
      lastExternalStyleRef.current = variantStyle;
      setStyleDraft(parseStyleString(variantStyle));
    }
  }, [variantStyle]);

  useEffect(() => {
    if (serializedDraft === variantStyle) return;
    lastExternalStyleRef.current = serializedDraft;
    onVariantStyleChange?.(serializedDraft);
  }, [serializedDraft, variantStyle, onVariantStyleChange]);

  useEffect(() => {
    syncSelectionFromSelector(selector);
  }, [selector]);

  useEffect(() => {
    const element = selectedElementRef.current;
    if (!element || !supportsTextEditing) return;
    if (variantText) {
      element.textContent = variantText;
      setSelectedLabel(getElementLabel(element));
      updateSelectedOverlay(element);
    }
  }, [variantText, supportsTextEditing]);

  useEffect(() => {
    const element = selectedElementRef.current;
    if (!element) return;
    applyDraftToElement(element, styleDraft);
    updateSelectedOverlay(element);
  }, [styleDraft]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let cleanup: (() => void) | undefined;

    function attach() {
      const doc = iframe.contentDocument;
      const win = iframe.contentWindow;
      if (!doc || !win) return;

      const style = doc.createElement("style");
      style.textContent = `
        html, body {
          cursor: crosshair !important;
        }
        [data-optify-editable="true"] {
          user-select: none;
          cursor: crosshair !important;
        }
        [data-optify-hovered="true"] {
          outline: 2px dashed rgba(19,92,67,.75) !important;
          outline-offset: 3px !important;
        }
      `;
      doc.head.appendChild(style);
      if (doc.body) {
        doc.body.style.cursor = "crosshair";
      }

      const markTree = (root: ParentNode) => {
        let count = 0;
        root.querySelectorAll("*").forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (!shouldBeEditable(node)) return;
          ensureEditorId(node);
          node.dataset.optifyEditable = "true";
          count += 1;
        });
        if (root === doc) {
          setEditableCount(count);
        }
      };

      markTree(doc);
      syncSelectionFromSelector(selector);

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement)) return;
            if (shouldBeEditable(node)) {
              ensureEditorId(node);
              node.dataset.optifyEditable = "true";
            }
            markTree(node);
          });
        });
        setEditableCount(doc.querySelectorAll("[data-optify-editable='true']").length);
      });

      if (doc.body) {
        observer.observe(doc.body, { childList: true, subtree: true });
      }

      let rafId = 0;
      const setHovered = (target: HTMLElement | null) => {
        if (hoveredElementRef.current === target) return;
        if (hoveredElementRef.current) {
          delete hoveredElementRef.current.dataset.optifyHovered;
        }
        hoveredElementRef.current = target;
        if (target) {
          target.dataset.optifyHovered = "true";
        }
        setHoverLabel(target ? `${target.tagName.toLowerCase()} - ${getElementLabel(target)}` : "");
      };

      const resolveTarget = (eventTarget: EventTarget | null) => {
        const base = eventTarget instanceof HTMLElement ? eventTarget : eventTarget instanceof Element ? eventTarget.parentElement : null;
        if (!base) return null;
        const stack = buildElementStack(base);
        return stack[0] ?? null;
      };

      const handlePointerMove = (event: MouseEvent) => {
        if (resizingRef.current) return;
        if (rafId) {
          win.cancelAnimationFrame(rafId);
        }
        rafId = win.requestAnimationFrame(() => {
          const hovered = resolveTarget(event.target);
          setHovered(hovered);
        });
      };

      const handlePointerLeave = () => {
        if (rafId) {
          win.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        setHovered(null);
      };

      const handlePointerDown = (event: PointerEvent) => {
        const base = event.target instanceof HTMLElement ? event.target : event.target instanceof Element ? event.target.parentElement : null;
        if (!base) return;
        const stack = buildElementStack(base);
        const editable = stack[0];
        if (!editable) return;
        event.preventDefault();
        event.stopPropagation();
        selectElement(editable, stack, 0, { revealInspector: true });
      };

      const handleClickSuppress = (event: MouseEvent) => {
        const base = event.target instanceof HTMLElement ? event.target : event.target instanceof Element ? event.target.parentElement : null;
        if (!base) return;
        const stack = buildElementStack(base);
        if (stack[0]) {
          event.preventDefault();
          event.stopPropagation();
        }
      };

      const syncOverlays = () => {
        updateSelectedOverlay(selectedElementRef.current);
      };

      doc.addEventListener("mousemove", handlePointerMove, true);
      doc.addEventListener("mouseleave", handlePointerLeave, true);
      doc.addEventListener("pointerdown", handlePointerDown, true);
      doc.addEventListener("click", handleClickSuppress, true);
      win.addEventListener("scroll", syncOverlays);
      win.addEventListener("resize", syncOverlays);
      window.addEventListener("resize", syncOverlays);

      cleanup = () => {
        observer.disconnect();
        if (rafId) {
          win.cancelAnimationFrame(rafId);
        }
        if (hoveredElementRef.current) {
          delete hoveredElementRef.current.dataset.optifyHovered;
        }
        hoveredElementRef.current = null;
        setHoverLabel("");
        doc.removeEventListener("mousemove", handlePointerMove, true);
        doc.removeEventListener("mouseleave", handlePointerLeave, true);
        doc.removeEventListener("pointerdown", handlePointerDown, true);
        doc.removeEventListener("click", handleClickSuppress, true);
        win.removeEventListener("scroll", syncOverlays);
        win.removeEventListener("resize", syncOverlays);
        window.removeEventListener("resize", syncOverlays);
        style.remove();
      };
    }

    iframe.addEventListener("load", attach);
    attach();

    return () => {
      iframe.removeEventListener("load", attach);
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      if (!resizingRef.current || !resizeOriginRef.current) return;
      const nextWidth = Math.max(40, resizeOriginRef.current.width + (event.clientX - resizeOriginRef.current.x));
      const nextHeight = Math.max(24, resizeOriginRef.current.height + (event.clientY - resizeOriginRef.current.y));
      setStyleDraft((current) => ({
        ...current,
        width: `${Math.round(nextWidth)}px`,
        height: `${Math.round(nextHeight)}px`
      }));
    }

    function handlePointerUp() {
      resizingRef.current = false;
      resizeOriginRef.current = null;
      updateSelectedOverlay(selectedElementRef.current);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <div className="rounded-[2rem] border border-border bg-white p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Visual editor</p>
          <p className="text-sm text-muted-foreground">Survolez pour viser, cliquez pour selectionner, puis editez texte, taille, couleurs et bordure dans le panneau.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setViewport("desktop")} className={`rounded-full px-3 py-1 text-sm ${viewport === "desktop" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            Desktop
          </button>
          <button type="button" onClick={() => setViewport("mobile")} className={`rounded-full px-3 py-1 text-sm ${viewport === "mobile" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
            Mobile
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-2xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
        {editableCount} elements detectes. Selection actuelle: <span className="font-medium text-foreground">{selectedLabel || "aucune"}</span>
      </div>

      <div>
        <div ref={surfaceRef} className="relative overflow-hidden rounded-[2rem] border border-border bg-[#f8f3e7] p-4">
          <div className={`relative mx-auto overflow-hidden rounded-[1.6rem] border border-border bg-white shadow-sm ${viewport === "desktop" ? "w-full" : "w-[390px] max-w-full"}`}>
            <iframe
              ref={iframeRef}
              src={`/products/demo?lang=${locale}`}
              className={`relative z-10 w-full border-0 ${viewport === "desktop" ? "h-[620px]" : "h-[720px]"}`}
              title="Optify visual editor"
            />

            {selectedRect ? (
              <>
                <div
                  className="pointer-events-none absolute z-30 rounded-2xl border-2 border-primary bg-primary/10"
                  style={{ top: selectedRect.top, left: selectedRect.left, width: selectedRect.width, height: selectedRect.height }}
                />
                <button
                  type="button"
                  aria-label="Resize selected element"
                  className="absolute z-40 h-4 w-4 rounded-full border-2 border-white bg-primary shadow"
                  style={{ top: selectedRect.top + selectedRect.height - 8, left: selectedRect.left + selectedRect.width - 8 }}
                  onPointerDown={(event) => {
                    const selected = selectedElementRef.current;
                    if (!selected) return;
                    event.preventDefault();
                    event.stopPropagation();
                    resizingRef.current = true;
                    resizeOriginRef.current = {
                      x: event.clientX,
                      y: event.clientY,
                      width: selected.getBoundingClientRect().width,
                      height: selected.getBoundingClientRect().height
                    };
                  }}
                />
              </>
            ) : null}

            <div className="pointer-events-none absolute left-4 top-4 z-40 flex max-w-[80%] items-center gap-2 rounded-full bg-[#11291f] px-3 py-2 text-xs font-medium text-white shadow">
              <Crosshair className="h-3.5 w-3.5" />
              <span>{hoverLabel || "Survolez un element editable"}</span>
            </div>
          </div>
            {inspectorOpen && selectedRect ? (
              <div
                className="absolute z-50 w-[340px] max-w-[calc(100%-2rem)] rounded-[1.8rem] border border-border bg-white p-4 shadow-2xl"
                style={{
                  top: Math.min(selectedRect.top + selectedRect.height + 16, viewport === "desktop" ? 420 : 500),
                  left: Math.min(selectedRect.left, (viewport === "desktop" ? 900 : 320) - 340)
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Inspector</p>
                  <p className="mt-2 line-clamp-2 font-semibold">{selectedLabel || "Cliquez un element dans la preview"}</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{selector || "Aucun selecteur choisi"}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedType ? <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-[0.12em]">{selectedType}</span> : null}
                  <button
                    type="button"
                    onClick={() => setInspectorOpen(false)}
                    className="rounded-full bg-secondary px-3 py-1 text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => stepSelection(1)}
                  disabled={selectedStackIndex >= selectionStack.length - 1}
                  className="rounded-2xl bg-secondary px-4 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Parent
                </button>
                <button
                  type="button"
                  onClick={() => stepSelection(-1)}
                  disabled={selectedStackIndex <= 0}
                  className="rounded-2xl bg-secondary px-4 py-3 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Child
                </button>
              </div>

              <div className="mt-3 rounded-2xl bg-secondary/50 px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <MoveUpRight className="h-4 w-4 text-primary" />
                  Precision selection
                </div>
                <p className="mt-2">Utilisez Parent/Child si le clic prend un bloc trop large.</p>
              </div>

              {supportsTextEditing ? (
                <div className="mt-4">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium"><Type className="h-4 w-4 text-primary" /> Text</label>
                  <textarea
                    value={variantText}
                    onChange={(event) => onVariantTextChange?.(event.target.value)}
                    className="min-h-[88px] w-full rounded-2xl border border-border px-4 py-3 text-sm outline-none"
                    placeholder="Edit the text here."
                  />
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium"><Palette className="h-4 w-4 text-primary" /> Background</label>
                  <input type="color" value={styleDraft.backgroundColor || "#135c43"} onChange={(event) => setStyleDraft((current) => ({ ...current, backgroundColor: event.target.value }))} className="h-11 w-full rounded-2xl border border-border bg-white px-2" />
                </div>
                <div>
                  <label className="mb-2 text-sm font-medium">Text color</label>
                  <input type="color" value={styleDraft.color || "#111111"} onChange={(event) => setStyleDraft((current) => ({ ...current, color: event.target.value }))} className="h-11 w-full rounded-2xl border border-border bg-white px-2" />
                </div>
                <div>
                  <label className="mb-2 text-sm font-medium">Border color</label>
                  <input type="color" value={styleDraft.borderColor || "#135c43"} onChange={(event) => setStyleDraft((current) => ({ ...current, borderColor: event.target.value }))} className="h-11 w-full rounded-2xl border border-border bg-white px-2" />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium"><Waypoints className="h-4 w-4 text-primary" /> Border width</label>
                  <input type="range" min="0" max="12" value={Number(styleDraft.borderWidth.replace("px", "") || "0")} onChange={(event) => setStyleDraft((current) => ({ ...current, borderWidth: `${event.target.value}px` }))} className="h-11 w-full" />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium"><Radius className="h-4 w-4 text-primary" /> Radius</label>
                  <input type="range" min="0" max="48" value={Number(styleDraft.borderRadius.replace("px", "") || "0")} onChange={(event) => setStyleDraft((current) => ({ ...current, borderRadius: `${event.target.value}px` }))} className="h-11 w-full" />
                </div>
                <div>
                  <label className="mb-2 text-sm font-medium">Width</label>
                  <input type="text" value={styleDraft.width} onChange={(event) => setStyleDraft((current) => ({ ...current, width: event.target.value }))} placeholder="ex: 260px" className="h-11 w-full rounded-2xl border border-border px-4 text-sm outline-none" />
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-2 block text-sm font-medium">Height</label>
                <input type="text" value={styleDraft.height} onChange={(event) => setStyleDraft((current) => ({ ...current, height: event.target.value }))} placeholder="ex: 64px" className="h-11 w-full rounded-2xl border border-border px-4 text-sm outline-none" />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

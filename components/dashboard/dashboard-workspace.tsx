"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { GripVertical, LayoutDashboard, PanelRight, Pin, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SectionConfig = {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
  defaultSpan?: "full" | "half";
};

type LayoutState = {
  order: string[];
  hidden: string[];
  span: Record<string, "full" | "half">;
};

const STORAGE_KEY = "optify-dashboard-workspace-v2";

function moveItem(list: string[], index: number, direction: -1 | 1) {
  const next = [...list];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function buildPreset(sections: SectionConfig[], preset: "investigate" | "exec" | "optimize" | "product" | "ux"): LayoutState {
  const ids = sections.map((section) => section.id);
  const baseSpan = Object.fromEntries(sections.map((section) => [section.id, section.defaultSpan ?? "full"]));

  if (preset === "exec") {
    return {
      order: ["priorities", "performance", "active-experiments", "activity", ...ids.filter((id) => !["priorities", "performance", "active-experiments", "activity"].includes(id))],
      hidden: ["hero", "onboarding"],
      span: { ...baseSpan, priorities: "full", performance: "full" }
    };
  }

  if (preset === "optimize") {
    return {
      order: ["priorities", "ai-preview", "performance", "active-experiments", "activity", ...ids.filter((id) => !["priorities", "ai-preview", "performance", "active-experiments", "activity"].includes(id))],
      hidden: [],
      span: { ...baseSpan, priorities: "full", "ai-preview": "full", performance: "full" }
    };
  }

  if (preset === "product") {
    return {
      order: ["hero", "onboarding", "priorities", "ai-preview", ...ids.filter((id) => !["hero", "onboarding", "priorities", "ai-preview"].includes(id))],
      hidden: ["activity"],
      span: { ...baseSpan, hero: "full", onboarding: "full", priorities: "full", "ai-preview": "full" }
    };
  }

  if (preset === "ux") {
    return {
      order: ["performance", "activity", "ai-preview", "active-experiments", ...ids.filter((id) => !["performance", "activity", "ai-preview", "active-experiments"].includes(id))],
      hidden: ["hero"],
      span: { ...baseSpan, performance: "full", activity: "full" }
    };
  }

  return {
    order: ["hero", "priorities", "performance", "ai-preview", "active-experiments", "activity", ...ids.filter((id) => !["hero", "priorities", "performance", "ai-preview", "active-experiments", "activity"].includes(id))],
    hidden: [],
    span: { ...baseSpan, hero: "full", priorities: "full", performance: "full", "ai-preview": "full", "active-experiments": "full", activity: "full" }
  };
}

export function DashboardWorkspace({ sections }: { sections: SectionConfig[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<LayoutState>({
    order: sections.map((section) => section.id),
    hidden: [],
    span: Object.fromEntries(sections.map((section) => [section.id, section.defaultSpan ?? "full"]))
  });

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as LayoutState;
      setLayout({
        order: parsed.order?.length ? parsed.order : sections.map((section) => section.id),
        hidden: parsed.hidden ?? [],
        span: { ...Object.fromEntries(sections.map((section) => [section.id, section.defaultSpan ?? "full"])), ...(parsed.span ?? {}) }
      });
    } catch {
      return;
    }
  }, [sections]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const byId = useMemo(() => Object.fromEntries(sections.map((section) => [section.id, section])), [sections]);
  const orderedSections = layout.order
    .map((id) => byId[id])
    .filter(Boolean)
    .filter((section) => !layout.hidden.includes(section.id));

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f2d22_0%,#135c43_55%,#f4d07a_140%)] text-white shadow-[0_24px_80px_rgba(17,41,31,0.18)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#f4d07a]">
              <LayoutDashboard className="h-4 w-4" />
              Custom workspace
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight">Build a cleaner command center in seconds</p>
            <p className="mt-2 max-w-3xl text-sm text-white/75">Choose a role-based view, then only keep the widgets that matter. Everything stays saved for this browser.</p>
          </div>
          <Button variant={isEditing ? "secondary" : "outline"} className={isEditing ? "bg-white text-[#11291f]" : "border-white/20 bg-white/10 text-white hover:bg-white/15"} onClick={() => setIsEditing((value) => !value)}>
            <Settings2 className="h-4 w-4" />
            {isEditing ? "Done editing" : "Customize layout"}
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button type="button" onClick={() => setLayout(buildPreset(sections, "investigate"))} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
            Investigator view
          </button>
          <button type="button" onClick={() => setLayout(buildPreset(sections, "exec"))} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
            CEO view
          </button>
          <button type="button" onClick={() => setLayout(buildPreset(sections, "optimize"))} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
            CRO view
          </button>
          <button type="button" onClick={() => setLayout(buildPreset(sections, "product"))} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
            Product view
          </button>
          <button type="button" onClick={() => setLayout(buildPreset(sections, "ux"))} className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur">
            UX view
          </button>
        </div>
      </Card>

      {isEditing ? (
        <Card className="bg-white">
          <div className="mb-5 flex items-center gap-2 text-sm font-medium">
            <PanelRight className="h-4 w-4 text-primary" />
            Widget organizer
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {layout.order.map((id, index) => {
              const section = byId[id];
              if (!section) return null;
              const isHidden = layout.hidden.includes(id);
              const span = layout.span[id] ?? "full";
              return (
                <div key={id} className="rounded-3xl border border-border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <p className="font-semibold">{section.title}</p>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{section.description}</p>
                    </div>
                    <Pin className={`h-4 w-4 ${isHidden ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-full bg-secondary px-3 py-2 text-sm"
                      onClick={() => setLayout((current) => ({ ...current, order: moveItem(current.order, index, -1) }))}
                    >
                      Move up
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-secondary px-3 py-2 text-sm"
                      onClick={() => setLayout((current) => ({ ...current, order: moveItem(current.order, index, 1) }))}
                    >
                      Move down
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-secondary px-3 py-2 text-sm"
                      onClick={() => setLayout((current) => ({
                        ...current,
                        span: { ...current.span, [id]: span === "full" ? "half" : "full" }
                      }))}
                    >
                      {span === "full" ? "Set half width" : "Set full width"}
                    </button>
                    <button
                      type="button"
                      className="rounded-full bg-secondary px-3 py-2 text-sm"
                      onClick={() => setLayout((current) => ({
                        ...current,
                        hidden: isHidden ? current.hidden.filter((item) => item !== id) : [...current.hidden, id]
                      }))}
                    >
                      {isHidden ? "Show widget" : "Hide widget"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {orderedSections.map((section) => (
          <div key={section.id} className={layout.span[section.id] === "half" ? "" : "xl:col-span-2"}>
            {section.children}
          </div>
        ))}
      </div>
    </div>
  );
}

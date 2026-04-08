"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, PlayCircle, Rocket, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { LaunchAuditEntry, LaunchCenterItem, LaunchCenterSnapshot } from "@/lib/types";

const stateTone: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  ready_for_review: "bg-primary text-white",
  approved: "bg-[#0d684b] text-white",
  scheduled: "bg-[#f4d07a] text-black",
  running: "bg-[#11291f] text-white",
  paused: "bg-secondary text-secondary-foreground"
};

const STORAGE_KEY = "optify-launch-center-v1";

function computeCounts(items: LaunchCenterItem[]) {
  return {
    draft: items.filter((item) => item.state === "draft").length,
    readyForReview: items.filter((item) => item.state === "ready_for_review").length,
    approved: items.filter((item) => item.state === "approved").length,
    scheduled: items.filter((item) => item.state === "scheduled").length,
    running: items.filter((item) => item.state === "running").length,
    paused: items.filter((item) => item.state === "paused").length
  };
}

export function LaunchCenter({ snapshot }: { snapshot: LaunchCenterSnapshot }) {
  const [items, setItems] = useState(snapshot.items);
  const [filter, setFilter] = useState<LaunchCenterItem["state"] | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [auditTrail, setAuditTrail] = useState<LaunchAuditEntry[]>(snapshot.auditTrail);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as Record<string, LaunchCenterItem["state"]>;
      setItems(snapshot.items.map((item) => ({ ...item, state: stored[item.id] ?? item.state })));
    } catch {
      setItems(snapshot.items);
    }
  }, [snapshot.items]);

  useEffect(() => {
    const persisted = Object.fromEntries(items.map((item) => [item.id, item.state]));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [items]);

  useEffect(() => {
    setAuditTrail(snapshot.auditTrail);
  }, [snapshot.auditTrail]);

  const counts = useMemo(() => computeCounts(items), [items]);
  const filteredItems = useMemo(
    () => (filter === "all" ? items : items.filter((item) => item.state === filter)),
    [filter, items]
  );
  const spotlight = filteredItems[0];

  async function updateItemState(item: LaunchCenterItem, nextState: LaunchCenterItem["state"]) {
    setBusyId(item.id);
    const scheduledFor = nextState === "scheduled" ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : undefined;
    const optimistic = (current: LaunchCenterItem[]) =>
      current.map((entry) => (entry.id === item.id ? { ...entry, state: nextState, scheduledFor } : entry));

    setItems(optimistic);

    if (item.kind === "ai_suggestion") {
      setBusyId(null);
      return;
    }

    try {
      const response = await fetch("/api/launch-center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          experimentId: item.id,
          workflowState: nextState,
          scheduledFor,
          priority: item.priority,
          exclusionGroup: item.exclusionGroup
        })
      });

      if (!response.ok) {
        throw new Error("Failed to update workflow");
      }

      const data = await response.json();
      if (data?.experiment) {
        setItems((current) => current.map((entry) => (
          entry.id === item.id
            ? {
                ...entry,
                state: data.experiment.workflowState ?? nextState,
                scheduledFor: data.experiment.scheduledFor,
                priority: data.experiment.priority ?? entry.priority,
                exclusionGroup: data.experiment.exclusionGroup ?? entry.exclusionGroup
              }
            : entry
        )));
      }
    } catch {
      setItems((current) => current.map((entry) => (entry.id === item.id ? item : entry)));
    } finally {
      setAuditTrail((current) => [
        {
          id: `${item.id}-${Date.now()}`,
          itemId: item.id,
          action: nextState,
          timestamp: new Date().toISOString(),
          note: `${item.title} moved to ${nextState.replaceAll("_", " ")}`
        },
        ...current
      ]);
      setBusyId(null);
    }
  }

  async function updateCampaignSettings(item: LaunchCenterItem, changes: Partial<LaunchCenterItem>) {
    const nextItem = { ...item, ...changes };
    setItems((current) => current.map((entry) => (entry.id === item.id ? nextItem : entry)));

    if (item.kind === "ai_suggestion") {
      return;
    }

    await fetch("/api/launch-center", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        experimentId: item.id,
        workflowState: nextItem.state,
        scheduledFor: nextItem.scheduledFor,
        priority: nextItem.priority,
        exclusionGroup: nextItem.exclusionGroup
      })
    });
  }

  return (
    <Card className="overflow-hidden border-0 bg-[linear-gradient(180deg,#fffef9_0%,#ffffff_42%,#f7f4eb_100%)] shadow-[0_24px_70px_rgba(17,41,31,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            <Rocket className="h-4 w-4" />
            Launch center
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">2. Validate, schedule, launch, or rollback</h2>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            This is the execution layer. Only items that are ready to be operated should live here.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-primary text-white">{counts.readyForReview} ready</Badge>
          <Badge>{counts.draft} draft</Badge>
          <Badge>{counts.running} running</Badge>
          <Badge>{counts.paused} paused</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#135c43_0%,#1a7d5b_100%)] p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Ready now</p>
          <p className="mt-2 text-3xl font-semibold">{counts.readyForReview}</p>
          <p className="mt-1 text-sm text-white/75">Needs a yes/no decision</p>
        </div>
        <div className="rounded-3xl bg-[linear-gradient(135deg,#fff2cf_0%,#f4d07a_100%)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Approved</p>
          <p className="mt-2 text-3xl font-semibold">{counts.approved}</p>
          <p className="mt-1 text-sm text-muted-foreground">Cleared for launch</p>
        </div>
        <div className="rounded-3xl bg-[linear-gradient(135deg,#11291f_0%,#214335_100%)] p-4 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Running</p>
          <p className="mt-2 text-3xl font-semibold">{counts.running}</p>
          <p className="mt-1 text-sm text-white/75">Live campaigns in flight</p>
        </div>
        <div className="rounded-3xl bg-[linear-gradient(135deg,#f5f5f2_0%,#ece8de_100%)] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Paused</p>
          <p className="mt-2 text-3xl font-semibold">{counts.paused}</p>
          <p className="mt-1 text-sm text-muted-foreground">Need review or rollback</p>
        </div>
      </div>

      {spotlight ? (
        <div className="mt-6 rounded-[2rem] bg-[linear-gradient(135deg,#fff7df_0%,#ffffff_100%)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Suggested next action</p>
              <p className="mt-2 text-xl font-semibold">{spotlight.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{spotlight.rationale}</p>
            </div>
            <Badge className={stateTone[spotlight.state] ?? stateTone.draft}>{spotlight.state.replaceAll("_", " ")}</Badge>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {(["all", "ready_for_review", "approved", "scheduled", "running", "paused", "draft"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 text-sm transition ${filter === item ? "bg-primary text-white shadow-glow" : "bg-secondary/80 text-secondary-foreground hover:bg-secondary"}`}
          >
            {item.replaceAll("_", " ")}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="rounded-[2rem] border border-border/80 bg-white p-5 shadow-[0_16px_40px_rgba(17,41,31,0.05)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold">{item.title}</p>
                  <Badge>{item.kind === "ai_suggestion" ? "AI-generated" : "Experiment"}</Badge>
                  <Badge className={stateTone[item.state] ?? stateTone.draft}>{item.state.replaceAll("_", " ")}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{item.rationale}</p>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                {item.state === "running" ? <PlayCircle className="h-4 w-4" /> : null}
                {item.state === "approved" ? <CheckCircle2 className="h-4 w-4" /> : null}
                {item.state === "scheduled" ? <CalendarClock className="h-4 w-4" /> : null}
                {item.risk === "high" ? <ShieldAlert className="h-4 w-4" /> : null}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-secondary/70 px-3 py-1 text-muted-foreground">Metric: {item.metric}</span>
              <span className="rounded-full bg-secondary/70 px-3 py-1 text-muted-foreground">Target: {item.target}</span>
              <span className="rounded-full bg-secondary/70 px-3 py-1 text-muted-foreground">Risk: {item.risk}</span>
              <span className="rounded-full bg-secondary/70 px-3 py-1 text-muted-foreground">Priority: {item.priority ?? "medium"}</span>
              {item.exclusionGroup ? <span className="rounded-full bg-secondary/70 px-3 py-1 text-muted-foreground">Exclusion: {item.exclusionGroup}</span> : null}
              {item.scheduledFor ? <span className="rounded-full bg-secondary/70 px-3 py-1 text-muted-foreground">Scheduled: {new Date(item.scheduledFor).toLocaleString("fr-FR")}</span> : null}
            </div>
            <div className="mt-4 rounded-[1.6rem] bg-[#f8f5ec] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Campaign settings</p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
              <input
                type="datetime-local"
                value={item.scheduledFor ? new Date(item.scheduledFor).toISOString().slice(0, 16) : ""}
                onChange={(event) => updateCampaignSettings(item, { scheduledFor: event.target.value ? new Date(event.target.value).toISOString() : undefined })}
                className="h-10 rounded-2xl border border-border px-3 text-sm outline-none"
              />
              <select
                value={item.priority ?? "medium"}
                onChange={(event) => updateCampaignSettings(item, { priority: event.target.value as LaunchCenterItem["priority"] })}
                className="h-10 rounded-2xl border border-border bg-white px-3 text-sm outline-none"
              >
                <option value="low">Low priority</option>
                <option value="medium">Medium priority</option>
                <option value="high">High priority</option>
              </select>
              <input
                type="text"
                value={item.exclusionGroup ?? ""}
                onChange={(event) => updateCampaignSettings(item, { exclusionGroup: event.target.value })}
                placeholder="Exclusion group"
                className="h-10 rounded-2xl border border-border px-3 text-sm outline-none"
              />
            </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={item.href}>Open item</Link>
              </Button>
              {item.state === "draft" || item.state === "ready_for_review" ? (
                <Button type="button" disabled={busyId === item.id} onClick={() => updateItemState(item, "approved")}>
                  Approve
                </Button>
              ) : null}
              {item.state === "approved" ? (
                <Button type="button" variant="outline" disabled={busyId === item.id} onClick={() => updateItemState(item, "scheduled")}>
                  Schedule
                </Button>
              ) : null}
              {(item.state === "approved" || item.state === "scheduled") ? (
                <Button type="button" disabled={busyId === item.id} onClick={() => updateItemState(item, "running")}>
                  Launch
                </Button>
              ) : null}
              {item.state === "running" ? (
                <Button type="button" variant="outline" disabled={busyId === item.id} onClick={() => updateItemState(item, "paused")}>
                  Pause
                </Button>
              ) : null}
              {item.state === "paused" ? (
                <Button type="button" variant="outline" disabled={busyId === item.id} onClick={() => updateItemState(item, "running")}>
                  Resume
                </Button>
              ) : null}
              {(item.state === "running" || item.state === "paused" || item.state === "scheduled") ? (
                <Button type="button" variant="outline" disabled={busyId === item.id} onClick={() => updateItemState(item, "draft")}>
                  Rollback
                </Button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-[2rem] border border-border bg-white p-5">
        <p className="text-sm font-semibold">Launch audit trail</p>
        <div className="mt-3 space-y-2">
          {auditTrail.length === 0 ? (
            <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">No launch actions yet.</div>
          ) : (
            auditTrail.slice(0, 8).map((entry) => (
              <div key={entry.id} className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">
                <div className="font-medium">{entry.note}</div>
                <div className="text-muted-foreground">{new Date(entry.timestamp).toLocaleString("fr-FR")}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

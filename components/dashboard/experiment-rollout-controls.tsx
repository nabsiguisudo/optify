"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PauseCircle, PlayCircle, Save, ShieldAlert, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const statusOptions = [
  {
    value: "draft" as const,
    label: "Draft",
    description: "Prepare le test sans l'activer.",
    icon: ShieldAlert,
    activeClass: "border-[#d9ccb8] bg-[#fff7ec] text-[#7d5a30]"
  },
  {
    value: "paused" as const,
    label: "Paused",
    description: "Stoppe le test sans le supprimer.",
    icon: PauseCircle,
    activeClass: "border-[#f2c66d] bg-[#fff8df] text-[#9a6b16]"
  },
  {
    value: "running" as const,
    label: "Active",
    description: "Diffuse le test sur le trafic eligibile.",
    icon: PlayCircle,
    activeClass: "border-[#ff8a7a] bg-[#fff0eb] text-[#d95e4e]"
  }
];

export function ExperimentRolloutControls({
  projectId,
  experimentId,
  initialTrafficSplit,
  initialStatus
}: {
  projectId: string;
  experimentId: string;
  initialTrafficSplit: number;
  initialStatus: "draft" | "running" | "paused";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [trafficSplit, setTrafficSplit] = useState(initialTrafficSplit);
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");

  function save() {
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/projects/${projectId}/experiments/${experimentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trafficSplit,
          status,
          workflowState: status === "running" ? "running" : status === "paused" ? "paused" : "draft"
        })
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.error ?? "Impossible d'enregistrer l'etat de l'experience.");
        return;
      }
      setMessage("Experience mise a jour.");
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm("Supprimer cette experience ?")) return;
    setMessage("");
    startTransition(async () => {
      const response = await fetch(`/api/projects/${projectId}/experiments/${experimentId}`, {
        method: "DELETE"
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.error ?? "Impossible de supprimer l'experience.");
        return;
      }
      window.location.assign(`/dashboard/sites/${projectId}/experiments`);
    });
  }

  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Pilotage live</p>
          <h2 className="mt-2 text-2xl font-semibold">Gerer cette experience</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Change le statut, ajuste le trafic, ou supprime le test si tu n'en as plus besoin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={remove} disabled={isPending} className="border-[#f1c5bd] text-[#b4483b] hover:bg-[#fff2ef]">
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
          <Button type="button" onClick={save} disabled={isPending}>
            <Save className="h-4 w-4" />
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <p className="text-sm font-medium text-foreground">Statut</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isActive = status === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`rounded-3xl border px-4 py-4 text-left transition ${
                    isActive ? option.activeClass : "border-border bg-white text-foreground hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span className="font-semibold">{option.label}</span>
                  </div>
                  <p className="mt-2 text-sm opacity-80">{option.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-secondary/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-foreground">Trafic expose</p>
              <p className="mt-1 text-sm text-muted-foreground">Choisis le pourcentage de trafic eligibile qui doit entrer dans le test.</p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={100}
                step={1}
                value={trafficSplit}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setTrafficSplit(Number.isFinite(next) ? Math.min(100, Math.max(1, next)) : 1);
                }}
                className="h-11 w-24 rounded-2xl border border-[#d9ccb8] bg-white px-4 text-sm font-semibold text-[#241b13] outline-none"
              />
              <span className="text-sm font-medium text-[#6f6458]">%</span>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[5, 10, 25, 50, 75, 100].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTrafficSplit(value)}
                className={`rounded-full px-3 py-2 text-sm ${
                  trafficSplit === value ? "bg-primary text-white" : "border border-border bg-white text-foreground"
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </Card>
  );
}

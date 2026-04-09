"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
        setMessage(payload?.error ?? "Impossible d'enregistrer la repartition.");
        return;
      }
      setMessage("Repartition enregistree.");
      router.refresh();
    });
  }

  return (
    <Card className="bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Rollout live</p>
          <h2 className="mt-2 text-2xl font-semibold">Modifier la repartition du trafic</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Passe de 100% a 50/50, mets en pause ou relance l'experience sans la recreer.
          </p>
        </div>
        <Button type="button" onClick={save} disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-border bg-secondary/40 p-5">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-foreground">Trafic expose a l'experience</p>
            <p className="text-sm font-semibold text-foreground">{trafficSplit}%</p>
          </div>
          <input
            className="mt-4 block w-full"
            type="range"
            min={10}
            max={100}
            step={10}
            value={trafficSplit}
            onChange={(event) => setTrafficSplit(Number(event.target.value))}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {[10, 25, 50, 75, 100].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTrafficSplit(value)}
                className={`rounded-full px-3 py-2 text-sm ${trafficSplit === value ? "bg-primary text-white" : "border border-border bg-white text-foreground"}`}
              >
                {value}%
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-secondary/40 p-5">
          <p className="text-sm font-medium text-foreground">Statut live</p>
          <div className="mt-4 grid gap-2">
            {(["running", "paused", "draft"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatus(value)}
                className={`rounded-2xl px-4 py-3 text-left text-sm ${status === value ? "bg-primary text-white" : "border border-border bg-white text-foreground"}`}
              >
                {value === "running" ? "Running" : value === "paused" ? "Paused" : "Draft"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </Card>
  );
}

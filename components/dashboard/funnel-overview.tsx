"use client";

import { Card } from "@/components/ui/card";
import type { FunnelOverview } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

export function FunnelOverviewCard({ funnel }: { funnel: FunnelOverview }) {
  const maxUsers = Math.max(...funnel.steps.map((step) => step.users), 1);

  return (
    <Card className="bg-white">
      <div className="mb-5">
        <p className="text-lg font-semibold">Global funnel</p>
        <p className="text-sm text-muted-foreground">Track where users drop from first visit through purchase across the current analytics window.</p>
      </div>

      <div className="space-y-4">
        {funnel.steps.map((step) => (
          <div key={step.key} className="rounded-3xl border border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.users.toLocaleString("en-US")} users</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-secondary px-3 py-1">Step CVR {formatPercent(step.rateFromPrevious)}</span>
                <span className="rounded-full bg-secondary px-3 py-1">Drop {step.dropoff.toLocaleString("en-US")}</span>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(step.users / maxUsers) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

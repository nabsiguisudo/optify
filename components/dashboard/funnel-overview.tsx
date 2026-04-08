"use client";

import { Card } from "@/components/ui/card";
import type { FunnelOverview } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

export function FunnelOverviewCard({ funnel }: { funnel: FunnelOverview }) {
  const maxUsers = Math.max(...funnel.steps.map((step) => step.users), 1);

  return (
    <Card className="bg-white">
      <div>
        <p className="text-lg font-semibold">Entonnoir de conversion</p>
        <p className="mt-1 text-sm text-muted-foreground">Un resume net du passage visite vers panier, checkout puis achat.</p>
      </div>

      <div className="mt-5 space-y-3">
        {funnel.steps.map((step, index) => (
          <div key={step.key} className="rounded-[1.5rem] border border-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">{index + 1}</div>
                <div>
                  <p className="font-semibold">{step.label}</p>
                  <p className="text-sm text-muted-foreground">{step.users.toLocaleString("fr-FR")} utilisateurs</p>
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{formatPercent(step.rateFromPrevious)}</p>
                <p className="text-muted-foreground">taux de passage</p>
              </div>
            </div>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#ff5864_0%,#ff9c59_100%)]"
                style={{ width: `${(step.users / maxUsers) * 100}%` }}
              />
            </div>
            {step.dropoff > 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">{step.dropoff.toLocaleString("fr-FR")} pertes avant l'etape suivante</p>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}

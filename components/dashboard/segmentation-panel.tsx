"use client";

import { Card } from "@/components/ui/card";
import type { SegmentSnapshot } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

export function SegmentationPanel({ segments }: { segments: SegmentSnapshot[] }) {
  return (
    <Card className="bg-white">
      <div>
        <p className="text-lg font-semibold">Segments utiles</p>
        <p className="mt-1 text-sm text-muted-foreground">Un recap tres simple des segments qui pesent le plus aujourd'hui.</p>
      </div>

      <div className="mt-5 space-y-3">
        {segments.map((segment) => (
          <div key={segment.key} className="rounded-[1.5rem] border border-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{segment.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{segment.note}</p>
              </div>
              <div className="rounded-full bg-secondary px-3 py-1 text-sm">{segment.trend}</div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[1rem] bg-secondary/45 px-3 py-2 text-sm">Part: <span className="font-semibold">{formatPercent(segment.share)}</span></div>
              <div className="rounded-[1rem] bg-secondary/45 px-3 py-2 text-sm">Conversion: <span className="font-semibold">{formatPercent(segment.conversionRate)}</span></div>
              <div className="rounded-[1rem] bg-secondary/45 px-3 py-2 text-sm">Revenu / visiteur: <span className="font-semibold">${segment.revenuePerVisitor.toFixed(2)}</span></div>
              <div className="rounded-[1rem] bg-secondary/45 px-3 py-2 text-sm">Score: <span className="font-semibold">{segment.engagementScore}</span></div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

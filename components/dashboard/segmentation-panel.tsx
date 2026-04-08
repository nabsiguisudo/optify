"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { SegmentSnapshot } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

export function SegmentationPanel({ segments }: { segments: SegmentSnapshot[] }) {
  return (
    <Card className="bg-white">
      <div className="mb-5">
        <p className="text-lg font-semibold">Top audiences</p>
        <p className="text-sm text-muted-foreground">The audience groups currently driving the most value, conversion efficiency, or engagement.</p>
      </div>

      <div className="space-y-4">
        {segments.map((segment) => (
          <div key={segment.key} className="rounded-3xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{segment.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{segment.note}</p>
              </div>
              <Badge className={segment.trend === "up" ? "bg-primary text-white" : ""}>{segment.trend}</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                Share <span className="font-semibold">{formatPercent(segment.share)}</span>
              </div>
              <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                CR <span className="font-semibold">{formatPercent(segment.conversionRate)}</span>
              </div>
              <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                RPV <span className="font-semibold">${segment.revenuePerVisitor.toFixed(2)}</span>
              </div>
              <div className="rounded-2xl bg-secondary/50 p-3 text-sm">
                Score <span className="font-semibold">{segment.engagementScore}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

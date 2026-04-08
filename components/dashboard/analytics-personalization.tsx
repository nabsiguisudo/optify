"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createSegmentStorageKey, type SegmentDefinition } from "@/lib/segments";

export function AnalyticsPersonalization({
  projectId,
  segmentsHref
}: {
  projectId: string;
  segmentsHref: string;
}) {
  const [segments, setSegments] = useState<SegmentDefinition[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(createSegmentStorageKey(projectId));
      setSegments(raw ? JSON.parse(raw) as SegmentDefinition[] : []);
    } catch {
      setSegments([]);
    }
  }, [projectId]);

  const pinned = useMemo(() => segments.filter((segment) => segment.pinned), [segments]);

  return (
    <Card className="border border-[#ebe3d5] bg-white shadow-[0_14px_34px_rgba(73,56,26,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-[#221b10]">Personnalisation Analytics</h2>
          <p className="mt-2 text-sm text-[#6b6255]">
            Cette zone est alimentée par les segments que tu crées et épingles. Elle sert de première brique vers un dashboard Analytics personnalisé par profil, page ou comportement.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={segmentsHref}>Configurer les segments</Link>
        </Button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.2rem] border border-[#ece4d8] bg-white p-4">
          <p className="text-sm text-[#7a705f]">Segments disponibles</p>
          <p className="mt-2 text-3xl font-semibold text-[#221b10]">{segments.length}</p>
        </div>
        <div className="rounded-[1.2rem] border border-[#ece7de] bg-[#faf8f3] p-4">
          <p className="text-sm text-[#7a705f]">Segments épinglés</p>
          <p className="mt-2 text-3xl font-semibold text-[#221b10]">{pinned.length}</p>
        </div>
        <div className="rounded-[1.2rem] border border-[#ead9bc] bg-[#fff7eb] p-4">
          <p className="text-sm text-[#7a705f]">Lecture personnalisée</p>
          <p className="mt-2 text-sm leading-6 text-[#6b6255]">{pinned.length > 0 ? "Segments prêts à être utilisés comme vues prioritaires dans Analytics." : "Épingle des segments pour faire remonter les bonnes vues ici."}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {pinned.length > 0 ? pinned.map((segment) => (
          <div key={segment.id} className="rounded-[1rem] border border-[#efe7db] bg-[#fcfaf6] px-4 py-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#3f3528]">{segment.name}</p>
                {segment.description ? <p className="mt-1 text-sm text-[#7a705f]">{segment.description}</p> : null}
              </div>
              <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.14em] text-[#8b6d3f]">Pinned</p>
            </div>
          </div>
        )) : (
          <div className="rounded-[1rem] border border-dashed border-[#dfd5c4] bg-[#fbf8f2] px-4 py-5 text-sm text-[#746956]">
            Aucun segment épinglé pour l'instant.
          </div>
        )}
      </div>
    </Card>
  );
}

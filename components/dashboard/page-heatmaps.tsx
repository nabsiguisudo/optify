"use client";

import { Card } from "@/components/ui/card";
import type { PageHeatmap, SessionReplayNode } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

function PreviewNode({ node, depth = 0 }: { node: SessionReplayNode; depth?: number }) {
  return (
    <div
      className={`rounded-xl border px-2 py-1.5 ${node.target ? "border-primary/40 bg-primary/10" : node.muted ? "border-border/60 bg-secondary/40 text-muted-foreground" : "border-border bg-white/80"}`}
      style={{ marginLeft: depth * 10 }}
    >
      <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{node.tag}{node.role ? ` ${node.role}` : ""}</div>
      {node.text ? <div className="mt-1 text-[11px] font-medium leading-tight">{node.text}</div> : null}
      {node.children?.length ? (
        <div className="mt-2 space-y-1.5">
          {node.children.slice(0, depth === 0 ? 5 : 3).map((child) => (
            <PreviewNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PageHeatmaps({ pages }: { pages: PageHeatmap[] }) {
  return (
    <Card className="bg-white">
      <div className="mb-5">
        <p className="text-lg font-semibold">Click and scroll heatmaps</p>
        <p className="text-sm text-muted-foreground">Per-page hotspots built from recorded clicks, scroll depth milestones, and captured Shopify page previews.</p>
      </div>

      <div className="space-y-5">
        {pages.map((page) => (
          <div key={page.pathname} className="rounded-3xl border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{page.pathname}</p>
                <p className="mt-1 text-sm text-muted-foreground">{page.totalClicks} clicks across {page.uniqueSessions} sessions</p>
              </div>
              <div className="rounded-full bg-secondary px-3 py-1 text-sm">
                Avg scroll {Math.round(page.averageScrollDepth)}%
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div>
                <p className="mb-2 text-sm font-medium">Click hotspots on store preview</p>
                <div className="relative h-72 overflow-hidden rounded-[1.5rem] border border-border bg-[linear-gradient(180deg,#faf7ef_0%,#f3efe4_100%)]">
                  {page.previewHtml ? (
                    <iframe
                      title={`Preview ${page.pathname}`}
                      srcDoc={page.previewHtml}
                      sandbox="allow-same-origin"
                      className="pointer-events-none absolute inset-0 h-full w-full origin-top-left scale-[0.6] border-0"
                      style={{ width: "166.6667%", height: "166.6667%" }}
                    />
                  ) : page.previewNodes?.length ? (
                    <div className="absolute inset-0 overflow-hidden p-3">
                      <div className="scale-[0.92] origin-top-left space-y-2">
                        {page.previewNodes.slice(0, 1).map((node) => (
                          <PreviewNode key={node.id} node={node} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No page preview recorded yet.</div>
                  )}

                  {page.points.length > 0 ? page.points.map((point) => (
                    <div
                      key={point.id}
                      className="absolute -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
                    >
                      <div
                        className="rounded-full bg-primary/20 ring-1 ring-primary/20 backdrop-blur-[1px]"
                        style={{
                          width: `${22 + Math.min(point.clicks, 10) * 8}px`,
                          height: `${22 + Math.min(point.clicks, 10) * 8}px`
                        }}
                      />
                      <div className="absolute inset-0 m-auto h-3 w-3 rounded-full bg-primary" />
                    </div>
                  )) : null}
                </div>
                <div className="mt-3 space-y-2">
                  {page.points.slice(0, 4).map((point) => (
                    <div key={`${page.pathname}-${point.id}`} className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">
                      <span className="font-medium">{point.label}</span> - {point.clicks} clicks
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Scroll heatmap</p>
                <div className="space-y-3">
                  {page.scrollBands.map((band) => (
                    <div key={`${page.pathname}-${band.depth}`} className="rounded-2xl border border-border p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span>{band.depth}% depth</span>
                        <span className="font-medium">{band.sessions} sessions</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-secondary">
                        <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.max(band.share * 100, 0)}%` }} />
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">{formatPercent(band.share)} of recorded sessions reached this depth.</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

"use client";

import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Gauge, MousePointerClick, Pause, Play, TimerReset } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { SessionDiagnostic, SessionReplayNode } from "@/lib/types";

function renderNode(node: SessionReplayNode, depth = 0): ReactElement {
  return (
    <div
      key={node.id}
      className={`rounded-2xl border px-3 py-2 ${node.target ? "border-primary bg-primary/10" : node.muted ? "border-border/60 bg-secondary/30 text-muted-foreground" : "border-border bg-white"}`}
      style={{ marginLeft: depth * 16 }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span>{node.tag}</span>
        {node.role ? <span>{node.role}</span> : null}
      </div>
      {node.text ? <p className="mt-2 text-sm font-medium text-foreground">{node.text}</p> : null}
      {node.children?.length ? <div className="mt-3 space-y-2">{node.children.map((child) => renderNode(child, depth + 1))}</div> : null}
    </div>
  );
}

function formatClock(valueMs: number) {
  const totalSeconds = Math.max(0, Math.round(valueMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SessionDiagnostics({
  sessions,
  showSessionList = true,
  backHref
}: {
  sessions: SessionDiagnostic[];
  showSessionList?: boolean;
  backHref?: string;
}) {
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.sessionId ?? "");
  const [frameIndexBySession, setFrameIndexBySession] = useState<Record<string, number>>({});
  const [isPlayingBySession, setIsPlayingBySession] = useState<Record<string, boolean>>({});
  const [speedBySession, setSpeedBySession] = useState<Record<string, number>>({});
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const selectedSession = sessions.find((session) => session.sessionId === selectedSessionId) ?? sessions[0];
  const activeFrameIndex = frameIndexBySession[selectedSession?.sessionId ?? ""] ?? 0;
  const activeFrame = selectedSession?.replay[activeFrameIndex];
  const playbackSpeed = speedBySession[selectedSession?.sessionId ?? ""] ?? 1;
  const isPlaying = !!isPlayingBySession[selectedSession?.sessionId ?? ""];
  const playerShellClassName = selectedSession?.deviceType === "mobile"
    ? "mx-auto w-full max-w-[390px]"
    : selectedSession?.deviceType === "tablet"
      ? "mx-auto w-full max-w-[820px]"
      : "w-full";

  const timeline = useMemo(() => {
    if (!selectedSession) return [];
    const sessionStart = new Date(selectedSession.replay[0]?.timestamp ?? selectedSession.startedAt).getTime();
    return selectedSession.replay.map((frame, index) => ({
      frame,
      index,
      offsetMs: Math.max(0, new Date(frame.timestamp).getTime() - sessionStart)
    }));
  }, [selectedSession]);

  useEffect(() => {
    if (!selectedSession || !isPlaying || selectedSession.replay.length <= 1) return;
    if (activeFrameIndex >= selectedSession.replay.length - 1) {
      setIsPlayingBySession((current) => ({ ...current, [selectedSession.sessionId]: false }));
      return;
    }

    const currentFrame = selectedSession.replay[activeFrameIndex];
    const nextFrame = selectedSession.replay[activeFrameIndex + 1];
    const currentMs = new Date(currentFrame.timestamp).getTime();
    const nextMs = new Date(nextFrame.timestamp).getTime();
    const rawDelay = Number.isFinite(nextMs - currentMs) ? nextMs - currentMs : 900;
    const delay = Math.min(2200, Math.max(250, rawDelay / Math.max(playbackSpeed, 0.5)));

    const timer = window.setTimeout(() => {
      setFrameIndexBySession((current) => ({
        ...current,
        [selectedSession.sessionId]: Math.min((current[selectedSession.sessionId] ?? 0) + 1, selectedSession.replay.length - 1)
      }));
    }, delay);

    return () => window.clearTimeout(timer);
  }, [activeFrameIndex, isPlaying, playbackSpeed, selectedSession]);

  useEffect(() => {
    if (!selectedSession) return;
    setFrameIndexBySession((current) => ({
      ...current,
      [selectedSession.sessionId]: Math.min(current[selectedSession.sessionId] ?? 0, Math.max(selectedSession.replay.length - 1, 0))
    }));
  }, [selectedSession]);

  function setFrame(nextIndex: number) {
    if (!selectedSession) return;
    setFrameIndexBySession((current) => ({
      ...current,
      [selectedSession.sessionId]: Math.min(Math.max(nextIndex, 0), selectedSession.replay.length - 1)
    }));
  }

  function handleFrameStep(direction: -1 | 1) {
    setFrame(activeFrameIndex + direction);
  }

  function togglePlay() {
    if (!selectedSession) return;
    setIsPlayingBySession((current) => ({
      ...current,
      [selectedSession.sessionId]: !(current[selectedSession.sessionId] ?? false)
    }));
  }

  function setPlaybackSpeed(nextSpeed: number) {
    if (!selectedSession) return;
    setSpeedBySession((current) => ({ ...current, [selectedSession.sessionId]: nextSpeed }));
  }

  function resetSession() {
    if (!selectedSession) return;
    setFrame(0);
    setIsPlayingBySession((current) => ({ ...current, [selectedSession.sessionId]: false }));
  }

  function handleReplayLoad() {
    if (!iframeRef.current || !activeFrame) return;
    try {
      iframeRef.current.contentWindow?.scrollTo({
        top: activeFrame.scrollOffsetY ?? 0,
        behavior: "instant" as ScrollBehavior
      });
    } catch {
      try {
        iframeRef.current.contentWindow?.scrollTo(0, activeFrame.scrollOffsetY ?? 0);
      } catch {}
    }
  }

  return (
    <Card className="bg-white">
      <div className="mb-5">
        <p className="text-lg font-semibold">Session replay player</p>
        <p className="text-sm text-muted-foreground">Play recorded storefront frames, scrub the journey, and inspect click, scroll, and friction signals on the captured Shopify page.</p>
      </div>

      <div className={`grid gap-4 ${showSessionList ? "xl:grid-cols-[0.78fr_1.22fr]" : ""}`}>
        {showSessionList ? (
          <div className="space-y-4">
            {sessions.map((session) => {
              const isActive = selectedSession?.sessionId === session.sessionId;
              const currentFrame = frameIndexBySession[session.sessionId] ?? 0;
              const currentSpeed = speedBySession[session.sessionId] ?? 1;
              return (
                <button
                  key={session.sessionId}
                  type="button"
                  onClick={() => setSelectedSessionId(session.sessionId)}
                  className={`w-full rounded-3xl border p-4 text-left transition ${isActive ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{session.sessionId}</p>
                      <p className="truncate text-sm text-muted-foreground">{session.anonymousId || "Dedicated recording session"}</p>
                    </div>
                    <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                      {Math.min(currentFrame + 1, Math.max(session.replay.length, 1))}/{Math.max(session.replay.length, 1)}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <span className="rounded-full bg-secondary px-3 py-1">{session.pages} pages</span>
                    <span className="rounded-full bg-secondary px-3 py-1">{Math.round(session.durationMs / 1000)}s total</span>
                    <span className="rounded-full bg-secondary px-3 py-1">{session.rageClicks} rage clicks</span>
                    <span className="rounded-full bg-secondary px-3 py-1">{session.deadClicks} dead clicks</span>
                    <span className="rounded-full bg-secondary px-3 py-1">{session.jsErrors} JS errors</span>
                    <span className="rounded-full bg-secondary px-3 py-1">{currentSpeed}x playback</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}

        {selectedSession && activeFrame ? (
          <div className="rounded-[2rem] border border-border bg-[#f8f3e7] p-4">
            <div className="rounded-[1.6rem] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  {backHref ? (
                    <Link href={backHref} className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                      Back to sessions
                    </Link>
                  ) : null}
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Recorded storefront replay</p>
                  <p className="mt-2 text-xl font-semibold">{activeFrame.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{activeFrame.pathname} {"·"} {selectedSession.deviceType}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFrameStep(-1)}
                    className="rounded-full bg-secondary p-2 text-secondary-foreground"
                    disabled={activeFrameIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={togglePlay} className="rounded-full bg-[#11291f] px-4 py-2 text-sm text-white">
                    <span className="flex items-center gap-2">
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {isPlaying ? "Pause" : "Play"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFrameStep(1)}
                    className="rounded-full bg-secondary p-2 text-secondary-foreground"
                    disabled={activeFrameIndex >= selectedSession.replay.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={resetSession} className="rounded-full bg-secondary p-2 text-secondary-foreground">
                    <TimerReset className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-[1.2rem] border border-border bg-secondary/20 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Gauge className="h-4 w-4" />
                    <span>{formatClock(timeline[activeFrameIndex]?.offsetMs ?? 0)}</span>
                    <span>/</span>
                    <span>{formatClock(timeline.at(-1)?.offsetMs ?? selectedSession.durationMs)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[0.75, 1, 1.5, 2].map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        onClick={() => setPlaybackSpeed(speed)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition ${playbackSpeed === speed ? "bg-primary text-primary-foreground" : "bg-white text-foreground"}`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(selectedSession.replay.length - 1, 0)}
                    step={1}
                    value={activeFrameIndex}
                    onChange={(event) => setFrame(Number(event.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {timeline.map((item, index) => (
                      <button
                        key={item.frame.id}
                        type="button"
                        onClick={() => setFrame(index)}
                        className={`rounded-full px-3 py-1 text-xs transition ${index === activeFrameIndex ? "bg-primary text-primary-foreground" : "bg-white text-muted-foreground"}`}
                      >
                        {item.frame.activeEventType.replaceAll("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[1.6rem] border border-border bg-white p-4">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  <span>{activeFrame.activeEventType.replaceAll("_", " ")}</span>
                  {activeFrame.selector ? <span className="rounded-full bg-secondary px-3 py-1 normal-case tracking-normal">{activeFrame.selector}</span> : null}
                </div>

                {activeFrame.htmlSnapshot ? (
                  <div className={playerShellClassName}>
                    <div className="relative overflow-hidden rounded-[1.2rem] border border-border bg-[#fbf8f1]">
                      <iframe
                        key={activeFrame.id}
                        ref={iframeRef}
                        title={`Replay ${activeFrame.pathname}`}
                        srcDoc={activeFrame.htmlSnapshot}
                        sandbox="allow-same-origin"
                        className="h-[560px] w-full border-0"
                        onLoad={handleReplayLoad}
                      />

                      {activeFrame.clickX !== undefined && activeFrame.clickY !== undefined && activeFrame.viewportWidth && activeFrame.viewportHeight ? (
                        <div
                          className="pointer-events-none absolute z-10"
                          style={{
                            left: `${Math.min(100, Math.max(0, (activeFrame.clickX / Math.max(activeFrame.viewportWidth, 1)) * 100))}%`,
                            top: `${Math.min(100, Math.max(0, (activeFrame.clickY / Math.max(activeFrame.viewportHeight, 1)) * 100))}%`,
                            transform: "translate(-50%, -50%)"
                          }}
                        >
                          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600/20">
                            <div className="absolute inset-0 rounded-full border border-emerald-600/40" />
                            <div className="absolute inset-1 rounded-full border border-emerald-600/30" />
                            <MousePointerClick className="relative z-10 h-4 w-4 text-emerald-800" />
                          </div>
                        </div>
                      ) : null}

                      {activeFrame.documentHeight && activeFrame.viewportHeight ? (
                        <div className="pointer-events-none absolute right-3 top-3 bottom-3 z-10 flex w-2 justify-center rounded-full bg-black/5">
                          <div
                            className="w-full rounded-full bg-emerald-700/30"
                            style={{
                              marginTop: `${Math.min(
                                92,
                                Math.max(
                                  0,
                                  ((activeFrame.scrollOffsetY ?? 0) / Math.max(activeFrame.documentHeight - activeFrame.viewportHeight, 1)) * 100
                                )
                              )}%`,
                              height: `${Math.min(100, Math.max(8, (activeFrame.viewportHeight / Math.max(activeFrame.documentHeight, 1)) * 100))}%`
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-3 rounded-full bg-secondary px-3 py-2 text-center text-xs text-muted-foreground">
                      {selectedSession.deviceType === "mobile" ? "Mobile replay canvas" : selectedSession.deviceType === "tablet" ? "Tablet replay canvas" : "Desktop replay canvas"}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">{activeFrame.nodes.map((node) => renderNode(node))}</div>
                )}
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.6rem] border border-border bg-white p-4">
                  <p className="text-sm font-semibold">Frame details</p>
                  <div className="mt-3 grid gap-2 text-sm">
                    <div className="rounded-2xl bg-secondary/50 px-3 py-2">{activeFrame.subtitle}</div>
                    <div className="rounded-2xl bg-secondary/50 px-3 py-2">{activeFrame.timestamp.replace("T", " ").slice(0, 19)}</div>
                    <div className="rounded-2xl bg-secondary/50 px-3 py-2">Scroll Y: {Math.round(activeFrame.scrollOffsetY ?? 0)}px</div>
                    <div className="rounded-2xl bg-secondary/50 px-3 py-2">
                      Viewport: {Math.round(activeFrame.viewportWidth ?? 0)} x {Math.round(activeFrame.viewportHeight ?? 0)}
                    </div>
                    {activeFrame.clickX !== undefined && activeFrame.clickY !== undefined ? (
                      <div className="rounded-2xl bg-secondary/50 px-3 py-2">Click: {Math.round(activeFrame.clickX)} x {Math.round(activeFrame.clickY)}</div>
                    ) : null}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-border bg-white p-4">
                  <p className="text-sm font-semibold">Session diagnostics</p>
                  <div className="mt-3 space-y-2">
                    <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">Rage clicks: {selectedSession.rageClicks}</div>
                    <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">Dead clicks: {selectedSession.deadClicks}</div>
                    <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">JS errors: {selectedSession.jsErrors}</div>
                    <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">Conversions: {selectedSession.conversions}</div>
                    <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">Revenue: ${Math.round(selectedSession.revenue)}</div>
                  </div>
                </div>

                {selectedSession.diagnostics ? (
                  <div className="rounded-[1.6rem] border border-border bg-white p-4">
                    <p className="text-sm font-semibold">Diagnostic summary</p>
                    <div className="mt-3 rounded-2xl bg-secondary/50 px-3 py-3 text-sm text-muted-foreground">
                      {selectedSession.diagnostics.summary}
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">Friction score: {selectedSession.diagnostics.frictionScore}</div>
                      <div className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">Intent score: {selectedSession.diagnostics.intentScore}</div>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[1.6rem] border border-border bg-white p-4">
                  <p className="text-sm font-semibold">Frame timeline</p>
                  <div className="mt-3 space-y-2">
                    {timeline.map((item, index) => (
                      <button
                        key={item.frame.id}
                        type="button"
                        onClick={() => setFrame(index)}
                        className={`w-full rounded-2xl px-3 py-3 text-left text-sm transition ${index === activeFrameIndex ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span>{item.frame.activeEventType.replaceAll("_", " ")}</span>
                          <span>{formatClock(item.offsetMs)}</span>
                        </div>
                        <div className={`mt-1 text-xs ${index === activeFrameIndex ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {item.frame.pathname}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.6rem] border border-border bg-white p-4">
                  <p className="text-sm font-semibold">Event trail</p>
                  <div className="mt-3 space-y-2">
                    {selectedSession.events.map((event) => (
                      <div key={`${event.timestamp}-${event.eventType}`} className="rounded-2xl bg-secondary/50 px-3 py-2 text-sm">
                        <div className="font-medium">{event.timestamp.slice(11, 16)} {event.eventType.replaceAll("_", " ")}</div>
                        <div className="text-muted-foreground">{event.pathname}{event.selector ? ` - ${event.selector}` : ""}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

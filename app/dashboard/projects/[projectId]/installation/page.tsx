import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/ui/copy-button";
import { ShopifyConnectForm } from "@/components/forms/shopify-connect-form";
import { getInstallationDiagnostic, getLaunchAuditTrail, getOnboardingProgress, getProjectById, getSdkDiagnostics, getShopifyConnection, getShopifyInstallAssets } from "@/lib/data";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import type { Platform } from "@/lib/types";

export default async function InstallationPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  const project = await getProjectById(projectId);
  const [diagnostic, onboarding, sdkDiagnostics, auditTrail] = await Promise.all([
    getInstallationDiagnostic(projectId),
    getOnboardingProgress(projectId, locale),
    getSdkDiagnostics(projectId),
    getLaunchAuditTrail(6)
  ]);
  const [shopifyConnection, shopifyAssets] = project?.platform === "shopify"
    ? await Promise.all([getShopifyConnection(projectId), getShopifyInstallAssets(projectId)])
    : [undefined, undefined];

  if (!project || !diagnostic || !onboarding || !sdkDiagnostics) {
    redirect(`/dashboard/projects/new?lang=${locale}`);
  }

  const scriptTag = `<script src="${project.scriptUrl.replace("https://cdn.optify.ai/sdk.js", "/optify-sdk.js")}" data-project="${project.id}"></script>`;
  const statusTone =
    diagnostic.status === "healthy"
      ? "bg-primary text-white"
        : diagnostic.status === "warning"
          ? "bg-[#f4d07a] text-[#11291f]"
          : "";
  const progressPercent = Math.round(onboarding.completionRatio * 100);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#135c43_0%,#1b7a58_55%,#f4d07a_160%)] text-white shadow-[0_24px_70px_rgba(17,41,31,0.16)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Badge>{project.platform}</Badge>
            <h1 className="mt-4 text-3xl font-semibold">{t.common.installOnProject} {project.name}</h1>
            <p className="mt-2 max-w-2xl text-white/80">{t.common.useProjectLevelSdk} {project.platform}. This page is now your onboarding cockpit: install, verify live events, review AI tests, then launch the first experiment.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href={`/dashboard/projects/${projectId}/suggestions?lang=${locale}`}>Open AI inbox</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
                <Link href={`/dashboard/sites/${projectId}/experiments?lang=${locale}`}>Open launch center</Link>
              </Button>
            </div>
          </div>
          <Badge className={statusTone}>SDK {diagnostic.status}</Badge>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[2rem] bg-white/10 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Onboarding progress</p>
                <p className="mt-2 text-2xl font-semibold">{progressPercent}% complete</p>
              </div>
              <p className="text-sm text-white/75">{onboarding.completedSteps}/{onboarding.totalSteps} steps</p>
            </div>
            <div className="mt-4 h-3 rounded-full bg-white/15">
              <div className="h-3 rounded-full bg-[#f4d07a]" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-3 text-sm text-white/80">Current focus: {onboarding.currentStepLabel}</p>
          </div>
          <div className="rounded-[2rem] bg-white/10 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">SDK transport health</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-sm text-white/70">Recent events</p>
                <p className="mt-1 text-2xl font-semibold">{sdkDiagnostics.transport.recentEventCount}</p>
              </div>
              <div>
                <p className="text-sm text-white/70">Error rate</p>
                <p className="mt-1 text-2xl font-semibold">{Math.round(sdkDiagnostics.transport.errorRate * 100)}%</p>
              </div>
              <div>
                <p className="text-sm text-white/70">Last event</p>
                <p className="mt-1 text-sm font-medium">{sdkDiagnostics.transport.lastEventAt ? new Date(sdkDiagnostics.transport.lastEventAt).toLocaleString("fr-FR") : "No event yet"}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
        <Card className="overflow-hidden border-0 bg-[linear-gradient(180deg,#fffef9_0%,#ffffff_100%)] shadow-[0_20px_60px_rgba(17,41,31,0.06)]">
          <p className="text-lg font-semibold">Step-by-step onboarding</p>
          <div className="mt-5 space-y-3">
            {onboarding.checklist.map((item, index) => (
              <Link key={item.key} href={`${item.href ?? `/dashboard/projects/${projectId}/installation`}${item.href?.includes("?") ? "" : `?lang=${locale}`}`} className="block rounded-[1.8rem] border border-border bg-white p-4 transition hover:border-primary/30 hover:shadow-[0_12px_30px_rgba(17,41,31,0.06)]">
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${item.status === "complete" ? "bg-primary text-white" : item.status === "current" ? "bg-[#f4d07a] text-[#11291f]" : "bg-secondary text-secondary-foreground"}`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-medium">{item.title}</p>
                      <Badge className={item.status === "complete" ? "bg-primary text-white" : item.status === "current" ? "bg-[#f4d07a] text-[#11291f]" : ""}>{item.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold">{t.common.scriptSnippet}</p>
              <p className="mt-2 text-sm text-muted-foreground">Fastest path for non-Shopify installs: paste the snippet once, reload the site, then confirm live events below.</p>
            </div>
            <CopyButton value={scriptTag} label="Copy snippet" />
          </div>
          <pre className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-3xl bg-[#11291f] p-5 text-sm text-[#f8f3e6]">{scriptTag}</pre>
          <div className="mt-5 rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">
            The SDK now batches events, retries failed sends, and reports transport health automatically as soon as the snippet is live.
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-white">
          <p className="text-lg font-semibold">Installation diagnostics</p>
          <div className="mt-5 space-y-3">
            {diagnostic.checks.map((check) => (
              <div key={check.key} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{check.label}</p>
                  <Badge className={check.status === "pass" ? "bg-primary text-white" : check.status === "warn" ? "bg-[#f4d07a] text-[#11291f]" : ""}>
                    {check.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{check.detail}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-white">
          <p className="text-lg font-semibold">Live SDK debug panel</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Latest page</p>
              <p className="mt-2 text-lg font-semibold">{diagnostic.latestHealth?.pathname ?? "No page seen yet"}</p>
            </div>
            <div className="rounded-3xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">SDK version</p>
              <p className="mt-2 text-lg font-semibold">{diagnostic.latestHealth?.sdkVersion ?? "Unknown"}</p>
            </div>
            <div className="rounded-3xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">Duplicate rate</p>
              <p className="mt-2 text-lg font-semibold">{Math.round(sdkDiagnostics.transport.duplicateRate * 100)}%</p>
            </div>
          </div>
          <div className="mt-5 rounded-3xl bg-[#11291f] p-5 text-[#f8f3e6]">
            <p className="text-sm font-medium">Top live event types</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(diagnostic.liveEventTypes ?? []).length > 0 ? (diagnostic.liveEventTypes ?? []).map((eventType) => (
                <span key={eventType.type} className="rounded-full bg-white/10 px-3 py-1 text-sm">{eventType.type} - {eventType.count}</span>
              )) : <span className="text-sm text-[#f8f3e6]/70">No events yet.</span>}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="bg-white">
          <p className="text-lg font-semibold">{t.common.platformGuide}</p>
          <div className="mt-5 space-y-4">
            {t.installationPage.installGuides[project.platform as Platform].map((step: string, index: number) => (
              <div key={step} className="flex gap-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary font-medium">{index + 1}</div>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-lg font-semibold">Observed pages and capabilities</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-3xl bg-secondary/50 p-4">
              <p className="text-sm font-medium">Recent pages</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {diagnostic.recentPages.length > 0 ? diagnostic.recentPages.map((page) => (
                  <span key={page} className="rounded-full bg-white px-3 py-1 text-sm">{page}</span>
                )) : <span className="text-sm text-muted-foreground">No recent pages detected.</span>}
              </div>
            </div>
            <div className="rounded-3xl bg-secondary/50 p-4">
              <p className="text-sm font-medium">Latest capability snapshot</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white px-3 py-2 text-sm">Beacon: {diagnostic.latestHealth?.capabilities.beacon ? "yes" : "unknown"}</div>
                <div className="rounded-2xl bg-white px-3 py-2 text-sm">IntersectionObserver: {diagnostic.latestHealth?.capabilities.intersectionObserver ? "yes" : "unknown"}</div>
                <div className="rounded-2xl bg-white px-3 py-2 text-sm">Local storage: {diagnostic.latestHealth?.capabilities.localStorage ? "yes" : "unknown"}</div>
                <div className="rounded-2xl bg-white px-3 py-2 text-sm">Session storage: {diagnostic.latestHealth?.capabilities.sessionStorage ? "yes" : "unknown"}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {project.platform === "shopify" ? (
        <div className="space-y-4">
          <Card className="overflow-hidden border-0 bg-[linear-gradient(180deg,#fffef9_0%,#ffffff_100%)] shadow-[0_20px_60px_rgba(17,41,31,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">Shopify quick start</p>
                <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                  Ignore tokens for now. The fastest working path is: 1. paste the Liquid snippet in your theme, 2. paste the custom pixel in Shopify Customer Events, 3. reload your storefront and check live events below.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <CopyButton value={shopifyAssets?.liquidSnippet ?? scriptTag} label="Copy Liquid" copiedLabel="Liquid copied" />
                <CopyButton value={shopifyAssets?.customPixelCode ?? ""} label="Copy custom pixel" copiedLabel="Pixel copied" />
                <Badge className={shopifyConnection?.status === "connected" ? "bg-primary text-white" : ""}>{shopifyConnection?.status ?? "manual install"}</Badge>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.8rem] bg-[#eef4ef] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Step 1</p>
                <p className="mt-2 font-medium">Install snippet in theme</p>
                <p className="mt-2 text-sm text-muted-foreground">Put the Liquid snippet in <code>theme.liquid</code>.</p>
              </div>
              <div className="rounded-[1.8rem] bg-[#fff5dc] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Step 2</p>
                <p className="mt-2 font-medium">Add the Shopify custom pixel</p>
                <p className="mt-2 text-sm text-muted-foreground">This sends product, cart, checkout and search events into Optify.</p>
              </div>
              <div className="rounded-[1.8rem] bg-[#f4f1e8] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Step 3</p>
                <p className="mt-2 font-medium">Reload storefront and verify</p>
                <p className="mt-2 text-sm text-muted-foreground">Use the live debug panels lower on the page to confirm everything is arriving.</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="bg-white">
              <p className="text-lg font-semibold">Shopify install status</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Shop: <span className="font-semibold break-all">{shopifyConnection?.shopDomain ?? project.domain}</span></div>
                <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Connection mode: <span className="font-semibold">{shopifyConnection?.status === "connected" ? "metadata synced" : "manual install"}</span></div>
                <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Theme: <span className="font-semibold">{shopifyConnection?.activeTheme?.name ?? "manual / unknown"}</span></div>
                <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Currency: <span className="font-semibold">{shopifyConnection?.currencyCode ?? "detected from events"}</span></div>
                <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Plan: <span className="font-semibold">{shopifyConnection?.planName ?? "not synced"}</span></div>
                <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Tracked page types: <span className="font-semibold">{shopifyConnection?.pageTypesTracked.join(", ") || "none yet"}</span></div>
              </div>
            </Card>
            <ShopifyConnectForm projectId={projectId} initialShopDomain={shopifyConnection?.shopDomain ?? project.domain} status={shopifyConnection?.status} />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card className="bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Shopify Liquid install snippet</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Add this to <code>theme.liquid</code> before <code>{"</head>"}</code> so Optify can detect real Shopify page types and storefront context.
                  </p>
                </div>
                <CopyButton value={shopifyAssets?.liquidSnippet ?? scriptTag} label="Copy Liquid" copiedLabel="Liquid copied" />
              </div>
              <pre className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-3xl bg-[#11291f] p-5 text-sm text-[#f8f3e6]">{shopifyAssets?.liquidSnippet ?? scriptTag}</pre>
            </Card>
            <Card className="bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold">Shopify custom pixel</p>
                  <p className="mt-2 text-sm text-muted-foreground">Paste this into Shopify Customer Events as a custom pixel to ingest storefront commerce events into Optify immediately.</p>
                </div>
                <CopyButton value={shopifyAssets?.customPixelCode ?? ""} label="Copy custom pixel" copiedLabel="Pixel copied" />
              </div>
              <pre className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-3xl bg-[#11291f] p-5 text-sm text-[#f8f3e6]">{shopifyAssets?.customPixelCode ?? "Custom pixel unavailable."}</pre>
            </Card>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="bg-white">
          <p className="text-lg font-semibold">Recent SDK events</p>
          <div className="mt-4 space-y-3">
            {sdkDiagnostics.recentEvents.length > 0 ? sdkDiagnostics.recentEvents.map((event) => (
              <div key={event.id} className="rounded-3xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium">{event.eventType.replaceAll("_", " ")}</p>
                  <Badge>{event.variantKey}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{event.pathname}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleString("fr-FR")}</p>
              </div>
            )) : <div className="rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">No recent events have been received yet.</div>}
          </div>
        </Card>

        <Card className="bg-white">
          <p className="text-lg font-semibold">Recent action history</p>
          <div className="mt-4 space-y-3">
            {auditTrail.length > 0 ? auditTrail.map((entry) => (
              <div key={entry.id} className="rounded-3xl border border-border p-4">
                <p className="font-medium">{entry.note}</p>
                <p className="mt-2 text-sm text-muted-foreground">{entry.actor ?? "workspace"} - {new Date(entry.timestamp).toLocaleString("fr-FR")}</p>
              </div>
            )) : <div className="rounded-3xl bg-secondary/50 p-4 text-sm text-muted-foreground">Launch actions will appear here as soon as your team starts approving and launching tests.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}

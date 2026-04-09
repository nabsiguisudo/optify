import { cache } from "react";
import { unstable_cache } from "next/cache";
import { demoExperiments, demoProjects, demoSessionDiagnostics, demoStats, demoSuggestions, demoUser } from "@/lib/demo-data";
import { readDevStore } from "@/lib/dev-store";
import { buildAudienceInsights, buildProductRecommendations, buildExperimentReport } from "@/lib/insights";
import { buildShopifyInstallAssets } from "@/lib/shopify";
import { buildGlobalAnalytics, computeExperimentStats } from "@/lib/stats";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase";
import { env, hasSupabaseClientEnv, hasSupabaseEnv } from "@/lib/env";
import { type Locale } from "@/lib/i18n";
import type { AiCopilotInsight, AiSuggestion, AudienceInsight, EventRecord, Experiment, ExperimentReport, ExperimentStats, GlobalAnalytics, InstallationDiagnostic, LaunchCenterItem, LaunchCenterSnapshot, OnboardingChecklistItem, OnboardingProgress, PageHeatmap, ProductRecommendation, Project, ReplayOpportunity, SdkDiagnosticsSnapshot, SessionDiagnostic, SessionRecordingChunk, SessionRecordingFrame, SessionReplayNode, ShopifyConnection, ShopifyInstallAssets, User } from "@/lib/types";

const clickLikeEventTypes = new Set<string>([
  "click",
  "cta_click",
  "outbound_click",
  "recommendation_click",
  "add_to_cart",
  "checkout_start",
  "purchase",
  "conversion"
]);

const PROJECT_DATA_REVALIDATE_SECONDS = 15;
const ANALYTICS_DATA_REVALIDATE_SECONDS = 8;

export const getCurrentUserOrNull = cache(async (): Promise<User | null> => {
  if (!hasSupabaseClientEnv()) {
    return demoUser;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await supabase?.auth.getUser();
    const user = result?.data.user;

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email ?? "",
      fullName: user.user_metadata.full_name ?? user.email ?? "Workspace owner"
    };
  } catch {
    return null;
  }
});

export const getCurrentUser = cache(async (): Promise<User> => {
  const user = await getCurrentUserOrNull();
  return user ?? demoUser;
});

const getProjectsFromSupabase = unstable_cache(
  async (userId: string): Promise<Project[]> => {
    const supabase = await createSupabaseAdminClient();
    const { data } = await supabase.from("projects").select("*").eq("owner_id", userId).order("created_at", { ascending: false });
    return (data ?? []).map((project) => ({
      id: project.id,
      name: project.name,
      domain: project.domain,
      platform: project.platform,
      publicKey: project.public_key,
      workspaceId: project.workspace_id,
      scriptUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/optify-sdk.js`
    }));
  },
  ["projects-by-user"],
  { revalidate: PROJECT_DATA_REVALIDATE_SECONDS }
);

export async function getProjects(): Promise<Project[]> {
  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    return store.projects.map((project) => ({
      ...project,
      scriptUrl: `${env.appUrl.replace(/\/$/, "")}/optify-sdk.js`
    }));
  }

  const user = await getCurrentUserOrNull();
  if (!user) {
    return [];
  }
  return getProjectsFromSupabase(user.id);
}

export async function getVisibleProjects(): Promise<Project[]> {
  const projects = await getProjects();
  const demoProjectIds = new Set(demoProjects.map((project) => project.id));
  const hasRealProjects = projects.some((project) => !demoProjectIds.has(project.id));

  if (!hasRealProjects) {
    return projects;
  }

  return projects.filter((project) => !demoProjectIds.has(project.id));
}

export async function getProjectById(projectId: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((project) => project.id === projectId);
}

const getExperimentsByProjectFromSupabase = unstable_cache(
  async (projectId: string): Promise<Experiment[]> => {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("experiments")
      .select("*, variants(*)")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    return (data ?? []).map((experiment) => ({
      id: experiment.id,
      projectId: experiment.project_id,
      name: experiment.name,
      hypothesis: experiment.hypothesis,
      pagePattern: experiment.page_pattern,
      trafficSplit: experiment.traffic_split,
      status: experiment.status,
      workflowState: experiment.workflow_state ?? experiment.status,
      scheduledFor: experiment.scheduled_for ?? undefined,
      priority: experiment.priority ?? "medium",
      exclusionGroup: experiment.exclusion_group ?? undefined,
      type: experiment.experiment_type ?? "visual",
      primaryMetric: experiment.primary_metric,
      createdAt: experiment.created_at,
      editorMode: experiment.editor_mode,
      customCode: experiment.custom_code ?? "",
      audienceRules: experiment.audience_rules ?? [],
      targeting: experiment.targeting_rules ?? undefined,
      popupConfig: experiment.popup_config ?? undefined,
      recommendationConfig: experiment.recommendation_config ?? undefined,
      variants: (experiment.variants ?? []).map((variant: any) => ({
        id: variant.id,
        experimentId: variant.experiment_id,
        name: variant.name,
        key: variant.key,
        allocation: variant.allocation,
        isControl: variant.is_control,
        changes: variant.changes
      }))
    }));
  },
  ["experiments-by-project"],
  { revalidate: PROJECT_DATA_REVALIDATE_SECONDS }
);

export async function getExperimentsByProject(projectId: string): Promise<Experiment[]> {
  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    return store.experiments.filter((experiment) => experiment.projectId === projectId);
  }
  return getExperimentsByProjectFromSupabase(projectId);
}

export async function getExperimentById(experimentId: string): Promise<Experiment | undefined> {
  const experiments = hasSupabaseEnv()
    ? (await Promise.all((await getProjects()).map((project) => getExperimentsByProject(project.id)))).flat()
    : (await readDevStore()).experiments;
  return experiments.find((experiment) => experiment.id === experimentId);
}

export async function getAllExperiments(): Promise<Experiment[]> {
  const projects = await getProjects();
  const groups = await Promise.all(projects.map((project) => getExperimentsByProject(project.id)));
  return groups.flat().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getGlobalAnalytics(): Promise<GlobalAnalytics> {
  const experiments = await getAllExperiments();
  const statsItems = (await Promise.all(experiments.map((experiment) => getExperimentStats(experiment.id, { days: 30 })))).filter(Boolean) as ExperimentStats[];
  const analytics = buildGlobalAnalytics(statsItems);
  const cumulativeRevenueUplift = statsItems.reduce((sum, item) => sum + (item.roi?.estimatedRevenueUplift ?? 0), 0);
  const launchReadyExperiments = experiments.filter((experiment) => ["approved", "scheduled", "ready_for_review"].includes(experiment.workflowState ?? "draft"));
  const averageRevenuePerExperiment = experiments.length > 0 ? analytics.kpis.revenue / experiments.length : 0;

  return {
    ...analytics,
    experimentsSummary: {
      running: experiments.filter((experiment) => experiment.status === "running").length,
      draft: experiments.filter((experiment) => experiment.status === "draft").length,
      paused: experiments.filter((experiment) => experiment.status === "paused").length,
      winners: statsItems.filter((item) => item.winner).length
    },
    businessImpact: {
      cumulativeRevenueUplift,
      projectedMonthlyImpact: cumulativeRevenueUplift * 30 / 7,
      launchReadyRevenuePotential: launchReadyExperiments.length * averageRevenuePerExperiment * 0.08
    }
  };
}

export async function getProjectAnalytics(projectId: string): Promise<GlobalAnalytics> {
  const experiments = await getExperimentsByProject(projectId);
  const projectEvents = await getProjectEvents(projectId);
  const pseudoVariant = {
    id: "__project_variant__",
    experimentId: "__project__",
    name: "Storefront",
    key: "storefront",
    allocation: 100,
    isControl: true,
    changes: []
  };
  const normalizedEvents = projectEvents.map((event) => ({
    ...event,
    experimentId: "__project__",
    variantKey: event.variantKey && event.variantKey.trim() ? event.variantKey : "storefront"
  }));
  const siteStats = computeExperimentStats("__project__", [pseudoVariant], normalizedEvents, { days: 30 });
  const experimentStats = (await Promise.all(experiments.map((experiment) => getExperimentStats(experiment.id, { days: 30 })))).filter(Boolean) as ExperimentStats[];
  const analytics = buildGlobalAnalytics([siteStats]);
  const cumulativeRevenueUplift = experimentStats.reduce((sum, item) => sum + (item.roi?.estimatedRevenueUplift ?? 0), 0);
  const launchReadyExperiments = experiments.filter((experiment) => ["approved", "scheduled", "ready_for_review"].includes(experiment.workflowState ?? "draft"));
  const averageRevenuePerExperiment = experiments.length > 0 ? analytics.kpis.revenue / Math.max(experiments.length, 1) : 0;

  return {
    ...analytics,
    experimentsSummary: {
      running: experiments.filter((experiment) => experiment.status === "running").length,
      draft: experiments.filter((experiment) => experiment.status === "draft").length,
      paused: experiments.filter((experiment) => experiment.status === "paused").length,
      winners: experimentStats.filter((item) => item.winner).length
    },
    businessImpact: {
      cumulativeRevenueUplift,
      projectedMonthlyImpact: cumulativeRevenueUplift * 30 / 7,
      launchReadyRevenuePotential: launchReadyExperiments.length * averageRevenuePerExperiment * 0.08
    }
  };
}

export async function getInstallationDiagnostic(projectId: string): Promise<InstallationDiagnostic | undefined> {
  const project = await getProjectById(projectId);
  if (!project) {
    return undefined;
  }

  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    const healthReports = store.sdkHealth.filter((item) => item.projectId === projectId).sort((a, b) => b.loadedAt.localeCompare(a.loadedAt));
    const relatedEvents = store.events.filter((event) => event.projectId === projectId).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const latestHealth = healthReports[0];
    const recentPages = [...new Set([
      ...healthReports.slice(0, 5).map((item) => item.pathname),
      ...relatedEvents.slice(0, 5).map((item) => item.pathname)
    ])].slice(0, 6);
    const lastSeenMs = latestHealth ? Date.now() - new Date(latestHealth.loadedAt).getTime() : Number.POSITIVE_INFINITY;

    const checks: InstallationDiagnostic["checks"] = [
      {
        key: "script_seen",
        label: "SDK script seen",
        status: latestHealth ? "pass" : "fail",
        detail: latestHealth ? `Last SDK load detected on ${latestHealth.pathname} at ${latestHealth.loadedAt}.` : "No SDK load has been reported yet."
      },
      {
        key: "recent_activity",
        label: "Recent SDK activity",
        status: latestHealth && lastSeenMs < 24 * 60 * 60 * 1000 ? "pass" : latestHealth ? "warn" : "fail",
        detail: latestHealth
          ? lastSeenMs < 24 * 60 * 60 * 1000
            ? "SDK was active in the last 24 hours."
            : "SDK has reported before, but not in the last 24 hours."
          : "No recent SDK heartbeat detected."
      },
      {
        key: "event_flow",
        label: "Event collection",
        status: relatedEvents.length >= 5 ? "pass" : relatedEvents.length > 0 ? "warn" : "fail",
        detail: relatedEvents.length >= 5
          ? `${relatedEvents.length} events collected for this project.`
          : relatedEvents.length > 0
            ? `Only ${relatedEvents.length} event(s) collected so far.`
            : "No events have been collected yet."
      },
      {
        key: "browser_support",
        label: "Browser capability coverage",
        status: latestHealth && latestHealth.capabilities.localStorage && latestHealth.capabilities.sessionStorage ? "pass" : latestHealth ? "warn" : "fail",
        detail: latestHealth
          ? `Beacon: ${latestHealth.capabilities.beacon ? "yes" : "no"}, IO: ${latestHealth.capabilities.intersectionObserver ? "yes" : "no"}, storage: ${latestHealth.capabilities.localStorage && latestHealth.capabilities.sessionStorage ? "ok" : "partial"}.`
          : "Capabilities unknown until the SDK loads on a page."
      }
    ];

    const status =
      checks.some((check) => check.status === "fail")
        ? checks.every((check) => check.status === "fail") ? "not_installed" : "warning"
        : "healthy";

    return {
      projectId,
      projectName: project.name,
      scriptUrl: project.scriptUrl,
      status,
      checks,
      latestHealth,
      recentPages,
      recentEventCount: relatedEvents.length,
      liveEventTypes: Object.entries(
        relatedEvents.reduce<Record<string, number>>((acc, event) => {
          acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
          return acc;
        }, {})
      )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([type, count]) => ({ type: type as EventRecord["eventType"], count }))
    };
  }

  const [experiments, projectEvents] = await Promise.all([
    getExperimentsByProject(projectId),
    getProjectEvents(projectId)
  ]);
  const recentEvents = [...projectEvents].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 24);
  const recentEventCount = projectEvents.length;
  const recentPages = [...new Set([
    ...recentEvents.map((event) => event.pathname),
    ...experiments.map((experiment) => experiment.pagePattern)
  ])].slice(0, 6);
  const liveEventTypes = Object.entries(
    recentEvents.reduce<Record<string, number>>((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([type, count]) => ({ type: type as EventRecord["eventType"], count }));
  const checks: InstallationDiagnostic["checks"] = [
    {
      key: "sdk_config",
      label: "Config endpoint available",
      status: "pass",
      detail: "Project config is resolvable by the SDK."
    },
    {
      key: "running_experiments",
      label: "Active experiments",
      status: experiments.some((experiment) => experiment.status === "running") ? "pass" : "warn",
      detail: experiments.some((experiment) => experiment.status === "running") ? "Running experiments are available for assignment." : "No running experiments yet."
    },
    {
      key: "event_flow",
      label: "Event collection",
      status: recentEventCount > 0 ? "pass" : "warn",
      detail: recentEventCount > 0 ? `${recentEventCount} events recents sont presents pour ce projet.` : "No tracked events found in the current analytics layer."
    }
  ];

  return {
    projectId,
    projectName: project.name,
    scriptUrl: project.scriptUrl,
    status: recentEventCount > 0 ? "healthy" : "warning",
    checks,
    recentPages,
    recentEventCount,
    liveEventTypes
  };
}

export async function getShopifyConnection(projectId: string): Promise<ShopifyConnection | undefined> {
  const project = await getProjectById(projectId);
  if (!project || project.platform !== "shopify") {
    return undefined;
  }

  if (hasSupabaseEnv()) {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("shopify_connections").select("*").eq("project_id", projectId).maybeSingle();
    if (!data) {
      return {
        projectId,
        status: "not_connected",
        shopDomain: project.domain,
        scopes: [],
        pageTypesTracked: ["index", "product", "collection", "cart", "search", "checkout"],
        themes: [],
        installMode: "manual_token"
      };
    }

    const relatedEvents = await getProjectEvents(projectId);
    const pageTypesTracked = [...new Set(relatedEvents.map((event) => event.context?.pageType).filter(Boolean) as string[])];
    return {
      projectId: data.project_id,
      status: data.status,
      shopDomain: data.shop_domain,
      adminAccessToken: data.admin_access_token ?? undefined,
      shopName: data.shop_name ?? undefined,
      storefrontDomain: data.storefront_domain ?? undefined,
      planName: data.plan_name ?? undefined,
      currencyCode: data.currency_code ?? undefined,
      primaryLocale: data.primary_locale ?? undefined,
      connectedAt: data.connected_at ?? undefined,
      lastSyncedAt: data.last_synced_at ?? undefined,
      scopes: data.scopes ?? [],
      pageTypesTracked: pageTypesTracked.length > 0 ? pageTypesTracked : data.page_types_tracked ?? [],
      activeTheme: data.active_theme ?? undefined,
      themes: data.themes ?? [],
      installMode: data.install_mode ?? "manual_token"
    };
  }

  const store = await readDevStore();
  const connection = store.shopifyConnections.find((item) => item.projectId === projectId);
  if (!connection) {
    return {
      projectId,
      status: "not_connected",
      shopDomain: project.domain,
      scopes: [],
      pageTypesTracked: ["index", "product", "collection", "cart", "search", "checkout"],
      themes: [],
      installMode: "manual_token"
    };
  }

  const relatedEvents = store.events.filter((event) => event.projectId === projectId);
  const pageTypesTracked = [...new Set(relatedEvents.map((event) => event.context?.pageType).filter(Boolean) as string[])];
  return {
    ...connection,
    pageTypesTracked: pageTypesTracked.length > 0 ? pageTypesTracked : connection.pageTypesTracked
  };
}

export async function getShopifyInstallAssets(projectId: string): Promise<ShopifyInstallAssets | undefined> {
  const project = await getProjectById(projectId);
  if (!project || project.platform !== "shopify") {
    return undefined;
  }

  return buildShopifyInstallAssets({
    projectId,
    scriptUrl: project.scriptUrl
  });
}

export async function getShopifyProjectsOverview() {
  const projects = (await getVisibleProjects()).filter((project) => project.platform === "shopify");
  const items = await Promise.all(projects.map(async (project) => {
    const [connection, diagnostic] = await Promise.all([
      getShopifyConnection(project.id),
      getInstallationDiagnostic(project.id)
    ]);
    return {
      project,
      connection,
      diagnostic
    };
  }));

  return items;
}

export async function getSdkDiagnostics(projectId: string): Promise<SdkDiagnosticsSnapshot | undefined> {
  const diagnostic = await getInstallationDiagnostic(projectId);
  if (!diagnostic) {
    return undefined;
  }

  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    const recentEvents = store.events
      .filter((event) => event.projectId === projectId)
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 12);

    const eventTypes = Object.entries(
      recentEvents.reduce<Record<string, number>>((acc, event) => {
        acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
        return acc;
      }, {})
    ).map(([type, count]) => ({ type: type as EventRecord["eventType"], count }));

    return {
      projectId,
      status: diagnostic.status,
      transport: {
        recentEventCount: diagnostic.recentEventCount,
        duplicateRate: 0,
        errorRate: recentEvents.length === 0 ? 0 : recentEvents.filter((event) => event.eventType === "js_error").length / recentEvents.length,
        lastEventAt: recentEvents[0]?.timestamp
      },
      eventTypes,
      recentEvents,
      latestHealth: diagnostic.latestHealth
    };
  }

  const recentEvents = (await getProjectEvents(projectId))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 12);

  return {
    projectId,
    status: diagnostic.status,
    transport: {
      recentEventCount: diagnostic.recentEventCount,
      duplicateRate: 0,
      errorRate: 0,
      lastEventAt: recentEvents[0]?.timestamp ?? diagnostic.latestHealth?.loadedAt
    },
    eventTypes: diagnostic.liveEventTypes ?? [],
    recentEvents,
    latestHealth: diagnostic.latestHealth
  };
}

export async function getLaunchAuditTrail(limit = 12) {
  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    return store.launchAudit.slice(0, limit);
  }

  return [];
}

export async function getProjectLaunchAuditTrail(projectId: string, limit = 12) {
  const experiments = await getExperimentsByProject(projectId);
  const experimentIds = new Set(experiments.map((experiment) => experiment.id));
  const trail = await getLaunchAuditTrail(100);
  return trail.filter((entry) => experimentIds.has(entry.itemId)).slice(0, limit);
}

export async function getOnboardingProgress(projectId: string, locale: Locale = "fr"): Promise<OnboardingProgress | undefined> {
  const [project, diagnostic, suggestions, experiments] = await Promise.all([
    getProjectById(projectId),
    getInstallationDiagnostic(projectId),
    getAiSuggestions("", locale),
    getExperimentsByProject(projectId)
  ]);

  if (!project || !diagnostic) {
    return undefined;
  }

  const checklist: OnboardingChecklistItem[] = [
    {
      key: "install_sdk",
      title: "Install the SDK",
      body: "Place the script on the storefront so Optify can start observing sessions.",
      status: diagnostic.status === "not_installed" ? "current" : "complete",
      href: `/dashboard/projects/${projectId}/installation`
    },
    {
      key: "verify_events",
      title: "Verify live events",
      body: "Confirm page views, clicks, commerce events, and health checks are arriving.",
      status: diagnostic.recentEventCount > 0 ? "complete" : diagnostic.status === "not_installed" ? "locked" : "current",
      href: `/dashboard/projects/${projectId}/installation`
    },
    {
      key: "review_ai_tests",
      title: "Review AI-generated tests",
      body: "Let the AI queue draft opportunities, then validate the ones worth launching.",
      status: suggestions.length > 0 ? "complete" : diagnostic.recentEventCount > 0 ? "current" : "locked",
      href: `/dashboard/projects/${projectId}/suggestions`
    },
    {
      key: "launch_first_test",
      title: "Launch your first experiment",
      body: "Approve, schedule or run one experiment so the ROI layer can start measuring impact.",
      status: experiments.some((experiment) => experiment.workflowState === "running" || experiment.status === "running")
        ? "complete"
        : suggestions.length > 0 || experiments.length > 0
          ? "current"
          : "locked",
      href: `/dashboard/sites/${projectId}/experiments`
    }
  ];

  const completedSteps = checklist.filter((item) => item.status === "complete").length;
  const currentStep = checklist.find((item) => item.status === "current") ?? checklist[checklist.length - 1];

  return {
    projectId,
    completionRatio: checklist.length === 0 ? 0 : completedSteps / checklist.length,
    completedSteps,
    totalSteps: checklist.length,
    currentStepLabel: currentStep.title,
    checklist
  };
}

export async function getExperimentStats(
  experimentId: string,
  options?: { days?: number; from?: string; to?: string }
): Promise<ExperimentStats | undefined> {
  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    const experiment = store.experiments.find((item) => item.id === experimentId);
    if (!experiment) {
      return undefined;
    }

    if (demoStats[experimentId] && store.events.filter((event) => event.experimentId === experimentId).length === 0) {
      return demoStats[experimentId];
    }

    return computeExperimentStats(experimentId, experiment.variants, store.events, options);
  }

  const experiment = await getExperimentById(experimentId);
  if (!experiment) {
    return undefined;
  }
  const events = (await getProjectEvents(experiment.projectId)).filter((event) => event.experimentId === experimentId);
  return computeExperimentStats(experimentId, experiment.variants, events, options);
}

export async function getAiSuggestions(url: string, locale: Locale = "fr"): Promise<AiSuggestion[]> {
  if (!env.openAiKey) {
    const localizedSuggestions: Record<Locale, AiSuggestion[]> = {
      fr: [
        {
          type: "visual",
          title: "Tester un CTA plus oriente valeur",
          hypothesis: "Remplacer un wording generique par une promesse plus claire devrait augmenter le taux de clic.",
          expectedImpact: "high",
          primaryMetric: "cta_click",
          targetSelector: "[data-optify='hero-cta']",
          approvalState: "ready_for_review",
          changes: ["Reecrire le CTA principal avec benefice + urgence", "Augmenter le contraste du bouton CTA"]
        },
        {
          type: "content",
          title: "Remonter la preuve sociale",
          hypothesis: "Ajouter avis et badges de confiance au-dessus de la ligne de flottaison devrait reduire la friction.",
          expectedImpact: "medium",
          primaryMetric: "add_to_cart",
          targetSelector: "[data-optify='hero-subtitle']",
          approvalState: "ready_for_review",
          changes: ["Ajouter la note etoilee pres du titre produit", "Montrer un bloc temoignage sous le hero"]
        },
        {
          type: "funnel",
          title: "Raccourcir la friction formulaire ou checkout",
          hypothesis: "Reduire la charge cognitive du funnel devrait aider la conversion mobile.",
          expectedImpact: "high",
          primaryMetric: "conversion",
          targetSelector: "checkout",
          approvalState: "draft",
          changes: ["Masquer les champs secondaires", "Passer en layout mobile une colonne"]
        }
      ],
      en: demoSuggestions,
      it: [
        {
          type: "visual",
          title: "Testare una CTA piu orientata al valore",
          hypothesis: "Sostituire un copy generico con uno piu orientato al beneficio dovrebbe aumentare il CTR.",
          expectedImpact: "high",
          primaryMetric: "cta_click",
          targetSelector: "[data-optify='hero-cta']",
          approvalState: "ready_for_review",
          changes: ["Riscrivere la CTA principale con beneficio + urgenza", "Aumentare il contrasto del bottone CTA"]
        },
        {
          type: "content",
          title: "Portare la social proof piu in alto",
          hypothesis: "Aggiungere recensioni e trust badge above the fold dovrebbe ridurre l'attrito.",
          expectedImpact: "medium",
          primaryMetric: "add_to_cart",
          targetSelector: "[data-optify='hero-subtitle']",
          approvalState: "ready_for_review",
          changes: ["Aggiungere rating vicino al titolo prodotto", "Mostrare un blocco testimonianza sotto l'hero"]
        },
        {
          type: "funnel",
          title: "Ridurre l'attrito di form o checkout",
          hypothesis: "Ridurre il carico cognitivo del funnel dovrebbe aiutare la conversione mobile.",
          expectedImpact: "high",
          primaryMetric: "conversion",
          targetSelector: "checkout",
          approvalState: "draft",
          changes: ["Nascondere i campi secondari", "Usare un layout mobile a colonna singola"]
        }
      ],
      es: [
        {
          type: "visual",
          title: "Probar una CTA mas orientada al valor",
          hypothesis: "Sustituir un copy generico por uno mas orientado al beneficio deberia mejorar el CTR.",
          expectedImpact: "high",
          primaryMetric: "cta_click",
          targetSelector: "[data-optify='hero-cta']",
          approvalState: "ready_for_review",
          changes: ["Reescribir la CTA principal con beneficio + urgencia", "Aumentar el contraste del boton CTA"]
        },
        {
          type: "content",
          title: "Subir la prueba social",
          hypothesis: "Anadir resenas y badges de confianza above the fold deberia reducir la friccion.",
          expectedImpact: "medium",
          primaryMetric: "add_to_cart",
          targetSelector: "[data-optify='hero-subtitle']",
          approvalState: "ready_for_review",
          changes: ["Anadir rating junto al titulo del producto", "Mostrar un bloque de testimonio bajo el hero"]
        },
        {
          type: "funnel",
          title: "Reducir la friccion de formulario o checkout",
          hypothesis: "Reducir la carga cognitiva del funnel deberia mejorar la conversion mobile.",
          expectedImpact: "high",
          primaryMetric: "conversion",
          targetSelector: "checkout",
          approvalState: "draft",
          changes: ["Ocultar campos secundarios", "Usar layout mobile de una sola columna"]
        }
      ],
      de: [
        {
          type: "visual",
          title: "Eine staerkere wertorientierte CTA testen",
          hypothesis: "Generische Handlungsaufforderung durch nutzenorientierten Copy zu ersetzen sollte die Klickrate steigern.",
          expectedImpact: "high",
          primaryMetric: "cta_click",
          targetSelector: "[data-optify='hero-cta']",
          approvalState: "ready_for_review",
          changes: ["Primare CTA mit Benefit + Dringlichkeit umschreiben", "CTA-Button-Kontrast erhoehen"]
        },
        {
          type: "content",
          title: "Social Proof weiter oben platzieren",
          hypothesis: "Testimonials und Trust-Badges above the fold sollten Reibung reduzieren.",
          expectedImpact: "medium",
          primaryMetric: "add_to_cart",
          targetSelector: "[data-optify='hero-subtitle']",
          approvalState: "ready_for_review",
          changes: ["Sternebewertung nahe dem Produkttitel zeigen", "Testimonial-Block unter dem Hero anzeigen"]
        },
        {
          type: "funnel",
          title: "Formular- oder Checkout-Reibung verringern",
          hypothesis: "Weniger kognitive Last im Funnel sollte die Mobile-Conversion verbessern.",
          expectedImpact: "high",
          primaryMetric: "conversion",
          targetSelector: "checkout",
          approvalState: "draft",
          changes: ["Sekundare Felder ausblenden", "Einspaltiges Mobile-Layout verwenden"]
        }
      ]
    };

    return localizedSuggestions[locale].map((suggestion) => ({
      ...suggestion,
      title: url ? `${suggestion.title} - ${url}` : suggestion.title
    }));
  }

  return demoSuggestions;
}

export async function getAiExperimentQueue(locale: Locale = "fr") {
  const suggestions = await getAiSuggestions("", locale);
  const ready = suggestions.filter((item) => item.approvalState === "ready_for_review").length;
  const types = Object.entries(
    suggestions.reduce<Record<string, number>>((acc, suggestion) => {
      acc[suggestion.type] = (acc[suggestion.type] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return {
    total: suggestions.length,
    ready,
    suggestions,
    types
  };
}

export async function getLaunchCenter(locale: Locale = "fr"): Promise<LaunchCenterSnapshot> {
  const [experiments, aiQueue, projects, auditTrail] = await Promise.all([getAllExperiments(), getAiExperimentQueue(locale), getProjects(), getLaunchAuditTrail()]);
  const defaultProjectId = projects[0]?.id ?? "proj_1";

  const experimentItems: LaunchCenterItem[] = experiments.slice(0, 6).map((experiment) => ({
    id: experiment.id,
    title: experiment.name,
    kind: "experiment",
    state: experiment.workflowState ?? (experiment.status === "running" ? "running" : experiment.status === "paused" ? "paused" : "draft"),
    metric: experiment.primaryMetric.replaceAll("_", " "),
    target: experiment.pagePattern,
    rationale: experiment.hypothesis,
    href: `/dashboard/projects/${experiment.projectId}/experiments/${experiment.id}`,
    risk: experiment.type === "custom_code" ? "high" : experiment.type === "popup" ? "medium" : "low",
    scheduledFor: experiment.scheduledFor,
    priority: experiment.priority ?? "medium",
    exclusionGroup: experiment.exclusionGroup
  }));

  const suggestionItems: LaunchCenterItem[] = aiQueue.suggestions.slice(0, 6).map((suggestion, index) => ({
    id: `ai-${index}-${suggestion.title}`,
    title: suggestion.title,
    kind: "ai_suggestion",
    state: suggestion.approvalState === "approved" ? "approved" : suggestion.approvalState === "ready_for_review" ? "ready_for_review" : "draft",
    metric: (suggestion.primaryMetric ?? "conversion").replaceAll("_", " "),
    target: suggestion.targetSelector ?? "homepage hero",
    rationale: suggestion.hypothesis,
    href: `/dashboard/projects/${defaultProjectId}/suggestions`,
    risk: suggestion.expectedImpact === "high" ? "medium" : "low"
  }));

  const items = [...suggestionItems, ...experimentItems].slice(0, 8);

  return {
    counts: {
      draft: items.filter((item) => item.state === "draft").length,
      readyForReview: items.filter((item) => item.state === "ready_for_review").length,
      approved: items.filter((item) => item.state === "approved").length,
      scheduled: items.filter((item) => item.state === "scheduled").length,
      running: items.filter((item) => item.state === "running").length,
      paused: items.filter((item) => item.state === "paused").length
    },
    items,
    auditTrail
  };
}

export async function getProjectLaunchCenter(projectId: string, locale: Locale = "fr"): Promise<LaunchCenterSnapshot> {
  const [experiments, aiQueue, auditTrail] = await Promise.all([
    getExperimentsByProject(projectId),
    getAiExperimentQueue(locale),
    getProjectLaunchAuditTrail(projectId)
  ]);

  const experimentItems: LaunchCenterItem[] = experiments.slice(0, 8).map((experiment) => ({
    id: experiment.id,
    title: experiment.name,
    kind: "experiment",
    state: experiment.workflowState ?? (experiment.status === "running" ? "running" : experiment.status === "paused" ? "paused" : "draft"),
    metric: experiment.primaryMetric.replaceAll("_", " "),
    target: experiment.pagePattern,
    rationale: experiment.hypothesis,
    href: `/dashboard/projects/${experiment.projectId}/experiments/${experiment.id}`,
    risk: experiment.type === "custom_code" ? "high" : experiment.type === "popup" ? "medium" : "low",
    scheduledFor: experiment.scheduledFor,
    priority: experiment.priority ?? "medium",
    exclusionGroup: experiment.exclusionGroup
  }));

  const suggestionItems: LaunchCenterItem[] = aiQueue.suggestions.slice(0, 4).map((suggestion, index) => ({
    id: `ai-${projectId}-${index}-${suggestion.title}`,
    title: suggestion.title,
    kind: "ai_suggestion",
    state: suggestion.approvalState === "approved" ? "approved" : suggestion.approvalState === "ready_for_review" ? "ready_for_review" : "draft",
    metric: (suggestion.primaryMetric ?? "conversion").replaceAll("_", " "),
    target: suggestion.targetSelector ?? "homepage hero",
    rationale: suggestion.hypothesis,
    href: `/dashboard/projects/${projectId}/suggestions`,
    risk: suggestion.expectedImpact === "high" ? "medium" : "low"
  }));

  const items = [...suggestionItems, ...experimentItems];

  return {
    counts: {
      draft: items.filter((item) => item.state === "draft").length,
      readyForReview: items.filter((item) => item.state === "ready_for_review").length,
      approved: items.filter((item) => item.state === "approved").length,
      scheduled: items.filter((item) => item.state === "scheduled").length,
      running: items.filter((item) => item.state === "running").length,
      paused: items.filter((item) => item.state === "paused").length
    },
    items,
    auditTrail
  };
}

export async function getAiCopilotInsights(locale: Locale = "fr"): Promise<AiCopilotInsight[]> {
  const [suggestions, analytics] = await Promise.all([getAiSuggestions("", locale), getGlobalAnalytics()]);
  const topSegment = analytics.segments[0];

  return suggestions.slice(0, 4).map((suggestion, index) => ({
    id: `copilot-${index}-${suggestion.title}`,
    title: suggestion.title,
    narrative: `${suggestion.hypothesis} Recommended because ${topSegment?.label ?? "high-intent users"} show the strongest mix of engagement and conversion potential.`,
    segment: topSegment?.label ?? "high intent users",
    expectedImpact: suggestion.expectedImpact,
    recommendedType: suggestion.type,
    primaryMetric: suggestion.primaryMetric ?? "conversion",
    risk: suggestion.type === "custom_code" || suggestion.type === "pricing" ? "high" : suggestion.type === "popup" ? "medium" : "low",
    actionLabel: suggestion.approvalState === "ready_for_review" ? "Review now" : "Refine with AI"
  }));
}

export async function getAudienceInsights(locale: Locale = "fr"): Promise<AudienceInsight[]> {
  const experiments = await getAllExperiments();
  return buildAudienceInsights(experiments, locale);
}

export async function getRecommendations(projectId?: string, locale: Locale = "fr"): Promise<ProductRecommendation[]> {
  const project = projectId ? await getProjectById(projectId) : (await getProjects())[0];
  return buildProductRecommendations(project, locale);
}

export async function getRecentProjectProductUrl(projectId: string): Promise<string | undefined> {
  const [project, events] = await Promise.all([
    getProjectById(projectId),
    getProjectEvents(projectId)
  ]);

  if (!project?.domain) {
    return undefined;
  }

  const storefrontBase = `https://${project.domain.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  const productEvent = events.find((event) => {
    if (!event.pathname?.startsWith("/products/")) return false;
    const pageType = typeof event.context?.pageType === "string" ? event.context.pageType : "";
    return pageType === "product" || event.eventType === "product_view" || event.eventType === "page_view";
  });

  return productEvent ? `${storefrontBase}${productEvent.pathname}` : undefined;
}

async function getProjectEvents(projectId: string): Promise<EventRecord[]> {
  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    return store.events.filter((event) => event.projectId === projectId);
  }
  return getProjectEventsFromSupabase(projectId);
}

const getProjectEventsFromSupabase = unstable_cache(
  async (projectId: string): Promise<EventRecord[]> => {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase.from("events").select("*").eq("project_id", projectId).order("created_at", { ascending: false });

    return (data ?? []).map((event: any) => ({
      id: event.id,
      projectId: event.project_id,
      anonymousId: event.anonymous_id,
      sessionId: event.session_id ?? undefined,
      experimentId: event.experiment_id ?? "__sdk__",
      variantKey: event.variant_key,
      eventType: event.event_type,
      pathname: event.pathname,
      timestamp: event.created_at,
      context: event.context ?? undefined
    }));
  },
  ["events-by-project"],
  { revalidate: ANALYTICS_DATA_REVALIDATE_SECONDS }
);

async function getProjectRecordingChunks(projectId: string): Promise<SessionRecordingChunk[]> {
  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    return store.recordings
      .filter((recording) => recording.projectId === projectId)
      .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  }

  return getProjectRecordingChunksFromSupabase(projectId);
}

const getProjectRecordingChunksFromSupabase = unstable_cache(
  async (projectId: string): Promise<SessionRecordingChunk[]> => {
    const supabase = createSupabaseAdminClient();
    const { data } = await supabase
      .from("session_recordings")
      .select("*")
      .eq("project_id", projectId)
      .order("started_at", { ascending: true })
      .order("chunk_index", { ascending: true });

    return (data ?? []).map((recording: any) => ({
      id: recording.id,
      projectId: recording.project_id,
      anonymousId: recording.anonymous_id,
      sessionId: recording.session_id,
      startedAt: recording.started_at,
      endedAt: recording.ended_at,
      chunkIndex: recording.chunk_index,
      frameCount: recording.frame_count ?? (recording.frames ?? []).length,
      frames: (recording.frames ?? []) as SessionRecordingFrame[]
    }));
  },
  ["recordings-by-project"],
  { revalidate: ANALYTICS_DATA_REVALIDATE_SECONDS }
);

async function getProjectRecordingFrames(projectId: string) {
  const chunks = await getProjectRecordingChunks(projectId);
  const bySession = new Map<string, SessionRecordingFrame[]>();

  for (const chunk of chunks) {
    const current = bySession.get(chunk.sessionId) ?? [];
    current.push(...chunk.frames);
    bySession.set(chunk.sessionId, current);
  }

  for (const [sessionId, frames] of bySession.entries()) {
    bySession.set(sessionId, [...frames].sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
  }

  return bySession;
}

function buildSessionDiagnosticsFromEvents(events: EventRecord[], limit = 6): SessionDiagnostic[] {
  const bySession = new Map<string, EventRecord[]>();

  for (const event of events) {
    const sessionId = event.sessionId ?? `anon:${event.anonymousId}`;
    const list = bySession.get(sessionId) ?? [];
    list.push(event);
    bySession.set(sessionId, list);
  }

  function parseReplayNodes(event: EventRecord, fallbackId: string): SessionReplayNode[] {
    const raw = event.context?.replaySnapshot;
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw) as SessionReplayNode[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch {
        // Ignore malformed snapshots and fall back to synthetic nodes.
      }
    }

    return [
      {
        id: `${fallbackId}-root`,
        tag: "main",
        children: [
          {
            id: `${fallbackId}-header`,
            tag: "section",
            text: event.context?.pageTitle || event.pathname,
            muted: true
          },
          {
            id: `${fallbackId}-target`,
            tag: "button",
            text: event.context?.elementText || event.context?.productName || event.eventType,
            target: true
          }
        ]
      }
    ];
  }

  function inferDeviceTypeFromWidth(width?: number) {
    if (!width || width <= 0) return "unknown" as const;
    if (width <= 768) return "mobile" as const;
    if (width <= 1100) return "tablet" as const;
    return "desktop" as const;
  }

  return [...bySession.entries()]
    .map(([sessionId, sessionEvents]) => {
      const sorted = [...sessionEvents].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
      const startedAt = sorted[0]?.timestamp ?? new Date().toISOString();
      const durationMs = sorted.reduce((max, event) => {
        const value = typeof event.context?.durationMs === "number" ? event.context.durationMs : 0;
        return Math.max(max, value);
      }, 0);
      const lastEvent = sorted.at(-1);
      const deviceType = (lastEvent?.context?.device as SessionDiagnostic["deviceType"] | undefined)
        ?? inferDeviceTypeFromWidth(lastEvent?.context?.viewportWidth);

      return {
        sessionId,
        anonymousId: sorted[0]?.anonymousId ?? "",
        startedAt,
        deviceType,
        durationMs,
        pages: new Set(sorted.map((event) => event.pathname)).size,
        rageClicks: sorted.filter((event) => event.eventType === "rage_click").length,
        deadClicks: sorted.filter((event) => event.eventType === "dead_click").length,
        jsErrors: sorted.filter((event) => event.eventType === "js_error").length,
        conversions: sorted.filter((event) => event.eventType === "conversion").length,
        revenue: sorted
          .filter((event) => event.eventType === "purchase")
          .reduce((sum, event) => sum + (typeof event.context?.revenue === "number" ? event.context.revenue : 0), 0),
        events: sorted.slice(-12).map((event) => ({
          timestamp: event.timestamp,
          eventType: event.eventType,
          pathname: event.pathname,
          label: event.context?.elementText || event.context?.productName || event.context?.formId || undefined,
          selector: event.context?.elementSelector,
          value: typeof event.context?.value === "number" ? String(event.context.value) : undefined,
          notes: event.context?.errorMessage ? [event.context.errorMessage] : undefined
        })),
        replay: sorted.slice(-12).map((event, index) => ({
          id: `${sessionId}-${index}`,
          timestamp: event.timestamp,
          title: event.context?.pageTitle || event.eventType.replaceAll("_", " "),
          subtitle: event.context?.elementText || event.context?.productName || "Derived from session events",
          pathname: event.pathname,
          activeEventType: event.eventType,
          selector: event.context?.elementSelector,
          htmlSnapshot: event.context?.replayHtmlSnapshot,
          baseHref: event.context?.replayBaseHref,
          notes: [
            event.context?.device ? `Device: ${event.context.device}` : "Device unavailable",
            event.context?.source ? `Source: ${event.context.source}` : "Source unavailable"
          ],
          nodes: parseReplayNodes(event, `${sessionId}-${index}`)
        })),
        diagnostics: {
          frictionScore: Math.min(100, sorted.filter((event) => event.eventType === "rage_click").length * 18 + sorted.filter((event) => event.eventType === "dead_click").length * 14 + sorted.filter((event) => event.eventType === "js_error").length * 24),
          intentScore: Math.min(100, sorted.filter((event) => event.eventType === "add_to_cart").length * 22 + sorted.filter((event) => event.eventType === "checkout_start").length * 28 + sorted.filter((event) => event.eventType === "conversion").length * 34),
          summary: sorted.some((event) => event.eventType === "conversion")
            ? "Session progressed into a downstream conversion signal."
            : sorted.some((event) => event.eventType === "js_error")
              ? "Session shows technical friction before conversion."
              : "Session shows exploratory behavior without a conversion outcome yet.",
          topSignals: [
            `${sorted.filter((event) => event.eventType === "rage_click").length} rage clicks`,
            `${sorted.filter((event) => event.eventType === "dead_click").length} dead clicks`,
            `${sorted.filter((event) => event.eventType === "js_error").length} JS errors`
          ]
        }
      };
    })
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

export async function getProjectPageHeatmaps(projectId: string): Promise<PageHeatmap[]> {
  const events = await getProjectEvents(projectId);
  const recordingFramesBySession = await getProjectRecordingFrames(projectId);
  const recordingFrames = [...recordingFramesBySession.values()].flat();
  const replayEvents = events.filter((event) => typeof event.context?.replaySnapshot === "string" && event.context.replaySnapshot.trim());
  const clickEvents = events.filter((event) =>
    ["click", "cta_click", "outbound_click", "rage_click", "dead_click", "add_to_cart", "checkout_start", "purchase"].includes(event.eventType)
  );
  const scrollEvents = events.filter((event) => event.eventType === "scroll_depth");

  const byPage = new Map<string, {
    pathname: string;
    clickPoints: Map<string, {
      id: string;
      x: number;
      y: number;
      clicks: number;
      selector: string;
      label: string;
    }>;
    uniqueSessions: Set<string>;
    scrollBands: Map<number, number>;
    totalScrollDepth: number;
    maxScrollDepth: number;
    scrollSamples: number;
    previewNodes?: SessionReplayNode[];
    previewHtml?: string;
    previewBaseHref?: string;
  }>();

  function getPage(pathname: string) {
    const existing = byPage.get(pathname);
    if (existing) return existing;
    const created = {
      pathname,
      clickPoints: new Map(),
      uniqueSessions: new Set<string>(),
      scrollBands: new Map<number, number>(),
      totalScrollDepth: 0,
      maxScrollDepth: 0,
      scrollSamples: 0,
      previewNodes: undefined,
      previewHtml: undefined,
      previewBaseHref: undefined
    };
    byPage.set(pathname, created);
    return created;
  }

  for (const event of replayEvents) {
    const page = getPage(event.pathname);
    if (!page.previewHtml && typeof event.context?.replayHtmlSnapshot === "string" && event.context.replayHtmlSnapshot.trim()) {
      page.previewHtml = event.context.replayHtmlSnapshot;
      page.previewBaseHref = event.context?.replayBaseHref;
    }
    if (page.previewNodes) continue;
    const raw = event.context?.replaySnapshot;
    if (typeof raw === "string" && raw.trim()) {
      try {
        const parsed = JSON.parse(raw) as SessionReplayNode[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          page.previewNodes = parsed;
        }
      } catch {
        // Ignore malformed preview snapshots.
      }
    }
  }

  for (const frame of recordingFrames) {
    const page = getPage(frame.pathname);
    if (!page.previewHtml && frame.htmlSnapshot) {
      page.previewHtml = frame.htmlSnapshot;
      page.previewBaseHref = frame.baseHref;
    }
  }

  for (const event of clickEvents) {
    const page = getPage(event.pathname);
    const viewportWidth = Math.max(event.context?.viewportWidth ?? 1, 1);
    const documentHeight = Math.max(event.context?.documentHeight ?? event.context?.viewportHeight ?? 1, 1);
    const absoluteY = (event.context?.scrollOffsetY ?? 0) + (event.context?.clickY ?? 0);
    const x = Math.max(0.04, Math.min(0.96, (event.context?.clickX ?? 0) / viewportWidth || 0.5));
    const y = Math.max(0.04, Math.min(0.96, absoluteY / documentHeight || 0.1));
    const selector = event.context?.elementSelector ?? "unknown";
    const label = event.context?.elementText ?? event.context?.productName ?? event.eventType.replaceAll("_", " ");
    const pointKey = `${Math.round(x * 12)}:${Math.round(y * 20)}:${selector}`;
    const current = page.clickPoints.get(pointKey) ?? {
      id: pointKey,
      x,
      y,
      clicks: 0,
      selector,
      label
    };
    current.clicks += 1;
    page.clickPoints.set(pointKey, current);
    page.uniqueSessions.add(event.sessionId ?? event.anonymousId);
  }

  for (const event of scrollEvents) {
    const page = getPage(event.pathname);
    const depth = typeof event.context?.scrollDepth === "number" ? event.context.scrollDepth : 0;
    page.scrollBands.set(depth, (page.scrollBands.get(depth) ?? 0) + 1);
    page.totalScrollDepth += depth;
    page.maxScrollDepth = Math.max(page.maxScrollDepth, depth);
    page.scrollSamples += 1;
    page.uniqueSessions.add(event.sessionId ?? event.anonymousId);
  }

  return [...byPage.values()]
    .map((page) => {
      const totalClicks = [...page.clickPoints.values()].reduce((sum, point) => sum + point.clicks, 0);
      const scrollBands = [25, 50, 75, 100].map((depth) => {
        const sessions = page.scrollBands.get(depth) ?? 0;
        return {
          depth,
          sessions,
          share: page.uniqueSessions.size === 0 ? 0 : sessions / page.uniqueSessions.size
        };
      });

      return {
        pathname: page.pathname,
        totalClicks,
        uniqueSessions: page.uniqueSessions.size,
        averageScrollDepth: page.scrollSamples === 0 ? 0 : page.totalScrollDepth / page.scrollSamples,
        maxScrollDepth: page.maxScrollDepth,
        points: [...page.clickPoints.values()].sort((a, b) => b.clicks - a.clicks).slice(0, 24),
        scrollBands,
        previewHtml: page.previewHtml,
        previewBaseHref: page.previewBaseHref,
        previewNodes: page.previewNodes ?? [
          {
            id: `${page.pathname}-fallback`,
            tag: "main",
            children: [
              {
                id: `${page.pathname}-title`,
                tag: "section",
                text: page.pathname,
                muted: true
              },
              {
                id: `${page.pathname}-summary`,
                tag: "section",
                text: totalClicks > 0 ? `${totalClicks} tracked clicks on this page` : "Preview will appear as soon as a recorded snapshot is received.",
                target: totalClicks > 0
              }
            ]
          }
        ]
      };
    })
    .sort((a, b) => b.totalClicks - a.totalClicks)
    .slice(0, 8);
}

export async function getProjectSessionDiagnostics(projectId: string, limit = 6): Promise<SessionDiagnostic[]> {
  const events = await getProjectEvents(projectId);
  const recordingFramesBySession = await getProjectRecordingFrames(projectId);
  if (events.length > 0) {
    const sessions = buildSessionDiagnosticsFromEvents(events, limit);
    return sessions.map((session) => {
      const recordingFrames = recordingFramesBySession.get(session.sessionId) ?? [];
      if (recordingFrames.length === 0) {
        return session;
      }

      return {
        ...session,
        replay: recordingFrames.slice(-12).map((frame, index) => ({
          id: frame.id || `${session.sessionId}-recording-${index}`,
          timestamp: frame.timestamp,
          title: frame.title || frame.eventType.replaceAll("_", " "),
          subtitle: frame.selector || "Recorded session frame",
          pathname: frame.pathname,
          activeEventType: frame.eventType,
          selector: frame.selector,
          scrollOffsetY: frame.scrollOffsetY,
          documentHeight: frame.documentHeight,
          clickX: frame.clickX,
          clickY: frame.clickY,
          viewportWidth: frame.viewportWidth,
          viewportHeight: frame.viewportHeight,
          htmlSnapshot: frame.htmlSnapshot,
          baseHref: frame.baseHref,
          notes: [
            frame.scrollOffsetY !== undefined ? `Scroll Y: ${Math.round(frame.scrollOffsetY)}px` : "Scroll position unavailable",
            frame.documentHeight !== undefined ? `Document height: ${Math.round(frame.documentHeight)}px` : "Document height unavailable"
          ],
          nodes: session.replay[index]?.nodes ?? []
        }))
      };
    });
  }

  if (recordingFramesBySession.size > 0) {
    return [...recordingFramesBySession.entries()]
      .map(([sessionId, frames]) => ({
        sessionId,
        anonymousId: "",
        startedAt: frames[0]?.timestamp ?? new Date().toISOString(),
        deviceType: frames.some((frame) => (frame.viewportWidth ?? 0) > 0)
          ? (() => {
            const width = frames.at(-1)?.viewportWidth ?? frames[0]?.viewportWidth;
            if (!width || width <= 0) return "unknown" as const;
            if (width <= 768) return "mobile" as const;
            if (width <= 1100) return "tablet" as const;
            return "desktop" as const;
          })()
          : "unknown",
        durationMs: Math.max(0, new Date(frames.at(-1)?.timestamp ?? Date.now()).getTime() - new Date(frames[0]?.timestamp ?? Date.now()).getTime()),
        pages: new Set(frames.map((frame) => frame.pathname)).size,
        rageClicks: frames.filter((frame) => frame.eventType === "rage_click").length,
        deadClicks: frames.filter((frame) => frame.eventType === "dead_click").length,
        jsErrors: frames.filter((frame) => frame.eventType === "js_error").length,
        conversions: frames.filter((frame) => frame.eventType === "conversion").length,
        revenue: 0,
        events: frames.slice(-12).map((frame) => ({
          timestamp: frame.timestamp,
          eventType: frame.eventType,
          pathname: frame.pathname,
          selector: frame.selector
        })),
        replay: frames.slice(-12).map((frame, index) => ({
          id: frame.id || `${sessionId}-recording-${index}`,
          timestamp: frame.timestamp,
          title: frame.title || frame.eventType.replaceAll("_", " "),
          subtitle: frame.selector || "Recorded session frame",
          pathname: frame.pathname,
          activeEventType: frame.eventType,
          selector: frame.selector,
          scrollOffsetY: frame.scrollOffsetY,
          documentHeight: frame.documentHeight,
          clickX: frame.clickX,
          clickY: frame.clickY,
          viewportWidth: frame.viewportWidth,
          viewportHeight: frame.viewportHeight,
          htmlSnapshot: frame.htmlSnapshot,
          baseHref: frame.baseHref,
          notes: [
            frame.scrollOffsetY !== undefined ? `Scroll Y: ${Math.round(frame.scrollOffsetY)}px` : "Scroll position unavailable",
            frame.documentHeight !== undefined ? `Document height: ${Math.round(frame.documentHeight)}px` : "Document height unavailable"
          ],
          nodes: []
        })),
        diagnostics: {
          frictionScore: Math.min(100, frames.filter((frame) => frame.eventType === "rage_click").length * 18 + frames.filter((frame) => frame.eventType === "dead_click").length * 14 + frames.filter((frame) => frame.eventType === "js_error").length * 24),
          intentScore: Math.min(100, frames.filter((frame) => frame.eventType === "add_to_cart").length * 22 + frames.filter((frame) => frame.eventType === "checkout_start").length * 28 + frames.filter((frame) => frame.eventType === "conversion").length * 34),
          summary: "Session reconstructed from dedicated recording chunks.",
          topSignals: [
            `${frames.filter((frame) => frame.eventType === "rage_click").length} rage clicks`,
            `${frames.filter((frame) => frame.eventType === "dead_click").length} dead clicks`,
            `${frames.filter((frame) => frame.eventType === "js_error").length} JS errors`
          ]
        }
      }))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, limit);
  }

  const experiments = await getExperimentsByProject(projectId);
  const fallbackExperiment = experiments.find((experiment) => experiment.status === "running") ?? experiments[0];
  if (!fallbackExperiment) {
    return [];
  }

  return getSessionDiagnostics(fallbackExperiment.id, limit);
}

export async function getProjectSessionDiagnosticById(projectId: string, sessionId: string): Promise<SessionDiagnostic | undefined> {
  const sessions = await getProjectSessionDiagnostics(projectId, 50);
  return sessions.find((session) => session.sessionId === sessionId);
}

export async function getProjectReplayOpportunities(projectId: string): Promise<ReplayOpportunity[]> {
  const sessions = await getProjectSessionDiagnostics(projectId, 4);

  return sessions
    .filter((session) => session.diagnostics)
    .map((session) => {
      const recommendedType: ReplayOpportunity["recommendedType"] =
        (session.diagnostics?.frictionScore ?? 0) >= 60
          ? "funnel"
          : session.deadClicks > 0
            ? "visual"
            : session.rageClicks > 0
              ? "popup"
              : "content";

      return {
        sessionId: session.sessionId,
        frictionScore: session.diagnostics?.frictionScore ?? 0,
        intentScore: session.diagnostics?.intentScore ?? 0,
        summary: session.diagnostics?.summary ?? "Session needs review.",
        opportunityTitle:
          (session.diagnostics?.frictionScore ?? 0) >= 60
            ? "Reduce friction on the highest-friction step"
            : (session.diagnostics?.intentScore ?? 0) >= 50
              ? "Push a stronger conversion moment for high-intent visitors"
              : "Clarify the primary value proposition",
        recommendedType,
        nextAction:
          (session.diagnostics?.frictionScore ?? 0) >= 60
            ? "Open replay, inspect the failing step, and ship a guided funnel test."
            : "Review the interaction pattern, then approve the generated test."
      };
    })
    .sort((a, b) => b.frictionScore - a.frictionScore);
}

export async function getProjectBehaviorInsights(projectId: string) {
  const events = [...await getProjectEvents(projectId)].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const sessions = await getProjectSessionDiagnostics(projectId, 8);

  const topInteractions = events.length > 0
    ? [...events
      .filter((event) => clickLikeEventTypes.has(event.eventType))
      .reduce((acc, event) => {
        const selector = event.context?.elementSelector ?? "";
        const label = event.context?.elementText ?? event.context?.productName ?? event.context?.pageTitle ?? event.eventType.replaceAll("_", " ");
        const key = `${event.pathname}__${selector}__${label}__${event.eventType}`;
        const current = acc.get(key) ?? {
          key,
          label,
          selector: selector || "No selector captured",
          pathname: event.pathname,
          eventType: event.eventType,
          totalClicks: 0,
          uniqueSessions: new Set<string>(),
          lastSeenAt: event.timestamp,
          goal:
            event.eventType === "purchase" ? "Revenue"
              : event.eventType === "conversion" ? "Conversion"
                : event.eventType === "checkout_start" ? "Checkout"
                  : event.eventType === "add_to_cart" ? "Cart"
                    : event.eventType === "recommendation_click" ? "Merchandising"
                      : event.eventType === "cta_click" ? "CTA"
                        : "Engagement"
        };

        current.totalClicks += 1;
        current.uniqueSessions.add(event.sessionId ?? event.anonymousId);
        if (event.timestamp > current.lastSeenAt) {
          current.lastSeenAt = event.timestamp;
        }
        acc.set(key, current);
        return acc;
      }, new Map<string, {
        key: string;
        label: string;
        selector: string;
        pathname: string;
        eventType: EventRecord["eventType"];
        totalClicks: number;
        uniqueSessions: Set<string>;
        lastSeenAt: string;
        goal: string;
      }>())
      .values()]
      .map((item) => ({
        ...item,
        uniqueSessions: item.uniqueSessions.size
      }))
      .sort((a, b) => b.totalClicks - a.totalClicks)
      .slice(0, 6)
    : sessions.flatMap((session) =>
      session.events
        .filter((event) => clickLikeEventTypes.has(event.eventType))
        .map((event, index) => ({
          key: `${session.sessionId}-${index}`,
          label: event.label ?? event.eventType.replaceAll("_", " "),
          selector: event.selector ?? "No selector captured",
          pathname: event.pathname,
          eventType: event.eventType,
          totalClicks: 1,
          uniqueSessions: 1,
          lastSeenAt: event.timestamp,
          goal: event.eventType === "conversion" ? "Conversion" : "Engagement"
        }))
    ).slice(0, 6);

  const topPages = events.length > 0
    ? [...events.reduce((acc, event) => {
      const current = acc.get(event.pathname) ?? {
        pathname: event.pathname,
        visits: 0,
        clicks: 0,
        conversions: 0,
        addToCart: 0,
        revenue: 0
      };

      if (event.eventType === "page_view") current.visits += 1;
      if (clickLikeEventTypes.has(event.eventType)) current.clicks += 1;
      if (event.eventType === "conversion") current.conversions += 1;
      if (event.eventType === "add_to_cart") current.addToCart += 1;
      if (event.eventType === "purchase") current.revenue += typeof event.context?.revenue === "number" ? event.context.revenue : 0;

      acc.set(event.pathname, current);
      return acc;
    }, new Map<string, {
      pathname: string;
      visits: number;
      clicks: number;
      conversions: number;
      addToCart: number;
      revenue: number;
    }>()).values()]
      .sort((a, b) => (b.clicks + b.conversions) - (a.clicks + a.conversions))
      .slice(0, 6)
    : sessions.map((session) => ({
      pathname: session.events[0]?.pathname ?? "/",
      visits: 1,
      clicks: session.events.filter((event) => clickLikeEventTypes.has(event.eventType)).length,
      conversions: session.conversions,
      addToCart: session.events.filter((event) => event.eventType === "add_to_cart").length,
      revenue: session.revenue
    })).slice(0, 6);

  const eventFeed = (events.length > 0 ? events.slice(0, 12).map((event) => ({
    id: event.id,
    timestamp: event.timestamp,
    headline: `${event.eventType.replaceAll("_", " ")} on ${event.pathname}`,
    detail: [
      event.context?.elementText ?? event.context?.productName ?? undefined,
      event.context?.device ? `Device ${event.context.device}` : undefined,
      event.context?.source ? `Source ${event.context.source}` : undefined
    ].filter(Boolean).join(" · "),
    goal:
      event.eventType === "purchase" ? "Revenue"
        : event.eventType === "conversion" ? "Conversion"
          : event.eventType === "checkout_start" ? "Checkout"
            : event.eventType === "add_to_cart" ? "Cart"
              : "Behavior"
  })) : sessions.flatMap((session) => session.events.map((event, index) => ({
    id: `${session.sessionId}-${index}`,
    timestamp: event.timestamp,
    headline: `${event.eventType.replaceAll("_", " ")} on ${event.pathname}`,
    detail: [event.label, event.selector].filter(Boolean).join(" · "),
    goal: event.eventType === "conversion" ? "Conversion" : "Behavior"
  })))).slice(0, 12);

  return {
    totals: {
      sessions: sessions.length,
      trackedPages: new Set(topPages.map((page) => page.pathname)).size,
      trackedClicks: topInteractions.reduce((sum, item) => sum + item.totalClicks, 0),
      conversionSessions: sessions.filter((session) => session.conversions > 0).length
    },
    topInteractions,
    topPages,
    eventFeed
  };
}

export async function getDetailedExperimentReport(experimentId: string, locale: Locale = "fr"): Promise<ExperimentReport | undefined> {
  const experiment = await getExperimentById(experimentId);
  if (!experiment) {
    return undefined;
  }

  const stats = await getExperimentStats(experimentId);
  return buildExperimentReport(experiment, stats, locale);
}

async function getExperimentEvents(experimentId: string): Promise<EventRecord[]> {
  if (!hasSupabaseEnv()) {
    const store = await readDevStore();
    return store.events.filter((event) => event.experimentId === experimentId);
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("events").select("*").eq("experiment_id", experimentId).order("created_at", { ascending: false });

  return (data ?? []).map((event: any) => ({
    id: event.id,
    projectId: event.project_id,
    anonymousId: event.anonymous_id,
    sessionId: event.session_id ?? undefined,
    experimentId: event.experiment_id ?? "__sdk__",
    variantKey: event.variant_key,
    eventType: event.event_type,
    pathname: event.pathname,
    timestamp: event.created_at,
    context: event.context ?? undefined
  }));
}

export async function getSessionDiagnostics(experimentId: string, limit = 6): Promise<SessionDiagnostic[]> {
  const events = await getExperimentEvents(experimentId);
  if (events.length === 0 && demoSessionDiagnostics[experimentId]) {
    return demoSessionDiagnostics[experimentId].slice(0, limit);
  }
  return buildSessionDiagnosticsFromEvents(events, limit);
}

export async function getReplayOpportunities(experimentId: string): Promise<ReplayOpportunity[]> {
  const experiment = await getExperimentById(experimentId);
  if (!experiment) {
    return [];
  }

  return getProjectReplayOpportunities(experiment.projectId);
}

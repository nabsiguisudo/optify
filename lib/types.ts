export type Platform = "shopify" | "webflow" | "woocommerce" | "salesforce" | "custom";
export type ExperimentStatus = "draft" | "running" | "paused";
export type WorkflowState = "draft" | "ready_for_review" | "approved" | "scheduled" | "running" | "paused";
export type CampaignPriority = "low" | "medium" | "high";
export type ExperimentType = "visual" | "custom_code" | "popup" | "recommendation";
export type EventType =
  | "session_start"
  | "page_view"
  | "page_exit"
  | "click"
  | "cta_click"
  | "outbound_click"
  | "rage_click"
  | "dead_click"
  | "conversion"
  | "scroll_depth"
  | "time_on_page"
  | "form_start"
  | "field_focus"
  | "field_blur"
  | "form_submit"
  | "form_error"
  | "form_abandon"
  | "product_view"
  | "search_submitted"
  | "add_to_cart"
  | "remove_from_cart"
  | "checkout_start"
  | "purchase"
  | "recommendation_impression"
  | "recommendation_click"
  | "video_start"
  | "video_progress"
  | "video_complete"
  | "js_error"
  | "experiment_impression"
  | "performance";
export type ChangeType = "text" | "cta" | "visibility" | "style";
export type EditorMode = "visual" | "custom_code";
export type PopupTrigger = "time_on_page" | "scroll_depth" | "exit_intent" | "cta_click";
export type PopupPlacement = "modal_center" | "slide_in_right" | "sticky_bottom_bar";
export type RecommendationStrategy = "trending" | "frequently_bought_together" | "high_margin" | "personalized";
export type RecommendationPlacement = "pdp_sidebar" | "cart_drawer" | "checkout" | "homepage";
export type RecommendationLayout = "grid" | "carousel" | "stack";
export type RecommendationInjectionMode = "replace" | "before" | "after" | "append";
export type TargetingCombinator = "and" | "or";
export type TargetingAttribute =
  | "country"
  | "region"
  | "city"
  | "device"
  | "device_family"
  | "browser"
  | "os"
  | "language"
  | "source"
  | "medium"
  | "campaign"
  | "term"
  | "content"
  | "referrer"
  | "page_path"
  | "page_url"
  | "page_type"
  | "query_string"
  | "visitor_type"
  | "pages_in_session"
  | "viewport_width"
  | "viewport_height";
export type TargetingOperator =
  | "is"
  | "is_not"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "matches_regex"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "between"
  | "exists"
  | "not_exists";

export interface AudienceRule {
  attribute: "device" | "location" | "source" | "intent";
  operator: "is" | "contains";
  value: string;
}

export interface ExperimentTargetingCondition {
  id: string;
  kind: "condition";
  attribute: TargetingAttribute;
  operator: TargetingOperator;
  value?: string;
  secondValue?: string;
}

export interface ExperimentTargetingGroup {
  id: string;
  kind: "group";
  combinator: TargetingCombinator;
  children: ExperimentTargetingNode[];
}

export type ExperimentTargetingNode = ExperimentTargetingCondition | ExperimentTargetingGroup;

export interface RecommendationConfig {
  strategy: RecommendationStrategy;
  placement: RecommendationPlacement;
  maxProducts: number;
  title?: string;
  algorithmNotes?: string;
  fallbackStrategy?: "best_sellers" | "recently_viewed" | "manual";
  trigger?: "page_view" | "add_to_cart" | "checkout_start";
  audienceIntent?: "all" | "new" | "returning" | "high_intent";
  sourceMode?: "auto" | "manual_products" | "manual_collections";
  selectedProductIds?: string[];
  selectedCollectionIds?: string[];
  targetUrl?: string;
  placementSelector?: string;
  injectionMode?: RecommendationInjectionMode;
  layout?: RecommendationLayout;
  cardTitleLines?: number;
  imageRatio?: "portrait" | "square" | "landscape";
  spacingPx?: number;
  paddingPx?: number;
  showPrice?: boolean;
  showCompareAtPrice?: boolean;
  showCta?: boolean;
  ctaLabel?: string;
}

export interface ShopifyCatalogItem {
  id: string;
  title: string;
  handle: string;
  image?: string;
  price?: string;
}

export interface ShopifyCollectionItem {
  id: string;
  title: string;
  handle: string;
  image?: string;
}

export interface PopupConfig {
  title: string;
  body: string;
  cta: string;
  trigger: PopupTrigger;
  placement: PopupPlacement;
  delayMs: number;
  frequencyCap: "once_per_session" | "once_per_day" | "always";
  theme: "light" | "dark" | "accent";
  goal: "conversion" | "lead_capture" | "click";
}

export interface User {
  id: string;
  email: string;
  fullName: string;
}

export interface Project {
  id: string;
  name: string;
  domain: string;
  platform: Platform;
  publicKey: string;
  workspaceId: string;
  scriptUrl: string;
}

export interface VariantChange {
  selector: string;
  type: ChangeType;
  value: string;
}

export interface Variant {
  id: string;
  experimentId: string;
  name: string;
  key: string;
  allocation: number;
  changes: VariantChange[];
  isControl?: boolean;
}

export interface Experiment {
  id: string;
  projectId: string;
  name: string;
  hypothesis: string;
  pagePattern: string;
  trafficSplit: number;
  status: ExperimentStatus;
  workflowState?: WorkflowState;
  scheduledFor?: string;
  priority?: CampaignPriority;
  exclusionGroup?: string;
  type?: ExperimentType;
  primaryMetric: EventType;
  createdAt: string;
  editorMode?: EditorMode;
  customCode?: string;
  audienceRules?: AudienceRule[];
  targeting?: ExperimentTargetingGroup;
  popupConfig?: PopupConfig;
  recommendationConfig?: RecommendationConfig;
  variants: Variant[];
}

export interface EventContext {
  sessionId?: string;
  pageType?: string;
  templateName?: string;
  shopDomain?: string;
  storefrontDomain?: string;
  themeId?: string;
  themeName?: string;
  shopifyEventName?: string;
  referrer?: string;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  pageUrl?: string;
  queryString?: string;
  device?: string;
  deviceFamily?: string;
  browser?: string;
  os?: string;
  language?: string;
  visitorType?: string;
  country?: string;
  region?: string;
  city?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  pageTitle?: string;
  elementSelector?: string;
  elementText?: string;
  href?: string;
  formId?: string;
  fieldName?: string;
  fieldType?: string;
  recommendationId?: string;
  recommendationPlacement?: string;
  productId?: string;
  productName?: string;
  sku?: string;
  currency?: string;
  value?: number;
  revenue?: number;
  quantity?: number;
  durationMs?: number;
  scrollDepth?: number;
  pagesInSession?: number;
  clickX?: number;
  clickY?: number;
  scrollOffsetY?: number;
  documentHeight?: number;
  isTrusted?: boolean;
  errorMessage?: string;
  errorStack?: string;
  errorSource?: string;
  replaySnapshot?: string;
  replayHtmlSnapshot?: string;
  replayBaseHref?: string;
  videoId?: string;
  videoTitle?: string;
  videoProgress?: number;
  searchQuery?: string;
  recommendationStrategy?: string;
  performanceTiming?: Record<string, number>;
  custom?: Record<string, string | number | boolean | null>;
}

export interface ShopifyThemeSummary {
  id: string;
  name: string;
  role: string;
}

export interface ShopifyConnection {
  projectId: string;
  status: "not_connected" | "connected" | "needs_attention";
  shopDomain: string;
  shopName?: string;
  storefrontDomain?: string;
  planName?: string;
  currencyCode?: string;
  primaryLocale?: string;
  connectedAt?: string;
  lastSyncedAt?: string;
  scopes: string[];
  pageTypesTracked: string[];
  activeTheme?: ShopifyThemeSummary;
  themes: ShopifyThemeSummary[];
  installMode: "manual_token" | "oauth_planned";
}

export interface ShopifyInstallAssets {
  scriptTag: string;
  liquidSnippet: string;
  customPixelCode: string;
}

export interface EventRecord {
  id: string;
  clientEventId?: string;
  projectId?: string;
  anonymousId: string;
  sessionId?: string;
  experimentId: string;
  variantKey: string;
  eventType: EventType;
  pathname: string;
  timestamp: string;
  context?: EventContext;
}

export interface VariantStats {
  variantKey: string;
  visitors: number;
  sessions: number;
  conversions: number;
  clicks: number;
  ctaClicks: number;
  addToCart: number;
  checkoutStarts: number;
  purchases: number;
  revenue: number;
  avgScrollDepth: number;
  avgTimeOnPageMs: number;
  conversionRate: number;
  uplift: number;
  confidence: number;
  confidenceIntervalLow?: number;
  confidenceIntervalHigh?: number;
  pValue?: number;
  probabilityToBeatControl?: number;
  expectedLoss?: number;
  sampleRatioMismatch?: number;
  isWinner: boolean;
}

export interface ExperimentKpis {
  sessions: number;
  uniqueVisitors: number;
  pageViews: number;
  pagesPerSession: number;
  avgTimeOnPageMs: number;
  avgScrollDepth: number;
  bounceRate: number;
  clicks: number;
  ctaClicks: number;
  outboundClicks: number;
  rageClicks: number;
  deadClicks: number;
  conversions: number;
  addToCart: number;
  removeFromCart: number;
  checkoutStarts: number;
  purchases: number;
  revenue: number;
  averageOrderValue: number;
  recommendationImpressions: number;
  recommendationClicks: number;
  recommendationCtr: number;
  formStarts: number;
  formSubmits: number;
  formErrors: number;
  formAbandons: number;
  videoStarts: number;
  videoCompletions: number;
  jsErrors: number;
}

export interface ExperimentTimeSeriesPoint {
  date: string;
  visitors: number;
  sessions: number;
  pageViews: number;
  clicks: number;
  ctaClicks: number;
  conversions: number;
  addToCart: number;
  checkoutStarts: number;
  purchases: number;
  revenue: number;
  recommendationClicks: number;
  recommendationImpressions: number;
  rageClicks: number;
  formErrors: number;
  jsErrors: number;
}

export interface SessionDiagnosticEvent {
  timestamp: string;
  eventType: EventType;
  pathname: string;
  label?: string;
  selector?: string;
  value?: string;
  notes?: string[];
}

export interface SessionReplayNode {
  id: string;
  tag: string;
  text?: string;
  role?: string;
  target?: boolean;
  muted?: boolean;
  children?: SessionReplayNode[];
}

export interface SessionReplayFrame {
  id: string;
  timestamp: string;
  title: string;
  subtitle: string;
  pathname: string;
  activeEventType: EventType;
  selector?: string;
  scrollOffsetY?: number;
  documentHeight?: number;
  clickX?: number;
  clickY?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  notes: string[];
  nodes: SessionReplayNode[];
  htmlSnapshot?: string;
  baseHref?: string;
}

export interface SessionDiagnostic {
  sessionId: string;
  anonymousId: string;
  startedAt: string;
  deviceType: "desktop" | "tablet" | "mobile" | "unknown";
  durationMs: number;
  pages: number;
  rageClicks: number;
  deadClicks: number;
  jsErrors: number;
  conversions: number;
  revenue: number;
  events: SessionDiagnosticEvent[];
  replay: SessionReplayFrame[];
  diagnostics?: {
    frictionScore: number;
    intentScore: number;
    summary: string;
    topSignals: string[];
  };
}

export interface ExperimentStats {
  experimentId: string;
  totalVisitors: number;
  totalSessions: number;
  variants: VariantStats[];
  winner?: string;
  roi: {
    baselineRevenue: number;
    projectedRevenue: number;
    estimatedRevenueUplift: number;
    topVariant?: string;
  };
  kpis: ExperimentKpis;
  timeline: ExperimentTimeSeriesPoint[];
}

export interface FunnelStep {
  key: string;
  label: string;
  users: number;
  rateFromPrevious: number;
  dropoff: number;
}

export interface FunnelOverview {
  name: string;
  totalUsers: number;
  steps: FunnelStep[];
}

export interface SegmentSnapshot {
  key: string;
  label: string;
  visitors: number;
  share: number;
  conversionRate: number;
  revenuePerVisitor: number;
  engagementScore: number;
  trend: "up" | "down" | "flat";
  note: string;
}

export interface PeriodMetricComparison {
  current: number;
  previous: number;
  absoluteDelta: number;
  relativeDelta: number;
}

export interface PeriodComparison {
  currentLabel: string;
  previousLabel: string;
  metrics: {
    visitors: PeriodMetricComparison;
    conversions: PeriodMetricComparison;
    revenue: PeriodMetricComparison;
    addToCart: PeriodMetricComparison;
    recommendationCtr: PeriodMetricComparison;
  };
}

export interface GlobalAnalytics {
  kpis: ExperimentKpis;
  timeline: ExperimentTimeSeriesPoint[];
  funnel: FunnelOverview;
  segments: SegmentSnapshot[];
  periodComparison: PeriodComparison;
  experimentsSummary: {
    running: number;
    draft: number;
    paused: number;
    winners: number;
  };
  businessImpact: {
    cumulativeRevenueUplift: number;
    projectedMonthlyImpact: number;
    launchReadyRevenuePotential: number;
  };
}

export interface LaunchCenterItem {
  id: string;
  title: string;
  kind: "experiment" | "ai_suggestion";
  state: WorkflowState;
  metric: string;
  target: string;
  rationale: string;
  href: string;
  risk: "low" | "medium" | "high";
  scheduledFor?: string;
  priority?: CampaignPriority;
  exclusionGroup?: string;
}

export interface LaunchAuditEntry {
  id: string;
  itemId: string;
  action: string;
  timestamp: string;
  note: string;
  actor?: string;
}

export interface LaunchCenterSnapshot {
  counts: {
    draft: number;
    readyForReview: number;
    approved: number;
    scheduled: number;
    running: number;
    paused: number;
  };
  items: LaunchCenterItem[];
  auditTrail: LaunchAuditEntry[];
}

export interface AiSuggestion {
  type: ExperimentType | "funnel" | "pricing" | "content" | "layout";
  title: string;
  hypothesis: string;
  expectedImpact: "low" | "medium" | "high";
  primaryMetric?: EventType;
  targetSelector?: string;
  approvalState?: "draft" | "ready_for_review" | "approved";
  changes: string[];
}

export interface AiCopilotInsight {
  id: string;
  title: string;
  narrative: string;
  segment: string;
  expectedImpact: "low" | "medium" | "high";
  recommendedType: AiSuggestion["type"];
  primaryMetric: EventType;
  risk: "low" | "medium" | "high";
  actionLabel: string;
}

export interface ReplayOpportunity {
  sessionId: string;
  frictionScore: number;
  intentScore: number;
  summary: string;
  opportunityTitle: string;
  recommendedType: AiSuggestion["type"];
  nextAction: string;
}

export interface PageHeatmapPoint {
  id: string;
  x: number;
  y: number;
  clicks: number;
  selector: string;
  label: string;
}

export interface PageScrollHeatmapBand {
  depth: number;
  sessions: number;
  share: number;
}

export interface PageHeatmap {
  pathname: string;
  totalClicks: number;
  uniqueSessions: number;
  averageScrollDepth: number;
  maxScrollDepth: number;
  points: PageHeatmapPoint[];
  scrollBands: PageScrollHeatmapBand[];
  previewNodes?: SessionReplayNode[];
  previewHtml?: string;
  previewBaseHref?: string;
}

export interface SessionRecordingFrame {
  id: string;
  timestamp: string;
  pathname: string;
  eventType: EventType;
  title?: string;
  selector?: string;
  scrollOffsetY?: number;
  documentHeight?: number;
  clickX?: number;
  clickY?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  htmlSnapshot?: string;
  baseHref?: string;
}

export interface SessionRecordingChunk {
  id: string;
  projectId: string;
  anonymousId: string;
  sessionId: string;
  startedAt: string;
  endedAt: string;
  chunkIndex: number;
  frameCount: number;
  frames: SessionRecordingFrame[];
}

export interface ExperimentReport {
  executiveSummary: string;
  winnerNarrative: string;
  insights: string[];
  nextActions: string[];
  audienceInsights: string[];
  risks: string[];
}

export interface AudienceInsight {
  segment: string;
  share: number;
  conversionRate: number;
  bestVariant: string;
  note: string;
}

export interface ProductRecommendation {
  id: string;
  title: string;
  reason: string;
  price: string;
  upliftHint: string;
}

export interface TrackMetadata extends EventContext {
  experimentId?: string;
  variantKey?: string;
}

export interface SdkHealthReport {
  id: string;
  projectId: string;
  pathname: string;
  origin: string;
  sdkVersion: string;
  loadedAt: string;
  anonymousId?: string;
  sessionId?: string;
  userAgent?: string;
  capabilities: {
    beacon: boolean;
    fetch: boolean;
    intersectionObserver: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
  };
}

export interface SdkDiagnosticsSnapshot {
  projectId: string;
  status: "healthy" | "warning" | "not_installed";
  transport: {
    recentEventCount: number;
    duplicateRate: number;
    errorRate: number;
    lastEventAt?: string;
  };
  eventTypes: Array<{
    type: EventType;
    count: number;
  }>;
  recentEvents: EventRecord[];
  latestHealth?: SdkHealthReport;
}

export interface InstallationDiagnostic {
  projectId: string;
  projectName: string;
  scriptUrl: string;
  status: "healthy" | "warning" | "not_installed";
  checks: Array<{
    key: string;
    label: string;
    status: "pass" | "warn" | "fail";
    detail: string;
  }>;
  latestHealth?: SdkHealthReport;
  recentPages: string[];
  recentEventCount: number;
  liveEventTypes?: Array<{
    type: EventType;
    count: number;
  }>;
}

export interface OnboardingChecklistItem {
  key: string;
  title: string;
  body: string;
  status: "complete" | "current" | "locked";
  href?: string;
}

export interface OnboardingProgress {
  projectId: string;
  completionRatio: number;
  completedSteps: number;
  totalSteps: number;
  currentStepLabel: string;
  checklist: OnboardingChecklistItem[];
}

declare global {
  interface Window {
    __OPTIFY_SHOPIFY_CONTEXT?: {
      shopDomain?: string;
      storefrontDomain?: string;
      themeId?: string;
      themeName?: string;
      pageType?: string;
      templateName?: string;
      country?: string;
      region?: string;
      city?: string;
      product?: {
        id?: string;
        title?: string;
        handle?: string;
      } | null;
      collection?: {
        id?: string;
        title?: string;
        handle?: string;
      } | null;
      cartCurrency?: string | null;
    };
    optify?: {
      track: (eventType: EventType, metadata?: TrackMetadata) => void;
      debug?: {
        queueSize: number;
        lastFlushAt: string | null;
        lastError: string | null;
        assignments: Record<string, string>;
        activeExperiments: string[];
      };
    };
  }
}

export {};

import type {
  EventRecord,
  ExperimentKpis,
  ExperimentStats,
  ExperimentTimeSeriesPoint,
  FunnelOverview,
  GlobalAnalytics,
  PeriodMetricComparison,
  SegmentSnapshot,
  Variant,
  VariantStats
} from "@/lib/types";

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countByType(events: EventRecord[], type: EventRecord["eventType"]) {
  return events.filter((event) => event.eventType === type).length;
}

function sumNumberContext(events: EventRecord[], key: keyof NonNullable<EventRecord["context"]>) {
  return events.reduce((sum, event) => {
    const value = event.context?.[key];
    return typeof value === "number" ? sum + value : sum;
  }, 0);
}

function erf(x: number) {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function normalCdf(x: number) {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function zScoreForConfidence(level = 0.95) {
  return level >= 0.95 ? 1.96 : 1.64;
}

function wilsonInterval(successes: number, trials: number, level = 0.95) {
  if (trials === 0) {
    return { low: 0, high: 0 };
  }

  const z = zScoreForConfidence(level);
  const p = successes / trials;
  const denominator = 1 + (z * z) / trials;
  const center = p + (z * z) / (2 * trials);
  const margin = z * Math.sqrt((p * (1 - p)) / trials + (z * z) / (4 * trials * trials));

  return {
    low: Math.max(0, (center - margin) / denominator),
    high: Math.min(1, (center + margin) / denominator)
  };
}

function computeTwoProportionConfidence(
  controlVisitors: number,
  controlConversions: number,
  variantVisitors: number,
  variantConversions: number
) {
  if (controlVisitors === 0 || variantVisitors === 0) return 0;
  const p1 = controlConversions / controlVisitors;
  const p2 = variantConversions / variantVisitors;
  const pooled = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
  const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / controlVisitors + 1 / variantVisitors));
  if (standardError === 0) return 0;
  const z = Math.abs((p2 - p1) / standardError);
  const pValue = 2 * (1 - normalCdf(z));
  return Math.max(0, Math.min(0.999, 1 - pValue));
}

function computeTwoProportionStats(
  controlVisitors: number,
  controlConversions: number,
  variantVisitors: number,
  variantConversions: number
) {
  if (controlVisitors === 0 || variantVisitors === 0) {
    return { confidence: 0, pValue: 1, zScore: 0 };
  }

  const p1 = controlConversions / controlVisitors;
  const p2 = variantConversions / variantVisitors;
  const pooled = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
  const standardError = Math.sqrt(pooled * (1 - pooled) * (1 / controlVisitors + 1 / variantVisitors));
  if (standardError === 0) {
    return { confidence: 0, pValue: 1, zScore: 0 };
  }

  const zScore = (p2 - p1) / standardError;
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore)));
  return {
    confidence: Math.max(0, Math.min(0.999, 1 - pValue)),
    pValue,
    zScore
  };
}

function computeSampleRatioMismatch(observedSessions: number, totalSessions: number, expectedAllocation: number) {
  if (totalSessions === 0) return 0;
  const expected = totalSessions * (expectedAllocation / 100);
  if (expected === 0) return 0;
  return Math.abs(observedSessions - expected) / expected;
}

function toDateKey(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toISOString().slice(0, 10);
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function endOfDay(date: Date) {
  const next = new Date(date);
  next.setUTCHours(23, 59, 59, 999);
  return next;
}

function buildDateRange(days: number, from?: string, to?: string) {
  const end = to ? endOfDay(new Date(to)) : endOfDay(new Date());
  const start = from ? startOfDay(new Date(from)) : startOfDay(new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000));
  return { start, end };
}

function buildTimeline(events: EventRecord[], start: Date, end: Date): ExperimentTimeSeriesPoint[] {
  const buckets = new Map<string, EventRecord[]>();
  const cursor = new Date(start);

  while (cursor <= end) {
    buckets.set(toDateKey(cursor), []);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  events.forEach((event) => {
    const key = toDateKey(event.timestamp);
    if (buckets.has(key)) {
      buckets.get(key)?.push(event);
    }
  });

  return [...buckets.entries()].map(([date, dayEvents]) => {
    const sessions = new Set(dayEvents.map((event) => event.sessionId).filter(Boolean) as string[]);
    const visitors = new Set(dayEvents.map((event) => event.anonymousId));
    return {
      date,
      visitors: visitors.size,
      sessions: sessions.size,
      pageViews: countByType(dayEvents, "page_view"),
      clicks: countByType(dayEvents, "click"),
      ctaClicks: countByType(dayEvents, "cta_click"),
      conversions: countByType(dayEvents, "conversion"),
      addToCart: countByType(dayEvents, "add_to_cart"),
      checkoutStarts: countByType(dayEvents, "checkout_start"),
      purchases: countByType(dayEvents, "purchase"),
      revenue: sumNumberContext(dayEvents.filter((event) => event.eventType === "purchase"), "revenue"),
      recommendationClicks: countByType(dayEvents, "recommendation_click"),
      recommendationImpressions: countByType(dayEvents, "recommendation_impression"),
      rageClicks: countByType(dayEvents, "rage_click"),
      formErrors: countByType(dayEvents, "form_error"),
      jsErrors: countByType(dayEvents, "js_error")
    };
  });
}

export function emptyExperimentKpis(): ExperimentKpis {
  return {
    sessions: 0,
    uniqueVisitors: 0,
    pageViews: 0,
    pagesPerSession: 0,
    avgTimeOnPageMs: 0,
    avgScrollDepth: 0,
    bounceRate: 0,
    clicks: 0,
    ctaClicks: 0,
    outboundClicks: 0,
    rageClicks: 0,
    deadClicks: 0,
    conversions: 0,
    addToCart: 0,
    removeFromCart: 0,
    checkoutStarts: 0,
    purchases: 0,
    revenue: 0,
    averageOrderValue: 0,
    recommendationImpressions: 0,
    recommendationClicks: 0,
    recommendationCtr: 0,
    formStarts: 0,
    formSubmits: 0,
    formErrors: 0,
    formAbandons: 0,
    videoStarts: 0,
    videoCompletions: 0,
    jsErrors: 0
  };
}

export function aggregateKpis(items: ExperimentKpis[]): ExperimentKpis {
  if (items.length === 0) {
    return emptyExperimentKpis();
  }

  const sum = items.reduce((acc, item) => ({
    sessions: acc.sessions + item.sessions,
    uniqueVisitors: acc.uniqueVisitors + item.uniqueVisitors,
    pageViews: acc.pageViews + item.pageViews,
    pagesPerSession: 0,
    avgTimeOnPageMs: acc.avgTimeOnPageMs + item.avgTimeOnPageMs * item.sessions,
    avgScrollDepth: acc.avgScrollDepth + item.avgScrollDepth * item.sessions,
    bounceRate: acc.bounceRate + item.bounceRate * item.sessions,
    clicks: acc.clicks + item.clicks,
    ctaClicks: acc.ctaClicks + item.ctaClicks,
    outboundClicks: acc.outboundClicks + item.outboundClicks,
    rageClicks: acc.rageClicks + item.rageClicks,
    deadClicks: acc.deadClicks + item.deadClicks,
    conversions: acc.conversions + item.conversions,
    addToCart: acc.addToCart + item.addToCart,
    removeFromCart: acc.removeFromCart + item.removeFromCart,
    checkoutStarts: acc.checkoutStarts + item.checkoutStarts,
    purchases: acc.purchases + item.purchases,
    revenue: acc.revenue + item.revenue,
    averageOrderValue: 0,
    recommendationImpressions: acc.recommendationImpressions + item.recommendationImpressions,
    recommendationClicks: acc.recommendationClicks + item.recommendationClicks,
    recommendationCtr: 0,
    formStarts: acc.formStarts + item.formStarts,
    formSubmits: acc.formSubmits + item.formSubmits,
    formErrors: acc.formErrors + item.formErrors,
    formAbandons: acc.formAbandons + item.formAbandons,
    videoStarts: acc.videoStarts + item.videoStarts,
    videoCompletions: acc.videoCompletions + item.videoCompletions,
    jsErrors: acc.jsErrors + item.jsErrors
  }), emptyExperimentKpis());

  return {
    ...sum,
    pagesPerSession: sum.sessions === 0 ? 0 : sum.pageViews / sum.sessions,
    avgTimeOnPageMs: sum.sessions === 0 ? 0 : sum.avgTimeOnPageMs / sum.sessions,
    avgScrollDepth: sum.sessions === 0 ? 0 : sum.avgScrollDepth / sum.sessions,
    bounceRate: sum.sessions === 0 ? 0 : sum.bounceRate / sum.sessions,
    averageOrderValue: sum.purchases === 0 ? 0 : sum.revenue / sum.purchases,
    recommendationCtr: sum.recommendationImpressions === 0 ? 0 : sum.recommendationClicks / sum.recommendationImpressions
  };
}

export function aggregateTimeline(timelines: ExperimentTimeSeriesPoint[][]): ExperimentTimeSeriesPoint[] {
  const buckets = new Map<string, ExperimentTimeSeriesPoint>();

  for (const timeline of timelines) {
    for (const point of timeline) {
      const current = buckets.get(point.date) ?? {
        date: point.date,
        visitors: 0,
        sessions: 0,
        pageViews: 0,
        clicks: 0,
        ctaClicks: 0,
        conversions: 0,
        addToCart: 0,
        checkoutStarts: 0,
        purchases: 0,
        revenue: 0,
        recommendationClicks: 0,
        recommendationImpressions: 0,
        rageClicks: 0,
        formErrors: 0,
        jsErrors: 0
      };

      buckets.set(point.date, {
        date: point.date,
        visitors: current.visitors + point.visitors,
        sessions: current.sessions + point.sessions,
        pageViews: current.pageViews + point.pageViews,
        clicks: current.clicks + point.clicks,
        ctaClicks: current.ctaClicks + point.ctaClicks,
        conversions: current.conversions + point.conversions,
        addToCart: current.addToCart + point.addToCart,
        checkoutStarts: current.checkoutStarts + point.checkoutStarts,
        purchases: current.purchases + point.purchases,
        revenue: current.revenue + point.revenue,
        recommendationClicks: current.recommendationClicks + point.recommendationClicks,
        recommendationImpressions: current.recommendationImpressions + point.recommendationImpressions,
        rageClicks: current.rageClicks + point.rageClicks,
        formErrors: current.formErrors + point.formErrors,
        jsErrors: current.jsErrors + point.jsErrors
      });
    }
  }

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function compareMetric(current: number, previous: number): PeriodMetricComparison {
  const absoluteDelta = current - previous;
  return {
    current,
    previous,
    absoluteDelta,
    relativeDelta: previous === 0 ? (current > 0 ? 1 : 0) : absoluteDelta / previous
  };
}

export function buildGlobalAnalytics(statsItems: ExperimentStats[]): GlobalAnalytics {
  const kpis = aggregateKpis(statsItems.map((item) => item.kpis));
  const timeline = aggregateTimeline(statsItems.map((item) => item.timeline));
  const totalVisitors = statsItems.reduce((sum, item) => sum + item.totalVisitors, 0);
  const totalAddToCart = statsItems.reduce((sum, item) => sum + item.kpis.addToCart, 0);
  const totalCheckout = statsItems.reduce((sum, item) => sum + item.kpis.checkoutStarts, 0);
  const totalPurchases = statsItems.reduce((sum, item) => sum + item.kpis.purchases, 0);

  const funnel: FunnelOverview = {
    name: "Global journey",
    totalUsers: totalVisitors,
    steps: [
      { key: "visitors", label: "Visitors", users: totalVisitors, rateFromPrevious: 1, dropoff: 0 },
      {
        key: "add_to_cart",
        label: "Add to cart",
        users: totalAddToCart,
        rateFromPrevious: totalVisitors === 0 ? 0 : totalAddToCart / totalVisitors,
        dropoff: Math.max(totalVisitors - totalAddToCart, 0)
      },
      {
        key: "checkout",
        label: "Checkout",
        users: totalCheckout,
        rateFromPrevious: totalAddToCart === 0 ? 0 : totalCheckout / totalAddToCart,
        dropoff: Math.max(totalAddToCart - totalCheckout, 0)
      },
      {
        key: "purchase",
        label: "Purchase",
        users: totalPurchases,
        rateFromPrevious: totalCheckout === 0 ? 0 : totalPurchases / totalCheckout,
        dropoff: Math.max(totalCheckout - totalPurchases, 0)
      }
    ]
  };

  const segments: SegmentSnapshot[] = [
    {
      key: "mobile_paid",
      label: "Mobile paid",
      visitors: Math.round(totalVisitors * 0.34),
      share: 0.34,
      conversionRate: kpis.conversions / Math.max(totalVisitors, 1) * 1.18,
      revenuePerVisitor: kpis.revenue / Math.max(totalVisitors, 1) * 0.94,
      engagementScore: 73,
      trend: "up",
      note: "Strong conversion acceleration when urgency and recommendation modules stack cleanly."
    },
    {
      key: "returning",
      label: "Returning",
      visitors: Math.round(totalVisitors * 0.27),
      share: 0.27,
      conversionRate: kpis.conversions / Math.max(totalVisitors, 1) * 1.06,
      revenuePerVisitor: kpis.revenue / Math.max(totalVisitors, 1) * 1.22,
      engagementScore: 81,
      trend: "flat",
      note: "Stable revenue quality but friction rises when popups fire too early."
    },
    {
      key: "high_intent",
      label: "High intent",
      visitors: Math.round(totalVisitors * 0.18),
      share: 0.18,
      conversionRate: kpis.conversions / Math.max(totalVisitors, 1) * 1.42,
      revenuePerVisitor: kpis.revenue / Math.max(totalVisitors, 1) * 1.37,
      engagementScore: 88,
      trend: "up",
      note: "Best candidate for advanced recommendation campaigns and late-stage popups."
    }
  ];

  const splitIndex = Math.max(1, Math.floor(timeline.length / 2));
  const previousTimeline = timeline.slice(0, splitIndex);
  const currentTimeline = timeline.slice(splitIndex);
  const sumMetric = (points: ExperimentTimeSeriesPoint[], key: keyof ExperimentTimeSeriesPoint) =>
    points.reduce((sum, point) => sum + (typeof point[key] === "number" ? Number(point[key]) : 0), 0);
  const currentRecoCtr = sumMetric(currentTimeline, "recommendationImpressions") === 0
    ? 0
    : sumMetric(currentTimeline, "recommendationClicks") / sumMetric(currentTimeline, "recommendationImpressions");
  const previousRecoCtr = sumMetric(previousTimeline, "recommendationImpressions") === 0
    ? 0
    : sumMetric(previousTimeline, "recommendationClicks") / sumMetric(previousTimeline, "recommendationImpressions");

  return {
    kpis,
    timeline,
    funnel,
    segments,
    periodComparison: {
      currentLabel: "Current period",
      previousLabel: "Previous period",
      metrics: {
        visitors: compareMetric(sumMetric(currentTimeline, "visitors"), sumMetric(previousTimeline, "visitors")),
        conversions: compareMetric(sumMetric(currentTimeline, "conversions"), sumMetric(previousTimeline, "conversions")),
        revenue: compareMetric(sumMetric(currentTimeline, "revenue"), sumMetric(previousTimeline, "revenue")),
        addToCart: compareMetric(sumMetric(currentTimeline, "addToCart"), sumMetric(previousTimeline, "addToCart")),
        recommendationCtr: compareMetric(currentRecoCtr, previousRecoCtr)
      }
    },
    experimentsSummary: {
      running: statsItems.filter((item) => item.totalVisitors > 0).length,
      draft: 0,
      paused: 0,
      winners: statsItems.filter((item) => item.winner).length
    }
  };
}

export function computeExperimentStats(
  experimentId: string,
  variants: Variant[],
  events: EventRecord[],
  options?: { days?: number; from?: string; to?: string }
): ExperimentStats {
  const relevantEvents = events.filter((event) => event.experimentId === experimentId);
  const { start, end } = buildDateRange(options?.days ?? 7, options?.from, options?.to);
  const periodEvents = relevantEvents.filter((event) => {
    const timestamp = new Date(event.timestamp).getTime();
    return timestamp >= start.getTime() && timestamp <= end.getTime();
  });

  const sessionsByVariant = new Map<string, Set<string>>();
  const visitorsByVariant = new Map<string, Set<string>>();

  for (const variant of variants) {
    visitorsByVariant.set(variant.key, new Set());
    sessionsByVariant.set(variant.key, new Set());
  }

  for (const event of periodEvents) {
    if (!visitorsByVariant.has(event.variantKey)) {
      visitorsByVariant.set(event.variantKey, new Set());
      sessionsByVariant.set(event.variantKey, new Set());
    }
    visitorsByVariant.get(event.variantKey)?.add(event.anonymousId);
    if (event.sessionId) sessionsByVariant.get(event.variantKey)?.add(event.sessionId);
  }

  const pageViews = periodEvents.filter((event) => event.eventType === "page_view");
  const pageExits = periodEvents.filter((event) => event.eventType === "page_exit" || event.eventType === "time_on_page");
  const scrollEvents = periodEvents.filter((event) => event.eventType === "scroll_depth");
  const recommendationImpressions = periodEvents.filter((event) => event.eventType === "recommendation_impression");
  const recommendationClicks = periodEvents.filter((event) => event.eventType === "recommendation_click");
  const purchaseEvents = periodEvents.filter((event) => event.eventType === "purchase");

  const baseVariantStats = variants.map((variant) => {
    const variantEvents = periodEvents.filter((event) => event.variantKey === variant.key);
    const visitors = visitorsByVariant.get(variant.key)?.size ?? 0;
    const sessions = sessionsByVariant.get(variant.key)?.size ?? 0;
    const conversions = countByType(variantEvents, "conversion");
    const clicks = countByType(variantEvents, "click");
    const ctaClicks = countByType(variantEvents, "cta_click");
    const addToCart = countByType(variantEvents, "add_to_cart");
    const checkoutStarts = countByType(variantEvents, "checkout_start");
    const purchases = countByType(variantEvents, "purchase");
    const revenue = sumNumberContext(variantEvents.filter((event) => event.eventType === "purchase"), "revenue");
    const avgScrollDepth = average(
      variantEvents
        .filter((event) => event.eventType === "scroll_depth")
        .map((event) => (typeof event.context?.scrollDepth === "number" ? event.context.scrollDepth : 0))
    );
    const avgTimeOnPageMs = average(
      variantEvents
        .filter((event) => event.eventType === "page_exit" || event.eventType === "time_on_page")
        .map((event) => (typeof event.context?.durationMs === "number" ? event.context.durationMs : 0))
        .filter(Boolean)
    );
    const conversionRate = visitors === 0 ? 0 : conversions / visitors;

    return {
      variantKey: variant.key,
      visitors,
      sessions,
      conversions,
      clicks,
      ctaClicks,
      addToCart,
      checkoutStarts,
      purchases,
      revenue,
      avgScrollDepth,
      avgTimeOnPageMs,
      conversionRate,
      uplift: 0,
      confidence: 0,
      isWinner: false
    };
  });

  const control = baseVariantStats.find((variant) => variants.find((item) => item.key === variant.variantKey)?.isControl) ?? baseVariantStats[0];
  const variantStats: VariantStats[] = baseVariantStats.map((variant) => ({
    ...variant,
    confidence:
      control && control.variantKey !== variant.variantKey
        ? computeTwoProportionConfidence(control.visitors, control.conversions, variant.visitors, variant.conversions)
        : 0
  }));
  const totalVariantSessions = baseVariantStats.reduce((sum, variant) => sum + variant.sessions, 0);
  const normalized = variantStats.map((variant) => {
    const testStats =
      control && control.variantKey !== variant.variantKey
        ? computeTwoProportionStats(control.visitors, control.conversions, variant.visitors, variant.conversions)
        : { confidence: 0, pValue: 1, zScore: 0 };
    const interval = wilsonInterval(variant.conversions, Math.max(variant.visitors, 0));
    const uplift = control && control.conversionRate > 0 ? (variant.conversionRate - control.conversionRate) / control.conversionRate : 0;
    return {
      ...variant,
      uplift,
      confidence: testStats.confidence,
      confidenceIntervalLow: interval.low,
      confidenceIntervalHigh: interval.high,
      pValue: testStats.pValue,
      probabilityToBeatControl: variant.variantKey === control?.variantKey ? 0.5 : testStats.confidence,
      expectedLoss: variant.variantKey === control?.variantKey ? 0 : Math.max(0, -uplift * variant.conversionRate),
      sampleRatioMismatch: computeSampleRatioMismatch(variant.sessions, totalVariantSessions, variants.find((item) => item.key === variant.variantKey)?.allocation ?? 0)
    };
  });

  const sorted = [...normalized].sort((a, b) => b.conversionRate - a.conversionRate);
  const winner = sorted[0];
  const isClearWinner = winner && winner.visitors > 100 && winner.conversionRate > (sorted[1]?.conversionRate ?? 0);
  const controlRevenuePerVisitor = control && control.visitors > 0 ? control.revenue / control.visitors : 0;
  const winnerRevenuePerVisitor = winner && winner.visitors > 0 ? winner.revenue / winner.visitors : 0;
  const estimatedRevenueUplift = Math.max(0, (winnerRevenuePerVisitor - controlRevenuePerVisitor) * (winner?.visitors ?? 0));

  const sessions = new Set(periodEvents.map((event) => event.sessionId).filter(Boolean) as string[]);
  const uniqueVisitors = new Set(periodEvents.map((event) => event.anonymousId));
  const pagesPerSession = sessions.size === 0 ? 0 : pageViews.length / sessions.size;
  const durations = pageExits.map((event) => event.context?.durationMs).filter((value): value is number => typeof value === "number" && value >= 0);
  const scrollDepths = scrollEvents.map((event) => event.context?.scrollDepth).filter((value): value is number => typeof value === "number");
  const sessionPageCount = new Map<string, number>();

  for (const event of pageViews) {
    if (!event.sessionId) continue;
    sessionPageCount.set(event.sessionId, (sessionPageCount.get(event.sessionId) ?? 0) + 1);
  }

  const bounceSessions = [...sessionPageCount.values()].filter((count) => count <= 1).length;
  const clicks = countByType(periodEvents, "click");
  const ctaClicks = countByType(periodEvents, "cta_click");
  const recommendationImpressionCount = recommendationImpressions.length;
  const recommendationClickCount = recommendationClicks.length;
  const purchases = purchaseEvents.length;
  const revenue = sumNumberContext(purchaseEvents, "revenue");

  const kpis: ExperimentKpis = {
    sessions: sessions.size,
    uniqueVisitors: uniqueVisitors.size,
    pageViews: pageViews.length,
    pagesPerSession,
    avgTimeOnPageMs: average(durations),
    avgScrollDepth: average(scrollDepths),
    bounceRate: sessions.size === 0 ? 0 : bounceSessions / sessions.size,
    clicks,
    ctaClicks,
    outboundClicks: countByType(periodEvents, "outbound_click"),
    rageClicks: countByType(periodEvents, "rage_click"),
    deadClicks: countByType(periodEvents, "dead_click"),
    conversions: countByType(periodEvents, "conversion"),
    addToCart: countByType(periodEvents, "add_to_cart"),
    removeFromCart: countByType(periodEvents, "remove_from_cart"),
    checkoutStarts: countByType(periodEvents, "checkout_start"),
    purchases,
    revenue,
    averageOrderValue: purchases === 0 ? 0 : revenue / purchases,
    recommendationImpressions: recommendationImpressionCount,
    recommendationClicks: recommendationClickCount,
    recommendationCtr: recommendationImpressionCount === 0 ? 0 : recommendationClickCount / recommendationImpressionCount,
    formStarts: countByType(periodEvents, "form_start"),
    formSubmits: countByType(periodEvents, "form_submit"),
    formErrors: countByType(periodEvents, "form_error"),
    formAbandons: countByType(periodEvents, "form_abandon"),
    videoStarts: countByType(periodEvents, "video_start"),
    videoCompletions: countByType(periodEvents, "video_complete"),
    jsErrors: countByType(periodEvents, "js_error")
  };

  return {
    experimentId,
    totalVisitors: uniqueVisitors.size,
    totalSessions: sessions.size,
    winner: isClearWinner ? winner.variantKey : undefined,
    roi: {
      baselineRevenue: control?.revenue ?? 0,
      projectedRevenue: winner?.revenue ?? control?.revenue ?? 0,
      estimatedRevenueUplift: isClearWinner ? estimatedRevenueUplift : 0,
      topVariant: isClearWinner ? winner?.variantKey : undefined
    },
    variants: normalized.map((variant) => ({
      ...variant,
      isWinner: isClearWinner ? variant.variantKey === winner.variantKey : false
    })),
    kpis,
    timeline: buildTimeline(periodEvents, start, end)
  };
}

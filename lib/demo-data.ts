import type { AiSuggestion, Experiment, ExperimentStats, Project, SessionDiagnostic, User } from "@/lib/types";

export const demoUser: User = {
  id: "user_demo",
  email: "founder@optify.ai",
  fullName: "Optify Demo"
};

export const demoProjects: Project[] = [
  {
    id: "proj_1",
    name: "Northstar Store",
    domain: "northstar-store.com",
    platform: "shopify",
    publicKey: "pub_proj_1",
    workspaceId: "ws_1",
    scriptUrl: "https://cdn.optify.ai/sdk.js"
  },
  {
    id: "proj_2",
    name: "Flow Wellness",
    domain: "flowwellness.io",
    platform: "webflow",
    publicKey: "pub_proj_2",
    workspaceId: "ws_1",
    scriptUrl: "https://cdn.optify.ai/sdk.js"
  }
];

export const demoExperiments: Experiment[] = [
  {
    id: "exp_hero_cta",
    projectId: "proj_1",
    name: "Hero CTA urgency",
    hypothesis: "A clearer urgency-driven CTA will improve primary conversions on product pages.",
    pagePattern: "/products/*",
    trafficSplit: 100,
    status: "running",
    primaryMetric: "conversion",
    createdAt: "2026-03-20T12:00:00.000Z",
    editorMode: "visual",
    audienceRules: [
      { attribute: "device", operator: "is", value: "mobile" },
      { attribute: "source", operator: "contains", value: "paid" }
    ],
    popupConfig: {
      title: "Unlock 10% now",
      body: "Short value-led popup for high-intent visitors before they abandon the PDP.",
      cta: "Claim offer",
      trigger: "exit_intent",
      placement: "modal_center",
      delayMs: 6000,
      frequencyCap: "once_per_session",
      theme: "accent",
      goal: "conversion"
    },
    recommendationConfig: {
      strategy: "frequently_bought_together",
      placement: "pdp_sidebar",
      maxProducts: 3,
      title: "Complete the bundle",
      algorithmNotes: "Blend high attach-rate accessories with margin-aware ranking.",
      fallbackStrategy: "best_sellers",
      trigger: "page_view",
      audienceIntent: "high_intent"
    },
    variants: [
      {
        id: "var_a",
        experimentId: "exp_hero_cta",
        name: "Control",
        key: "A",
        allocation: 50,
        isControl: true,
        changes: []
      },
      {
        id: "var_b",
        experimentId: "exp_hero_cta",
        name: "Urgency CTA",
        key: "B",
        allocation: 50,
        changes: [
          {
            selector: "[data-optify='hero-cta']",
            type: "text",
            value: "Get yours before tonight's sell-out"
          },
          {
            selector: "[data-optify='hero-cta']",
            type: "style",
            value: "background:#135c43;color:white;border-radius:9999px;padding:14px 22px;"
          }
        ]
      }
    ]
  },
  {
    id: "exp_social_proof",
    projectId: "proj_1",
    name: "Social proof above fold",
    hypothesis: "Showing proof higher on the page will reduce uncertainty and improve add-to-cart clicks.",
    pagePattern: "/products/*",
    trafficSplit: 100,
    status: "draft",
    primaryMetric: "click",
    createdAt: "2026-03-21T12:00:00.000Z",
    editorMode: "visual",
    audienceRules: [{ attribute: "intent", operator: "is", value: "returning" }],
    popupConfig: {
      title: "See why shoppers trust this product",
      body: "Use proof moments instead of discounting to reassure uncertain visitors.",
      cta: "Show reviews",
      trigger: "scroll_depth",
      placement: "slide_in_right",
      delayMs: 8000,
      frequencyCap: "once_per_day",
      theme: "light",
      goal: "click"
    },
    variants: [
      {
        id: "var_sp_a",
        experimentId: "exp_social_proof",
        name: "Control",
        key: "A",
        allocation: 50,
        isControl: true,
        changes: []
      },
      {
        id: "var_sp_b",
        experimentId: "exp_social_proof",
        name: "Proof stack",
        key: "B",
        allocation: 50,
        changes: [
          {
            selector: "[data-optify='hero-subtitle']",
            type: "text",
            value: "Trusted by 18,000+ customers and featured in Vogue."
          }
        ]
      }
    ]
  }
];

export const demoStats: Record<string, ExperimentStats> = {
  exp_hero_cta: {
    experimentId: "exp_hero_cta",
    totalVisitors: 2042,
    totalSessions: 1610,
    winner: "B",
    roi: {
      baselineRevenue: 3334,
      projectedRevenue: 5298,
      estimatedRevenueUplift: 1964,
      topVariant: "B"
    },
    kpis: {
      sessions: 1610,
      uniqueVisitors: 2042,
      pageViews: 3128,
      pagesPerSession: 1.94,
      avgTimeOnPageMs: 48200,
      avgScrollDepth: 68,
      bounceRate: 0.34,
      clicks: 490,
      ctaClicks: 351,
      outboundClicks: 28,
      rageClicks: 19,
      deadClicks: 12,
      conversions: 203,
      addToCart: 274,
      removeFromCart: 37,
      checkoutStarts: 162,
      purchases: 91,
      revenue: 8632,
      averageOrderValue: 94.86,
      recommendationImpressions: 1188,
      recommendationClicks: 134,
      recommendationCtr: 0.1128,
      formStarts: 98,
      formSubmits: 71,
      formErrors: 14,
      formAbandons: 21,
      videoStarts: 42,
      videoCompletions: 18,
      jsErrors: 3
    },
    timeline: [
      { date: "2026-03-18", visitors: 241, sessions: 180, pageViews: 322, clicks: 41, ctaClicks: 28, conversions: 18, addToCart: 31, checkoutStarts: 11, purchases: 7, revenue: 663, recommendationClicks: 12, recommendationImpressions: 98, rageClicks: 2, formErrors: 1, jsErrors: 0 },
      { date: "2026-03-19", visitors: 265, sessions: 203, pageViews: 351, clicks: 46, ctaClicks: 32, conversions: 22, addToCart: 35, checkoutStarts: 17, purchases: 9, revenue: 854, recommendationClicks: 14, recommendationImpressions: 121, rageClicks: 2, formErrors: 1, jsErrors: 0 },
      { date: "2026-03-20", visitors: 278, sessions: 219, pageViews: 401, clicks: 57, ctaClicks: 41, conversions: 26, addToCart: 39, checkoutStarts: 19, purchases: 10, revenue: 948, recommendationClicks: 16, recommendationImpressions: 146, rageClicks: 3, formErrors: 2, jsErrors: 1 },
      { date: "2026-03-21", visitors: 292, sessions: 231, pageViews: 436, clicks: 63, ctaClicks: 46, conversions: 29, addToCart: 42, checkoutStarts: 24, purchases: 13, revenue: 1214, recommendationClicks: 19, recommendationImpressions: 167, rageClicks: 3, formErrors: 2, jsErrors: 0 },
      { date: "2026-03-22", visitors: 304, sessions: 244, pageViews: 478, clicks: 75, ctaClicks: 55, conversions: 33, addToCart: 45, checkoutStarts: 28, purchases: 15, revenue: 1425, recommendationClicks: 21, recommendationImpressions: 189, rageClicks: 4, formErrors: 3, jsErrors: 1 },
      { date: "2026-03-23", visitors: 321, sessions: 257, pageViews: 542, clicks: 99, ctaClicks: 72, conversions: 36, addToCart: 49, checkoutStarts: 31, purchases: 17, revenue: 1618, recommendationClicks: 24, recommendationImpressions: 221, rageClicks: 2, formErrors: 3, jsErrors: 0 },
      { date: "2026-03-24", visitors: 341, sessions: 276, pageViews: 598, clicks: 109, ctaClicks: 77, conversions: 39, addToCart: 33, checkoutStarts: 32, purchases: 20, revenue: 1910, recommendationClicks: 28, recommendationImpressions: 246, rageClicks: 3, formErrors: 2, jsErrors: 1 }
    ],
    variants: [
      {
        variantKey: "A",
        visitors: 1018,
        sessions: 803,
        conversions: 86,
        clicks: 212,
        ctaClicks: 146,
        addToCart: 118,
        checkoutStarts: 69,
        purchases: 38,
        revenue: 3334,
        avgScrollDepth: 63,
        avgTimeOnPageMs: 45120,
        conversionRate: 0.0845,
        uplift: 0,
        confidence: 0.53,
        isWinner: false
      },
      {
        variantKey: "B",
        visitors: 1024,
        sessions: 807,
        conversions: 117,
        clicks: 278,
        ctaClicks: 205,
        addToCart: 156,
        checkoutStarts: 93,
        purchases: 53,
        revenue: 5298,
        avgScrollDepth: 72,
        avgTimeOnPageMs: 51280,
        conversionRate: 0.1143,
        uplift: 0.3527,
        confidence: 0.94,
        isWinner: true
      }
    ]
  },
  exp_social_proof: {
    experimentId: "exp_social_proof",
    totalVisitors: 0,
    totalSessions: 0,
    roi: {
      baselineRevenue: 0,
      projectedRevenue: 0,
      estimatedRevenueUplift: 0
    },
    kpis: {
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
    },
    timeline: [
      { date: "2026-03-18", visitors: 0, sessions: 0, pageViews: 0, clicks: 0, ctaClicks: 0, conversions: 0, addToCart: 0, checkoutStarts: 0, purchases: 0, revenue: 0, recommendationClicks: 0, recommendationImpressions: 0, rageClicks: 0, formErrors: 0, jsErrors: 0 },
      { date: "2026-03-19", visitors: 0, sessions: 0, pageViews: 0, clicks: 0, ctaClicks: 0, conversions: 0, addToCart: 0, checkoutStarts: 0, purchases: 0, revenue: 0, recommendationClicks: 0, recommendationImpressions: 0, rageClicks: 0, formErrors: 0, jsErrors: 0 },
      { date: "2026-03-20", visitors: 0, sessions: 0, pageViews: 0, clicks: 0, ctaClicks: 0, conversions: 0, addToCart: 0, checkoutStarts: 0, purchases: 0, revenue: 0, recommendationClicks: 0, recommendationImpressions: 0, rageClicks: 0, formErrors: 0, jsErrors: 0 },
      { date: "2026-03-21", visitors: 0, sessions: 0, pageViews: 0, clicks: 0, ctaClicks: 0, conversions: 0, addToCart: 0, checkoutStarts: 0, purchases: 0, revenue: 0, recommendationClicks: 0, recommendationImpressions: 0, rageClicks: 0, formErrors: 0, jsErrors: 0 },
      { date: "2026-03-22", visitors: 0, sessions: 0, pageViews: 0, clicks: 0, ctaClicks: 0, conversions: 0, addToCart: 0, checkoutStarts: 0, purchases: 0, revenue: 0, recommendationClicks: 0, recommendationImpressions: 0, rageClicks: 0, formErrors: 0, jsErrors: 0 },
      { date: "2026-03-23", visitors: 0, sessions: 0, pageViews: 0, clicks: 0, ctaClicks: 0, conversions: 0, addToCart: 0, checkoutStarts: 0, purchases: 0, revenue: 0, recommendationClicks: 0, recommendationImpressions: 0, rageClicks: 0, formErrors: 0, jsErrors: 0 },
      { date: "2026-03-24", visitors: 0, sessions: 0, pageViews: 0, clicks: 0, ctaClicks: 0, conversions: 0, addToCart: 0, checkoutStarts: 0, purchases: 0, revenue: 0, recommendationClicks: 0, recommendationImpressions: 0, rageClicks: 0, formErrors: 0, jsErrors: 0 }
    ],
    variants: [
      {
        variantKey: "A",
        visitors: 0,
        sessions: 0,
        conversions: 0,
        clicks: 0,
        ctaClicks: 0,
        addToCart: 0,
        checkoutStarts: 0,
        purchases: 0,
        revenue: 0,
        avgScrollDepth: 0,
        avgTimeOnPageMs: 0,
        conversionRate: 0,
        uplift: 0,
        confidence: 0,
        isWinner: false
      },
      {
        variantKey: "B",
        visitors: 0,
        sessions: 0,
        conversions: 0,
        clicks: 0,
        ctaClicks: 0,
        addToCart: 0,
        checkoutStarts: 0,
        purchases: 0,
        revenue: 0,
        avgScrollDepth: 0,
        avgTimeOnPageMs: 0,
        conversionRate: 0,
        uplift: 0,
        confidence: 0,
        isWinner: false
      }
    ]
  }
};

export const demoSuggestions: AiSuggestion[] = [
  {
    type: "visual",
    title: "Test a stronger value-driven CTA",
    hypothesis: "Swapping generic action language for benefit-led copy should improve click-through rate.",
    expectedImpact: "high",
    primaryMetric: "cta_click",
    targetSelector: "[data-optify='hero-cta']",
    approvalState: "ready_for_review",
    changes: ["Rewrite the primary CTA with benefit + urgency", "Increase contrast on CTA button"]
  },
  {
    type: "content",
    title: "Move proof higher on the page",
    hypothesis: "Adding testimonials or trust badges above the fold will reduce friction before users scroll.",
    expectedImpact: "medium",
    primaryMetric: "add_to_cart",
    targetSelector: "[data-optify='hero-subtitle']",
    approvalState: "ready_for_review",
    changes: ["Add star rating near product title", "Surface a testimonial block under the hero"]
  },
  {
    type: "funnel",
    title: "Shorten the form or checkout friction",
    hypothesis: "Reducing cognitive load in the funnel should lift conversions on mobile traffic.",
    expectedImpact: "high",
    primaryMetric: "conversion",
    approvalState: "draft",
    targetSelector: "checkout",
    changes: ["Hide secondary form fields", "Use a one-column mobile layout"]
  },
  {
    type: "popup",
    title: "Generate an exit-intent offer popup",
    hypothesis: "A late-session incentive popup should recover abandoning PDP sessions without degrading early engagement.",
    expectedImpact: "high",
    primaryMetric: "conversion",
    targetSelector: "body",
    approvalState: "ready_for_review",
    changes: ["Show a modal offer on exit intent", "Test discount-first versus reassurance-first popup copy"]
  },
  {
    type: "recommendation",
    title: "Launch a high-intent recommendation module",
    hypothesis: "Contextual bundles after product engagement should raise attach rate and revenue per visitor.",
    expectedImpact: "medium",
    primaryMetric: "add_to_cart",
    targetSelector: "[data-optify-recommendation-id='rec_demo_1']",
    approvalState: "ready_for_review",
    changes: ["Insert a dynamic bundle below the hero", "Rank items by margin and attach rate"]
  },
  {
    type: "custom_code",
    title: "Inject a sticky urgency rail",
    hypothesis: "A persistent custom merchandising rail can keep high-intent users focused deeper in the session.",
    expectedImpact: "medium",
    primaryMetric: "click",
    targetSelector: "body",
    approvalState: "draft",
    changes: ["Inject a sticky urgency strip near the viewport edge", "Animate the rail when product intent rises"]
  }
];

export const demoSessionDiagnostics: Record<string, SessionDiagnostic[]> = {
  exp_hero_cta: [
    {
      sessionId: "sess_replay_1",
      anonymousId: "anon_84f12",
      startedAt: "2026-03-24T16:42:12.000Z",
      deviceType: "desktop",
      durationMs: 91000,
      pages: 3,
      rageClicks: 2,
      deadClicks: 1,
      jsErrors: 0,
      conversions: 1,
      revenue: 59,
      events: [
        { timestamp: "2026-03-24T16:42:12.000Z", eventType: "page_view", pathname: "/products/demo", label: "Demo PDP", notes: ["Landing from paid campaign"] },
        { timestamp: "2026-03-24T16:42:31.000Z", eventType: "rage_click", pathname: "/products/demo", label: "Hero CTA", selector: "[data-optify='hero-cta']", notes: ["Repeated taps before copy change"] },
        { timestamp: "2026-03-24T16:42:44.000Z", eventType: "scroll_depth", pathname: "/products/demo", label: "68%", notes: ["Reached social proof and recommendations"] },
        { timestamp: "2026-03-24T16:43:03.000Z", eventType: "recommendation_click", pathname: "/products/demo", label: "Booster Case", selector: "[data-optify-recommendation-id='rec_demo_1']", notes: ["Accessory recommendation engaged"] },
        { timestamp: "2026-03-24T16:43:43.000Z", eventType: "conversion", pathname: "/checkout", label: "Checkout started", notes: ["Variant B maintained momentum into checkout"] }
      ],
      replay: [
        {
          id: "frame_1",
          timestamp: "2026-03-24T16:42:12.000Z",
          title: "Landing on PDP",
          subtitle: "First view with variant hero copy exposed",
          pathname: "/products/demo",
          activeEventType: "page_view",
          notes: ["Traffic source: paid social", "Hero module fully visible above the fold"],
          nodes: [
            { id: "page", tag: "main", children: [
              { id: "hero", tag: "section", role: "hero", children: [
                { id: "title", tag: "h1", text: "Launch faster winning experiments" },
                { id: "subtitle", tag: "p", text: "High-intent product detail page with urgency copy.", muted: true },
                { id: "cta", tag: "button", text: "Get yours before tonight's sell-out", target: true }
              ]},
              { id: "recommendations", tag: "section", role: "recommendations", children: [
                { id: "rec-a", tag: "article", text: "Recommendation A" },
                { id: "rec-b", tag: "article", text: "Recommendation B" }
              ]}
            ]}
          ]
        },
        {
          id: "frame_2",
          timestamp: "2026-03-24T16:42:31.000Z",
          title: "CTA friction spike",
          subtitle: "Two repeated clicks on the same control",
          pathname: "/products/demo",
          activeEventType: "rage_click",
          selector: "[data-optify='hero-cta']",
          notes: ["Rage pattern detected around pricing hesitation", "CTA becomes the active DOM target"],
          nodes: [
            { id: "page", tag: "main", children: [
              { id: "hero", tag: "section", role: "hero", children: [
                { id: "price", tag: "div", text: "$59 today only", muted: true },
                { id: "cta", tag: "button", text: "Get yours before tonight's sell-out", target: true },
                { id: "alt", tag: "button", text: "Trigger conversion", muted: true }
              ]},
              { id: "support", tag: "aside", text: "Shipping & returns", muted: true }
            ]}
          ]
        },
        {
          id: "frame_3",
          timestamp: "2026-03-24T16:43:03.000Z",
          title: "Recommendation engagement",
          subtitle: "Visitor explores the accessory module",
          pathname: "/products/demo",
          activeEventType: "recommendation_click",
          selector: "[data-optify-recommendation-id='rec_demo_1']",
          notes: ["Reco module creates a second engagement path", "Cross-sell block is now dominant in viewport"],
          nodes: [
            { id: "page", tag: "main", children: [
              { id: "hero", tag: "section", role: "hero", muted: true, children: [
                { id: "cta", tag: "button", text: "Get yours before tonight's sell-out" }
              ]},
              { id: "recommendations", tag: "section", role: "recommendations", children: [
                { id: "rec-a", tag: "article", text: "Booster Case", target: true },
                { id: "rec-b", tag: "article", text: "Fast Track Warranty" }
              ]}
            ]}
          ]
        },
        {
          id: "frame_4",
          timestamp: "2026-03-24T16:43:43.000Z",
          title: "Checkout progression",
          subtitle: "Session ends in a conversion signal",
          pathname: "/checkout",
          activeEventType: "conversion",
          selector: "[data-checkout-start]",
          notes: ["Checkout started after recommendation interaction", "High intent confirmed with no JS error"],
          nodes: [
            { id: "checkout", tag: "main", children: [
              { id: "summary", tag: "section", text: "Order summary", muted: true },
              { id: "items", tag: "section", text: "Optify Booster + Booster Case", target: true },
              { id: "payment", tag: "section", text: "Payment step", muted: true }
            ]}
          ]
        }
      ],
      diagnostics: {
        frictionScore: 61,
        intentScore: 83,
        summary: "High-intent session with initial CTA hesitation, then strong recovery through recommendation engagement.",
        topSignals: ["Rage clicks on hero CTA", "Recommendation click before checkout", "Conversion reached without JS errors"]
      }
    },
    {
      sessionId: "sess_replay_2",
      anonymousId: "anon_17aa0",
      startedAt: "2026-03-24T14:18:09.000Z",
      deviceType: "mobile",
      durationMs: 64000,
      pages: 2,
      rageClicks: 0,
      deadClicks: 2,
      jsErrors: 1,
      conversions: 0,
      revenue: 0,
      events: [
        { timestamp: "2026-03-24T14:18:09.000Z", eventType: "page_view", pathname: "/products/demo", label: "Demo PDP", notes: ["Organic session"] },
        { timestamp: "2026-03-24T14:18:27.000Z", eventType: "dead_click", pathname: "/products/demo", label: "Video player", selector: "video", notes: ["Control looked interactive but did not progress session"] },
        { timestamp: "2026-03-24T14:18:40.000Z", eventType: "js_error", pathname: "/products/demo", label: "Recommendation slot", notes: ["Client-side issue near the recommendation block"] }
      ],
      replay: [
        {
          id: "frame_a",
          timestamp: "2026-03-24T14:18:09.000Z",
          title: "Organic landing",
          subtitle: "Visitor scans the hero without engaging the CTA",
          pathname: "/products/demo",
          activeEventType: "page_view",
          notes: ["Longer dwell around explainer content"],
          nodes: [
            { id: "page", tag: "main", children: [
              { id: "hero", tag: "section", children: [
                { id: "title", tag: "h1", text: "Launch faster winning experiments" },
                { id: "video", tag: "video", text: "Product demo", target: true }
              ]}
            ]}
          ]
        },
        {
          id: "frame_b",
          timestamp: "2026-03-24T14:18:40.000Z",
          title: "Reco rendering error",
          subtitle: "Script issue interrupts the secondary merchandising area",
          pathname: "/products/demo",
          activeEventType: "js_error",
          selector: "[data-optify-recommendation-id='rec_demo_2']",
          notes: ["Recommendation slot failed to fully hydrate", "Good candidate for guardrails before broader rollout"],
          nodes: [
            { id: "page", tag: "main", children: [
              { id: "hero", tag: "section", muted: true, children: [
                { id: "cta", tag: "button", text: "Get yours before tonight's sell-out" }
              ]},
              { id: "recommendations", tag: "section", children: [
                { id: "rec-a", tag: "article", text: "Booster Case", muted: true },
                { id: "rec-b", tag: "article", text: "Fast Track Warranty", target: true }
              ]}
            ]}
          ]
        }
      ],
      diagnostics: {
        frictionScore: 79,
        intentScore: 34,
        summary: "Lower-intent exploratory session disrupted by dead clicks and a recommendation-side rendering issue.",
        topSignals: ["Dead clicks around video area", "JS error near recommendation slot", "No downstream conversion signal"]
      }
    }
  ]
};

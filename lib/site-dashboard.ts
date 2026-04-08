import type { Locale } from "@/lib/i18n";

type Copy = {
  nav: {
    currentSite: string;
    addSite: string;
    command: string;
    observe: string;
    decide: string;
    act: string;
    workspace: string;
    overview: string;
    analytics: string;
    sessions: string;
    activity: string;
    suggestions: string;
    experiments: string;
    installation: string;
    shopifyHub: string;
    billing: string;
    noSite: string;
    createSiteHint: string;
  };
  common: {
    revenue: string;
    visitors: string;
    sessions: string;
    conversions: string;
    addToCart: string;
    checkout: string;
    purchases: string;
    pageViews: string;
    noData: string;
    updatedAt: string;
    currentStatus: string;
    copySnippet: string;
    recentActivity: string;
  };
  pages: {
    overview: {
      title: string;
      description: string;
      primaryAction: string;
      secondaryAction: string;
      summaryTitle: string;
      summaryDescription: string;
      topPagesTitle: string;
      topPagesDescription: string;
      activeTestsTitle: string;
      activeTestsDescription: string;
      setupTitle: string;
      setupDescription: string;
      bestPage: string;
      bestPageEmpty: string;
      strongestInteraction: string;
      strongestInteractionEmpty: string;
      trackedRevenue: string;
      liveTests: string;
      noRunningTest: string;
      setupProgress: string;
      setupPending: string;
      recentSignalsTitle: string;
      recentSignalsDescription: string;
      recommendationsTitle: string;
      recommendationsDescription: string;
      recommendationsDisclaimer: string;
    };
    analytics: {
      title: string;
      description: string;
      trafficTitle: string;
      trafficDescription: string;
      funnelTitle: string;
      funnelDescription: string;
      comparisonTitle: string;
      comparisonDescription: string;
      pageTableTitle: string;
      pageTableDescription: string;
      interactionTableTitle: string;
      interactionTableDescription: string;
      qualityTitle: string;
      qualityDescription: string;
      currentPeriod: string;
      previousPeriod: string;
      delta: string;
    };
    sessions: {
      title: string;
      description: string;
      replayTitle: string;
      replayDescription: string;
      hotspotsTitle: string;
      hotspotsDescription: string;
      diagnosticsTitle: string;
      diagnosticsDescription: string;
      noReplay: string;
    };
    activity: {
      title: string;
      description: string;
      onboardingTitle: string;
      onboardingDescription: string;
      sdkTitle: string;
      sdkDescription: string;
      feedTitle: string;
      feedDescription: string;
      auditTitle: string;
      auditDescription: string;
    };
    experiments: {
      title: string;
      description: string;
      createAction: string;
      secondaryAction: string;
      portfolioTitle: string;
      portfolioDescription: string;
      readinessTitle: string;
      readinessDescription: string;
      funnelTitle: string;
      funnelDescription: string;
      statesTitle: string;
      statesDescription: string;
    };
    installation: {
      title: string;
      description: string;
      snippetTitle: string;
      snippetDescription: string;
      checksTitle: string;
      checksDescription: string;
      guideTitle: string;
      guideDescription: string;
      capabilitiesTitle: string;
      capabilitiesDescription: string;
      shopifyTitle: string;
      shopifyDescription: string;
    };
    suggestions: {
      title: string;
      description: string;
      queueTitle: string;
      queueDescription: string;
      evidenceTitle: string;
      evidenceDescription: string;
      disclaimer: string;
    };
  };
};

const fr: Copy = {
  nav: {
    currentSite: "Site actuel",
    addSite: "Ajouter un site",
    command: "Pilotage",
    observe: "Observation",
    decide: "Suggestions",
    act: "Execution",
    workspace: "Workspace",
    overview: "Vue d'ensemble",
    analytics: "Analytics",
    sessions: "Sessions",
    activity: "Activite",
    suggestions: "Suggestions",
    experiments: "Experiences",
    installation: "Installation",
    shopifyHub: "Hub Shopify",
    billing: "Facturation",
    noSite: "Aucun site selectionne",
    createSiteHint: "Creez un site pour commencer"
  },
  common: {
    revenue: "Revenu",
    visitors: "Visiteurs",
    sessions: "Sessions",
    conversions: "Conversions",
    addToCart: "Ajouts au panier",
    checkout: "Passages en checkout",
    purchases: "Achats",
    pageViews: "Vues de page",
    noData: "Pas encore de donnees",
    updatedAt: "Derniere mise a jour",
    currentStatus: "Statut actuel",
    copySnippet: "Copier le snippet",
    recentActivity: "Activite recente"
  },
  pages: {
    overview: {
      title: "Vue d'ensemble",
      description: "Une lecture rapide du site: trafic, pages qui performent, signaux de friction, tests en cours et niveau d'installation.",
      primaryAction: "Voir les analytics",
      secondaryAction: "Voir les experiences",
      summaryTitle: "Resume du site",
      summaryDescription: "Les chiffres essentiels a lire en premier.",
      topPagesTitle: "Pages les plus utiles",
      topPagesDescription: "Les pages qui generent trafic, actions et revenu.",
      activeTestsTitle: "Tests actifs",
      activeTestsDescription: "Ce qui tourne maintenant et ce qui est pret a etre lance.",
      setupTitle: "Installation et collecte",
      setupDescription: "Etat du SDK et progression d'onboarding.",
      bestPage: "Meilleure page",
      bestPageEmpty: "Aucune page notable pour l'instant",
      strongestInteraction: "Interaction principale",
      strongestInteractionEmpty: "Aucune interaction saillante pour l'instant",
      trackedRevenue: "Revenu observe",
      liveTests: "Tests en cours",
      noRunningTest: "Aucun test actif",
      setupProgress: "Progression d'installation",
      setupPending: "Installation a finaliser",
      recentSignalsTitle: "Signaux recents",
      recentSignalsDescription: "Ce qui vient d'etre capture sur le site.",
      recommendationsTitle: "Suggestions de tests",
      recommendationsDescription: "Pistes a examiner avant de creer une experience.",
      recommendationsDisclaimer: "Ces suggestions sont presentees comme des opportunites produit. Elles ne doivent pas etre vendues comme une analyse IA si aucun moteur IA n'est branche."
    },
    analytics: {
      title: "Analytics",
      description: "Des statistiques claires sur le trafic, le funnel et les pages qui contribuent vraiment aux conversions.",
      trafficTitle: "Vue trafic",
      trafficDescription: "Volume, engagement et progression dans le funnel.",
      funnelTitle: "Funnel de conversion",
      funnelDescription: "Le passage du visiteur jusqu'a l'achat.",
      comparisonTitle: "Comparaison de periode",
      comparisonDescription: "Periode actuelle versus precedente, avec ecarts lisibles.",
      pageTableTitle: "Pages et performance",
      pageTableDescription: "Les pages les plus vues et leur contribution business.",
      interactionTableTitle: "Zones d'interaction",
      interactionTableDescription: "Les elements cliques et leur contexte.",
      qualityTitle: "Qualite de collecte",
      qualityDescription: "Verifie rapidement si la data remonte proprement.",
      currentPeriod: "Periode actuelle",
      previousPeriod: "Periode precedente",
      delta: "Evolution"
    },
    sessions: {
      title: "Sessions",
      description: "Comprendre le comportement reel des visiteurs, les signaux de frustration et les zones cliquees.",
      replayTitle: "Replays disponibles",
      replayDescription: "Sessions suffisamment riches pour etre inspectees.",
      hotspotsTitle: "Hotspots de clic",
      hotspotsDescription: "Les zones les plus sollicitees du site.",
      diagnosticsTitle: "Diagnostics de session",
      diagnosticsDescription: "Friction, erreurs et signaux d'intention.",
      noReplay: "Aucune session exploitable n'a encore ete capturee."
    },
    activity: {
      title: "Activite",
      description: "Suivi operationnel du site: onboarding, etat SDK, flux d'evenements et historique des actions.",
      onboardingTitle: "Onboarding",
      onboardingDescription: "Ou vous en etes dans la mise en place.",
      sdkTitle: "Transport SDK",
      sdkDescription: "Sante de la collecte et derniers evenements recus.",
      feedTitle: "Flux d'activite",
      feedDescription: "Evenements recents pour verifier ce qui remonte vraiment.",
      auditTitle: "Historique",
      auditDescription: "Actions de lancement, validation et changements de workflow."
    },
    experiments: {
      title: "Experiences",
      description: "Le portefeuille de tests du site, avec un suivi clair du statut, de l'impact et du funnel.",
      createAction: "Creer une experience",
      secondaryAction: "Voir les suggestions",
      portfolioTitle: "Portefeuille",
      portfolioDescription: "Combien d'experiences existent et combien tournent vraiment.",
      readinessTitle: "Pretes a lancer",
      readinessDescription: "Ce qui est pret pour revue, approbation ou mise en ligne.",
      funnelTitle: "Impact du portefeuille",
      funnelDescription: "Contribution cumulee des experiences sur le trafic et l'achat.",
      statesTitle: "Statuts d'execution",
      statesDescription: "Repartition simple des experiences par etat."
    },
    installation: {
      title: "Installation",
      description: "Mettre Optify en place proprement, verifier la remontee d'evenements et confirmer les capacites disponibles.",
      snippetTitle: "Snippet d'installation",
      snippetDescription: "Le chemin le plus rapide pour brancher le SDK.",
      checksTitle: "Verifications",
      checksDescription: "Controle immediat de la sante d'installation.",
      guideTitle: "Guide plateforme",
      guideDescription: "Etapes concretes selon votre stack.",
      capabilitiesTitle: "Pages et capacites observees",
      capabilitiesDescription: "Ce que le SDK voit reellement aujourd'hui.",
      shopifyTitle: "Configuration Shopify",
      shopifyDescription: "Snippet Liquid, custom pixel et etat de connexion."
    },
    suggestions: {
      title: "Suggestions",
      description: "Une file d'opportunites et d'idees de tests a transformer en experiences, sans surpromesse marketing.",
      queueTitle: "File de suggestions",
      queueDescription: "Opportunites pretes a etre examinees.",
      evidenceTitle: "Elements de preuve",
      evidenceDescription: "Signaux de comportement utiles pour prioriser.",
      disclaimer: "Le produit doit parler de suggestions et d'heuristiques tant qu'aucun moteur IA reel n'alimente cette vue."
    }
  }
};

const en: Copy = {
  nav: {
    currentSite: "Current site",
    addSite: "Add site",
    command: "Command",
    observe: "Observe",
    decide: "Suggestions",
    act: "Execution",
    workspace: "Workspace",
    overview: "Overview",
    analytics: "Analytics",
    sessions: "Sessions",
    activity: "Activity",
    suggestions: "Suggestions",
    experiments: "Experiments",
    installation: "Installation",
    shopifyHub: "Shopify hub",
    billing: "Billing",
    noSite: "No site selected",
    createSiteHint: "Create a site to begin"
  },
  common: {
    revenue: "Revenue",
    visitors: "Visitors",
    sessions: "Sessions",
    conversions: "Conversions",
    addToCart: "Add to cart",
    checkout: "Checkout starts",
    purchases: "Purchases",
    pageViews: "Page views",
    noData: "No data yet",
    updatedAt: "Updated at",
    currentStatus: "Current status",
    copySnippet: "Copy snippet",
    recentActivity: "Recent activity"
  },
  pages: {
    overview: {
      title: "Overview",
      description: "A quick read of site traffic, useful pages, friction signals, live tests, and installation progress.",
      primaryAction: "Open analytics",
      secondaryAction: "Open experiments",
      summaryTitle: "Site summary",
      summaryDescription: "The essential numbers to read first.",
      topPagesTitle: "Useful pages",
      topPagesDescription: "Pages generating traffic, actions, and revenue.",
      activeTestsTitle: "Live tests",
      activeTestsDescription: "What is running now and what is ready to launch.",
      setupTitle: "Installation and tracking",
      setupDescription: "SDK status and onboarding progress.",
      bestPage: "Best page",
      bestPageEmpty: "No leading page yet",
      strongestInteraction: "Top interaction",
      strongestInteractionEmpty: "No strong interaction yet",
      trackedRevenue: "Observed revenue",
      liveTests: "Running tests",
      noRunningTest: "No live test",
      setupProgress: "Installation progress",
      setupPending: "Installation still pending",
      recentSignalsTitle: "Recent signals",
      recentSignalsDescription: "What has just been captured on the site.",
      recommendationsTitle: "Test suggestions",
      recommendationsDescription: "Opportunities to review before creating an experiment.",
      recommendationsDisclaimer: "These are product opportunities. They should not be presented as AI output unless a real AI engine powers them."
    },
    analytics: {
      title: "Analytics",
      description: "Clear stats for traffic, funnel performance, and the pages that truly contribute to conversions.",
      trafficTitle: "Traffic view",
      trafficDescription: "Volume, engagement, and funnel progression.",
      funnelTitle: "Conversion funnel",
      funnelDescription: "How visitors move from visit to purchase.",
      comparisonTitle: "Period comparison",
      comparisonDescription: "Current versus previous period with readable deltas.",
      pageTableTitle: "Pages and performance",
      pageTableDescription: "Most-viewed pages and their business contribution.",
      interactionTableTitle: "Interaction zones",
      interactionTableDescription: "Clicked elements and their context.",
      qualityTitle: "Tracking quality",
      qualityDescription: "Quick check that the data is flowing cleanly.",
      currentPeriod: "Current period",
      previousPeriod: "Previous period",
      delta: "Change"
    },
    sessions: {
      title: "Sessions",
      description: "Understand real visitor behavior, frustration signals, and the areas getting clicked.",
      replayTitle: "Available replays",
      replayDescription: "Sessions rich enough to inspect.",
      hotspotsTitle: "Click hotspots",
      hotspotsDescription: "The most-used areas of the site.",
      diagnosticsTitle: "Session diagnostics",
      diagnosticsDescription: "Friction, errors, and intent signals.",
      noReplay: "No usable session has been captured yet."
    },
    activity: {
      title: "Activity",
      description: "Operational tracking for the site: onboarding, SDK state, raw event flow, and action history.",
      onboardingTitle: "Onboarding",
      onboardingDescription: "Where setup currently stands.",
      sdkTitle: "SDK transport",
      sdkDescription: "Collection health and latest events received.",
      feedTitle: "Activity feed",
      feedDescription: "Recent events so you can verify what is actually coming in.",
      auditTitle: "History",
      auditDescription: "Launch, approval, and workflow actions."
    },
    experiments: {
      title: "Experiments",
      description: "The site's test portfolio with a clearer view of status, impact, and funnel contribution.",
      createAction: "Create experiment",
      secondaryAction: "Open suggestions",
      portfolioTitle: "Portfolio",
      portfolioDescription: "How many experiments exist and how many are truly running.",
      readinessTitle: "Ready to launch",
      readinessDescription: "Items ready for review, approval, or rollout.",
      funnelTitle: "Portfolio impact",
      funnelDescription: "Combined contribution of experiments across traffic and purchase.",
      statesTitle: "Execution states",
      statesDescription: "Simple distribution of experiments by status."
    },
    installation: {
      title: "Installation",
      description: "Set up Optify cleanly, verify live events, and confirm which capabilities are actually available.",
      snippetTitle: "Install snippet",
      snippetDescription: "The fastest path to connecting the SDK.",
      checksTitle: "Checks",
      checksDescription: "Immediate review of installation health.",
      guideTitle: "Platform guide",
      guideDescription: "Concrete steps for your stack.",
      capabilitiesTitle: "Observed pages and capabilities",
      capabilitiesDescription: "What the SDK is truly seeing today.",
      shopifyTitle: "Shopify setup",
      shopifyDescription: "Liquid snippet, custom pixel, and connection status."
    },
    suggestions: {
      title: "Suggestions",
      description: "A queue of opportunities and test ideas to turn into experiments, without fake AI framing.",
      queueTitle: "Suggestion queue",
      queueDescription: "Opportunities ready for review.",
      evidenceTitle: "Evidence",
      evidenceDescription: "Behavior signals useful for prioritization.",
      disclaimer: "This product should speak about suggestions and heuristics unless a real AI engine powers this view."
    }
  }
};

export function getSiteDashboardCopy(locale: Locale) {
  return locale === "fr" ? fr : en;
}

export function getLocaleTag(locale: Locale) {
  return locale === "fr" ? "fr-FR" : "en-US";
}

export function formatDashboardNumber(value: number, locale: Locale) {
  return new Intl.NumberFormat(getLocaleTag(locale)).format(value);
}

export function formatDashboardPercent(value: number, locale: Locale, digits = 1) {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

export function formatDashboardCurrency(value: number, locale: Locale, currency = "USD") {
  return new Intl.NumberFormat(getLocaleTag(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDashboardDateTime(input: string, locale: Locale) {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(input));
}

export function formatDashboardDate(input: string, locale: Locale) {
  return new Intl.DateTimeFormat(getLocaleTag(locale), {
    dateStyle: "medium"
  }).format(new Date(input));
}

export function formatDashboardDuration(ms: number, locale: Locale) {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (locale === "fr") {
    if (minutes === 0) return `${seconds}s`;
    return `${minutes} min ${seconds}s`;
  }
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function formatDashboardStatus(status: string, locale: Locale) {
  const map = locale === "fr"
    ? {
        running: "En cours",
        paused: "En pause",
        draft: "Brouillon",
        ready_for_review: "Pret pour revue",
        approved: "Approuve",
        scheduled: "Planifie",
        healthy: "Sain",
        warning: "A surveiller",
        fail: "Echec",
        pass: "Valide",
        warn: "A verifier",
        connected: "Connecte",
        not_connected: "Non connecte",
        needs_attention: "Attention requise",
        complete: "Termine",
        current: "En cours",
        pending: "A faire"
      }
    : {
        running: "Running",
        paused: "Paused",
        draft: "Draft",
        ready_for_review: "Ready for review",
        approved: "Approved",
        scheduled: "Scheduled",
        healthy: "Healthy",
        warning: "Warning",
        fail: "Failed",
        pass: "Passed",
        warn: "Needs review",
        connected: "Connected",
        not_connected: "Not connected",
        needs_attention: "Needs attention",
        complete: "Complete",
        current: "Current",
        pending: "Pending"
      };

  return map[status as keyof typeof map] ?? status.replaceAll("_", " ");
}

export function formatEventLabel(value: string, locale: Locale) {
  const map = locale === "fr"
    ? {
        click: "Clic",
        cta_click: "Clic CTA",
        add_to_cart: "Ajout au panier",
        checkout_start: "Debut checkout",
        purchase: "Achat",
        conversion: "Conversion",
        recommendation_click: "Clic recommandation",
        recommendation_impression: "Impression recommandation",
        rage_click: "Rage click",
        dead_click: "Clic sans effet",
        page_view: "Vue de page",
        js_error: "Erreur JS"
      }
    : {
        click: "Click",
        cta_click: "CTA click",
        add_to_cart: "Add to cart",
        checkout_start: "Checkout start",
        purchase: "Purchase",
        conversion: "Conversion",
        recommendation_click: "Recommendation click",
        recommendation_impression: "Recommendation impression",
        rage_click: "Rage click",
        dead_click: "Dead click",
        page_view: "Page view",
        js_error: "JS error"
      };

  return map[value as keyof typeof map] ?? value.replaceAll("_", " ");
}

export function formatPlatformLabel(value: string) {
  if (value === "shopify") return "Shopify";
  if (value === "webflow") return "Webflow";
  if (value === "woocommerce") return "WooCommerce";
  if (value === "salesforce") return "Salesforce";
  return "Custom";
}

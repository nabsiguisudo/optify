import type { Locale } from "@/lib/i18n";

type Copy = {
  nav: {
    currentSite: string;
    addSite: string;
    analyticsSuite: string;
    activationSuite: string;
    workspace: string;
    overview: string;
    analytics: string;
    sessions: string;
    segments: string;
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
    segments: {
      title: string;
      description: string;
      presetsTitle: string;
      presetsDescription: string;
      pinnedTitle: string;
      pinnedDescription: string;
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
    analyticsSuite: "Analyse",
    activationSuite: "Activation",
    workspace: "Workspace",
    overview: "Dashboard",
    analytics: "Analytics",
    sessions: "Sessions",
    segments: "Segments",
    activity: "Activité",
    suggestions: "Suggestions",
    experiments: "Expériences",
    installation: "Installation",
    shopifyHub: "Hub Shopify",
    billing: "Facturation",
    noSite: "Aucun site sélectionné",
    createSiteHint: "Créez un site pour commencer"
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
    noData: "Pas encore de données",
    updatedAt: "Dernière mise à jour",
    currentStatus: "Statut actuel",
    copySnippet: "Copier le snippet",
    recentActivity: "Activité récente"
  },
  pages: {
    overview: {
      title: "Dashboard",
      description: "Deux espaces très lisibles : l'analyse comportementale d'un côté, l'activation et les tests de l'autre.",
      primaryAction: "Ouvrir Analytics",
      secondaryAction: "Ouvrir Expériences",
      summaryTitle: "Résumé du site",
      summaryDescription: "Les chiffres essentiels à lire en premier.",
      topPagesTitle: "Pages les plus utiles",
      topPagesDescription: "Les pages qui génèrent trafic, actions et revenu.",
      activeTestsTitle: "Tests actifs",
      activeTestsDescription: "Ce qui tourne maintenant et ce qui est prêt à être lancé.",
      setupTitle: "Installation et collecte",
      setupDescription: "État du SDK et progression d'onboarding.",
      bestPage: "Meilleure page",
      bestPageEmpty: "Aucune page notable pour l'instant",
      strongestInteraction: "Interaction principale",
      strongestInteractionEmpty: "Aucune interaction saillante pour l'instant",
      trackedRevenue: "Revenu observé",
      liveTests: "Tests en cours",
      noRunningTest: "Aucun test actif",
      setupProgress: "Progression d'installation",
      setupPending: "Installation à finaliser",
      recentSignalsTitle: "Signaux récents",
      recentSignalsDescription: "Ce qui vient d'être capturé sur le site.",
      recommendationsTitle: "Suggestions de tests",
      recommendationsDescription: "Pistes à examiner avant de créer une expérience.",
      recommendationsDisclaimer: "Ces suggestions sont présentées comme des opportunités produit. Elles ne doivent pas être vendues comme une analyse IA si aucun moteur IA n'est branché."
    },
    analytics: {
      title: "Analytics",
      description: "Des statistiques claires sur le trafic, le funnel et les pages qui contribuent vraiment aux conversions.",
      trafficTitle: "Vue trafic",
      trafficDescription: "Volume, engagement et progression dans le funnel.",
      funnelTitle: "Funnel de conversion",
      funnelDescription: "Le passage du visiteur jusqu'à l'achat.",
      comparisonTitle: "Comparaison de période",
      comparisonDescription: "Période actuelle versus précédente, avec écarts lisibles.",
      pageTableTitle: "Pages et performance",
      pageTableDescription: "Les pages les plus vues et leur contribution business.",
      interactionTableTitle: "Zones d'interaction",
      interactionTableDescription: "Les éléments cliqués et leur contexte.",
      qualityTitle: "Qualité de collecte",
      qualityDescription: "Vérifie rapidement si la data remonte proprement.",
      currentPeriod: "Période actuelle",
      previousPeriod: "Période précédente",
      delta: "Évolution"
    },
    sessions: {
      title: "Sessions",
      description: "Comprendre le comportement réel des visiteurs, les signaux de frustration et les zones cliquées.",
      replayTitle: "Replays disponibles",
      replayDescription: "Sessions suffisamment riches pour être inspectées.",
      hotspotsTitle: "Hotspots de clic",
      hotspotsDescription: "Les zones les plus sollicitées du site.",
      diagnosticsTitle: "Diagnostics de session",
      diagnosticsDescription: "Friction, erreurs et signaux d'intention.",
      noReplay: "Aucune session exploitable n'a encore été capturée."
    },
    segments: {
      title: "Segments",
      description: "Créer des lectures comportementales simples à partir des pages, clics et étapes du funnel.",
      presetsTitle: "Segments prêts à l'emploi",
      presetsDescription: "Des vues utiles pour démarrer sans construire des filtres complexes.",
      pinnedTitle: "Segments à épingler",
      pinnedDescription: "Les segments importants à garder sous la main dans ton dashboard."
    },
    activity: {
      title: "Activité",
      description: "Suivi opérationnel du site : onboarding, état SDK, flux d'événements et historique des actions.",
      onboardingTitle: "Onboarding",
      onboardingDescription: "Où vous en êtes dans la mise en place.",
      sdkTitle: "Transport SDK",
      sdkDescription: "Santé de la collecte et derniers événements reçus.",
      feedTitle: "Flux d'activité",
      feedDescription: "Événements récents pour vérifier ce qui remonte vraiment.",
      auditTitle: "Historique",
      auditDescription: "Actions de lancement, validation et changements de workflow."
    },
    experiments: {
      title: "Expériences",
      description: "Le portefeuille de tests du site, avec un suivi clair du statut, de l'impact et du funnel.",
      createAction: "Créer une expérience",
      secondaryAction: "Voir les suggestions",
      portfolioTitle: "Portefeuille",
      portfolioDescription: "Combien d'expériences existent et combien tournent vraiment.",
      readinessTitle: "Prêtes à lancer",
      readinessDescription: "Ce qui est prêt pour revue, approbation ou mise en ligne.",
      funnelTitle: "Impact du portefeuille",
      funnelDescription: "Contribution cumulée des expériences sur le trafic et l'achat.",
      statesTitle: "Statuts d'exécution",
      statesDescription: "Répartition simple des expériences par état."
    },
    installation: {
      title: "Installation",
      description: "Mettre Optify en place proprement, vérifier la remontée d'événements et confirmer les capacités disponibles.",
      snippetTitle: "Snippet d'installation",
      snippetDescription: "Le chemin le plus rapide pour brancher le SDK.",
      checksTitle: "Vérifications",
      checksDescription: "Contrôle immédiat de la santé d'installation.",
      guideTitle: "Guide plateforme",
      guideDescription: "Étapes concrètes selon votre stack.",
      capabilitiesTitle: "Pages et capacités observées",
      capabilitiesDescription: "Ce que le SDK voit réellement aujourd'hui.",
      shopifyTitle: "Configuration Shopify",
      shopifyDescription: "Snippet Liquid, custom pixel et état de connexion."
    },
    suggestions: {
      title: "Suggestions",
      description: "Une file d'opportunités et d'idées de tests à transformer en expériences, sans surpromesse marketing.",
      queueTitle: "File de suggestions",
      queueDescription: "Opportunités prêtes à être examinées.",
      evidenceTitle: "Éléments de preuve",
      evidenceDescription: "Signaux de comportement utiles pour prioriser.",
      disclaimer: "Le produit doit parler de suggestions et d'heuristiques tant qu'aucun moteur IA réel n'alimente cette vue."
    }
  }
};

const en: Copy = {
  nav: {
    currentSite: "Current site",
    addSite: "Add site",
    analyticsSuite: "Analytics",
    activationSuite: "Activation",
    workspace: "Workspace",
    overview: "Dashboard",
    analytics: "Analytics",
    sessions: "Sessions",
    segments: "Segments",
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
      title: "Dashboard",
      description: "Two clean spaces: behavior analytics on one side, activation and testing on the other.",
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
    segments: {
      title: "Segments",
      description: "Create simple behavior views from pages, clicks, and funnel milestones.",
      presetsTitle: "Ready-made segments",
      presetsDescription: "Useful views to start without complex filtering.",
      pinnedTitle: "Pin-worthy segments",
      pinnedDescription: "The segments that deserve a fixed place on your dashboard."
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
        ready_for_review: "Prêt pour revue",
        approved: "Approuvé",
        scheduled: "Planifié",
        healthy: "Sain",
        warning: "À surveiller",
        fail: "Échec",
        pass: "Validé",
        warn: "À vérifier",
        connected: "Connecté",
        not_connected: "Non connecté",
        needs_attention: "Attention requise",
        complete: "Terminé",
        current: "En cours",
        pending: "À faire"
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
        checkout_start: "Début checkout",
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

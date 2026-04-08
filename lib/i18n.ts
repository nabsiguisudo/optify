export const LOCALE_COOKIE = "optify-lang";

export type Locale = "fr" | "en" | "it" | "es" | "de";

export const localeLabels: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  it: "IT",
  es: "ES",
  de: "DE"
};

export function resolveLocale(input?: string): Locale {
  if (input === "en" || input === "it" || input === "es" || input === "de") {
    return input;
  }
  return "fr";
}

export function withLang(href: string, locale: Locale) {
  const [base, hash = ""] = href.split("#");
  const [pathname, query = ""] = base.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", locale);
  const search = params.toString();
  const hashSuffix = hash ? `#${hash}` : "";
  return `${pathname}${search ? `?${search}` : ""}${hashSuffix}`;
}

const dictionary = {
  fr: {
    meta: {
      description: "SaaS d'A/B testing pour Shopify, Webflow, WooCommerce et Salesforce Commerce Cloud."
    },
    common: {
      appName: "Optify",
      dashboard: "Tableau de bord",
      features: "Fonctionnalites",
      integrations: "Integrations",
      launchApp: "Ouvrir l'app",
      signIn: "Connexion",
      signUp: "Creer un compte",
      createOne: "Creer un compte",
      sendMagicLink: "Envoyer un magic link",
      currentPlan: "Offre actuelle",
      upgradeWithStripe: "Passer a Stripe",
      winner: "Gagnant",
      actionable: "Actionnable",
      stripeReady: "Pret pour Stripe",
      proTrial: "Essai Pro",
      experimentOs: "OS d'experimentation",
      aiTestIdeas: "Idees de tests IA",
      aiReports: "Rapports IA",
      loadingProject: "Creation du projet...",
      loadingExperiment: "Creation de l'experience...",
      variant: "Variante",
      noWinnerYet: "Pas encore de gagnant",
      openExperiment: "Ouvrir l'experience",
      openReport: "Ouvrir le rapport",
      installSdk: "Installer le SDK",
      newExperiment: "Nouvelle experience",
      createProject: "Creer un projet",
      createExperiment: "Creer une experience",
      detailedReportsEnabled: "Rapports detailles actifs",
      allSources: "Toutes les sources",
      allDevices: "Tous les appareils",
      mobile: "Mobile",
      desktop: "Desktop",
      paid: "Paid",
      email: "Email",
      organic: "Organic",
      draft: "Brouillon",
      running: "En cours",
      paused: "En pause",
      conversion: "Conversion",
      click: "Clic",
      pageView: "Vue de page",
      visualEdit: "Edition visuelle",
      customCode: "Code personnalise",
      status: "Statut",
      visitors: "Visiteurs",
      primaryMetric: "Metrique principale",
      trafficSplit: "Repartition du trafic",
      conversionRate: "Taux de conversion",
      uplift: "Uplift",
      audience: "Audience",
      recommendations: "Recommandations",
      executiveSummary: "Resume executif",
      winnerNarrative: "Narratif du gagnant",
      audienceInsights: "Insights audience",
      insights: "Insights",
      nextActions: "Prochaines actions",
      risksToWatch: "Risques a surveiller",
      productRecommendations: "Recommandations produit",
      platformGuide: "Guide plateforme",
      scriptSnippet: "Snippet de script",
      shareOfTraffic: "part du trafic",
      bestVariant: "Meilleure variante",
      peakCr: "pic de CR",
      detailedExperimentAnalysis: "Analyse detaillee de l'experience",
      installOnProject: "Installer Optify sur",
      useProjectLevelSdk: "Utilise la cle SDK du projet et le guide d'installation pour",
      allExperiments: "Toutes les experiences",
      recommendationOpportunities: "Opportunites de recommandation",
      conversionPerformance: "Performance de conversion",
      aiOpportunityFeed: "Flux d'opportunites IA",
      audiencePulse: "Pouls audience",
      noDomChanges: "Variante controle sans modification DOM.",
      onSelector: "sur",
      forProject: "configurees pour le projet",
      triggerConversion: "Declencher une conversion"
    },
    nav: {
      overview: "Vue d'ensemble",
      experiments: "Experiences",
      audience: "Audience",
      recommendations: "Recommandations",
      newProject: "Nouveau projet",
      billing: "Facturation"
    },
    site: {
      tagline: "A/B testing IA pour le commerce moderne",
      heroEyebrow: "MVP pret pour la production",
      heroTitle: "Lance des experiences revenu sur chaque storefront sans deployer de code.",
      heroBody: "Optify donne aux equipes growth un workflow d'experimentation clair, un SDK d'assignation sticky, des analytics de conversion et des idees de tests propulsees par l'IA.",
      createFirstProject: "Creer un premier projet",
      upliftDetection: "Detection d'uplift avec badge gagnant",
      installOnce: "Installe une fois, pilote tous les tests en live",
      oneScript: "1 script",
      fiveIdeas: "5 idees",
      aiSuggested: "Experiences suggerees par IA en un clic",
      fastOnboarding: "Onboarding rapide",
      steps: ["Creer un projet", "Copier le snippet SDK", "Lancer la premiere experience"],
      stepBodies: [
        "Stocke domaine, plateforme et acces workspace dans un modele projet propre.",
        "Installe le script sur n'importe quelle plateforme supportee via un guide dedie.",
        "Configure des variantes basees sur des selecteurs et regarde les conversions remonter dans le dashboard."
      ],
      features: [
        {
          title: "Editeur de variantes no-code",
          body: "Modifie textes, labels CTA, visibilite et CSS via une logique visuelle basee sur des selecteurs."
        },
        {
          title: "Installation multi-plateforme",
          body: "Utilise un seul SDK sur Shopify, Webflow, WooCommerce, Salesforce Commerce Cloud ou une vitrine custom."
        },
        {
          title: "Idees CRO enrichies par l'IA",
          body: "Genere des hypotheses de tests pertinentes avec des prompts OpenAI concus pour l'optimisation de conversion."
        }
      ]
    },
    auth: {
      welcomeBack: "Bon retour",
      signInBody: "Utilise l'auth email Supabase ou le magic link en production.",
      noAccount: "Pas encore de compte ?",
      createWorkspace: "Cree ton espace Optify",
      signUpBody: "Email/mot de passe et magic links sont modeles pour Supabase Auth.",
      fullName: "Nom complet",
      password: "Mot de passe",
      alreadyHaveAccount: "Tu as deja un compte ?"
    },
    dashboard: {
      heroBadge: "MVP pret",
      heroTitle: "Une experimentation claire pour les equipes growth qui cherchent du signal, pas des vanity dashboards.",
      heroBody: "Cree des workspaces projet, lance des A/B tests sticky, ingere les pages vues et conversions, et genere des idees alimentees par l'IA depuis des pages reelles.",
      onboarding: "Onboarding",
      onboardingItems: [
        { title: "Creer un projet", body: "Stocke domaine, plateforme et cle SDK publique." },
        { title: "Installer le script", body: "Colle un seul snippet dans ton theme ou ton espace custom code." },
        { title: "Lancer un test", body: "Utilise les suggestions IA ou configure les variantes a la main." }
      ],
      projects: "Projets",
      experiments: "Experiences",
      topUplift: "Meilleur uplift",
      winningVariant: "variante gagnante",
      runningExperiment: "Experience en cours",
      noActiveExperiment: "Aucune experience active",
      aiOpportunityBody: "Idees prioritaires basees sur des heuristiques CRO.",
      aiIdeas: [
        "Tester un wording CTA plus urgent sur les fiches produit",
        "Remonter la preuve sociale au-dessus de la ligne de flottaison sur mobile",
        "Masquer les contenus hero secondaires pour accelerer la decision"
      ],
      generateNewIdeas: "Generer de nouvelles idees",
      recommendationBody: "Placements produit a forte marge et forte intention, prets a etre testes."
    },
    audiencePage: {
      title: "Audience",
      body: "Segments, variantes les plus performantes et prochains tests a montrer selon les profils."
    },
    billingPage: {
      title: "Monetiser avec un pricing product-led",
      body: "Gratuit pour le setup, Pro pour les workflows growth, puis pricing a l'usage sur les visiteurs ou evenements trackes.",
      perMonth: "/mo",
      plans: [
        {
          name: "Free",
          description: "Parfait pour valider et poser les bases.",
          features: ["1 projet", "2 experiences actives", "10k evenements trackes"]
        },
        {
          name: "Pro",
          description: "Pense pour les equipes growth internes.",
          features: ["Projets illimites", "Suggestions IA", "250k evenements trackes"]
        },
        {
          name: "Scale",
          description: "Pour les equipes ecommerce multi-marques.",
          features: ["Support prioritaire", "Depassement a l'usage", "Integrations avancees"]
        }
      ]
    },
    experimentsPage: {
      body: "Inventaire central de chaque projet, de l'etat gagnant et du point d'entree vers le rapport detaille."
    },
    projectForm: {
      title: "Creer un projet",
      body: "Configure un workspace site et recupere ton snippet d'installation en moins d'une minute."
    },
    experimentForm: {
      title: "Creer une experience",
      body: "Cree une vraie experience avec variantes generees et modifications DOM basees sur des selecteurs.",
      hypothesisPlaceholder: "Les utilisateurs hesitent car le CTA parait trop generique et pas assez urgent.",
      variantSchemaTitle: "Schema d'editeur de variantes",
      variantSchemaBody: "Chaque variante stocke des changements basees sur selecteurs pour le texte, les CTA, la visibilite et le CSS.",
      variants: "Variantes",
      variantB: "Texte CTA variante B",
      variantC: "Texte CTA variante C",
      customDomCode: "Code DOM personnalise pour la variante selectionnee."
    },
    suggestionsPage: {
      placeholder: "https://example.com/fiche-produit",
      button: "Generer des idees",
      impact: "impact"
    },
    experimentTable: {
      title: "Inventaire des experiences",
      body: "Tous les projets, statuts et signaux de performance au meme endroit."
    },
    recommendationsPage: {
      title: "Recommandations produit",
      body: "Idees de recommandations facon Dynamic Yield a connecter aux placements PDP, panier, checkout ou homepage."
    },
    installationPage: {
      installGuides: {
        shopify: [
          "Ouvre Boutique en ligne > Themes > Modifier le code.",
          "Colle la balise script dans theme.liquid avant </head>.",
          "Publie puis verifie les evenements page_view dans Optify."
        ],
        webflow: [
          "Ouvre Project Settings > Custom Code.",
          "Colle le script dans Head Code.",
          "Publie le site puis confirme l'assignation SDK."
        ],
        woocommerce: [
          "Ajoute le script dans le header de ton child theme ou via un plugin header/footer.",
          "Confirme que le script charge sur les pages cibles.",
          "Cree des experiences en reutilisant les selecteurs CSS deja presents sur le site."
        ],
        salesforce: [
          "Ajoute le script au template storefront ou a l'include de page.",
          "Utilise les page patterns Optify pour cadrer les tests.",
          "Valide les evenements depuis la preprod avant passage en production."
        ],
        custom: [
          "Colle la balise script dans ton layout principal avant </head>.",
          "Assure-toi que les selecteurs cibles existent apres hydration.",
          "Envoie les conversions custom avec window.optify.track('conversion')."
        ]
      }
    },
    demo: {
      sandbox: "Sandbox produit",
      title: "Booster de conversion Optify",
      subtitle: "La facon la plus propre de tester des experiences sticky sur une fiche produit sans toucher a la production.",
      devtools: "Ouvre les DevTools et regarde les requetes vers",
      howTo: "Comment utiliser cette sandbox",
      steps: [
        "Charge cette page plusieurs fois en fenetre privee pour observer l'assignation sticky.",
        "Clique sur le CTA principal pour emettre un evenement de clic.",
        "Utilise \"Declencher une conversion\" pour envoyer une conversion sur l'experience active.",
        "Reviens au dashboard de l'experience pour inspecter les metriques mises a jour."
      ],
      buyNow: "Acheter maintenant"
    }
  },
  en: {
    meta: {
      description: "A/B testing SaaS for Shopify, Webflow, WooCommerce, and Salesforce Commerce Cloud."
    },
    common: {
      appName: "Optify",
      dashboard: "Dashboard",
      features: "Features",
      integrations: "Integrations",
      launchApp: "Launch app",
      signIn: "Sign in",
      signUp: "Create account",
      createOne: "Create one",
      sendMagicLink: "Send magic link",
      currentPlan: "Current plan",
      upgradeWithStripe: "Upgrade with Stripe",
      winner: "Winner",
      actionable: "Actionable",
      stripeReady: "Stripe-ready",
      proTrial: "Pro trial",
      experimentOs: "Experiment OS",
      aiTestIdeas: "AI test ideas",
      aiReports: "AI reports",
      loadingProject: "Creating project...",
      loadingExperiment: "Creating experiment...",
      variant: "Variant",
      noWinnerYet: "No winner yet",
      openExperiment: "Open experiment",
      openReport: "Open report",
      installSdk: "Install SDK",
      newExperiment: "New experiment",
      createProject: "Create project",
      createExperiment: "Create experiment",
      detailedReportsEnabled: "Detailed reports enabled",
      allSources: "All sources",
      allDevices: "All devices",
      mobile: "Mobile",
      desktop: "Desktop",
      paid: "Paid",
      email: "Email",
      organic: "Organic",
      draft: "Draft",
      running: "Running",
      paused: "Paused",
      conversion: "Conversion",
      click: "Click",
      pageView: "Page view",
      visualEdit: "Visual edit",
      customCode: "Custom code",
      status: "Status",
      visitors: "Visitors",
      primaryMetric: "Primary metric",
      trafficSplit: "Traffic split",
      conversionRate: "Conversion rate",
      uplift: "Uplift",
      audience: "Audience",
      recommendations: "Recommendations",
      executiveSummary: "Executive summary",
      winnerNarrative: "Winner narrative",
      audienceInsights: "Audience insights",
      insights: "Insights",
      nextActions: "Next actions",
      risksToWatch: "Risks to watch",
      productRecommendations: "Product recommendations",
      platformGuide: "Platform guide",
      scriptSnippet: "Script snippet",
      shareOfTraffic: "share of traffic",
      bestVariant: "Best variant",
      peakCr: "peak CR",
      detailedExperimentAnalysis: "Detailed experiment analysis",
      installOnProject: "Install Optify on",
      useProjectLevelSdk: "Use the project-level SDK key and guided install for",
      allExperiments: "All experiments",
      recommendationOpportunities: "Recommendation opportunities",
      conversionPerformance: "Conversion performance",
      aiOpportunityFeed: "AI opportunity feed",
      audiencePulse: "Audience pulse",
      noDomChanges: "Control variant with no DOM changes.",
      onSelector: "on",
      forProject: "configured for project",
      triggerConversion: "Trigger conversion"
    },
    nav: {
      overview: "Overview",
      experiments: "Experiments",
      audience: "Audience",
      recommendations: "Recommendations",
      newProject: "New project",
      billing: "Billing"
    },
    site: {
      tagline: "AI A/B testing for modern commerce",
      heroEyebrow: "Production-ready MVP",
      heroTitle: "Run revenue experiments across every storefront without shipping code.",
      heroBody: "Optify gives growth teams a clean experiment workflow, a sticky assignment SDK, real conversion analytics, and AI-powered test ideas.",
      createFirstProject: "Create first project",
      upliftDetection: "Uplift detection with winner badges",
      installOnce: "Install once, control every live test",
      oneScript: "1 script",
      fiveIdeas: "5 ideas",
      aiSuggested: "AI-suggested experiments in one click",
      fastOnboarding: "Fast onboarding",
      steps: ["Create project", "Copy SDK snippet", "Launch first experiment"],
      stepBodies: [
        "Store domain, platform, and workspace access in a clean project model.",
        "Install the script on any supported commerce platform using guided instructions.",
        "Configure selector-based variants and watch conversions populate in the dashboard."
      ],
      features: [
        {
          title: "No-code variant editor",
          body: "Change copy, CTA labels, visibility, and CSS overrides with selector-based visual logic."
        },
        {
          title: "Cross-platform install",
          body: "Use one SDK across Shopify, Webflow, WooCommerce, Salesforce Commerce Cloud, or any custom storefront."
        },
        {
          title: "AI-backed CRO ideas",
          body: "Generate smart experiment hypotheses using OpenAI prompts built for conversion optimization."
        }
      ]
    },
    auth: {
      welcomeBack: "Welcome back",
      signInBody: "Use Supabase email auth or magic link in production.",
      noAccount: "No account yet?",
      createWorkspace: "Create your Optify workspace",
      signUpBody: "Email/password and magic links are modeled for Supabase Auth.",
      fullName: "Full name",
      password: "Password",
      alreadyHaveAccount: "Already have an account?"
    },
    dashboard: {
      heroBadge: "MVP ready",
      heroTitle: "Clear experimentation for growth teams who care about signal, not vanity dashboards.",
      heroBody: "Build project workspaces, launch sticky A/B tests, ingest page views and conversions, and generate AI-powered ideas from live pages.",
      onboarding: "Onboarding",
      onboardingItems: [
        { title: "Create project", body: "Store domain, platform, and public SDK key." },
        { title: "Install script", body: "Paste one snippet into your storefront theme or custom code area." },
        { title: "Launch test", body: "Use AI suggestions or configure variants manually." }
      ],
      projects: "Projects",
      experiments: "Experiments",
      topUplift: "Top uplift",
      winningVariant: "winning variant",
      runningExperiment: "Running experiment",
      noActiveExperiment: "No active experiment",
      aiOpportunityBody: "Prioritized ideas rooted in CRO heuristics.",
      aiIdeas: [
        "Test urgency-driven CTA language on product pages",
        "Move customer proof above the fold on mobile",
        "Hide lower-priority hero content for faster decision-making"
      ],
      generateNewIdeas: "Generate new ideas",
      recommendationBody: "High-margin and high-intent product placements ready for experimentation."
    },
    audiencePage: {
      title: "Audience",
      body: "Segments, best-performing variants, and who should see which test next."
    },
    billingPage: {
      title: "Monetize with product-led pricing",
      body: "Free for setup, Pro for growth workflows, and usage-based pricing on tracked visitors or events.",
      perMonth: "/mo",
      plans: [
        {
          name: "Free",
          description: "Perfect for validation and early setup.",
          features: ["1 project", "2 active experiments", "10k tracked events"]
        },
        {
          name: "Pro",
          description: "Built for in-house growth teams.",
          features: ["Unlimited projects", "AI suggestions", "250k tracked events"]
        },
        {
          name: "Scale",
          description: "For multi-brand ecommerce teams.",
          features: ["Priority support", "Usage-based overage", "Advanced integrations"]
        }
      ]
    },
    experimentsPage: {
      body: "Central inventory for every project, winner state, and detailed report entry point."
    },
    projectForm: {
      title: "Create a project",
      body: "Set up a site workspace and get your install snippet in under a minute."
    },
    experimentForm: {
      title: "Create an experiment",
      body: "Create a real experiment record with generated variants and selector-based DOM changes.",
      hypothesisPlaceholder: "Users hesitate because the CTA feels generic and low urgency.",
      variantSchemaTitle: "Variant editor schema",
      variantSchemaBody: "Each variant stores selector-based changes for text, CTA copy, visibility, and CSS overrides.",
      variants: "Variants",
      variantB: "Variant B CTA text",
      variantC: "Variant C CTA text",
      customDomCode: "Custom DOM code for the selected variant."
    },
    suggestionsPage: {
      placeholder: "https://example.com/product-page",
      button: "Generate ideas",
      impact: "impact"
    },
    experimentTable: {
      title: "Experiment inventory",
      body: "All projects, statuses, and performance signals in one place."
    },
    recommendationsPage: {
      title: "Product recommendations",
      body: "Dynamic Yield-style recommendation ideas you can connect to PDP, cart, checkout, or homepage placements."
    },
    installationPage: {
      installGuides: {
        shopify: [
          "Open Online Store > Themes > Edit code.",
          "Paste the script tag into theme.liquid before </head>.",
          "Publish and verify page_view events in Optify."
        ],
        webflow: [
          "Open Project Settings > Custom Code.",
          "Paste the script into Head Code.",
          "Publish the site and confirm SDK assignment."
        ],
        woocommerce: [
          "Add the script in your child theme header or via a header/footer plugin.",
          "Confirm script loads on target pages.",
          "Create experiments using CSS selectors already present on the site."
        ],
        salesforce: [
          "Add the script to the storefront template or page include.",
          "Use Optify page patterns to scope tests.",
          "Validate events from staging before rolling to production."
        ],
        custom: [
          "Paste the script tag in your base layout before </head>.",
          "Ensure target selectors exist after hydration.",
          "Send custom conversion events with window.optify.track('conversion')."
        ]
      }
    },
    demo: {
      sandbox: "Product sandbox",
      title: "Optify Conversion Booster",
      subtitle: "The cleanest way to test sticky experiments on a product page without touching production.",
      devtools: "Open DevTools and watch requests hit",
      howTo: "How to use this sandbox",
      steps: [
        "Load this page a few times in a private window to see sticky assignment behavior.",
        "Click the primary CTA to emit a click event.",
        "Use \"Trigger conversion\" to send a conversion event for the running experiment.",
        "Return to the experiment dashboard to inspect updated metrics."
      ],
      buyNow: "Buy now"
    }
  },
  it: {} as any,
  es: {} as any,
  de: {} as any
} as const;

dictionary.it = {
  ...dictionary.en,
  common: {
    ...dictionary.en.common,
    dashboard: "Dashboard",
    features: "Funzionalita",
    integrations: "Integrazioni",
    launchApp: "Apri app",
    signIn: "Accedi",
    signUp: "Crea account",
    createOne: "Creane uno",
    sendMagicLink: "Invia magic link",
    currentPlan: "Piano attuale",
    upgradeWithStripe: "Passa a Stripe",
    actionable: "Azionabile",
    stripeReady: "Pronto per Stripe",
    aiReports: "Report IA",
    loadingProject: "Creazione progetto...",
    loadingExperiment: "Creazione esperimento...",
    openExperiment: "Apri esperimento",
    openReport: "Apri report",
    installSdk: "Installa SDK",
    newExperiment: "Nuovo esperimento",
    createProject: "Crea progetto",
    createExperiment: "Crea esperimento",
    allSources: "Tutte le sorgenti",
    allDevices: "Tutti i dispositivi",
    draft: "Bozza",
    running: "Attivo",
    paused: "In pausa",
    conversion: "Conversione",
    click: "Clic",
    pageView: "Visualizzazione pagina",
    visitors: "Visitatori",
    primaryMetric: "Metrica principale",
    trafficSplit: "Ripartizione traffico",
    conversionRate: "Tasso di conversione",
    audience: "Audience",
    recommendations: "Raccomandazioni",
    executiveSummary: "Sintesi esecutiva",
    winnerNarrative: "Narrazione del vincitore",
    audienceInsights: "Insight audience",
    insights: "Insight",
    nextActions: "Prossime azioni",
    risksToWatch: "Rischi da monitorare",
    productRecommendations: "Raccomandazioni prodotto",
    platformGuide: "Guida piattaforma",
    scriptSnippet: "Snippet script",
    shareOfTraffic: "quota di traffico",
    bestVariant: "Migliore variante",
    detailedExperimentAnalysis: "Analisi dettagliata dell'esperimento",
    installOnProject: "Installa Optify su",
    useProjectLevelSdk: "Usa la chiave SDK del progetto e la guida di installazione per",
    allExperiments: "Tutti gli esperimenti",
    recommendationOpportunities: "Opportunita di raccomandazione",
    conversionPerformance: "Performance di conversione",
    aiOpportunityFeed: "Feed di opportunita IA",
    audiencePulse: "Polso audience",
    noDomChanges: "Variante controllo senza modifiche DOM.",
    triggerConversion: "Attiva conversione",
    detailedReportsEnabled: "Report dettagliati attivi",
    peakCr: "picco CR",
    onSelector: "su",
    forProject: "varianti configurate per il progetto"
  },
  nav: {
    overview: "Panoramica",
    experiments: "Esperimenti",
    audience: "Audience",
    recommendations: "Raccomandazioni",
    newProject: "Nuovo progetto",
    billing: "Fatturazione"
  },
  site: {
    ...dictionary.en.site,
    tagline: "A/B testing IA per il commercio moderno",
    heroEyebrow: "MVP pronto per la produzione",
    heroTitle: "Lancia esperimenti revenue su ogni storefront senza rilasciare codice.",
    heroBody: "Optify offre ai team growth un workflow chiaro, un SDK di assegnazione sticky, analytics di conversione e idee di test guidate dall'IA.",
    createFirstProject: "Crea il primo progetto",
    upliftDetection: "Rilevazione uplift con badge vincitore",
    installOnce: "Installa una volta, controlla ogni test live",
    fiveIdeas: "5 idee",
    aiSuggested: "Esperimenti suggeriti dall'IA in un click",
    fastOnboarding: "Onboarding rapido",
    steps: ["Crea progetto", "Copia snippet SDK", "Lancia il primo esperimento"],
    stepBodies: [
      "Salva dominio, piattaforma e accesso workspace in un modello progetto pulito.",
      "Installa lo script su qualsiasi piattaforma supportata con guida dedicata.",
      "Configura varianti basate su selettori e osserva le conversioni nel dashboard."
    ],
    features: [
      { title: "Editor varianti no-code", body: "Modifica copy, CTA, visibilita e CSS con logica visuale basata su selettori." },
      { title: "Installazione cross-platform", body: "Usa un solo SDK su Shopify, Webflow, WooCommerce, Salesforce Commerce Cloud o storefront custom." },
      { title: "Idee CRO supportate dall'IA", body: "Genera ipotesi di test intelligenti con prompt OpenAI pensati per la conversione." }
    ]
  },
  auth: {
    welcomeBack: "Bentornato",
    signInBody: "Usa l'autenticazione email Supabase o il magic link in produzione.",
    noAccount: "Nessun account?",
    createWorkspace: "Crea il tuo workspace Optify",
    signUpBody: "Email/password e magic link sono modellati per Supabase Auth.",
    fullName: "Nome completo",
    password: "Password",
    alreadyHaveAccount: "Hai gia un account?"
  },
  dashboard: {
    ...dictionary.en.dashboard,
    heroBadge: "MVP pronto",
    heroTitle: "Sperimentazione chiara per team growth che vogliono segnale, non vanity dashboard.",
    heroBody: "Crea workspace progetto, lancia A/B test sticky, raccogli page view e conversioni e genera idee IA da pagine live.",
    onboarding: "Onboarding",
    onboardingItems: [
      { title: "Crea progetto", body: "Salva dominio, piattaforma e chiave SDK pubblica." },
      { title: "Installa script", body: "Incolla uno snippet nel tema storefront o nell'area custom code." },
      { title: "Lancia test", body: "Usa suggerimenti IA o configura manualmente le varianti." }
    ],
    projects: "Progetti",
    topUplift: "Miglior uplift",
    winningVariant: "variante vincente",
    runningExperiment: "Esperimento attivo",
    noActiveExperiment: "Nessun esperimento attivo",
    aiOpportunityBody: "Idee prioritarie basate su euristiche CRO.",
    aiIdeas: [
      "Testare CTA piu urgenti sulle pagine prodotto",
      "Portare la social proof above the fold su mobile",
      "Nascondere contenuti hero secondari per accelerare la decisione"
    ],
    generateNewIdeas: "Genera nuove idee",
    recommendationBody: "Placement prodotto ad alto margine e alta intenzione pronti per essere testati."
  },
  audiencePage: {
    title: "Audience",
    body: "Segmenti, varianti migliori e quali test mostrare ai diversi profili."
  },
  billingPage: {
    title: "Monetizza con pricing product-led",
    body: "Gratis per il setup, Pro per i workflow growth e pricing a consumo su visitatori o eventi tracciati.",
    perMonth: "/mese",
    plans: [
      { name: "Free", description: "Perfetto per validare e impostare le basi.", features: ["1 progetto", "2 esperimenti attivi", "10k eventi tracciati"] },
      { name: "Pro", description: "Pensato per team growth interni.", features: ["Progetti illimitati", "Suggerimenti IA", "250k eventi tracciati"] },
      { name: "Scale", description: "Per team ecommerce multi-brand.", features: ["Supporto prioritario", "Overage a consumo", "Integrazioni avanzate"] }
    ]
  },
  experimentsPage: {
    body: "Inventario centrale di ogni progetto, stato vincitore e accesso al report dettagliato."
  },
  projectForm: {
    title: "Crea un progetto",
    body: "Configura un workspace sito e ottieni lo snippet di installazione in meno di un minuto."
  },
  experimentForm: {
    title: "Crea un esperimento",
    body: "Crea un vero record di esperimento con varianti generate e modifiche DOM basate su selettori.",
    hypothesisPlaceholder: "Gli utenti esitano perche la CTA sembra troppo generica e poco urgente.",
    variantSchemaTitle: "Schema editor varianti",
    variantSchemaBody: "Ogni variante salva modifiche basate su selettori per testo, CTA, visibilita e CSS.",
    variants: "Varianti",
    variantB: "Testo CTA variante B",
    variantC: "Testo CTA variante C",
    customDomCode: "Codice DOM personalizzato per la variante selezionata."
  },
  suggestionsPage: {
    placeholder: "https://example.com/pagina-prodotto",
    button: "Genera idee",
    impact: "impatto"
  },
  experimentTable: {
    title: "Inventario esperimenti",
    body: "Tutti i progetti, stati e segnali di performance in un solo posto."
  },
  recommendationsPage: {
    title: "Raccomandazioni prodotto",
    body: "Idee di raccomandazione in stile Dynamic Yield da collegare a PDP, carrello, checkout o homepage."
  },
  demo: {
    sandbox: "Sandbox prodotto",
    title: "Optify Conversion Booster",
    subtitle: "Il modo piu pulito per testare esperimenti sticky su una pagina prodotto senza toccare la produzione.",
    devtools: "Apri DevTools e osserva le richieste verso",
    howTo: "Come usare questa sandbox",
    steps: [
      "Carica questa pagina piu volte in finestra privata per vedere l'assegnazione sticky.",
      "Clicca la CTA principale per inviare un evento click.",
      "Usa \"Attiva conversione\" per inviare una conversione sull'esperimento attivo.",
      "Torna al dashboard dell'esperimento per vedere le metriche aggiornate."
    ],
    buyNow: "Acquista ora"
  }
};

dictionary.es = {
  ...dictionary.en,
  common: {
    ...dictionary.en.common,
    dashboard: "Panel",
    features: "Funciones",
    integrations: "Integraciones",
    launchApp: "Abrir app",
    signIn: "Iniciar sesion",
    signUp: "Crear cuenta",
    createOne: "Crear una",
    sendMagicLink: "Enviar magic link",
    currentPlan: "Plan actual",
    upgradeWithStripe: "Actualizar con Stripe",
    actionable: "Accionable",
    stripeReady: "Listo para Stripe",
    aiReports: "Informes IA",
    loadingProject: "Creando proyecto...",
    loadingExperiment: "Creando experimento...",
    openExperiment: "Abrir experimento",
    openReport: "Abrir informe",
    installSdk: "Instalar SDK",
    newExperiment: "Nuevo experimento",
    createProject: "Crear proyecto",
    createExperiment: "Crear experimento",
    allSources: "Todas las fuentes",
    allDevices: "Todos los dispositivos",
    draft: "Borrador",
    running: "Activo",
    paused: "En pausa",
    conversion: "Conversion",
    click: "Clic",
    pageView: "Vista de pagina",
    visitors: "Visitantes",
    primaryMetric: "Metrica principal",
    trafficSplit: "Distribucion de trafico",
    conversionRate: "Tasa de conversion",
    audience: "Audiencia",
    recommendations: "Recomendaciones",
    executiveSummary: "Resumen ejecutivo",
    winnerNarrative: "Narrativa del ganador",
    audienceInsights: "Insights de audiencia",
    nextActions: "Siguientes acciones",
    risksToWatch: "Riesgos a vigilar",
    productRecommendations: "Recomendaciones de producto",
    platformGuide: "Guia de plataforma",
    scriptSnippet: "Snippet de script",
    shareOfTraffic: "cuota de trafico",
    bestVariant: "Mejor variante",
    detailedExperimentAnalysis: "Analisis detallado del experimento",
    installOnProject: "Instalar Optify en",
    useProjectLevelSdk: "Usa la clave SDK del proyecto y la guia de instalacion para",
    allExperiments: "Todos los experimentos",
    recommendationOpportunities: "Oportunidades de recomendacion",
    conversionPerformance: "Rendimiento de conversion",
    aiOpportunityFeed: "Feed de oportunidades IA",
    audiencePulse: "Pulso de audiencia",
    noDomChanges: "Variante control sin cambios DOM.",
    triggerConversion: "Activar conversion",
    detailedReportsEnabled: "Informes detallados activos",
    peakCr: "pico CR",
    onSelector: "en",
    forProject: "variantes configuradas para el proyecto"
  },
  nav: {
    overview: "Resumen",
    experiments: "Experimentos",
    audience: "Audiencia",
    recommendations: "Recomendaciones",
    newProject: "Nuevo proyecto",
    billing: "Facturacion"
  },
  site: {
    ...dictionary.en.site,
    tagline: "A/B testing IA para comercio moderno",
    heroEyebrow: "MVP listo para produccion",
    heroTitle: "Lanza experimentos de ingresos en cada storefront sin desplegar codigo.",
    heroBody: "Optify da a los equipos growth un workflow claro, un SDK sticky, analytics de conversion y ideas de test impulsadas por IA.",
    createFirstProject: "Crear primer proyecto",
    upliftDetection: "Deteccion de uplift con badges de ganador",
    installOnce: "Instala una vez, controla todos los tests live",
    fiveIdeas: "5 ideas",
    aiSuggested: "Experimentos sugeridos por IA en un clic",
    fastOnboarding: "Onboarding rapido",
    steps: ["Crear proyecto", "Copiar snippet SDK", "Lanzar primer experimento"],
    stepBodies: [
      "Guarda dominio, plataforma y acceso al workspace en un modelo limpio.",
      "Instala el script en cualquier plataforma soportada con guia guiada.",
      "Configura variantes basadas en selectores y mira las conversiones en el dashboard."
    ],
    features: [
      { title: "Editor de variantes sin codigo", body: "Cambia copy, CTA, visibilidad y CSS con logica visual basada en selectores." },
      { title: "Instalacion multiplataforma", body: "Usa un unico SDK en Shopify, Webflow, WooCommerce, Salesforce Commerce Cloud o storefront custom." },
      { title: "Ideas CRO con IA", body: "Genera hipotesis de test inteligentes con prompts OpenAI pensados para conversion." }
    ]
  },
  auth: {
    welcomeBack: "Bienvenido de nuevo",
    signInBody: "Usa auth por email de Supabase o magic link en produccion.",
    noAccount: "Aun no tienes cuenta?",
    createWorkspace: "Crea tu workspace de Optify",
    signUpBody: "Email/password y magic links estan modelados para Supabase Auth.",
    fullName: "Nombre completo",
    password: "Contrasena",
    alreadyHaveAccount: "Ya tienes cuenta?"
  },
  dashboard: {
    ...dictionary.en.dashboard,
    heroBadge: "MVP listo",
    heroTitle: "Experimentacion clara para equipos growth que quieren senal, no vanity dashboards.",
    heroBody: "Crea workspaces por proyecto, lanza A/B tests sticky, ingiere page views y conversiones y genera ideas IA desde paginas reales.",
    onboardingItems: [
      { title: "Crear proyecto", body: "Guarda dominio, plataforma y clave SDK publica." },
      { title: "Instalar script", body: "Pega un snippet en el tema o en el area de custom code." },
      { title: "Lanzar test", body: "Usa sugerencias IA o configura variantes manualmente." }
    ],
    projects: "Proyectos",
    topUplift: "Mayor uplift",
    winningVariant: "variante ganadora",
    runningExperiment: "Experimento activo",
    noActiveExperiment: "Ningun experimento activo",
    aiOpportunityBody: "Ideas priorizadas basadas en heuristicas CRO.",
    aiIdeas: [
      "Probar un CTA con mas urgencia en paginas de producto",
      "Subir la prueba social above the fold en mobile",
      "Ocultar contenido hero secundario para acelerar la decision"
    ],
    generateNewIdeas: "Generar nuevas ideas",
    recommendationBody: "Placements de alto margen y alta intencion listos para experimentar."
  },
  audiencePage: {
    title: "Audiencia",
    body: "Segmentos, variantes con mejor rendimiento y que test mostrar a cada perfil."
  },
  billingPage: {
    title: "Monetizar con pricing product-led",
    body: "Gratis para setup, Pro para workflows growth y pricing por uso segun visitantes o eventos rastreados.",
    perMonth: "/mes",
    plans: [
      { name: "Free", description: "Perfecto para validar y preparar la base.", features: ["1 proyecto", "2 experimentos activos", "10k eventos rastreados"] },
      { name: "Pro", description: "Pensado para equipos growth internos.", features: ["Proyectos ilimitados", "Sugerencias IA", "250k eventos rastreados"] },
      { name: "Scale", description: "Para equipos ecommerce multi-marca.", features: ["Soporte prioritario", "Exceso por uso", "Integraciones avanzadas"] }
    ]
  },
  experimentsPage: {
    body: "Inventario central de cada proyecto, estado ganador y acceso al informe detallado."
  },
  projectForm: {
    title: "Crear un proyecto",
    body: "Configura un workspace del sitio y consigue tu snippet de instalacion en menos de un minuto."
  },
  experimentForm: {
    title: "Crear un experimento",
    body: "Crea un experimento real con variantes generadas y cambios DOM basados en selectores.",
    hypothesisPlaceholder: "Los usuarios dudan porque la CTA parece generica y con poca urgencia.",
    variantSchemaTitle: "Esquema del editor de variantes",
    variantSchemaBody: "Cada variante guarda cambios por selectores para texto, CTA, visibilidad y CSS.",
    variants: "Variantes",
    variantB: "Texto CTA variante B",
    variantC: "Texto CTA variante C",
    customDomCode: "Codigo DOM personalizado para la variante seleccionada."
  },
  suggestionsPage: {
    placeholder: "https://example.com/pagina-producto",
    button: "Generar ideas",
    impact: "impacto"
  },
  experimentTable: {
    title: "Inventario de experimentos",
    body: "Todos los proyectos, estados y senales de rendimiento en un solo lugar."
  },
  recommendationsPage: {
    title: "Recomendaciones de producto",
    body: "Ideas de recomendacion estilo Dynamic Yield para PDP, carrito, checkout o homepage."
  },
  demo: {
    sandbox: "Sandbox de producto",
    title: "Optify Conversion Booster",
    subtitle: "La forma mas limpia de probar experimentos sticky en una pagina de producto sin tocar produccion.",
    devtools: "Abre DevTools y observa las peticiones a",
    howTo: "Como usar esta sandbox",
    steps: [
      "Carga esta pagina varias veces en ventana privada para ver el comportamiento sticky.",
      "Haz clic en la CTA principal para emitir un evento click.",
      "Usa \"Activar conversion\" para enviar una conversion al experimento activo.",
      "Vuelve al dashboard del experimento para revisar las metricas actualizadas."
    ],
    buyNow: "Comprar ahora"
  }
};

dictionary.de = {
  ...dictionary.en,
  common: {
    ...dictionary.en.common,
    dashboard: "Dashboard",
    features: "Funktionen",
    integrations: "Integrationen",
    launchApp: "App starten",
    signIn: "Anmelden",
    signUp: "Konto erstellen",
    createOne: "Eins erstellen",
    sendMagicLink: "Magic Link senden",
    currentPlan: "Aktueller Plan",
    upgradeWithStripe: "Mit Stripe upgraden",
    actionable: "Umsetzbar",
    stripeReady: "Stripe-ready",
    aiReports: "KI-Berichte",
    loadingProject: "Projekt wird erstellt...",
    loadingExperiment: "Experiment wird erstellt...",
    openExperiment: "Experiment offnen",
    openReport: "Report offnen",
    installSdk: "SDK installieren",
    newExperiment: "Neues Experiment",
    createProject: "Projekt erstellen",
    createExperiment: "Experiment erstellen",
    allSources: "Alle Quellen",
    allDevices: "Alle Gerate",
    draft: "Entwurf",
    running: "Aktiv",
    paused: "Pausiert",
    conversion: "Conversion",
    click: "Klick",
    pageView: "Seitenaufruf",
    visitors: "Besucher",
    primaryMetric: "Hauptmetrik",
    trafficSplit: "Traffic-Split",
    conversionRate: "Conversion-Rate",
    audience: "Audience",
    recommendations: "Empfehlungen",
    executiveSummary: "Executive Summary",
    winnerNarrative: "Sieger-Narrativ",
    audienceInsights: "Audience-Insights",
    nextActions: "Nachte Schritte",
    risksToWatch: "Zu beobachtende Risiken",
    productRecommendations: "Produktempfehlungen",
    platformGuide: "Plattformleitfaden",
    scriptSnippet: "Script-Snippet",
    shareOfTraffic: "Anteil am Traffic",
    bestVariant: "Beste Variante",
    detailedExperimentAnalysis: "Detaillierte Experimentanalyse",
    installOnProject: "Optify installieren auf",
    useProjectLevelSdk: "Verwende den projektweiten SDK-Schlussel und die Installationsanleitung fur",
    allExperiments: "Alle Experimente",
    recommendationOpportunities: "Empfehlungs-Chancen",
    conversionPerformance: "Conversion-Performance",
    aiOpportunityFeed: "KI-Chancenfeed",
    audiencePulse: "Audience-Puls",
    noDomChanges: "Kontrollvariante ohne DOM-Anderungen.",
    triggerConversion: "Conversion auslosen",
    detailedReportsEnabled: "Detaillierte Reports aktiv",
    peakCr: "Peak CR",
    onSelector: "auf",
    forProject: "Varianten fuer das Projekt konfiguriert"
  },
  nav: {
    overview: "Ubersicht",
    experiments: "Experimente",
    audience: "Audience",
    recommendations: "Empfehlungen",
    newProject: "Neues Projekt",
    billing: "Abrechnung"
  },
  site: {
    ...dictionary.en.site,
    tagline: "KI A/B-Testing fuer modernen Commerce",
    heroEyebrow: "Produktionsreifes MVP",
    heroTitle: "Starte Umsatzexperimente ueber jeden Storefront hinweg ohne Code-Deployment.",
    heroBody: "Optify gibt Growth-Teams einen klaren Workflow, ein sticky SDK, Conversion-Analytics und KI-gestuetzte Testideen.",
    createFirstProject: "Erstes Projekt erstellen",
    upliftDetection: "Uplift-Erkennung mit Gewinner-Badges",
    installOnce: "Einmal installieren, alle Live-Tests steuern",
    fiveIdeas: "5 Ideen",
    aiSuggested: "Von KI vorgeschlagene Experimente mit einem Klick",
    fastOnboarding: "Schnelles Onboarding",
    steps: ["Projekt erstellen", "SDK-Snippet kopieren", "Erstes Experiment starten"],
    stepBodies: [
      "Domain, Plattform und Workspace-Zugriff in einem sauberen Projektmodell speichern.",
      "Das Script mit gefuehrter Anleitung auf jeder unterstuetzten Plattform installieren.",
      "Selektorbasierte Varianten konfigurieren und Conversions im Dashboard beobachten."
    ],
    features: [
      { title: "No-Code Varianten-Editor", body: "Aendere Copy, CTA-Texte, Sichtbarkeit und CSS mit selektorbasierter visueller Logik." },
      { title: "Plattformuebergreifende Installation", body: "Nutze ein SDK fuer Shopify, Webflow, WooCommerce, Salesforce Commerce Cloud oder Custom Storefronts." },
      { title: "KI-gestuetzte CRO-Ideen", body: "Erzeuge smarte Testhypothesen mit OpenAI-Prompts fuer Conversion-Optimierung." }
    ]
  },
  auth: {
    welcomeBack: "Willkommen zuruck",
    signInBody: "Nutze Supabase E-Mail-Auth oder Magic Link in Produktion.",
    noAccount: "Noch kein Konto?",
    createWorkspace: "Erstelle deinen Optify Workspace",
    signUpBody: "E-Mail/Passwort und Magic Links sind fuer Supabase Auth modelliert.",
    fullName: "Vollstandiger Name",
    password: "Passwort",
    alreadyHaveAccount: "Hast du bereits ein Konto?"
  },
  dashboard: {
    ...dictionary.en.dashboard,
    heroBadge: "MVP bereit",
    heroTitle: "Klare Experimentierung fuer Growth-Teams, die Signal statt Vanity Dashboards wollen.",
    heroBody: "Erstelle Projekt-Workspaces, starte sticky A/B-Tests, erfasse Page Views und Conversions und generiere KI-Ideen aus Live-Seiten.",
    onboardingItems: [
      { title: "Projekt erstellen", body: "Domain, Plattform und oeffentlichen SDK-Schluessel speichern." },
      { title: "Script installieren", body: "Ein Snippet in Theme oder Custom-Code-Bereich einfuegen." },
      { title: "Test starten", body: "KI-Vorschlaege nutzen oder Varianten manuell konfigurieren." }
    ],
    projects: "Projekte",
    topUplift: "Top Uplift",
    winningVariant: "gewinnende Variante",
    runningExperiment: "Aktives Experiment",
    noActiveExperiment: "Kein aktives Experiment",
    aiOpportunityBody: "Priorisierte Ideen auf Basis von CRO-Heuristiken.",
    aiIdeas: [
      "Dringlichere CTA-Sprache auf Produktseiten testen",
      "Social Proof auf Mobile weiter nach oben ziehen",
      "Sekundaeren Hero-Content ausblenden, um Entscheidungen zu beschleunigen"
    ],
    generateNewIdeas: "Neue Ideen generieren",
    recommendationBody: "Produktplatzierungen mit hoher Marge und hoher Intention, bereit fuer Experimente."
  },
  audiencePage: {
    title: "Audience",
    body: "Segmente, beste Varianten und welcher Test welchem Profil als naechstes gezeigt werden sollte."
  },
  billingPage: {
    title: "Mit product-led Pricing monetarisieren",
    body: "Kostenlos fuer Setup, Pro fuer Growth-Workflows und nutzungsbasiertes Pricing auf Besucher oder Events.",
    perMonth: "/Monat",
    plans: [
      { name: "Free", description: "Perfekt fuer Validierung und fruehen Setup.", features: ["1 Projekt", "2 aktive Experimente", "10k getrackte Events"] },
      { name: "Pro", description: "Fuer interne Growth-Teams gebaut.", features: ["Unbegrenzte Projekte", "KI-Vorschlaege", "250k getrackte Events"] },
      { name: "Scale", description: "Fuer Multi-Brand-Ecommerce-Teams.", features: ["Priorisierter Support", "Nutzungsbasierter Aufpreis", "Erweiterte Integrationen"] }
    ]
  },
  experimentsPage: {
    body: "Zentrales Inventar fuer jedes Projekt, Gewinnerstatus und Einstieg in den Detailreport."
  },
  projectForm: {
    title: "Projekt erstellen",
    body: "Richte einen Site-Workspace ein und erhalte dein Installations-Snippet in unter einer Minute."
  },
  experimentForm: {
    title: "Experiment erstellen",
    body: "Erstelle einen echten Experiment-Datensatz mit generierten Varianten und selektorbasierten DOM-Aenderungen.",
    hypothesisPlaceholder: "Nutzer zoegern, weil die CTA zu generisch und nicht dringend genug wirkt.",
    variantSchemaTitle: "Varianten-Editor-Schema",
    variantSchemaBody: "Jede Variante speichert selektorbasierte Aenderungen fuer Text, CTA, Sichtbarkeit und CSS.",
    variants: "Varianten",
    variantB: "CTA-Text Variante B",
    variantC: "CTA-Text Variante C",
    customDomCode: "Benutzerdefinierter DOM-Code fuer die ausgewaehlte Variante."
  },
  suggestionsPage: {
    placeholder: "https://example.com/produktseite",
    button: "Ideen generieren",
    impact: "Impact"
  },
  experimentTable: {
    title: "Experiment-Inventar",
    body: "Alle Projekte, Statuswerte und Performance-Signale an einem Ort."
  },
  recommendationsPage: {
    title: "Produktempfehlungen",
    body: "Dynamic-Yield-aehnliche Empfehlungsideen fuer PDP, Warenkorb, Checkout oder Homepage."
  },
  demo: {
    sandbox: "Produkt-Sandbox",
    title: "Optify Conversion Booster",
    subtitle: "Der sauberste Weg, sticky Experimente auf einer Produktseite zu testen, ohne die Produktion zu beruehren.",
    devtools: "Oeffne DevTools und beobachte Requests an",
    howTo: "So nutzt du diese Sandbox",
    steps: [
      "Lade diese Seite mehrmals im privaten Fenster, um sticky Zuweisungen zu sehen.",
      "Klicke die primaere CTA, um ein Click-Event auszusenden.",
      "Nutze \"Conversion auslosen\", um eine Conversion fuer das aktive Experiment zu senden.",
      "Gehe zum Experiment-Dashboard zurueck, um aktualisierte Metriken zu sehen."
    ],
    buyNow: "Jetzt kaufen"
  }
};

export function getDictionary(locale: Locale) {
  return dictionary[locale];
}

export function localizeStatus(status: string, locale: Locale) {
  const t = getDictionary(locale).common;
  if (status === "running") return t.running;
  if (status === "paused") return t.paused;
  return t.draft;
}

export function localizeMetric(metric: string, locale: Locale) {
  const t = getDictionary(locale).common;
  if (metric === "click") return t.click;
  if (metric === "page_view") return t.pageView;
  return t.conversion;
}

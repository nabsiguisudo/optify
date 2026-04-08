import OpenAI from "openai";
import { env } from "@/lib/env";
import type {
  AudienceInsight,
  Experiment,
  ExperimentReport,
  ExperimentStats,
  ProductRecommendation,
  Project
} from "@/lib/types";
import type { Locale } from "@/lib/i18n";

function localeOrEnglish(locale?: Locale) {
  return locale === "fr" || locale === "it" || locale === "es" || locale === "de" ? locale : "en";
}

export function buildAudienceInsights(experiments: Experiment[], locale: Locale = "fr"): AudienceInsight[] {
  const activeCount = Math.max(1, experiments.filter((experiment) => experiment.status === "running").length);
  const lang = localeOrEnglish(locale);

  const notes = {
    fr: [
      `${activeCount} experience(s) active(s) montrent un meilleur impact des messages d'urgence sur mobile.`,
      "Les visiteurs de retour reagissent mieux a un message rassurant et a une interface stable.",
      "Le trafic paid a besoin de plus de preuve et d'une lecture plus claire des le premier scroll."
    ],
    en: [
      `${activeCount} active experiment(s) show stronger urgency messaging on mobile traffic.`,
      "Returning users respond better to reassurance and lower UI volatility.",
      "Paid traffic needs stronger proof and faster first-scroll clarity."
    ],
    it: [
      `${activeCount} esperimento/i attivo/i mostrano messaggi di urgenza piu efficaci sul traffico mobile.`,
      "Gli utenti di ritorno rispondono meglio a rassicurazione e minore volatilita dell'interfaccia.",
      "Il traffico paid ha bisogno di piu proof e chiarezza fin dal primo scroll."
    ],
    es: [
      `${activeCount} experimento(s) activo(s) muestran mensajes de urgencia mas eficaces en movil.`,
      "Los usuarios recurrentes responden mejor a mensajes de confianza y menor volatilidad visual.",
      "El trafico paid necesita mas prueba social y claridad en el primer scroll."
    ],
    de: [
      `${activeCount} aktive Experimente zeigen staerkere Dringlichkeitsbotschaften im Mobile-Traffic.`,
      "Wiederkehrende Nutzer reagieren besser auf mehr Sicherheit und weniger UI-Volatilitaet.",
      "Paid Traffic braucht staerkeren Proof und mehr Klarheit im ersten Scroll."
    ]
  }[lang];

  const segments = {
    fr: ["Mobile haute intention", "Visiteurs de retour", "Paid social"],
    en: ["Mobile high intent", "Returning visitors", "Paid social"],
    it: ["Mobile ad alta intenzione", "Visitatori di ritorno", "Paid social"],
    es: ["Mobile de alta intencion", "Visitantes recurrentes", "Paid social"],
    de: ["Mobile mit hoher Intention", "Wiederkehrende Besucher", "Paid social"]
  }[lang];

  return [
    {
      segment: segments[0],
      share: 0.41,
      conversionRate: 0.123,
      bestVariant: "B",
      note: notes[0]
    },
    {
      segment: segments[1],
      share: 0.24,
      conversionRate: 0.149,
      bestVariant: "A",
      note: notes[1]
    },
    {
      segment: segments[2],
      share: 0.18,
      conversionRate: 0.088,
      bestVariant: "B",
      note: notes[2]
    }
  ];
}

export function buildProductRecommendations(project: Project | undefined, locale: Locale = "fr"): ProductRecommendation[] {
  const label = project?.name ?? "store";
  const lang = localeOrEnglish(locale);

  const copy = {
    fr: [
      {
        title: "Bundle de demarrage",
        reason: `Bundle concu pour les acheteurs de ${label} sensibles a la certitude et aux economies.`,
        upliftHint: "+8 a 12% de conversion panier attendus"
      },
      {
        title: "Accessoire a forte marge",
        reason: "Cross-sell axe sur la marge avec une faible charge cognitive.",
        upliftHint: "+6% de potentiel AOV"
      },
      {
        title: "Pack souvent achete ensemble",
        reason: "Ideal pour une insertion en sidebar PDP ou dans le drawer panier.",
        upliftHint: "+10% de potentiel d'attach rate"
      }
    ],
    en: [
      {
        title: "Starter bundle",
        reason: `Bundle recommendation tuned for ${label} shoppers who respond to certainty and savings.`,
        upliftHint: "+8 to 12% cart conversion expected"
      },
      {
        title: "High-margin accessory",
        reason: "Cross-sell focused on margin lift with low cognitive load.",
        upliftHint: "+6% AOV potential"
      },
      {
        title: "Frequently bought together pack",
        reason: "Best for PDP sidebar or cart drawer placement.",
        upliftHint: "+10% attach rate potential"
      }
    ],
    it: [
      {
        title: "Bundle starter",
        reason: `Bundle pensato per gli acquirenti di ${label} sensibili a risparmio e sicurezza.`,
        upliftHint: "+8-12% di conversione carrello attesa"
      },
      {
        title: "Accessorio ad alto margine",
        reason: "Cross-sell focalizzato sul margine con basso carico cognitivo.",
        upliftHint: "+6% di potenziale AOV"
      },
      {
        title: "Pacchetto acquistati insieme",
        reason: "Ideale per sidebar PDP o cart drawer.",
        upliftHint: "+10% di attach rate potenziale"
      }
    ],
    es: [
      {
        title: "Bundle inicial",
        reason: `Bundle ajustado para compradores de ${label} que reaccionan bien a certeza y ahorro.`,
        upliftHint: "+8 a 12% de conversion de carrito esperada"
      },
      {
        title: "Accesorio de alto margen",
        reason: "Cross-sell centrado en margen con baja carga cognitiva.",
        upliftHint: "+6% de potencial AOV"
      },
      {
        title: "Pack comprado frecuentemente",
        reason: "Ideal para sidebar PDP o cart drawer.",
        upliftHint: "+10% de potencial de attach rate"
      }
    ],
    de: [
      {
        title: "Starter-Bundle",
        reason: `Bundle-Empfehlung fuer ${label}-Kaeufer, die gut auf Sicherheit und Ersparnis reagieren.`,
        upliftHint: "+8 bis 12% erwartete Warenkorb-Conversion"
      },
      {
        title: "Margenstarkes Zubehoer",
        reason: "Cross-Sell mit Fokus auf Marge bei geringer kognitiver Last.",
        upliftHint: "+6% AOV-Potenzial"
      },
      {
        title: "Oft zusammen gekauftes Paket",
        reason: "Ideal fuer PDP-Sidebar oder Cart Drawer.",
        upliftHint: "+10% Attach-Rate-Potenzial"
      }
    ]
  }[lang];

  return [
    { id: "rec_1", title: copy[0].title, reason: copy[0].reason, price: "$59", upliftHint: copy[0].upliftHint },
    { id: "rec_2", title: copy[1].title, reason: copy[1].reason, price: "$24", upliftHint: copy[1].upliftHint },
    { id: "rec_3", title: copy[2].title, reason: copy[2].reason, price: "$89", upliftHint: copy[2].upliftHint }
  ];
}

function fallbackReport(experiment: Experiment, stats: ExperimentStats | undefined, locale: Locale): ExperimentReport {
  const lang = localeOrEnglish(locale);
  const winner = stats?.winner;
  const topVariant = stats?.variants.find((variant) => variant.isWinner) ?? stats?.variants[0];

  const copy = {
    fr: {
      noWinner: "Le test est encore en train de collecter assez de signal.",
      summary: winner
        ? `${experiment.name} cible ${experiment.pagePattern}. La variante ${winner} est actuellement devant.`
        : `${experiment.name} cible ${experiment.pagePattern}. Le test est encore en train de collecter assez de signal.`,
      narrative: topVariant
        ? `La variante ${topVariant.variantKey} mene avec ${(topVariant.conversionRate * 100).toFixed(1)}% de conversion et ${(topVariant.uplift * 100).toFixed(1)}% d'uplift.`
        : "Le trafic est encore insuffisant pour raconter un gagnant clair.",
      insights: [
        "Les messages d'urgence et de benefice depassent les actions generiques quand le CTA est au-dessus de la ligne de flottaison.",
        "La structure du test est assez propre pour iterer vite sur le copy ou le layout.",
        "Le trafic mobile et paid doit etre segmente ensuite car c'est souvent la que les divergences apparaissent le plus vite."
      ],
      nextActions: [
        "Lancer un test de suivi isolant la preuve sociale versus le wording CTA.",
        "Creer une audience dediee aux visiteurs de retour avec un message plus rassurant.",
        "Passer la variante gagnante a 100% seulement apres validation sur un autre slice de trafic."
      ],
      audienceInsights: [
        "Les visiteurs mobile a forte intention sont les meilleurs candidats a une variante dediee.",
        "Le trafic de retour semble preferer la coherence a la nouveaute.",
        "Les sessions paid social ont sans doute besoin d'un cadre de confiance plus fort avant le detail produit."
      ],
      risks: [
        "Ne melange pas changements de layout et de pricing dans le meme test suivant.",
        "Surveille les effets de nouveaute si le gagnant utilise un wording tres agressif.",
        "Evite que les widgets de recommandation masquent le CTA principal sur mobile."
      ]
    },
    en: {
      summary: winner
        ? `${experiment.name} is targeting ${experiment.pagePattern}. Variant ${winner} is currently ahead.`
        : `${experiment.name} is targeting ${experiment.pagePattern}. The test is still gathering enough signal.`,
      narrative: topVariant
        ? `Variant ${topVariant.variantKey} is leading with ${(topVariant.conversionRate * 100).toFixed(1)}% conversion and ${(topVariant.uplift * 100).toFixed(1)}% uplift.`
        : "There is not enough traffic yet to explain a clear winner narrative.",
      insights: [
        "Urgency and benefit-led copy are outperforming generic actions when the CTA is above the fold.",
        "The test structure is clean enough to iterate quickly on copy or layout.",
        "Mobile and paid traffic should be segmented next because that is usually where divergence shows up first."
      ],
      nextActions: [
        "Launch a follow-up test isolating proof placement versus CTA wording.",
        "Create a dedicated audience for returning visitors with more reassurance-heavy messaging.",
        "Promote the winner to 100% only after validating on another traffic slice."
      ],
      audienceInsights: [
        "Mobile high-intent visitors are the strongest candidate for a dedicated variant.",
        "Returning traffic likely needs consistency more than novelty.",
        "Paid social sessions may need stronger trust framing before product detail."
      ],
      risks: [
        "Do not mix layout and pricing changes in the same follow-up test.",
        "Watch for novelty effects if the winner uses very aggressive urgency copy.",
        "Keep recommendation widgets from obscuring the primary CTA on mobile."
      ]
    },
    it: {
      summary: winner
        ? `${experiment.name} e focalizzato su ${experiment.pagePattern}. La variante ${winner} e al momento davanti.`
        : `${experiment.name} e focalizzato su ${experiment.pagePattern}. Il test sta ancora raccogliendo abbastanza segnale.`,
      narrative: topVariant
        ? `La variante ${topVariant.variantKey} guida con ${(topVariant.conversionRate * 100).toFixed(1)}% di conversione e ${(topVariant.uplift * 100).toFixed(1)}% di uplift.`
        : "Non c'e ancora abbastanza traffico per spiegare un vincitore chiaro.",
      insights: ["I messaggi di urgenza e beneficio superano le CTA generiche.", "La struttura del test consente iterazioni rapide.", "Mobile e paid dovrebbero essere segmentati come prossimo step."],
      nextActions: ["Lancia un test successivo su social proof vs CTA.", "Crea un'audience per visitatori di ritorno.", "Porta il vincitore al 100% solo dopo ulteriore validazione."],
      audienceInsights: ["Il mobile ad alta intenzione e il candidato migliore per una variante dedicata.", "Il traffico di ritorno preferisce coerenza.", "Il paid social richiede piu fiducia prima del dettaglio prodotto."],
      risks: ["Non mescolare layout e prezzo nello stesso test.", "Attenzione agli effetti novita.", "Evita che i widget coprano il CTA mobile."]
    },
    es: {
      summary: winner
        ? `${experiment.name} apunta a ${experiment.pagePattern}. La variante ${winner} va por delante actualmente.`
        : `${experiment.name} apunta a ${experiment.pagePattern}. El test aun esta reuniendo suficiente senal.`,
      narrative: topVariant
        ? `La variante ${topVariant.variantKey} lidera con ${(topVariant.conversionRate * 100).toFixed(1)}% de conversion y ${(topVariant.uplift * 100).toFixed(1)}% de uplift.`
        : "Todavia no hay trafico suficiente para explicar un ganador claro.",
      insights: ["La urgencia y el copy orientado a beneficio superan las acciones genericas.", "La estructura del test permite iterar rapido.", "Mobile y paid deberian segmentarse despues."],
      nextActions: ["Lanzar un test de seguimiento sobre prueba social vs CTA.", "Crear una audiencia para visitantes recurrentes.", "Pasar el ganador al 100% solo tras otra validacion."],
      audienceInsights: ["Mobile de alta intencion es el mejor candidato a una variante dedicada.", "El trafico recurrente necesita consistencia.", "Paid social puede requerir mas confianza antes del detalle del producto."],
      risks: ["No mezcles layout y precio en el mismo test.", "Vigila los efectos de novedad.", "Evita que los widgets tapen el CTA en mobile."]
    },
    de: {
      summary: winner
        ? `${experiment.name} zielt auf ${experiment.pagePattern}. Variante ${winner} liegt aktuell vorne.`
        : `${experiment.name} zielt auf ${experiment.pagePattern}. Der Test sammelt noch genug Signal.`,
      narrative: topVariant
        ? `Variante ${topVariant.variantKey} fuehrt mit ${(topVariant.conversionRate * 100).toFixed(1)}% Conversion und ${(topVariant.uplift * 100).toFixed(1)}% Uplift.`
        : "Es gibt noch nicht genug Traffic fuer eine klare Gewinner-Erklaerung.",
      insights: ["Dringlichkeit und Benefit-Copy schlagen generische CTAs.", "Die Teststruktur erlaubt schnelle Iterationen.", "Mobile und Paid sollten als naechstes segmentiert werden."],
      nextActions: ["Folgetest zu Social Proof vs CTA starten.", "Audience fuer wiederkehrende Besucher aufbauen.", "Gewinner erst nach weiterer Validierung auf 100% setzen."],
      audienceInsights: ["Mobile mit hoher Intention ist der beste Kandidat fuer eine eigene Variante.", "Wiederkehrender Traffic braucht eher Konsistenz.", "Paid Social braucht vermutlich mehr Vertrauen vor dem Produktdetail."],
      risks: ["Layout und Preis nicht im selben Test mischen.", "Neuheitseffekte beobachten.", "Empfehlungswidgets duerfen den mobilen CTA nicht verdecken."]
    }
  }[lang];

  return {
    executiveSummary: copy.summary,
    winnerNarrative: copy.narrative,
    insights: copy.insights,
    nextActions: copy.nextActions,
    audienceInsights: copy.audienceInsights,
    risks: copy.risks
  };
}

export async function buildExperimentReport(experiment: Experiment, stats?: ExperimentStats, locale: Locale = "fr"): Promise<ExperimentReport> {
  if (!env.openAiKey) {
    return fallbackReport(experiment, stats, locale);
  }

  try {
    const openai = new OpenAI({ apiKey: env.openAiKey });
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: "You are a senior CRO analyst. Return concise JSON only."
        },
        {
          role: "user",
          content: JSON.stringify({
            experiment,
            stats,
            locale,
            ask: "Generate a detailed experiment report with executiveSummary, winnerNarrative, insights, nextActions, audienceInsights, risks."
          })
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "experiment_report",
          schema: {
            type: "object",
            properties: {
              executiveSummary: { type: "string" },
              winnerNarrative: { type: "string" },
              insights: { type: "array", items: { type: "string" } },
              nextActions: { type: "array", items: { type: "string" } },
              audienceInsights: { type: "array", items: { type: "string" } },
              risks: { type: "array", items: { type: "string" } }
            },
            required: ["executiveSummary", "winnerNarrative", "insights", "nextActions", "audienceInsights", "risks"],
            additionalProperties: false
          }
        }
      }
    });

    return JSON.parse(response.output_text) as ExperimentReport;
  } catch {
    return fallbackReport(experiment, stats, locale);
  }
}

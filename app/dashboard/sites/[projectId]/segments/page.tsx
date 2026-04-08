import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DashboardEmpty,
  DashboardMetricList,
  DashboardPageHeader,
  DashboardSection,
  DashboardStatusBadge
} from "@/components/dashboard/site-dashboard-primitives";
import { getProjectAnalytics, getProjectBehaviorInsights, getProjectById, getProjectSessionDiagnostics } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";
import { formatDashboardNumber, formatDashboardPercent, getSiteDashboardCopy } from "@/lib/site-dashboard";

function formatPageLabel(pathname?: string) {
  if (!pathname) return null;
  if (pathname === "/" || pathname === "/home") return "Accueil";
  return pathname;
}

export default async function SiteSegmentsPage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const copy = getSiteDashboardCopy(locale);
  const project = await getProjectById(projectId);
  if (!project) notFound();

  const [analytics, behavior, sessions] = await Promise.all([
    getProjectAnalytics(projectId),
    getProjectBehaviorInsights(projectId),
    getProjectSessionDiagnostics(projectId, 12)
  ]);

  const topPage = behavior.topPages[0];
  const topInteraction = behavior.topInteractions[0];
  const highFrictionSessions = sessions.filter((session) => session.rageClicks > 0 || session.deadClicks > 0).length;
  const highIntentSessions = sessions.filter((session) => session.conversions > 0 || session.revenue > 0).length;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow={copy.pages.segments.title}
        title={project.name}
        description={copy.pages.segments.description}
        actions={(
          <>
            <Button asChild>
              <Link href={withLang(`/dashboard/sites/${projectId}/analytics`, locale)}>Retour à Analytics</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/sites/${projectId}/overview`, locale)}>Retour au dashboard</Link>
            </Button>
          </>
        )}
        meta={(
          <>
            <DashboardStatusBadge label="Lecture ciblée" tone="good" />
            <DashboardStatusBadge label={`${formatDashboardNumber(behavior.topPages.length, locale)} pages utiles`} tone="muted" />
            <DashboardStatusBadge label={`${formatDashboardNumber(behavior.topInteractions.length, locale)} interactions clés`} />
          </>
        )}
      />

      <DashboardSection title="Pourquoi cette page existe" description="Les segments servent à sortir du bruit global pour suivre un comportement précis, comme dans un outil analytics avancé.">
        <DashboardMetricList
          items={[
            {
              label: "Segment de page",
              value: topPage ? formatPageLabel(topPage.pathname) ?? "Accueil" : "À définir",
              note: "Exemple : tous les visiteurs qui arrivent sur une fiche produit précise."
            },
            {
              label: "Segment d'intention",
              value: `${formatDashboardNumber(highIntentSessions, locale)} sessions`,
              note: "Exemple : visiteurs qui ajoutent au panier ou convertissent."
            },
            {
              label: "Segment de friction",
              value: `${formatDashboardNumber(highFrictionSessions, locale)} sessions`,
              note: "Exemple : visiteurs qui rage-clickent ou cliquent sans effet."
            }
          ]}
        />
      </DashboardSection>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardSection title={copy.pages.segments.presetsTitle} description={copy.pages.segments.presetsDescription}>
          <DashboardMetricList
            items={[
              {
                label: "Visiteurs arrivés sur la page la plus vue",
                value: topPage ? formatPageLabel(topPage.pathname) ?? "Accueil" : "Aucun segment disponible",
                note: topPage ? `${formatDashboardNumber(topPage.visits, locale)} visites observées sur cette page` : "Il faut un peu plus de trafic pour construire ce segment."
              },
              {
                label: "Visiteurs qui ont déclenché un ajout au panier",
                value: `${formatDashboardNumber(analytics.kpis.addToCart, locale)} actions`,
                note: "Segment utile pour isoler les visiteurs à forte intention."
              },
              {
                label: "Visiteurs bloqués ou frustrés",
                value: `${formatDashboardNumber(highFrictionSessions, locale)} sessions`,
                note: "Construit à partir des rage clicks et clics sans effet."
              },
              {
                label: "Visiteurs qui cliquent l'élément principal",
                value: topInteraction?.label || topInteraction?.selector || "Aucun élément dominant",
                note: topInteraction ? `${formatDashboardNumber(topInteraction.totalClicks, locale)} clics suivis` : "Pas encore assez de clics exploitables."
              }
            ]}
          />
        </DashboardSection>

        <DashboardSection title="Définitions prêtes à créer" description="Ce sont les segments qu'un utilisateur devrait pouvoir épingler dans son dashboard personnalisé.">
          <DashboardMetricList
            items={[
              {
                label: "Entrée sur page clé puis clic principal",
                value: topPage && topInteraction ? "Prêt à suivre" : "En attente de data",
                note: topPage && topInteraction ? `Page ${formatPageLabel(topPage.pathname)} puis interaction ${topInteraction.label || topInteraction.selector}` : "Il faut une page clé et une interaction dominante pour le définir."
              },
              {
                label: "Visiteurs issus du funnel panier",
                value: formatDashboardPercent(analytics.kpis.uniqueVisitors === 0 ? 0 : analytics.kpis.addToCart / analytics.kpis.uniqueVisitors, locale),
                note: "Segment des visiteurs ayant montré une intention d'achat."
              },
              {
                label: "Sessions à fort risque d'abandon",
                value: `${formatDashboardNumber(highFrictionSessions, locale)} sessions`,
                note: "À pin pour vérifier si les optimisations réduisent les blocages."
              }
            ]}
          />
        </DashboardSection>
      </div>

      <DashboardSection title={copy.pages.segments.pinnedTitle} description={copy.pages.segments.pinnedDescription}>
        {behavior.topPages.length > 0 || behavior.topInteractions.length > 0 ? (
          <DashboardMetricList
            items={[
              {
                label: "Segment à épingler : page clé",
                value: formatPageLabel(topPage?.pathname) ?? "Aucun",
                note: "À afficher dans le dashboard si cette page est stratégique pour la boutique."
              },
              {
                label: "Segment à épingler : clic principal",
                value: topInteraction?.label || topInteraction?.selector || "Aucun",
                note: "Permet de suivre une zone d'attention précise dans le temps."
              },
              {
                label: "Segment à épingler : sessions avec friction",
                value: `${formatDashboardNumber(highFrictionSessions, locale)} sessions`,
                note: "Très utile pour mesurer si les changements réduisent vraiment les blocages."
              }
            ]}
          />
        ) : (
          <DashboardEmpty
            title="Pas encore de segment utile à épingler"
            body="Dès que la boutique remontera assez de pages, clics et sessions, cette vue permettra de garder les segments les plus importants dans le dashboard."
          />
        )}
      </DashboardSection>
    </div>
  );
}

import { redirect } from "next/navigation";
import { CopyButton } from "@/components/ui/copy-button";
import { ShopifyConnectForm } from "@/components/forms/shopify-connect-form";
import {
  DashboardEmpty,
  DashboardMetricList,
  DashboardPageHeader,
  DashboardProgress,
  DashboardSection,
  DashboardStatusBadge
} from "@/components/dashboard/site-dashboard-primitives";
import { getInstallationDiagnostic, getLaunchAuditTrail, getOnboardingProgress, getProjectById, getSdkDiagnostics, getShopifyConnection, getShopifyInstallAssets } from "@/lib/data";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { getCanonicalOptifySdkUrl } from "@/lib/shopify";
import {
  formatDashboardDateTime,
  formatDashboardStatus,
  getSiteDashboardCopy
} from "@/lib/site-dashboard";
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
  const copy = getSiteDashboardCopy(locale);
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

  const scriptTag = `<script src="${getCanonicalOptifySdkUrl()}" data-project="${project.id}"></script>`;
  const progressPercent = Math.round(onboarding.completionRatio * 100);

  return (
    <div className="space-y-6 overflow-x-hidden">
      <DashboardPageHeader
        eyebrow={copy.pages.installation.title}
        title={project.name}
        description={copy.pages.installation.description}
        meta={(
          <>
            <DashboardStatusBadge label={formatDashboardStatus(diagnostic.status, locale)} tone={diagnostic.status === "healthy" ? "good" : diagnostic.status === "warning" ? "warn" : "muted"} />
            <DashboardStatusBadge label={project.platform} tone="muted" />
          </>
        )}
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <DashboardSection title="Progression d'installation" description="Ce qui reste a faire pour avoir une collecte propre et exploitable.">
          <DashboardProgress label="Installation globale" value={progressPercent} note={onboarding.currentStepLabel} />
          <div className="mt-5">
            <DashboardMetricList
              items={onboarding.checklist.map((item) => ({
                label: item.title,
                value: formatDashboardStatus(item.status, locale),
                note: item.body
              }))}
            />
          </div>
        </DashboardSection>

        <DashboardSection title={copy.pages.installation.snippetTitle} description={copy.pages.installation.snippetDescription}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">C'est le snippet principal a coller si tu veux brancher rapidement Optify hors Shopify.</p>
            <CopyButton value={scriptTag} label="Copier le snippet" />
          </div>
          <pre className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-[1.5rem] bg-[#241f34] p-5 text-sm text-[#fff7f1]">{scriptTag}</pre>
          <div className="mt-5">
            <DashboardMetricList
              items={[
                {
                  label: "Evenements recents",
                  value: String(sdkDiagnostics.transport.recentEventCount),
                  note: "Nombre d'evenements vus recemment par le transport."
                },
                {
                  label: "Dernier evenement",
                  value: sdkDiagnostics.transport.lastEventAt ? formatDashboardDateTime(sdkDiagnostics.transport.lastEventAt, locale) : "Aucun",
                  note: "Permet de verifier que la collecte vit vraiment."
                },
                {
                  label: "Taux de doublons",
                  value: `${Math.round(sdkDiagnostics.transport.duplicateRate * 100)}%`,
                  note: "Doit rester faible."
                }
              ]}
            />
          </div>
        </DashboardSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardSection title={copy.pages.installation.checksTitle} description={copy.pages.installation.checksDescription}>
          <DashboardMetricList
            items={diagnostic.checks.map((check) => ({
              label: check.label,
              value: formatDashboardStatus(check.status, locale),
              note: check.detail
            }))}
          />
        </DashboardSection>

        <DashboardSection title={copy.pages.installation.capabilitiesTitle} description={copy.pages.installation.capabilitiesDescription}>
          <DashboardMetricList
            items={[
              {
                label: "Derniere page vue",
                value: diagnostic.latestHealth?.pathname ?? "Aucune",
                note: diagnostic.latestHealth?.sdkVersion ? `SDK ${diagnostic.latestHealth.sdkVersion}` : "Version SDK inconnue"
              },
              {
                label: "Pages recentes",
                value: diagnostic.recentPages.length > 0 ? diagnostic.recentPages.join(", ") : "Aucune",
                note: "Pages sur lesquelles le SDK a ete vu recemment."
              },
              {
                label: "Beacon",
                value: diagnostic.latestHealth?.capabilities.beacon ? "Oui" : "Inconnu",
                note: "Capacite navigateur utile pour la fiabilite d'envoi."
              },
              {
                label: "Local storage",
                value: diagnostic.latestHealth?.capabilities.localStorage ? "Oui" : "Inconnu",
                note: "Permet de mieux stabiliser la session et les retries."
              }
            ]}
          />
        </DashboardSection>
      </div>

      <DashboardSection title={copy.pages.installation.guideTitle} description={copy.pages.installation.guideDescription}>
        <DashboardMetricList
          items={t.installationPage.installGuides[project.platform as Platform].map((step: string, index: number) => ({
            label: `Etape ${index + 1}`,
            value: "",
            note: step
          }))}
        />
      </DashboardSection>

      {project.platform === "shopify" ? (
        <>
          <DashboardSection title={copy.pages.installation.shopifyTitle} description={copy.pages.installation.shopifyDescription}>
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-[#ece3d7] bg-[#fff8ee] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">Snippet Liquid</p>
                      <p className="mt-2 text-sm text-muted-foreground">A coller dans theme.liquid avant la fermeture de head.</p>
                    </div>
                    <CopyButton value={shopifyAssets?.liquidSnippet ?? scriptTag} label="Copier Liquid" copiedLabel="Liquid copie" />
                  </div>
                  <pre className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-[1.2rem] bg-[#241f34] p-4 text-sm text-[#fff7f1]">{shopifyAssets?.liquidSnippet ?? scriptTag}</pre>
                </div>

                <div className="rounded-[1.5rem] border border-[#ece3d7] bg-[#fffdfa] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">Custom pixel Shopify</p>
                      <p className="mt-2 text-sm text-muted-foreground">A coller dans Shopify Customer Events pour remonter les events commerce.</p>
                    </div>
                    <CopyButton value={shopifyAssets?.customPixelCode ?? ""} label="Copier le pixel" copiedLabel="Pixel copie" />
                  </div>
                  <pre className="mt-4 max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-[1.2rem] bg-[#241f34] p-4 text-sm text-[#fff7f1]">{shopifyAssets?.customPixelCode ?? "Custom pixel indisponible."}</pre>
                </div>
              </div>

              <div className="space-y-6">
                <DashboardMetricList
                  items={[
                    {
                      label: "Boutique",
                      value: shopifyConnection?.shopDomain ?? project.domain,
                      note: "Domaine actuellement relie a Optify."
                    },
                    {
                      label: "Theme",
                      value: shopifyConnection?.activeTheme?.name ?? "Inconnu",
                      note: "Si non remonte, l'installation manuelle peut quand meme fonctionner."
                    },
                    {
                      label: "Devise",
                      value: shopifyConnection?.currencyCode ?? "Inconnue",
                      note: "Utile pour les lectures de revenu."
                    },
                    {
                      label: "Connexion",
                      value: shopifyConnection?.status ? formatDashboardStatus(shopifyConnection.status, locale) : "Installation manuelle",
                      note: "Le suivi peut fonctionner meme sans sync metadonnees."
                    }
                  ]}
                />
                <ShopifyConnectForm projectId={projectId} initialShopDomain={shopifyConnection?.shopDomain ?? project.domain} status={shopifyConnection?.status} />
              </div>
            </div>
          </DashboardSection>
        </>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <DashboardSection title="Evenements recents" description="Pratique pour verifier si des signaux arrivent vraiment.">
          {sdkDiagnostics.recentEvents.length > 0 ? (
            <DashboardMetricList
              items={sdkDiagnostics.recentEvents.map((event) => ({
                label: event.eventType.replaceAll("_", " "),
                value: event.pathname,
                note: formatDashboardDateTime(event.timestamp, locale)
              }))}
            />
          ) : (
            <DashboardEmpty title="Aucun evenement recent" body="Recharge le site instrumente et refais quelques interactions pour voir la collecte ici." />
          )}
        </DashboardSection>

        <DashboardSection title="Historique recent" description="Actions internes liees au setup et aux lancements.">
          {auditTrail.length > 0 ? (
            <DashboardMetricList
              items={auditTrail.map((entry) => ({
                label: entry.note,
                value: entry.actor ?? "workspace",
                note: formatDashboardDateTime(entry.timestamp, locale)
              }))}
            />
          ) : (
            <DashboardEmpty title="Pas encore d'historique" body="Les validations et changements d'etat apparaitront ici." />
          )}
        </DashboardSection>
      </div>
    </div>
  );
}

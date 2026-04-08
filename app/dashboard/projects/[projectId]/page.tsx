import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getExperimentsByProject, getProjectById, getShopifyConnection } from "@/lib/data";
import { getDictionary, localizeStatus, resolveLocale, withLang } from "@/lib/i18n";

export default async function ProjectPage({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ lang?: string }> }) {
  const { projectId } = await params;
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  const project = await getProjectById(projectId);
  if (!project) {
    notFound();
  }

  const experiments = await getExperimentsByProject(projectId);
  const shopifyConnection = project.platform === "shopify" ? await getShopifyConnection(projectId) : undefined;

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <Badge>{project.platform}</Badge>
            <h1 className="mt-4 text-3xl font-semibold">{project.name}</h1>
            <p className="mt-2 text-muted-foreground">{project.domain}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href={withLang(`/dashboard/projects/${project.id}/installation`, locale)}>{t.common.installSdk}</Link>
            </Button>
            <Button asChild>
              <Link href={withLang(`/dashboard/projects/${project.id}/experiments/new`, locale)}>{t.common.newExperiment}</Link>
            </Button>
          </div>
        </div>
      </Card>

      {project.platform === "shopify" ? (
        <Card className="bg-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">Shopify compatibility</p>
              <p className="mt-2 text-sm text-muted-foreground">This project can now connect to a real Shopify store, ingest customer events through a custom pixel, and expose page-type aware storefront tracking.</p>
            </div>
            <Badge className={shopifyConnection?.status === "connected" ? "bg-primary text-white" : ""}>{shopifyConnection?.status ?? "not_connected"}</Badge>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Shop domain: <span className="font-semibold">{shopifyConnection?.shopDomain ?? project.domain}</span></div>
            <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Theme: <span className="font-semibold">{shopifyConnection?.activeTheme?.name ?? "not synced"}</span></div>
            <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Currency: <span className="font-semibold">{shopifyConnection?.currencyCode ?? "unknown"}</span></div>
            <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Tracked pages: <span className="font-semibold">{shopifyConnection?.pageTypesTracked.join(", ") || "none yet"}</span></div>
          </div>
          <Button asChild variant="outline" className="mt-5">
            <Link href={withLang(`/dashboard/projects/${project.id}/installation`, locale)}>Open Shopify installation</Link>
          </Button>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {experiments.map((experiment) => (
          <Card key={experiment.id} className="bg-white">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-lg font-semibold">{experiment.name}</p>
                <p className="text-sm text-muted-foreground">{experiment.pagePattern}</p>
              </div>
              <Badge className={experiment.status === "running" ? "bg-primary text-white" : ""}>{localizeStatus(experiment.status, locale)}</Badge>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{experiment.hypothesis}</p>
            <Button asChild variant="outline" className="mt-6">
              <Link href={withLang(`/dashboard/projects/${project.id}/experiments/${experiment.id}`, locale)}>{t.common.openExperiment}</Link>
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DeleteProjectButton } from "@/components/forms/delete-project-button";
import { getShopifyProjectsOverview } from "@/lib/data";
import { resolveLocale, withLang } from "@/lib/i18n";

export default async function ShopifyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const items = await getShopifyProjectsOverview();

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f2d22_0%,#135c43_58%,#f4d07a_160%)] text-white shadow-[0_24px_80px_rgba(17,41,31,0.18)]">
        <h1 className="text-3xl font-semibold">Shopify hub</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/78">
          Optify is now wired for a Shopify-first manual install: Liquid snippet, custom pixel ingestion, page-type detection, and commerce KPIs. Admin metadata sync is optional for now.
        </p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Connected stores</p>
          <p className="mt-2 text-3xl font-semibold">{items.filter((item) => item.connection?.status === "connected").length}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Shopify projects</p>
          <p className="mt-2 text-3xl font-semibold">{items.length}</p>
        </Card>
        <Card className="bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Healthy installs</p>
          <p className="mt-2 text-3xl font-semibold">{items.filter((item) => item.diagnostic?.status === "healthy").length}</p>
        </Card>
      </div>

      <div className="space-y-4">
        {items.map(({ project, connection, diagnostic }) => (
          <Card key={project.id} className="bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xl font-semibold">{project.name}</p>
                  <Badge>{connection?.status ?? "not_connected"}</Badge>
                  {connection?.planName ? <Badge>{connection.planName}</Badge> : null}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{connection?.shopDomain ?? project.domain}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href={withLang(`/dashboard/sites/${project.id}/overview`, locale)}>Open project</Link>
                </Button>
                <Button asChild>
                  <Link href={withLang(`/dashboard/sites/${project.id}/installation`, locale)}>Open Shopify install</Link>
                </Button>
                <DeleteProjectButton projectId={project.id} projectName={project.name} locale={locale} />
              </div>
            </div>
            <div className="mt-4 grid gap-3 xl:grid-cols-4">
              <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Install status: <span className="font-semibold">{diagnostic?.status ?? "unknown"}</span></div>
              <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Currency: <span className="font-semibold">{connection?.currencyCode ?? "unknown"}</span></div>
              <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Theme: <span className="font-semibold">{connection?.activeTheme?.name ?? "not synced"}</span></div>
              <div className="rounded-3xl bg-secondary/50 p-4 text-sm">Tracked pages: <span className="font-semibold">{connection?.pageTypesTracked.join(", ") || "none yet"}</span></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

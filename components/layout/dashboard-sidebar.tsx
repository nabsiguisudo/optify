"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Activity, Bot, ChartColumnBig, ChevronDown, Clapperboard, CreditCard, LayoutPanelLeft, Rocket, Settings2, ShoppingBag, SlidersHorizontal, Wrench } from "lucide-react";
import { DeleteProjectButton } from "@/components/forms/delete-project-button";
import { Badge } from "@/components/ui/badge";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { getSiteDashboardCopy } from "@/lib/site-dashboard";
import { cn } from "@/lib/utils";

type SidebarProject = {
  id: string;
  name: string;
  platform: string;
  domain: string;
};

function buildHref(pathname: string, nextProjectId: string) {
  if (pathname.startsWith("/dashboard/sites/")) {
    return pathname.replace(/^\/dashboard\/sites\/[^/]+/, `/dashboard/sites/${nextProjectId}`);
  }
  return `/dashboard/sites/${nextProjectId}/overview`;
}

export function DashboardSidebar({
  user,
  projects,
  locale,
  appName,
  experimentOs,
  proTrial
}: {
  user: { fullName: string; email: string };
  projects: SidebarProject[];
  locale: string;
  appName: string;
  experimentOs: string;
  proTrial: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentProjectId = pathname.match(/^\/dashboard\/sites\/([^/]+)/)?.[1] ?? projects[0]?.id;
  const currentProject = projects.find((project) => project.id === currentProjectId) ?? projects[0];
  const section = pathname.match(/^\/dashboard\/sites\/[^/]+\/([^/?#]+)/)?.[1] ?? "overview";
  const query = searchParams.toString();
  const withQuery = (href: string) => `${href}${query ? `?${query}` : `?lang=${locale}`}`;
  const copy = getSiteDashboardCopy(locale === "fr" ? "fr" : "en");

  const groups = currentProject ? [
    {
      label: copy.nav.analyticsSuite,
      items: [
        { href: `/dashboard/sites/${currentProject.id}/overview`, label: copy.nav.overview, icon: LayoutPanelLeft, key: "overview" },
        { href: `/dashboard/sites/${currentProject.id}/analytics`, label: copy.nav.analytics, icon: ChartColumnBig, key: "analytics" },
        { href: `/dashboard/sites/${currentProject.id}/sessions`, label: copy.nav.sessions, icon: Clapperboard, key: "sessions" },
        { href: `/dashboard/sites/${currentProject.id}/segments`, label: copy.nav.segments, icon: SlidersHorizontal, key: "segments" },
        { href: `/dashboard/sites/${currentProject.id}/activity`, label: copy.nav.activity, icon: Activity, key: "activity" }
      ]
    },
    {
      label: copy.nav.activationSuite,
      items: [
        { href: `/dashboard/sites/${currentProject.id}/ai`, label: copy.nav.suggestions, icon: Bot, key: "ai" },
        { href: `/dashboard/sites/${currentProject.id}/experiments`, label: copy.nav.experiments, icon: Rocket, key: "experiments" },
        { href: `/dashboard/sites/${currentProject.id}/installation`, label: copy.nav.installation, icon: Settings2, key: "installation" }
      ]
    }
  ] : [];

  return (
    <aside className="border-r border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92)_0%,rgba(246,246,255,0.94)_100%)] p-5 backdrop-blur-xl lg:p-6">
      <div className="sticky top-0 space-y-6">
        <Link href={currentProject ? withQuery(`/dashboard/sites/${currentProject.id}/overview`) : "/dashboard"} className="flex items-center gap-3">
          <div className="rounded-2xl bg-[linear-gradient(135deg,#ff5864_0%,#ff7b6b_48%,#ffb36a_100%)] p-3 text-primary-foreground shadow-glow">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold">{appName}</p>
            <p className="truncate text-xs text-muted-foreground">{experimentOs}</p>
          </div>
        </Link>

        <details className="rounded-[1.4rem] border border-white/70 bg-white/80 p-4 shadow-[0_12px_30px_rgba(91,86,132,0.06)]" open>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">{copy.nav.currentSite}</p>
              <p className="mt-1 truncate text-sm font-semibold">{currentProject?.name ?? copy.nav.noSite}</p>
              <p className="truncate text-xs text-muted-foreground">{currentProject?.domain ?? copy.nav.createSiteHint}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </summary>
          <div className="mt-4 space-y-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={withQuery(buildHref(pathname, project.id))}
                className={cn(
                  "block rounded-2xl border px-3 py-3 transition",
                  project.id === currentProject?.id ? "border-transparent bg-[linear-gradient(135deg,rgba(255,88,100,0.12)_0%,rgba(255,179,106,0.12)_100%)]" : "border-transparent hover:border-border hover:bg-secondary/60"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <Badge>{project.platform}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">{project.domain}</p>
              </Link>
            ))}
            <Link href={withQuery("/dashboard/projects/new")} className="mt-2 flex items-center gap-2 rounded-2xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground transition hover:bg-secondary/40">
              <Wrench className="h-4 w-4" />
              {copy.nav.addSite}
            </Link>
            {currentProject ? (
              <DeleteProjectButton projectId={currentProject.id} projectName={currentProject.name} locale={locale} />
            ) : null}
          </div>
        </details>

        <nav className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">{group.label}</p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.key;
                  return (
                    <Link
                      key={item.href}
                      href={withQuery(item.href)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition",
                        active ? "bg-[linear-gradient(135deg,#ff5864_0%,#ff7f67_54%,#ffb86b_100%)] text-white shadow-glow" : "text-muted-foreground hover:bg-white hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-2 px-2 text-xs font-medium text-muted-foreground">{copy.nav.workspace}</p>
            <div className="space-y-1">
              <Link href={withQuery("/dashboard/shopify")} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                <ShoppingBag className="h-4 w-4" />
                {copy.nav.shopifyHub}
              </Link>
              <Link href={withQuery("/dashboard/billing")} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                <CreditCard className="h-4 w-4" />
                {copy.nav.billing}
              </Link>
            </div>
          </div>
        </nav>

        <div className="rounded-[1.4rem] border border-white/70 bg-white/80 p-4 shadow-[0_12px_30px_rgba(91,86,132,0.06)]">
          <p className="text-sm font-semibold">{user.fullName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          <Badge className="mt-3 bg-[linear-gradient(135deg,rgba(255,88,100,0.12)_0%,rgba(255,179,106,0.16)_100%)] text-[#d64056]">{proTrial}</Badge>
          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </aside>
  );
}

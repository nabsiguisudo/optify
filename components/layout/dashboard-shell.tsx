import { cookies } from "next/headers";
import { getCurrentUser, getVisibleProjects } from "@/lib/data";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LOCALE_COOKIE, getDictionary, resolveLocale } from "@/lib/i18n";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const projects = await getVisibleProjects();
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getDictionary(locale);

  return (
    <div className="min-h-screen bg-[#f7f7f4] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <DashboardSidebar
          user={user}
          projects={projects.map((project) => ({ id: project.id, name: project.name, platform: project.platform, domain: project.domain }))}
          locale={locale}
          appName={t.common.appName}
          experimentOs={t.common.experimentOs}
          proTrial={t.common.proTrial}
        />
        <main className="min-w-0 p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUserOrNull, getVisibleProjects } from "@/lib/data";
import { hasSupabaseClientEnv } from "@/lib/env";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { LOCALE_COOKIE, getDictionary, resolveLocale } from "@/lib/i18n";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  if (hasSupabaseClientEnv()) {
    const user = await getCurrentUserOrNull();
    if (!user) {
      redirect(`/auth/sign-in?lang=${locale}`);
    }
    const projects = await getVisibleProjects();
    const t = getDictionary(locale);

    return (
      <div className="min-h-screen bg-transparent text-foreground">
        <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
          <DashboardSidebar
            user={user}
            projects={projects.map((project) => ({ id: project.id, name: project.name, platform: project.platform, domain: project.domain }))}
            locale={locale}
            appName={t.common.appName}
            experimentOs={t.common.experimentOs}
            proTrial={t.common.proTrial}
          />
          <main className="min-w-0 p-5 lg:p-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    );
  }

  const user = await getCurrentUserOrNull();
  const projects = await getVisibleProjects();
  const t = getDictionary(locale);

  return (
    <div className="min-h-screen bg-transparent text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <DashboardSidebar
          user={user ?? { fullName: "Workspace owner", email: "" }}
          projects={projects.map((project) => ({ id: project.id, name: project.name, platform: project.platform, domain: project.domain }))}
          locale={locale}
          appName={t.common.appName}
          experimentOs={t.common.experimentOs}
          proTrial={t.common.proTrial}
        />
        <main className="min-w-0 p-5 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

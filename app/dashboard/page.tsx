import { redirect } from "next/navigation";
import { getVisibleProjects } from "@/lib/data";
import { resolveLocale } from "@/lib/i18n";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const projects = await getVisibleProjects();

  if (projects[0]) {
    redirect(`/dashboard/sites/${projects[0].id}/overview?lang=${locale}`);
  }

  redirect(`/dashboard/projects/new?lang=${locale}`);
}

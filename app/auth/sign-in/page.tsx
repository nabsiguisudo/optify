import { redirect } from "next/navigation";
import { AuthForm } from "@/components/forms/auth-form";
import { getCurrentUserOrNull, getVisibleProjects } from "@/lib/data";
import { hasSupabaseClientEnv } from "@/lib/env";
import { resolveLocale, withLang } from "@/lib/i18n";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  if (hasSupabaseClientEnv()) {
    const user = await getCurrentUserOrNull();
    if (user) {
      const projects = await getVisibleProjects();
      redirect(withLang(projects[0] ? `/dashboard/sites/${projects[0].id}/overview` : "/dashboard/projects/new", locale));
    }
  }
  return <AuthForm mode="sign_in" locale={locale} />;
}

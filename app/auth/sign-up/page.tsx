import { AuthForm } from "@/components/forms/auth-form";
import { resolveLocale } from "@/lib/i18n";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  return <AuthForm mode="sign_up" locale={locale} />;
}

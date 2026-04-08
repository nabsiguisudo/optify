import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getDictionary, resolveLocale, withLang } from "@/lib/i18n";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <Card className="w-full max-w-md bg-white">
        <p className="text-2xl font-semibold">{t.auth.createWorkspace}</p>
        <p className="mt-2 text-sm text-muted-foreground">{t.auth.signUpBody}</p>
        <div className="mt-6 space-y-4">
          <Input placeholder={t.auth.fullName} />
          <Input placeholder="you@company.com" type="email" />
          <Input placeholder={t.auth.password} type="password" />
          <Button className="w-full">{t.common.signUp}</Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {t.auth.alreadyHaveAccount} <Link href={withLang("/auth/sign-in", locale)} className="text-primary">{t.common.signIn}</Link>
        </p>
      </Card>
    </div>
  );
}

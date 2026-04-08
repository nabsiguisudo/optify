import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getDictionary, resolveLocale, withLang } from "@/lib/i18n";

export function SiteShell({ children, locale = "fr" }: { children: React.ReactNode; locale?: string }) {
  const currentLocale = resolveLocale(locale);
  const t = getDictionary(currentLocale);

  return (
    <div className="min-h-screen bg-background bg-mesh text-foreground">
      <header className="border-b border-border/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href={withLang("/", currentLocale)} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold">{t.common.appName}</p>
              <p className="text-xs text-muted-foreground">{t.site.tagline}</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <Link href={withLang("/#features", currentLocale)}>{t.common.features}</Link>
            <Link href={withLang("/#integrations", currentLocale)}>{t.common.integrations}</Link>
            <Link href={withLang("/dashboard", currentLocale)}>{t.common.dashboard}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href={withLang("/auth/sign-in", currentLocale)}>{t.common.signIn}</Link>
            </Button>
            <Button asChild>
              <Link href={withLang("/dashboard", currentLocale)}>{t.common.launchApp}</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

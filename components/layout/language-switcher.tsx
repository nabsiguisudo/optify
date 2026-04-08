"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LOCALE_COOKIE, localeLabels, type Locale, resolveLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const locales: Locale[] = ["fr", "en", "it", "es", "de"];

export function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = resolveLocale(searchParams.get("lang") ?? undefined);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {locales.map((locale) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("lang", locale);

        return (
          <Link
            key={locale}
            href={`${pathname}?${params.toString()}`}
            onClick={() => {
              document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
            }}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] transition",
              current === locale ? "border-primary bg-primary text-white" : "border-border bg-white text-muted-foreground"
            )}
          >
            {localeLabels[locale]}
          </Link>
        );
      })}
    </div>
  );
}

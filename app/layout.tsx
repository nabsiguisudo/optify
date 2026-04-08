import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, getDictionary, resolveLocale } from "@/lib/i18n";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  const t = getDictionary(locale);

  return {
    title: "Optify",
    description: t.meta.description
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}

import { redirect } from "next/navigation";
import { resolveLocale } from "@/lib/i18n";

export default async function SitePage({
  params,
  searchParams
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { projectId } = await params;
  const locale = resolveLocale((await searchParams).lang);
  redirect(`/dashboard/sites/${projectId}/overview?lang=${locale}`);
}

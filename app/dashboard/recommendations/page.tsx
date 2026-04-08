import { RecommendationGrid } from "@/components/dashboard/recommendation-grid";
import { Card } from "@/components/ui/card";
import { getRecommendations } from "@/lib/data";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export default async function RecommendationsPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  const items = await getRecommendations(undefined, locale);

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <h1 className="text-3xl font-semibold">{t.recommendationsPage.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.recommendationsPage.body}</p>
      </Card>
      <RecommendationGrid items={items} locale={locale} />
    </div>
  );
}

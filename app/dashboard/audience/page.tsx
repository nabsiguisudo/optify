import { Card } from "@/components/ui/card";
import { getAudienceInsights } from "@/lib/data";
import { getDictionary, resolveLocale } from "@/lib/i18n";
import { formatPercent } from "@/lib/utils";

export default async function AudiencePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);
  const insights = await getAudienceInsights(locale);

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <h1 className="text-3xl font-semibold">{t.audiencePage.title}</h1>
        <p className="mt-2 text-muted-foreground">{t.audiencePage.body}</p>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {insights.map((insight) => (
          <Card key={insight.segment} className="bg-white">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{insight.segment}</p>
            <p className="mt-4 text-3xl font-semibold">{formatPercent(insight.share)}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.common.shareOfTraffic}</p>
            <p className="mt-4 text-sm font-medium">{t.common.bestVariant}: {insight.bestVariant}</p>
            <p className="mt-2 text-sm text-muted-foreground">{insight.note}</p>
            <p className="mt-4 rounded-2xl bg-secondary/60 px-3 py-2 text-sm">CR {formatPercent(insight.conversionRate)}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { resolveLocale } from "@/lib/i18n";
import type { ProductRecommendation } from "@/lib/types";

export function RecommendationGrid({ items, locale = "fr" }: { items: ProductRecommendation[]; locale?: string }) {
  resolveLocale(locale);
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{item.upliftHint}</p>
          <p className="mt-3 text-xl font-semibold">{item.title}</p>
          <p className="mt-2 text-sm text-muted-foreground">{item.reason}</p>
          <div className="mt-5 rounded-2xl bg-secondary/60 px-3 py-2 text-sm font-medium">{item.price}</div>
        </Card>
      ))}
    </div>
  );
}

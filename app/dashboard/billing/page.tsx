import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDictionary, resolveLocale } from "@/lib/i18n";

const prices = ["$0", "$79", "$299"];

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <Badge>{t.common.stripeReady}</Badge>
        <h1 className="mt-4 text-3xl font-semibold">{t.billingPage.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{t.billingPage.body}</p>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {t.billingPage.plans.map((plan, index) => (
          <Card key={plan.name} className={plan.name === "Pro" ? "border-primary bg-white" : "bg-white"}>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{plan.name}</p>
            <p className="mt-4 text-4xl font-semibold">{prices[index]}<span className="text-base text-muted-foreground">{t.billingPage.perMonth}</span></p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
            <div className="mt-6 space-y-3">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {feature}
                </div>
              ))}
            </div>
            <Button className="mt-6 w-full" variant={plan.name === "Pro" ? "default" : "outline"}>
              {plan.name === "Free" ? t.common.currentPlan : t.common.upgradeWithStripe}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}

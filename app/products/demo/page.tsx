"use client";

import Script from "next/script";
import { useSearchParams } from "next/navigation";
import { ArrowRight, MousePointerClick } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDictionary, resolveLocale } from "@/lib/i18n";

export default function DemoProductPage() {
  const searchParams = useSearchParams();
  const locale = resolveLocale(searchParams.get("lang") ?? undefined);
  const t = getDictionary(locale);

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <Script src="/optify-sdk.js" data-project="proj_1" strategy="afterInteractive" />
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="w-fit rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">{t.demo.sandbox}</div>
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-white" data-product-id="sku_optify_booster" data-product-name="Optify Conversion Booster">
            <p className="text-sm uppercase tracking-[0.16em] text-primary">Demo PDP</p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight">{t.demo.title}</h1>
            <p data-optify="hero-subtitle" className="mt-4 max-w-2xl text-lg text-muted-foreground">
              {t.demo.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button data-optify="hero-cta" data-optify-track="cta_click add_to_cart" data-add-to-cart data-product-id="sku_optify_booster" data-product-name="Optify Conversion Booster" data-value="59" data-currency="USD" size="lg">
                {t.demo.buyNow}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                data-checkout-start
                data-product-id="sku_optify_booster"
                data-product-name="Optify Conversion Booster"
                data-value="59"
                data-currency="USD"
                onClick={() => window.optify?.track("conversion", { experimentId: "exp_hero_cta" })}
              >
                {t.common.triggerConversion}
              </Button>
              <Button
                variant="outline"
                size="lg"
                data-purchase
                data-product-id="sku_optify_booster"
                data-product-name="Optify Conversion Booster"
                data-revenue="59"
                data-value="59"
                data-currency="USD"
              >
                Complete purchase
              </Button>
            </div>
            <div className="mt-8 rounded-3xl bg-secondary/50 p-5 text-sm text-muted-foreground">
              {t.demo.devtools} <code>/api/sdk/config/proj_1</code> and <code>/api/sdk/events</code>.
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-border p-4" data-optify-recommendation-id="rec_demo_1" data-optify-placement="pdp_sidebar" data-optify-strategy="frequently_bought_together" data-product-id="rec_booster_case" data-product-name="Booster Case">
                <p className="text-sm font-semibold">Recommendation A</p>
                <p className="mt-2 text-sm text-muted-foreground">Bundle accessory with strong attach rate potential.</p>
              </div>
              <div className="rounded-3xl border border-border p-4" data-optify-recommendation-id="rec_demo_2" data-optify-placement="pdp_sidebar" data-optify-strategy="high_margin" data-product-id="rec_fast_track" data-product-name="Fast Track Warranty">
                <p className="text-sm font-semibold">Recommendation B</p>
                <p className="mt-2 text-sm text-muted-foreground">High-margin warranty upsell for checkout intent.</p>
              </div>
              <video className="w-full rounded-3xl border border-border" controls title="Optify Demo Video">
                <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4" />
              </video>
            </div>
          </Card>

          <Card className="bg-white">
            <div className="flex items-center gap-3">
              <MousePointerClick className="h-5 w-5 text-primary" />
              <p className="text-lg font-semibold">{t.demo.howTo}</p>
            </div>
            <div className="mt-5 space-y-4 text-sm text-muted-foreground">
              {t.demo.steps.map((step: string, index: number) => (
                <p key={step}>{index + 1}. {step}</p>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

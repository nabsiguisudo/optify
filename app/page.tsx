import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, PlugZap } from "lucide-react";
import { SiteShell } from "@/components/layout/site-shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDictionary, resolveLocale, withLang } from "@/lib/i18n";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const locale = resolveLocale((await searchParams).lang);
  const t = getDictionary(locale);

  return (
    <SiteShell locale={locale}>
      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-primary">{t.site.heroEyebrow}</p>
            <h1 className="font-display text-5xl leading-tight tracking-tight md:text-7xl">
              {t.site.heroTitle}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              {t.site.heroBody}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href={withLang("/dashboard", locale)}>
                  {t.common.dashboard}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={withLang("/dashboard/projects/new", locale)}>{t.site.createFirstProject}</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <Card className="bg-white">
                <BarChart3 className="h-5 w-5 text-primary" />
                <p className="mt-4 text-2xl font-semibold">+35%</p>
                <p className="text-sm text-muted-foreground">{t.site.upliftDetection}</p>
              </Card>
              <Card className="bg-white">
                <PlugZap className="h-5 w-5 text-primary" />
                <p className="mt-4 text-2xl font-semibold">{t.site.oneScript}</p>
                <p className="text-sm text-muted-foreground">{t.site.installOnce}</p>
              </Card>
              <Card className="bg-white">
                <BrainCircuit className="h-5 w-5 text-primary" />
                <p className="mt-4 text-2xl font-semibold">{t.site.fiveIdeas}</p>
                <p className="text-sm text-muted-foreground">{t.site.aiSuggested}</p>
              </Card>
            </div>
          </div>
          <Card className="bg-[#fffdf8] p-8 shadow-glow">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{t.site.fastOnboarding}</p>
            <div className="mt-6 space-y-6">
              {t.site.steps.map((step, index) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">{index + 1}</div>
                  <div>
                    <p className="font-medium">{step}</p>
                    <p className="text-sm text-muted-foreground">{t.site.stepBodies[index]}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 pb-12">
          <div className="grid gap-4 lg:grid-cols-3">
            {t.site.features.map((feature) => (
              <Card key={feature.title} className="bg-white">
                <p className="text-lg font-semibold">{feature.title}</p>
                <p className="mt-3 text-sm text-muted-foreground">{feature.body}</p>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}

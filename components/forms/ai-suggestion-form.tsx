"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDictionary, resolveLocale, withLang } from "@/lib/i18n";
import type { AiSuggestion } from "@/lib/types";

export function AiSuggestionForm({
  initialSuggestions = [],
  locale = "fr",
  projectId
}: {
  initialSuggestions?: AiSuggestion[];
  locale?: string;
  projectId?: string;
}) {
  const currentLocale = resolveLocale(locale);
  const t = getDictionary(currentLocale);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AiSuggestion[]>(initialSuggestions);

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <div className="flex flex-col gap-4 lg:flex-row">
          <Input placeholder={t.suggestionsPage.placeholder} value={url} onChange={(event) => setUrl(event.target.value)} />
          <Button
            onClick={async () => {
              setLoading(true);
              const response = await fetch("/api/ai/suggestions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url })
              });
              const data = await response.json();
              setSuggestions(data.suggestions ?? []);
              setLoading(false);
            }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <WandSparkles className="h-4 w-4" />}
            {t.suggestionsPage.button}
          </Button>
        </div>
      </Card>
      <Card className="bg-[#11291f] text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f4d07a]">AI experiment engine</p>
        <p className="mt-3 text-lg font-semibold">The product should generate ready-to-review experiments, not just loose ideas.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {["visual", "popup", "recommendation", "custom_code", "funnel", "content", "layout", "pricing"].map((type) => (
            <div key={type} className="rounded-2xl bg-white/10 px-3 py-2 text-sm capitalize text-white/85">
              {type.replaceAll("_", " ")}
            </div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {suggestions.map((suggestion) => (
          <Card key={suggestion.title} className="bg-white">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{suggestion.expectedImpact} {t.suggestionsPage.impact}</p>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs uppercase tracking-[0.12em]">{suggestion.type.replaceAll("_", " ")}</span>
            </div>
            <p className="mt-3 text-lg font-semibold">{suggestion.title}</p>
            <p className="mt-3 text-sm text-muted-foreground">{suggestion.hypothesis}</p>
            <div className="mt-4 grid gap-2">
              {suggestion.primaryMetric ? <div className="rounded-2xl bg-secondary/60 px-3 py-2 text-sm">Primary metric: {suggestion.primaryMetric.replaceAll("_", " ")}</div> : null}
              {suggestion.targetSelector ? <div className="rounded-2xl bg-secondary/60 px-3 py-2 text-sm">Target: {suggestion.targetSelector}</div> : null}
              {suggestion.approvalState ? <div className="rounded-2xl bg-secondary/60 px-3 py-2 text-sm">State: {suggestion.approvalState.replaceAll("_", " ")}</div> : null}
            </div>
            <div className="mt-4 space-y-2">
              {suggestion.changes.map((change: string) => (
                <div key={change} className="rounded-2xl bg-secondary/60 px-3 py-2 text-sm">
                  {change}
                </div>
              ))}
            </div>
            {projectId ? (
              <Button asChild className="mt-5 w-full">
                <Link href={withLang(`/dashboard/projects/${projectId}/experiments/new`, currentLocale)}>
                  Review in builder
                </Link>
              </Button>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

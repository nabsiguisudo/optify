"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/ui/copy-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ExperimentQaPanel({
  experimentId,
  defaultTargetUrl
}: {
  experimentId: string;
  defaultTargetUrl: string;
}) {
  const [targetUrl, setTargetUrl] = useState(() => {
    if (!defaultTargetUrl.trim()) return "";
    try {
      const url = new URL(defaultTargetUrl);
      [
        "optify_builder",
        "optify_builder_origin",
        "optify_builder_scope",
        "optify_builder_selector",
        "optify_builder_text",
        "optify_builder_style",
        "optify_experiment",
        "optify_variant"
      ].forEach((key) => url.searchParams.delete(key));
      return url.toString();
    } catch {
      return defaultTargetUrl;
    }
  });

  const qaParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("optify_experiment", experimentId);
    params.set("optify_variant", "B");
    return params.toString();
  }, [experimentId]);

  const qaUrl = useMemo(() => {
    if (!targetUrl.trim()) return "";
    try {
      const url = new URL(targetUrl);
      url.searchParams.set("optify_experiment", experimentId);
      url.searchParams.set("optify_variant", "B");
      return url.toString();
    } catch {
      return "";
    }
  }, [experimentId, targetUrl]);

  function openVariant() {
    if (!qaUrl) return;
    window.open(qaUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-3xl border border-border bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">QA variant</p>
          <h2 className="mt-2 text-2xl font-semibold">Tester la variante B</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Colle une vraie URL Shopify, puis copie ou ouvre directement le lien QA.
          </p>
        </div>
        <div className="rounded-2xl bg-secondary/50 px-4 py-3 text-sm">
          <span className="text-muted-foreground">Experiment ID</span>
          <div className="mt-1 break-all font-mono text-xs font-semibold text-foreground">{experimentId}</div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Input
          value={targetUrl}
          onChange={(event) => setTargetUrl(event.target.value)}
          placeholder="https://ta-boutique.myshopify.com/products/ton-produit"
        />
        <div className="flex flex-wrap gap-3">
          <CopyButton value={experimentId} label="Copier l'ID" copiedLabel="ID copie" />
          <CopyButton value={qaParams} label="Copier les params QA" copiedLabel="Params copies" />
          <CopyButton value={qaUrl} label="Copier le lien QA" copiedLabel="Lien copie" />
          <Button type="button" onClick={openVariant} disabled={!qaUrl}>
            <ExternalLink className="h-4 w-4" />
            Ouvrir la variante B
          </Button>
        </div>
      </div>
    </div>
  );
}

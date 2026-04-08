"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getDictionary, resolveLocale, withLang } from "@/lib/i18n";

export function ProjectForm({ locale = "fr" }: { locale?: string }) {
  const currentLocale = resolveLocale(locale);
  const t = getDictionary(currentLocale);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [platform, setPlatform] = useState("shopify");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <Card className="bg-white">
      <div className="space-y-5">
        <div>
          <p className="text-lg font-semibold">{t.projectForm.title}</p>
          <p className="text-sm text-muted-foreground">{t.projectForm.body}</p>
        </div>
        <Input placeholder="Northstar Store" value={name} onChange={(event) => setName(event.target.value)} />
        <Input placeholder="northstar-store.com" value={domain} onChange={(event) => setDomain(event.target.value)} />
        <select
          className="flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm outline-none"
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
        >
          <option value="shopify">Shopify</option>
          <option value="webflow">Webflow</option>
          <option value="woocommerce">WooCommerce</option>
              <option value="salesforce">Salesforce Commerce Cloud</option>
              <option value="custom">Custom</option>
        </select>
        <Button
          disabled={loading}
          onClick={async () => {
            if (!name.trim() || !domain.trim()) {
              setError(t.common.createProject);
              return;
            }

            setLoading(true);
            setError("");

            try {
              const response = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: name.trim(),
                  domain: domain.trim(),
                  platform
                })
              });

              const data = await response.json();
              if (!response.ok) {
                setError(data.error ?? t.common.createProject);
                return;
              }

              window.location.assign(withLang(`/dashboard/sites/${data.project.id}/installation`, currentLocale));
              return;
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : t.common.createProject);
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? t.common.loadingProject : t.common.createProject}
        </Button>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </Card>
  );
}

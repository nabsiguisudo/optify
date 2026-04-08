"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ShopifyConnectForm({
  projectId,
  initialShopDomain,
  status
}: {
  projectId: string;
  initialShopDomain?: string;
  status?: string;
}) {
  const [shopDomain, setShopDomain] = useState(initialShopDomain ?? "");
  const [adminAccessToken, setAdminAccessToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/shopify/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          shopDomain,
          adminAccessToken
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to connect Shopify store");
      }
      setMessage(`Connected to ${payload.connection.shopDomain}. Reload the page to see the synced storefront details.`);
      setAdminAccessToken("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to connect Shopify store");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="bg-white">
      <p className="text-lg font-semibold">Advanced Shopify sync</p>
      <p className="mt-2 text-sm text-muted-foreground">
        This step is optional. Manual install already lets Optify track the storefront. Use this only if you want Optify to read shop metadata like theme, currency and plan.
      </p>
      <details className="mt-5 rounded-[1.6rem] border border-border bg-secondary/30 p-4">
        <summary className="cursor-pointer list-none text-sm font-medium">Open advanced Shopify connection</summary>
        <p className="mt-3 text-sm text-muted-foreground">
          Current Shopify setup is still pre-OAuth. If you already have a private Admin API token from a custom app, you can use it here. Otherwise, skip this and continue with the manual snippet + pixel install below.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Shop domain</span>
            <input
              value={shopDomain}
              onChange={(event) => setShopDomain(event.target.value)}
              placeholder="your-store.myshopify.com"
              className="h-11 w-full rounded-2xl border border-border px-4 outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Admin API access token</span>
            <input
              value={adminAccessToken}
              onChange={(event) => setAdminAccessToken(event.target.value)}
              type="password"
              placeholder="shpat_..."
              className="h-11 w-full rounded-2xl border border-border px-4 outline-none"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? "Connecting..." : status === "connected" ? "Reconnect store" : "Connect store"}
            </Button>
            {message ? <span className="text-sm text-primary">{message}</span> : null}
            {error ? <span className="text-sm text-red-600">{error}</span> : null}
          </div>
        </form>
      </details>
    </Card>
  );
}

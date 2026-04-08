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
        throw new Error(payload.error ?? "Impossible de connecter la boutique Shopify");
      }
      setMessage(`Connecte a ${payload.connection.shopDomain}. Recharge la page pour voir les metadonnees synchronisees.`);
      setAdminAccessToken("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Impossible de connecter la boutique Shopify");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="bg-white">
      <p className="text-lg font-semibold">Connexion Shopify avancee</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Cette etape est optionnelle. L'installation manuelle suffit deja pour suivre la boutique. Utilise-la seulement si tu veux synchroniser des metadonnees comme le theme, la devise ou le plan.
      </p>
      <details className="mt-5 rounded-[1.6rem] border border-border bg-secondary/30 p-4">
        <summary className="cursor-pointer list-none text-sm font-medium">Ouvrir la connexion avancee Shopify</summary>
        <p className="mt-3 text-sm text-muted-foreground">
          Le flux OAuth n'est pas encore en place ici. Si tu as deja un token Admin API prive via une app custom Shopify, tu peux l'utiliser. Sinon, garde simplement le snippet + le pixel manuel.
        </p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Domaine de la boutique</span>
            <input
              value={shopDomain}
              onChange={(event) => setShopDomain(event.target.value)}
              placeholder="your-store.myshopify.com"
              className="h-11 w-full rounded-2xl border border-border px-4 outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Token Admin API</span>
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
              {busy ? "Connexion..." : status === "connected" ? "Reconnecter la boutique" : "Connecter la boutique"}
            </Button>
            {message ? <span className="text-sm text-primary">{message}</span> : null}
            {error ? <span className="text-sm text-red-600">{error}</span> : null}
          </div>
        </form>
      </details>
    </Card>
  );
}

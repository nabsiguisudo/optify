"use client";

import { ExternalLink, MousePointerClick, Paintbrush2 } from "lucide-react";

type VisualEditorCanvasProps = {
  targetUrl: string;
  onTargetUrlChange: (value: string) => void;
  onOpenEditor: () => void;
  pickerStatus: string;
  selectedLabel: string;
  selector: string;
};

export function VisualEditorCanvas({
  targetUrl,
  onTargetUrlChange,
  onOpenEditor,
  pickerStatus,
  selectedLabel,
  selector
}: VisualEditorCanvasProps) {
  return (
    <div className="rounded-[1.8rem] border border-[#eadfce] bg-[linear-gradient(180deg,#fff9f5_0%,#ffffff_100%)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-[#241b13]">Live visual editor Shopify</p>
          <p className="mt-2 text-sm leading-6 text-[#6f6458]">
            Ouvre la vraie page Shopify, clique l’élément à modifier, puis édite le texte et les couleurs directement sur la boutique.
            Quand tu valides, Optify récupère le sélecteur et les changements.
          </p>
        </div>
        <div className="rounded-full bg-[#fff1e7] px-3 py-2 text-xs font-medium text-[#a96532]">
          Plus de sandbox locale
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_auto]">
        <input
          type="url"
          value={targetUrl}
          onChange={(event) => onTargetUrlChange(event.target.value)}
          placeholder="https://ta-boutique.myshopify.com/products/ton-produit"
          className="h-12 rounded-2xl border border-[#d9ccb8] px-4 text-sm outline-none"
        />
        <button
          type="button"
          onClick={onOpenEditor}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#241b13] px-5 text-sm font-medium text-white hover:bg-[#38291d]"
        >
          <MousePointerClick className="h-4 w-4" />
          Ouvrir l’editeur live
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.4rem] border border-[#eadfce] bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#241b13]">
            <ExternalLink className="h-4 w-4 text-[#ff6f61]" />
            Page cible
          </div>
          <p className="mt-3 break-all text-sm text-[#6f6458]">{targetUrl || "Ajoute d’abord une URL Shopify."}</p>
        </div>
        <div className="rounded-[1.4rem] border border-[#eadfce] bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#241b13]">
            <MousePointerClick className="h-4 w-4 text-[#ff6f61]" />
            Element
          </div>
          <p className="mt-3 text-sm text-[#6f6458]">{selectedLabel || "Aucun élément sélectionné pour l’instant."}</p>
        </div>
        <div className="rounded-[1.4rem] border border-[#eadfce] bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#241b13]">
            <Paintbrush2 className="h-4 w-4 text-[#ff6f61]" />
            Etat de l’éditeur
          </div>
          <p className="mt-3 text-sm text-[#6f6458]">{pickerStatus}</p>
        </div>
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-dashed border-[#eadfce] bg-[#fcf8f1] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a96532]">Sélecteur actuel</p>
        <p className="mt-2 break-all font-mono text-xs text-[#4d4035]">{selector || "Le sélecteur arrivera ici après sélection dans Shopify."}</p>
      </div>
    </div>
  );
}

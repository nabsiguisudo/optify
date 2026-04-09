"use client";

import { ExternalLink, MousePointerClick, Paintbrush2 } from "lucide-react";

type VisualEditorCanvasProps = {
  targetUrl: string;
  onTargetUrlChange: (value: string) => void;
  onOpenEditor: () => void;
  pickerStatus: string;
  selectedLabel: string;
  selector: string;
  variantText: string;
  variantStyle: string;
};

export function VisualEditorCanvas({
  targetUrl,
  onTargetUrlChange,
  onOpenEditor,
  pickerStatus,
  selectedLabel,
  selector,
  variantText,
  variantStyle
}: VisualEditorCanvasProps) {
  const previewStyle = variantStyle
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, chunk) => {
      const [property, ...valueParts] = chunk.split(":");
      if (!property || valueParts.length === 0) return acc;
      const normalized = property.trim().replace(/-([a-z])/g, (_, char) => char.toUpperCase());
      acc[normalized] = valueParts.join(":").replace(/\s*!important$/i, "").trim();
      return acc;
    }, {});

  return (
    <div className="rounded-[1.8rem] border border-[#eadfce] bg-[linear-gradient(180deg,#fff9f5_0%,#ffffff_100%)] p-5">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-[#241b13]">Editeur live Shopify</p>
        <p className="mt-2 text-sm leading-6 text-[#6f6458]">
          Choisis une vraie page Shopify, ouvre l'editeur live, clique l'element a modifier puis valide.
          Optify recupere ensuite le selecteur, le texte et le style de la variante, puis te ramene sur l'app.
        </p>
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
          Ouvrir l'editeur live
        </button>
      </div>

      <div className="mt-4 rounded-[1.4rem] border border-[#eadfce] bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-[#241b13]">
              <ExternalLink className="h-4 w-4 text-[#ff6f61]" />
              Etat de la selection
            </div>
            <p className="break-all text-sm text-[#6f6458]">{targetUrl || "Ajoute d'abord une URL Shopify."}</p>
            <p className="text-sm text-[#6f6458]">{selectedLabel || "Aucun element Shopify selectionne pour l'instant."}</p>
            <p className="text-sm text-[#6f6458]">{pickerStatus}</p>
          </div>
          <div className="rounded-full bg-[#fff1e7] px-3 py-2 text-xs font-medium text-[#a96532]">
            La vraie boutique, pas une sandbox
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.4rem] border border-dashed border-[#eadfce] bg-[#fcf8f1] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a96532]">Selecteur actuel</p>
          <p className="mt-2 break-all font-mono text-xs text-[#4d4035]">{selector || "Le selecteur arrivera ici apres selection dans Shopify."}</p>
        </div>
        <div className="rounded-[1.4rem] border border-[#eadfce] bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#241b13]">
            <Paintbrush2 className="h-4 w-4 text-[#ff6f61]" />
            Apercu de la variante B
          </div>
          <div className="mt-4 rounded-2xl border border-[#f0e0d0] bg-[#fff8f1] p-4">
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-4 py-2 text-sm font-medium"
              style={previewStyle}
            >
              {variantText || selectedLabel || "Element selectionne"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

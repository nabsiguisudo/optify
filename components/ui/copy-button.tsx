"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied"
}: {
  value: string;
  label?: string;
  copiedLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" variant={copied ? "secondary" : "outline"} onClick={handleCopy} disabled={!value}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? copiedLabel : label}
    </Button>
  );
}

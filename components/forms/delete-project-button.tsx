"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { resolveLocale, withLang } from "@/lib/i18n";

export function DeleteProjectButton({
  projectId,
  projectName,
  locale = "fr"
}: {
  projectId: string;
  projectName: string;
  locale?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const currentLocale = resolveLocale(locale);

  return (
    <Button
      variant="outline"
      className="border-red-200 text-red-700 hover:bg-red-50"
      disabled={loading}
      onClick={async () => {
        const confirmed = window.confirm(`Delete "${projectName}" from Optify? This removes its local analytics and experiments.`);
        if (!confirmed) {
          return;
        }

        setLoading(true);
        try {
          const response = await fetch(`/api/projects/${projectId}`, {
            method: "DELETE"
          });

          if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.error ?? "Unable to delete project");
          }

          router.push(withLang("/dashboard/shopify", currentLocale));
          router.refresh();
        } catch (error) {
          window.alert(error instanceof Error ? error.message : "Unable to delete project");
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "Deleting..." : "Delete store"}
    </Button>
  );
}

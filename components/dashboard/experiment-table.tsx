import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getDictionary, localizeStatus, resolveLocale, withLang } from "@/lib/i18n";
import type { Experiment, ExperimentStats } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

export function ExperimentTable({
  experiments,
  statsByExperiment,
  locale = "fr"
}: {
  experiments: Experiment[];
  statsByExperiment: Record<string, ExperimentStats | undefined>;
  locale?: string;
}) {
  const currentLocale = resolveLocale(locale);
  const t = getDictionary(currentLocale);

  return (
    <Card className="bg-white">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Experiences du site</p>
          <p className="text-sm text-muted-foreground">Une liste plus simple a lire: nom, statut, page cible et meilleur taux de conversion observe.</p>
        </div>
        <Badge>{experiments.length} total</Badge>
      </div>
      <div className="space-y-4">
        {experiments.map((experiment) => {
          const stats = statsByExperiment[experiment.id];
          return (
            <div key={experiment.id} className="grid gap-4 rounded-3xl border border-border p-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr_0.7fr]">
              <div>
                <p className="font-semibold">{experiment.name}</p>
                <p className="text-sm text-muted-foreground">{experiment.pagePattern}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{t.common.status}</p>
                <Badge className={experiment.status === "running" ? "mt-2 bg-primary text-white" : "mt-2"}>
                  {localizeStatus(experiment.status, currentLocale)}
                </Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Lecture</p>
                <p className="mt-2 text-sm font-medium">{stats?.winner ? `${t.common.variant} ${stats.winner}` : t.common.noWinnerYet}</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.variants[0] ? formatPercent(Math.max(...stats.variants.map((variant) => variant.conversionRate))) : "0.0%"} max
                </p>
              </div>
              <div className="flex items-center justify-end">
                <Link className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-secondary" href={withLang(`/dashboard/projects/${experiment.projectId}/experiments/${experiment.id}`, currentLocale)}>
                  Ouvrir
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

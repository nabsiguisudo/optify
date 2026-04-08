import { ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  change
}: {
  label: string;
  value: string;
  change?: string;
}) {
  return (
    <Card className="bg-white">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {change ? (
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <ArrowUpRight className="h-4 w-4" />
            {change}
          </div>
        ) : null}
      </div>
    </Card>
  );
}

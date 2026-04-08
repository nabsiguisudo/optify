import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <Card className="border border-[#e7e0d4] bg-[#fffdfa] shadow-[0_18px_40px_rgba(73,56,26,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="max-w-4xl">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b6d3f]">{eyebrow}</p> : null}
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-[#221b10]">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#6b6255]">{description}</p>
          {meta ? <div className="mt-4 flex flex-wrap gap-2">{meta}</div> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </Card>
  );
}

export function DashboardSection({
  title,
  description,
  aside,
  children,
  className
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("border border-[#ebe3d5] bg-white shadow-[0_14px_34px_rgba(73,56,26,0.05)]", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className="text-xl font-semibold text-[#221b10]">{title}</h2>
          {description ? <p className="mt-2 text-sm text-[#6b6255]">{description}</p> : null}
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export function DashboardKpiGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export function DashboardKpiCard({
  label,
  value,
  hint,
  tone = "default"
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warm" | "soft";
}) {
  return (
    <div
      className={cn(
        "rounded-[1.5rem] border p-5",
        tone === "warm" && "border-[#ead9bc] bg-[#fff7eb]",
        tone === "soft" && "border-[#ece7de] bg-[#faf8f3]",
        tone === "default" && "border-[#ece4d8] bg-white"
      )}
    >
      <p className="text-sm text-[#7a705f]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#221b10]">{value}</p>
      {hint ? <p className="mt-2 text-sm leading-6 text-[#6b6255]">{hint}</p> : null}
    </div>
  );
}

export function DashboardMetricList({
  items
}: {
  items: Array<{ label: string; value: string; note?: string }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={`${item.label}-${item.value}`} className="rounded-[1.2rem] border border-[#efe7db] bg-[#fcfaf6] px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#3f3528]">{item.label}</p>
              {item.note ? <p className="mt-1 text-sm text-[#7a705f]">{item.note}</p> : null}
            </div>
            <p className="shrink-0 text-sm font-semibold text-[#221b10]">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardStatusBadge({
  label,
  tone = "default"
}: {
  label: string;
  tone?: "default" | "good" | "warn" | "muted";
}) {
  return (
    <Badge
      className={cn(
        "border-0",
        tone === "good" && "bg-[#dff2e7] text-[#1e5b38]",
        tone === "warn" && "bg-[#fff1d6] text-[#8d5c00]",
        tone === "muted" && "bg-[#efebe5] text-[#645b4d]",
        tone === "default" && "bg-[#f3ede2] text-[#5d513f]"
      )}
    >
      {label}
    </Badge>
  );
}

export function DashboardEmpty({
  title,
  body
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[#dfd5c4] bg-[#fbf8f2] px-5 py-6">
      <p className="font-semibold text-[#3f3528]">{title}</p>
      <p className="mt-2 text-sm leading-6 text-[#746956]">{body}</p>
    </div>
  );
}

export function DashboardProgress({
  label,
  value,
  note
}: {
  label: string;
  value: number;
  note?: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-[#eadfcd] bg-[#fdfbf7] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#3f3528]">{label}</p>
        <p className="text-sm font-semibold text-[#221b10]">{value}%</p>
      </div>
      <div className="mt-3 h-2.5 rounded-full bg-[#efe6d8]">
        <div className="h-2.5 rounded-full bg-[#c98a2e]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
      {note ? <p className="mt-3 text-sm text-[#6b6255]">{note}</p> : null}
    </div>
  );
}

export function DashboardBarList({
  items
}: {
  items: Array<{ label: string; value: number; displayValue: string; note?: string }>;
}) {
  const maxValue = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-[1.2rem] border border-[#eee5d8] bg-white px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <p className="font-medium text-[#3f3528]">{item.label}</p>
            <p className="text-sm font-semibold text-[#221b10]">{item.displayValue}</p>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#f1ebe2]">
            <div className="h-2 rounded-full bg-[#b8782f]" style={{ width: `${(item.value / maxValue) * 100}%` }} />
          </div>
          {item.note ? <p className="mt-2 text-sm text-[#6f6558]">{item.note}</p> : null}
        </div>
      ))}
    </div>
  );
}

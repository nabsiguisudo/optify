import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)]", className)} {...props} />;
}

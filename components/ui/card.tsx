import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("min-w-0 rounded-[1.6rem] border border-white/70 bg-card p-6 shadow-[0_16px_48px_rgba(79,72,119,0.08)] backdrop-blur-sm", className)} {...props} />;
}

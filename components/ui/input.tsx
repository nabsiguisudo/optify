import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-border bg-white px-4 py-2 text-sm outline-none ring-0 transition placeholder:text-muted-foreground focus:border-primary",
        className
      )}
      {...props}
    />
  );
}

import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("min-h-28 w-full rounded-2xl border border-border bg-white p-4 text-sm focus:border-primary focus:outline-none", className)}
      {...props}
    />
  );
}

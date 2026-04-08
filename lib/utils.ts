import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

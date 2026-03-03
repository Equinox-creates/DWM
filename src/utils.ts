import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hexToInt(hex: string): number | null {
  if (!hex) return null;
  const cleanHex = hex.replace("#", "");
  const int = parseInt(cleanHex, 16);
  return isNaN(int) ? null : int;
}

export function intToHex(int: number | null | undefined): string {
  if (int === null || int === undefined) return "#000000";
  return "#" + int.toString(16).padStart(6, "0");
}

export function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

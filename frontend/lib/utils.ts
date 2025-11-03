// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// This function can be used in both Server and Client Components.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// The uuid function has been moved to lib/client-utils.ts
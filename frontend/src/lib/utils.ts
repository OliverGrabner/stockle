import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format market cap number to human-readable format with 1 significant figure
 * Examples: 2500000000 -> "$2B", 500000000 -> "$500M", 1200000000000 -> "$1T"
 */
export function formatMarketCap(marketCap: number | undefined | null): string {
  if (marketCap === undefined || marketCap === null || marketCap === 0) {
    return "N/A"
  }

  const trillion = 1_000_000_000_000
  const billion = 1_000_000_000
  const million = 1_000_000

  if (marketCap >= trillion) {
    const value = marketCap / trillion
    const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
    return `$${rounded}T`
  } else if (marketCap >= billion) {
    const value = marketCap / billion
    const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
    return `$${rounded}B`
  } else if (marketCap >= million) {
    const value = marketCap / million
    const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10
    return `$${rounded}M`
  }

  return `$${marketCap.toLocaleString()}`
}

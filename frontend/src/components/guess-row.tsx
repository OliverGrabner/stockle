"use client"

import { cn } from "@/lib/utils"
import { GuessResult, GuessComparison } from "@/types/game"
import { ArrowUp, ArrowDown } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface GuessRowProps {
  result: GuessResult
  logo?: string
}

export function EmptyRow() {
  return (
    <div className="flex items-center gap-1 md:gap-4 justify-center">
      <Skeleton className="w-[60px] md:w-[105px] h-[60px] md:h-[90px] rounded-lg" />
      <Skeleton className="w-[48px] md:w-[90px] h-[60px] md:h-[90px] rounded-lg" />
      <Skeleton className="w-[48px] md:w-[90px] h-[60px] md:h-[90px] rounded-lg" />
      <Skeleton className="w-[48px] md:w-[90px] h-[60px] md:h-[90px] rounded-lg" />
      <Skeleton className="w-[48px] md:w-[90px] h-[60px] md:h-[90px] rounded-lg" />
      <Skeleton className="w-[48px] md:w-[90px] h-[60px] md:h-[90px] rounded-lg" />
      <Skeleton className="w-[48px] md:w-[90px] h-[60px] md:h-[90px] rounded-lg" />
    </div>
  )
}

export function GuessHeader() {
  return (
    <div className="flex items-center gap-1 md:gap-4 justify-center">
      <div className="w-[60px] md:w-[105px] text-center text-[8px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Stock
      </div>
      <div className="w-[48px] md:w-[90px] text-center text-[8px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Sector
      </div>
      <div className="w-[48px] md:w-[90px] text-center text-[8px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Industry
      </div>
      <div className="w-[48px] md:w-[90px] text-center text-[8px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Mkt Cap
      </div>
      <div className="w-[48px] md:w-[90px] text-center text-[8px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Price
      </div>
      <div className="w-[48px] md:w-[90px] text-center text-[8px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        P/E
      </div>
      <div className="w-[48px] md:w-[90px] text-center text-[8px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Div
      </div>
    </div>
  )
}

export function GuessRow({ result, logo }: GuessRowProps) {
  return (
    <div className="flex items-center gap-1 md:gap-4 justify-center">
      <div className="flex flex-col items-center justify-center gap-0.5 md:gap-1 p-1 md:p-2 rounded-lg border bg-card w-[60px] md:w-[105px] h-[60px] md:h-[90px]">
        {logo && (
          <img
            src={logo}
            alt={result.guess.name}
            className="h-5 w-5 md:h-8 md:w-8 rounded object-contain bg-white flex-shrink-0"
          />
        )}
        <span className="font-bold text-[10px] md:text-sm">{result.guess.ticker}</span>
        <span className="text-[7px] md:text-[9px] text-muted-foreground text-center line-clamp-1 md:line-clamp-2 leading-tight hidden md:block">
          {result.guess.name}
        </span>
      </div>

      <ComparisonBox comparison={result.comparisons.sector} />
      <ComparisonBox comparison={result.comparisons.industry} />
      <ComparisonBox comparison={result.comparisons.marketCap} />
      <ComparisonBox comparison={result.comparisons.price} />
      <ComparisonBox comparison={result.comparisons.peRatio} />
      <ComparisonBox comparison={result.comparisons.dividendYield} />
    </div>
  )
}

interface ComparisonBoxProps {
  comparison: GuessComparison
}

function getBackgroundColor(status: GuessComparison["status"], closeness?: number): string {
  if (status === "correct") return "rgb(5, 150, 105)"
  if (status === "wrong") return "rgb(190, 18, 60)"

  if (closeness !== undefined) {
    const r = Math.round(217 + (5 - 217) * closeness)
    const g = Math.round(119 + (150 - 119) * closeness)
    const b = Math.round(6 + (105 - 6) * closeness)
    return `rgb(${r}, ${g}, ${b})`
  }

  // fallback color
  return "rgb(217, 119, 6)"
}

function ComparisonBox({ comparison }: ComparisonBoxProps) {
  const showArrow = comparison.status === "higher" || comparison.status === "lower"
  const bgColor = getBackgroundColor(comparison.status, comparison.closeness)

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg text-white w-[48px] md:w-[90px] h-[60px] md:h-[90px]"
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-[8px] md:text-xs font-semibold text-center leading-tight px-0.5 md:px-1">
        {comparison.value}
      </span>
      {showArrow && (
        <div className="mt-0.5 md:mt-1">
          {comparison.status === "higher"
            ? <ArrowDown className="h-3 w-3 md:h-5 md:w-5" />
            : <ArrowUp className="h-3 w-3 md:h-5 md:w-5" />
          }
        </div>
      )}
    </div>
  )
}

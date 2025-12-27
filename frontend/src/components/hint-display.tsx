"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Lightbulb, ChevronDown, Building2, Factory, Image } from "lucide-react"
import { stocks } from "@/data/stocks"
import { cn } from "@/lib/utils"

interface HintDisplayProps {
  hints: { sector?: string; industry?: string; ticker?: string }
  hintLevel: number
  onRequestHint: () => void
  disabled?: boolean
}

export function HintDisplay({ hints, hintLevel, onRequestHint, disabled }: HintDisplayProps) {
  const [isOpen, setIsOpen] = useState(true)

  // Find stock and get logo
  const stock = hints.ticker ? stocks.find(s => s.ticker === hints.ticker) : null
  const logo = stock?.logo ?? null

  const hintsRemaining = 3 - hintLevel
  const showLogo = hintLevel >= 3 && hints.ticker
  const hasHints = hints.sector || hints.industry || showLogo

  if (disabled && !hasHints) return null

  return (
    <div className="w-full max-w-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-center gap-2">
          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRequestHint}
              disabled={hintsRemaining === 0}
              className="gap-2"
            >
              <Lightbulb className="h-4 w-4" />
              {hintsRemaining === 0 ? "No hints left" : `Hint (${hintsRemaining})`}
            </Button>
          )}

          {hasHints && (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                {isOpen ? "Hide" : "Show"} hints
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
              </Button>
            </CollapsibleTrigger>
          )}
        </div>

        {hasHints && (
          <CollapsibleContent className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              {hints.sector && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Sector</span>
                    <p className="font-medium">{hints.sector}</p>
                  </div>
                </div>
              )}

              {hints.industry && (
                <div className="flex items-center gap-3">
                  <Factory className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Industry</span>
                    <p className="font-medium">{hints.industry}</p>
                  </div>
                </div>
              )}

              {showLogo && (
                <div className="flex items-center gap-3">
                  <Image className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Logo</span>
                    <div className="mt-1">
                      {logo ? (
                        <div className="bg-white rounded-md p-2 w-fit">
                          <img
                            src={logo}
                            alt="Logo hint"
                            className="h-12 w-12 object-contain blur-[4px]"
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unavailable</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  )
}

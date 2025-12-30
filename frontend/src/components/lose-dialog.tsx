"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GuessResult } from "@/types/game"
import { toast } from "sonner"
import { Copy } from "lucide-react"
import { stocks } from "@/data/stocks"

interface LoseDialogProps {
  open: boolean
  guesses: { result: GuessResult }[]
  answer: { ticker: string; name: string } | null
  gaveUp?: boolean
  onClose: () => void
}

export function LoseDialog({ open, guesses, answer, gaveUp = false, onClose }: LoseDialogProps) {
  const answerStock = answer ? stocks.find(s => s.ticker === answer.ticker) : null

  const generateShareText = () => {
    const rows = guesses.map(g => {
      const c = g.result.comparisons
      return [c.sector, c.industry, c.marketCap, c.price, c.peRatio, c.dividendYield]
        .map(comp => {
          if (comp.status === "correct") return "🟩"
          if (comp.status === "higher" || comp.status === "lower") return "🟨"
          return "⬛"
        })
        .join("")
    }).join("\n")

    const suffix = gaveUp ? " (gave up)" : ""
    return `STOCKLE X/6${suffix}\n\n${rows}`
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateShareText())
    toast.success("Copied to clipboard!")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">{gaveUp ? "You Gave Up" : "Game Over"}</DialogTitle>
        </DialogHeader>

        {answer && (
          <div className="flex flex-col items-center gap-4 py-4">
            <span className="text-sm text-muted-foreground">Answer:</span>
            <div className="flex items-center gap-4">
              {answerStock?.logo && (
                <img
                  src={answerStock.logo}
                  alt={answer.name}
                  className="h-16 w-16 rounded-lg object-contain bg-white p-1"
                />
              )}
              <div className="flex flex-col">
                <span className="text-2xl font-bold">{answer.ticker}</span>
                <span className="text-sm text-muted-foreground">{answer.name}</span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-muted p-4 rounded-lg font-mono text-sm whitespace-pre text-center">
          {generateShareText()}
        </div>

        <Button onClick={handleCopy} className="w-full gap-2">
          <Copy className="h-4 w-4" />
          Copy Results
        </Button>
      </DialogContent>
    </Dialog>
  )
}

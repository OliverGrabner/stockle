"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GuessResult } from "@/types/game"
import { toast } from "sonner"
import confetti from "canvas-confetti"
import { useEffect } from "react"
import { Copy } from "lucide-react"

interface WinDialogProps {
  open: boolean
  guesses: { result: GuessResult }[]
  onClose: () => void
}

export function WinDialog({ open, guesses, onClose }: WinDialogProps) {
  useEffect(() => {
    if (open) {
      const end = Date.now() + 3 * 1000
      const colors = ["#22c55e", "#f59e0b", "#ffffff"]

      const frame = () => {
        if (Date.now() > end) return

        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          startVelocity: 60,
          origin: { x: 0, y: 0.5 },
          colors: colors,
        })
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          startVelocity: 60,
          origin: { x: 1, y: 0.5 },
          colors: colors,
        })
        requestAnimationFrame(frame)
      }
      frame()
    }
  }, [open])

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

    return `STOCKLE ${guesses.length}/6\n\n${rows}`
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateShareText())
    toast.success("Copied to clipboard!")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Congratulations!</DialogTitle>
          <DialogDescription>
            You guessed the stock in {guesses.length} {guesses.length === 1 ? "try" : "tries"}!
          </DialogDescription>
        </DialogHeader>

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

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { StockSearch } from "@/components/stock-search"
import { GuessRow, GuessHeader, EmptyRow } from "@/components/guess-row"
import { WinDialog } from "@/components/win-dialog"
import { LoseDialog } from "@/components/lose-dialog"
import { HintDisplay } from "@/components/hint-display"
import { PriceChart } from "@/components/price-chart"
import { stocks as staticStocks, Stock } from "@/data/stocks"
import { GuessResult } from "@/types/game"
import { loadStocksWithMetadata } from "@/lib/stock-service"

interface GuessWithLogo {
  result: GuessResult
  logo: string
}

export function Game({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [guesses, setGuesses] = useState<GuessWithLogo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showWinDialog, setShowWinDialog] = useState(false)
  const [showLoseDialog, setShowLoseDialog] = useState(false)
  const [answer, setAnswer] = useState<{ ticker: string; name: string } | null>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [hints, setHints] = useState<{ sector?: string; industry?: string; ticker?: string }>({})
  const [stocks, setStocks] = useState<Stock[]>(staticStocks)

  const MAX_GUESSES = 6
  const hasWon = guesses.some(g => g.result.correct)
  const hasLost = guesses.length >= MAX_GUESSES && !hasWon
  const gameOver = hasWon || hasLost

  useEffect(() => {
    loadStocksWithMetadata().then(setStocks)
  }, [])

  const handleRequestHint = async () => {
    const nextLevel = hintLevel + 1
    try {
      const res = await fetch(`/api/puzzle/today/hint?level=${nextLevel}`)
      if (res.ok) {
        const data = await res.json()
        setHints(data)
        setHintLevel(nextLevel)
      }
    } catch (error) {
      console.error('Failed to get hint:', error)
    }
  }

  const handleSubmit = async (stock: Stock) => {
    setIsLoading(true)
    const start = performance.now()

    try {
      console.log('[timing] Starting fetch...')
      const fetchStart = performance.now()

      const res = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: stock.ticker })
      })

      console.log(`[timing] Fetch complete: ${(performance.now() - fetchStart).toFixed(0)}ms`)

      if (!res.ok) {
        const error = await res.json()
        console.error('Guess error:', error)
        return
      }

      const parseStart = performance.now()
      const result: GuessResult = await res.json()
      console.log(`[timing] JSON parse: ${(performance.now() - parseStart).toFixed(0)}ms`)

      setGuesses((prev) => [...prev, { result, logo: stock.logo }])

      if (result.correct) {
        setShowWinDialog(true)
      } else if (guesses.length + 1 >= MAX_GUESSES) {
        // Fetch the answer when player loses
        try {
          const answerRes = await fetch('/api/puzzle/today/answer')
          if (answerRes.ok) {
            const answerData = await answerRes.json()
            setAnswer(answerData)
          }
        } catch (e) {
          console.error('Failed to fetch answer:', e)
        }
        setShowLoseDialog(true)
      }
    } catch (error) {
      console.error('Failed to submit guess:', error)
    } finally {
      setIsLoading(false)
      console.log(`[timing] Total: ${(performance.now() - start).toFixed(0)}ms`)
    }
  }

  return (
    <div className={cn("flex flex-col items-center gap-6", className)} {...props}>
      <header className="flex flex-col items-center gap-1">
        <h1 className="text-4xl font-serif tracking-tight">STOCKLE</h1>
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          Daily Stock Challenge
        </p>
      </header>

      <PriceChart className="px-4" />

      <div className="flex flex-col items-center gap-4 w-full max-w-sm">
        <StockSearch onSubmit={handleSubmit} disabled={gameOver} loading={isLoading} stocks={stocks} />
        <HintDisplay
          hints={hints}
          hintLevel={hintLevel}
          onRequestHint={handleRequestHint}
          disabled={gameOver}
        />
      </div>

      <div className="flex flex-col gap-3 w-full">
        <GuessHeader />
        {Array.from({ length: MAX_GUESSES }).map((_, i) =>
          guesses[i] ? (
            <GuessRow key={i} result={guesses[i].result} logo={guesses[i].logo} />
          ) : (
            <EmptyRow key={i} />
          )
        )}
      </div>

      <WinDialog
        open={showWinDialog}
        guesses={guesses}
        onClose={() => setShowWinDialog(false)}
      />

      <LoseDialog
        open={showLoseDialog}
        guesses={guesses}
        answer={answer}
        onClose={() => setShowLoseDialog(false)}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { StockSearch } from "@/components/stock-search"
import { GuessRow, GuessHeader, EmptyRow } from "@/components/guess-row"
import { WinDialog } from "@/components/win-dialog"
import { LoseDialog } from "@/components/lose-dialog"
import { GiveUpConfirmDialog } from "@/components/give-up-confirm-dialog"
import { TutorialDialog } from "@/components/tutorial-dialog"
import { StatsDialog } from "@/components/stats-dialog"
import { HintDisplay } from "@/components/hint-display"
import { PriceChart } from "@/components/price-chart"
import { Button } from "@/components/ui/button"
import { stocks as staticStocks, Stock } from "@/data/stocks"
import { GuessResult } from "@/types/game"
import { loadStocksWithMetadata } from "@/lib/stock-service"
import { Globe, Info, Flag, BarChart3 } from "lucide-react"

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  )
}

interface GuessWithLogo {
  result: GuessResult
  logo: string
}

interface SavedGameState {
  date: string
  guesses: GuessWithLogo[]
  gaveUp: boolean
  answer: { ticker: string; name: string } | null
  hintLevel: number
  hints: { sector?: string; industry?: string; ticker?: string }
}

const GAME_STORAGE_KEY = 'stockle-game-state'

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function saveGameState(state: Omit<SavedGameState, 'date'>) {
  const savedState: SavedGameState = {
    date: getTodayString(),
    ...state
  }
  localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(savedState))
}

function loadGameState(): SavedGameState | null {
  try {
    const saved = localStorage.getItem(GAME_STORAGE_KEY)
    if (!saved) return null

    const state: SavedGameState = JSON.parse(saved)
    if (state.date !== getTodayString()) {
      localStorage.removeItem(GAME_STORAGE_KEY)
      return null
    }
    return state
  } catch {
    return null
  }
}

export function Game({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [guesses, setGuesses] = useState<GuessWithLogo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showWinDialog, setShowWinDialog] = useState(false)
  const [showLoseDialog, setShowLoseDialog] = useState(false)
  const [showTutorial, setShowTutorial] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false)
  const [gaveUp, setGaveUp] = useState(false)
  const [answer, setAnswer] = useState<{ ticker: string; name: string } | null>(null)
  const [hintLevel, setHintLevel] = useState(0)
  const [hints, setHints] = useState<{ sector?: string; industry?: string; ticker?: string }>({})
  const [stocks, setStocks] = useState<Stock[]>(staticStocks)
  const [gameLoaded, setGameLoaded] = useState(false)

  const MAX_GUESSES = 6
  const hasWon = guesses.some(g => g.result.correct)
  const hasLost = (guesses.length >= MAX_GUESSES && !hasWon) || gaveUp
  const gameOver = hasWon || hasLost

  // Load saved game state on mount
  useEffect(() => {
    const saved = loadGameState()
    if (saved) {
      setGuesses(saved.guesses)
      setGaveUp(saved.gaveUp)
      setAnswer(saved.answer)
      setHintLevel(saved.hintLevel)
      setHints(saved.hints)

      // Show appropriate dialog if game was over
      const wasWon = saved.guesses.some(g => g.result.correct)
      const wasLost = (saved.guesses.length >= MAX_GUESSES && !wasWon) || saved.gaveUp

      if (wasWon) {
        setTimeout(() => setShowWinDialog(true), 500)
      } else if (wasLost) {
        setTimeout(() => setShowLoseDialog(true), 500)
      }
    }
    setGameLoaded(true)
  }, [])

  // Save game state whenever it changes
  useEffect(() => {
    if (gameLoaded) {
      saveGameState({ guesses, gaveUp, answer, hintLevel, hints })
    }
  }, [guesses, gaveUp, answer, hintLevel, hints, gameLoaded])

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

  const handleGiveUp = async () => {
    setShowGiveUpConfirm(false)
    setGaveUp(true)

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

  return (
    <div className={cn("flex flex-col items-center gap-6", className)} {...props}>
      <header className="flex flex-col items-center gap-1 relative w-full">
        <div className="absolute top-0 right-2 md:right-4 flex gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:h-12 md:w-12"
            onClick={() => setShowStats(true)}
            aria-label="Statistics"
          >
            <BarChart3 className="h-5 w-5 md:h-7 md:w-7" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:h-12 md:w-12"
            onClick={() => setShowTutorial(true)}
            aria-label="How to play"
          >
            <Info className="h-5 w-5 md:h-7 md:w-7" />
          </Button>
        </div>
        <h1 className="text-4xl font-serif tracking-tight">STOCKLE</h1>
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          Daily Stock Challenge
        </p>
      </header>

      <div className="relative w-full">
        <PriceChart className="px-4" />
      </div>

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

      {!gameOver && (
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setShowGiveUpConfirm(true)}
        >
          <Flag className="h-4 w-4" />
          Give Up
        </Button>
      )}

      <WinDialog
        open={showWinDialog}
        guesses={guesses}
        hintsUsed={hintLevel}
        onClose={() => setShowWinDialog(false)}
      />

      <LoseDialog
        open={showLoseDialog}
        guesses={guesses}
        answer={answer}
        gaveUp={gaveUp}
        hintsUsed={hintLevel}
        onClose={() => setShowLoseDialog(false)}
      />

      <GiveUpConfirmDialog
        open={showGiveUpConfirm}
        onConfirm={handleGiveUp}
        onCancel={() => setShowGiveUpConfirm(false)}
      />

      <TutorialDialog
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <StatsDialog
        open={showStats}
        onClose={() => setShowStats(false)}
      />

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-4">
          <a
            href="https://github.com/olivergrabner/stockle"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            GitHub
          </a>
          <span>•</span>
          <a
            href="https://olivergrabner.com/projects"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            Portfolio
          </a>
        </div>
      </footer>
    </div>
  )
}

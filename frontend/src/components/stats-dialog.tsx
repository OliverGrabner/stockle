"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface StatsData {
  distribution: number[]
  totalPlays: number
  average: number
  yourResult?: number
  percentile?: number
}

interface StatsDialogProps {
  open: boolean
  onClose: () => void
}

export function StatsDialog({ open, onClose }: StatsDialogProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
      fetch("/api/stats/today")
        .then(res => res.ok ? res.json() : null)
        .then(data => setStats(data))
        .catch(() => setStats(null))
        .finally(() => setLoading(false))
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">Today's Statistics</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : stats ? (
          <StatsDisplay stats={stats} />
        ) : (
          <p className="text-center text-muted-foreground py-4">No stats available yet</p>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface StatsDisplayProps {
  stats: StatsData
  className?: string
}

export function StatsDisplay({ stats, className }: StatsDisplayProps) {
  const { distribution, totalPlays, average, yourResult, percentile } = stats
  const maxCount = Math.max(...distribution, 1)
  const labels = ["1", "2", "3", "4", "5", "6", "X"]

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        {distribution.map((count, i) => {
          const percentage = totalPlays > 0 ? Math.round((count / totalPlays) * 100) : 0
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0
          const isYourResult = yourResult === i + 1

          return (
            <div key={i} className="flex items-center gap-2">
              <span className={cn(
                "w-4 text-sm font-medium text-right",
                isYourResult && "text-primary font-bold"
              )}>
                {labels[i]}
              </span>
              <div className="flex-1 h-6 bg-muted rounded-sm overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-500 rounded-sm flex items-center justify-end pr-2",
                    isYourResult ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  style={{ width: `${Math.max(barWidth, count > 0 ? 8 : 0)}%` }}
                >
                  {count > 0 && (
                    <span className={cn(
                      "text-xs font-medium",
                      isYourResult ? "text-primary-foreground" : "text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  )}
                </div>
              </div>
              <span className="w-10 text-xs text-muted-foreground text-right">
                {percentage}%
              </span>
              {isYourResult && (
                <span className="text-xs text-primary font-medium">You</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-2 border-t text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          {totalPlays} {totalPlays === 1 ? "player" : "players"} today
          {average > 0 && ` • Avg: ${average.toFixed(1)} guesses`}
        </p>
        {percentile !== undefined && percentile > 0 && (
          <p className="text-sm font-medium text-primary">
            You beat {percentile.toFixed(0)}% of players!
          </p>
        )}
      </div>
    </div>
  )
}

"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { GuessResult } from "@/types/game"
import { toast } from "sonner"
import { Copy } from "lucide-react"
import { stocks } from "@/data/stocks"
import { useEffect, useState } from "react"
import { StatsDisplay } from "@/components/stats-dialog"

interface StatsData {
distribution: number[]
totalPlays: number
average: number
yourResult?: number
percentile?: number
}

interface LoseDialogProps {
open: boolean
guesses: { result: GuessResult }[]
answer: { ticker: string; name: string } | null
gaveUp?: boolean
hintsUsed?: number
onClose: () => void
}

export function LoseDialog({ open, guesses, answer, gaveUp = false, hintsUsed = 0, onClose }: LoseDialogProps) {
const answerStock = answer ? stocks.find(s => s.ticker === answer.ticker) : null
const [stats, setStats] = useState<StatsData | null>(null)
const [statsSubmitted, setStatsSubmitted] = useState(false)

useEffect(() => {
if (open && !statsSubmitted) {
const today = new Date().toISOString().split('T')[0]
const submittedKey = `stockle-stats-${today}`

const savedResult = localStorage.getItem(submittedKey)
if (savedResult) {
// Migrate old format (just "true") to new format
try {
const parsed = JSON.parse(savedResult)
if (parsed.yourResult !== undefined) {
// New format - user already submitted, fetch latest stats
fetch("/api/stats/today")
.then(res => res.ok ? res.json() : null)
.then(data => {
if (data) {
const { yourResult, percentile } = parsed
setStats({ ...data, yourResult, percentile })
}
})
setStatsSubmitted(true)
return
}
} catch (e) {
// Old format or corrupted - clear it and resubmit
console.log("Clearing old localStorage format")
localStorage.removeItem(submittedKey)
}
}

fetch("/api/stats/submit", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ guessCount: guesses.length, won: false })
})
.then(res => res.ok ? res.json() : null)
.then(data => {
if (data) {
setStats(data)
// Store yourResult and percentile for later retrieval
localStorage.setItem(submittedKey, JSON.stringify({
yourResult: data.yourResult,
percentile: data.percentile
}))
}
})
.catch(console.error)
setStatsSubmitted(true)
}
}, [open, guesses.length, statsSubmitted])

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

const hintSuffix = hintsUsed > 0 ? ` 💡${hintsUsed}` : ""
const gaveUpSuffix = gaveUp ? " (gave up)" : ""
return `STOCKLE X/6${hintSuffix}${gaveUpSuffix}\n\n${rows}\n\nstockle.fun`
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

{stats && <StatsDisplay stats={stats} />}

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

export interface GuessComparison {
  value: string
  status: "correct" | "wrong" | "higher" | "lower"
  closeness?: number // 0-1, how close the guess is (1 = exact match)
}

export interface GuessResult {
  ticker: string
  correct: boolean
  guess: {
    ticker: string
    name: string
    sector: string
    industry: string
    marketCap: number
    price: number
    peRatio: number | null
    dividendYield: number | null
  }
  comparisons: {
    sector: GuessComparison
    industry: GuessComparison
    marketCap: GuessComparison
    price: GuessComparison
    peRatio: GuessComparison
    dividendYield: GuessComparison
  }
}

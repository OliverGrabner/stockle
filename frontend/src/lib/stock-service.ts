import { stocks as staticStocks, Stock } from "@/data/stocks"

export interface FilterOptions {
  sectors: string[]
  industries: string[]
}

export interface StockFilter {
  type: 'sector' | 'industry'
  value: string
}

// Fetch stocks with metadata and merge with static logos
export async function loadStocksWithMetadata(): Promise<Stock[]> {
  try {
    const res = await fetch('/api/stocks/metadata')
    if (!res.ok) throw new Error('Failed to fetch stocks')

    const data = await res.json()
    const backendStocks = data.stocks as Array<{
      ticker: string
      name: string
      sector: string
      industry: string
      marketCap: number | null
    }>

    // Merge backend data with frontend logo URLs
    return backendStocks.map(backendStock => {
      const staticStock = staticStocks.find(s => s.ticker === backendStock.ticker)
      return {
        ticker: backendStock.ticker,
        name: backendStock.name,
        logo: staticStock?.logo || '',
        sector: backendStock.sector,
        industry: backendStock.industry,
        marketCap: backendStock.marketCap ?? undefined,
      }
    })
  } catch (error) {
    console.error('Failed to load stock metadata:', error)
    return staticStocks // Fallback to static stocks
  }
}

// Fetch filter options
export async function loadFilterOptions(): Promise<FilterOptions> {
  try {
    const res = await fetch('/api/stocks/filters')
    if (!res.ok) throw new Error('Failed to fetch filters')
    return await res.json()
  } catch (error) {
    console.error('Failed to load filter options:', error)
    return { sectors: [], industries: [] }
  }
}

// Apply filter to stocks
export function applyStockFilter(
  stocks: Stock[],
  filter: StockFilter | null
): Stock[] {
  if (!filter) return stocks

  return stocks.filter(stock => {
    if (filter.type === 'sector') {
      return stock.sector === filter.value
    } else {
      return stock.industry === filter.value
    }
  })
}

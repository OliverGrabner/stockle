"use client"

import * as React from "react"
import { Search, Send, Filter, X, Building2, Factory, Loader2 } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Stock } from "@/data/stocks"
import { loadFilterOptions, FilterOptions } from "@/lib/stock-service"
import { formatMarketCap } from "@/lib/utils"

interface StockSearchProps {
  onSubmit: (stock: Stock) => void
  disabled?: boolean
  loading?: boolean
  stocks: Stock[]
}

export function StockSearch({ onSubmit, disabled, loading, stocks }: StockSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Stock | null>(null)
  const [filterOptions, setFilterOptions] = React.useState<FilterOptions>({ sectors: [], industries: [] })

  // Filter dialog state
  const [filterDialogOpen, setFilterDialogOpen] = React.useState(false)
  const [filterType, setFilterType] = React.useState<'sector' | 'industry'>('sector')
  const [filterValue, setFilterValue] = React.useState<string>('')
  const [filterResults, setFilterResults] = React.useState<Stock[]>([])

  // Market cap toggle state
  const [showMarketCap, setShowMarketCap] = React.useState(true)

  React.useEffect(() => {
    loadFilterOptions().then(setFilterOptions)
  }, [])

  // Reset filter value when filter type changes
  React.useEffect(() => {
    setFilterValue('')
  }, [filterType])

  // Apply filters when they change in the dialog
  React.useEffect(() => {
    if (!filterDialogOpen || !filterValue) {
      setFilterResults([])
      return
    }

    const results = stocks.filter(s =>
      filterType === 'sector' ? s.sector === filterValue : s.industry === filterValue
    )

    setFilterResults(results)
  }, [stocks, filterType, filterValue, filterDialogOpen])

  const currentFilterOptions = filterType === 'sector'
    ? filterOptions.sectors
    : filterOptions.industries

  const filteredStocks = React.useMemo(() => {
    if (!search) return stocks.slice(0, 8)

    const query = search.toLowerCase()
    return stocks
      .filter(
        (stock) =>
          stock.ticker.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query)
      )
      .slice(0, 8)
  }, [stocks, search])

  const handleSelect = (stock: Stock) => {
    setSelected(stock)
    setSearch("")
    setOpen(false)
  }

  const handleFilterSelect = (stock: Stock) => {
    setSelected(stock)
    setFilterDialogOpen(false)
    // Reset filter value for next time
    setFilterValue('')
  }

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected)
      setSelected(null)
    }
  }

  const clearFilter = () => {
    setFilterValue('')
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Search Bar with Filter Button */}
      <div className="flex gap-2 w-full">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 shrink-0"
          onClick={() => setFilterDialogOpen(true)}
          disabled={disabled}
        >
          <Filter className="h-4 w-4" />
        </Button>

        <div className="relative flex-1">
          <Command className="rounded-lg border" shouldFilter={false}>
            <div className="flex items-center px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              {selected ? (
                <div
                  className="flex items-center gap-2 h-12 w-full cursor-pointer"
                  onClick={() => {
                    setSelected(null)
                    setOpen(true)
                  }}
                >
                  <img
                    src={selected.logo}
                    alt={selected.name}
                    className="h-6 w-6 rounded object-contain bg-white"
                  />
                  <span className="font-medium">{selected.ticker}</span>
                  <span className="text-muted-foreground text-sm">{selected.name}</span>
                </div>
              ) : (
                <input
                  className="flex h-12 w-full rounded-md bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Search stocks..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setOpen(true)
                  }}
                  onFocus={() => setOpen(true)}
                  disabled={disabled}
                />
              )}
            </div>
            {open && search && !selected && (
              <CommandList className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border bg-popover shadow-md">
                <CommandEmpty>No stocks found.</CommandEmpty>
                <CommandGroup>
                  {filteredStocks.map((stock) => (
                    <CommandItem
                      key={stock.ticker}
                      value={stock.ticker}
                      onSelect={() => handleSelect(stock)}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <img
                        src={stock.logo}
                        alt={stock.name}
                        className="h-8 w-8 rounded-md object-contain bg-white"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{stock.ticker}</span>
                          {showMarketCap && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatMarketCap(stock.marketCap)}
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground truncate">
                          {stock.name}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!selected || disabled || loading}
          size="lg"
          className="h-12 px-6"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Market Cap Toggle */}
      <div className="flex justify-center px-1">
        <label className="flex items-center gap-1.5 cursor-pointer text-xs text-muted-foreground">
          <Checkbox
            id="show-market-cap"
            checked={showMarketCap}
            onCheckedChange={(checked) => setShowMarketCap(checked === true)}
            disabled={disabled}
            className="h-3 w-3"
          />
          Show market cap
        </label>
      </div>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Filter Stocks</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Filter Controls */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <label className="w-20 text-sm font-medium">Filter by</label>
                <Select value={filterType} onValueChange={(v) => setFilterType(v as 'sector' | 'industry')}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sector">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Sector
                      </span>
                    </SelectItem>
                    <SelectItem value="industry">
                      <span className="flex items-center gap-2">
                        <Factory className="h-4 w-4" />
                        Industry
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="w-20 text-sm font-medium flex items-center gap-1">
                  {filterType === 'sector' ? <Building2 className="h-4 w-4" /> : <Factory className="h-4 w-4" />}
                  <span className="capitalize">{filterType}</span>
                </label>
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder={`Select ${filterType}...`} />
                  </SelectTrigger>
                  <SelectContent>
                    {currentFilterOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filterValue && (
                <Button variant="ghost" size="sm" onClick={clearFilter} className="self-end">
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>

            {/* Results */}
            <div className="border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">
                {filterValue
                  ? `${filterResults.length} stocks found`
                  : `Select a ${filterType} to see matching stocks`
                }
              </div>

              {filterValue && (
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {filterResults.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground">
                      No stocks match these filters
                    </div>
                  ) : (
                    filterResults.map((stock) => (
                      <div
                        key={stock.ticker}
                        onClick={() => handleFilterSelect(stock)}
                        className="flex items-center gap-3 p-2 cursor-pointer hover:bg-muted transition-colors"
                      >
                        <img
                          src={stock.logo}
                          alt={stock.name}
                          className="h-8 w-8 rounded-md object-contain bg-white"
                          onError={(e) => {
                            e.currentTarget.style.display = "none"
                          }}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">{stock.ticker}</span>
                            {showMarketCap && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatMarketCap(stock.marketCap)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground truncate">
                            {stock.name}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import * as React from "react"
import { Search, Send } from "lucide-react"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { stocks, Stock } from "@/data/stocks"

interface StockSearchProps {
  onSubmit: (stock: Stock) => void
  disabled?: boolean
}

export function StockSearch({ onSubmit, disabled }: StockSearchProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<Stock | null>(null)

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
  }, [search])

  const handleSelect = (stock: Stock) => {
    setSelected(stock)
    setSearch("")
    setOpen(false)
  }

  const handleSubmit = () => {
    if (selected) {
      onSubmit(selected)
      setSelected(null)
    }
  }

  return (
    <div className="flex gap-2 w-full">
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
                    <div className="flex flex-col">
                      <span className="font-semibold">{stock.ticker}</span>
                      <span className="text-sm text-muted-foreground">
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
        disabled={!selected || disabled}
        size="lg"
        className="h-12 px-6"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}

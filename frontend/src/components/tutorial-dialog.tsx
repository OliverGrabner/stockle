"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown } from "lucide-react"

interface TutorialDialogProps {
  open: boolean
  onClose: () => void
}

function getBackgroundColor(status: string, closeness?: number): string {
  if (status === "correct") return "rgb(5, 150, 105)"
  if (status === "wrong") return "rgb(190, 18, 60)"

  if (closeness !== undefined) {
    // Match exact formula from guess-row.tsx
    const r = Math.round(217 + (5 - 217) * closeness)
    const g = Math.round(119 + (150 - 119) * closeness)
    const b = Math.round(6 + (105 - 6) * closeness)
    return `rgb(${r}, ${g}, ${b})`
  }

  // fallback color
  return "rgb(217, 119, 6)"
}

interface ExampleBoxProps {
  value: string
  status: string
  closeness?: number
  bgColor?: string
}

function ExampleBox({ value, status, closeness, bgColor: customBgColor }: ExampleBoxProps) {
  const showArrow = status === "higher" || status === "lower"
  const bgColor = customBgColor || getBackgroundColor(status, closeness)

  return (
    <div
      className="flex flex-col items-center justify-center rounded-lg text-white w-[90px] h-[90px]"
      style={{ backgroundColor: bgColor }}
    >
      <span className="text-xs font-semibold text-center leading-tight px-1">
        {value}
      </span>
      {showArrow && (
        <div className="mt-1">
          {status === "higher"
            ? <ArrowDown className="h-5 w-5" />
            : <ArrowUp className="h-5 w-5" />
          }
        </div>
      )}
    </div>
  )
}

interface ExampleRowProps {
  ticker: string
  name: string
  logo: string
  sector: { value: string; status: string; closeness?: number; bgColor?: string }
  industry: { value: string; status: string; closeness?: number; bgColor?: string }
  marketCap: { value: string; status: string; closeness?: number; bgColor?: string }
  price: { value: string; status: string; closeness?: number; bgColor?: string }
  peRatio: { value: string; status: string; closeness?: number; bgColor?: string }
  dividend: { value: string; status: string; closeness?: number; bgColor?: string }
}

function ExampleRow({ ticker, name, logo, sector, industry, marketCap, price, peRatio, dividend }: ExampleRowProps) {
  return (
    <div className="flex items-center gap-4 justify-center">
      <div className="flex flex-col items-center justify-center gap-1 p-2 rounded-lg border bg-card w-[105px] h-[90px]">
        <img
          src={logo}
          alt={name}
          className="h-8 w-8 rounded object-contain bg-white flex-shrink-0"
        />
        <span className="font-bold text-sm">{ticker}</span>
        <span className="text-[9px] text-muted-foreground text-center line-clamp-2 leading-tight">
          {name}
        </span>
      </div>

      <ExampleBox value={sector.value} status={sector.status} closeness={sector.closeness} bgColor={sector.bgColor} />
      <ExampleBox value={industry.value} status={industry.status} closeness={industry.closeness} bgColor={industry.bgColor} />
      <ExampleBox value={marketCap.value} status={marketCap.status} closeness={marketCap.closeness} bgColor={marketCap.bgColor} />
      <ExampleBox value={price.value} status={price.status} closeness={price.closeness} bgColor={price.bgColor} />
      <ExampleBox value={peRatio.value} status={peRatio.status} closeness={peRatio.closeness} bgColor={peRatio.bgColor} />
      <ExampleBox value={dividend.value} status={dividend.status} closeness={dividend.closeness} bgColor={dividend.bgColor} />
    </div>
  )
}

export function TutorialDialog({ open, onClose }: TutorialDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">How to Play Stockle</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4 overflow-y-auto pr-2">
          {/* Rules */}
          <div className="space-y-2">
            <p className="text-center">Guess the daily stock in 6 tries</p>
            <p className="text-center text-sm text-muted-foreground">
              Each guess shows how close you are to the answer
            </p>
          </div>

          {/* Color Legend */}
          <div className="border rounded-lg p-4">
            <div className="grid grid-cols-2 gap-8 text-sm items-center max-w-md mx-auto">
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-0.5">
                  <div className="w-10 h-7 rounded-l" style={{ backgroundColor: "rgb(5, 150, 105)" }}></div>
                  <div className="w-10 h-7" style={{ backgroundColor: "rgb(111, 134, 55)" }}></div>
                  <div className="w-10 h-7" style={{ backgroundColor: "rgb(217, 119, 6)" }}></div>
                  <div className="w-10 h-7 rounded-r" style={{ backgroundColor: "rgb(190, 18, 60)" }}></div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Color Gradient</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    <strong className="text-green-600">Green</strong> = closer, <strong className="text-rose-700">Red</strong> = further
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <ArrowUp className="w-8 h-8" />
                  <ArrowDown className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <div className="font-medium">Arrows</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    Show if answer is higher or lower
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Example Section */}
          <div>
            <h3 className="font-semibold text-center mb-3">Example Game</h3>
            <div className="text-xs text-center text-muted-foreground mb-2">
              (The answer is McDonald's - MCD)
            </div>

            {/* Header */}
            <div className="flex items-center gap-4 justify-center mb-2">
              <div className="w-[105px] text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Stock
              </div>
              <div className="w-[90px] text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sector
              </div>
              <div className="w-[90px] text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Industry
              </div>
              <div className="w-[90px] text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Mkt Cap
              </div>
              <div className="w-[90px] text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Price
              </div>
              <div className="w-[90px] text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                P/E
              </div>
              <div className="w-[90px] text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dividend
              </div>
            </div>

            {/* Example Rows */}
            <div className="space-y-3">
              {/* Guess 1: GOOGL */}
              <ExampleRow
                ticker="GOOGL"
                name="Alphabet Inc."
                logo="https://img.logokit.com/google.com?token=pk_fr0783494d69bdc7ad285c"
                sector={{ value: "Communication Services", status: "wrong", bgColor: "rgb(190, 18, 60)" }}
                industry={{ value: "Internet Content & Information", status: "wrong", bgColor: "rgb(190, 18, 60)" }}
                marketCap={{ value: "3.80T", status: "higher", bgColor: "rgb(205, 121, 12)" }}
                price={{ value: "$313.51", status: "higher", bgColor: "rgb(7, 150, 104)" }}
                peRatio={{ value: "30.95x", status: "higher", bgColor: "rgb(85, 146, 91)" }}
                dividend={{ value: "0.27%", status: "lower", bgColor: "rgb(193, 123, 17)" }}
              />

              {/* Guess 2: AMD */}
              <ExampleRow
                ticker="AMD"
                name="Advanced Micro Devices, Inc."
                logo="https://img.logokit.com/amd.com?token=pk_fr0783494d69bdc7ad285c"
                sector={{ value: "Technology", status: "wrong", bgColor: "rgb(190, 18, 60)" }}
                industry={{ value: "Semiconductors", status: "wrong", bgColor: "rgb(190, 18, 60)" }}
                marketCap={{ value: "350.01B", status: "higher", bgColor: "rgb(83, 139, 69)" }}
                price={{ value: "$214.99", status: "lower", bgColor: "rgb(70, 140, 75)" }}
                peRatio={{ value: "112.56x", status: "higher", bgColor: "rgb(167, 126, 29)" }}
                dividend={{ value: "N/A", status: "wrong", bgColor: "rgb(190, 18, 60)" }}
              />

              {/* Guess 3: AMZN */}
              <ExampleRow
                ticker="AMZN"
                name="Amazon.com, Inc."
                logo="https://img.logokit.com/amazon.com?token=pk_fr0783494d69bdc7ad285c"
                sector={{ value: "Consumer Cyclical", status: "correct", bgColor: "rgb(5, 150, 105)" }}
                industry={{ value: "Internet Retail", status: "wrong", bgColor: "rgb(190, 18, 60)" }}
                marketCap={{ value: "2.49T", status: "higher", bgColor: "rgb(198, 122, 15)" }}
                price={{ value: "$232.52", status: "lower", bgColor: "rgb(58, 142, 80)" }}
                peRatio={{ value: "32.89x", status: "higher", bgColor: "rgb(46, 144, 86)" }}
                dividend={{ value: "N/A", status: "wrong", bgColor: "rgb(190, 18, 60)" }}
              />

              {/* Guess 4: MCD - Correct! */}
              <ExampleRow
                ticker="MCD"
                name="McDonald's Corporation"
                logo="https://img.logokit.com/mcdonalds.com?token=pk_fr0783494d69bdc7ad285c"
                sector={{ value: "Consumer Cyclical", status: "correct", bgColor: "rgb(5, 150, 105)" }}
                industry={{ value: "Restaurants", status: "correct", bgColor: "rgb(5, 150, 105)" }}
                marketCap={{ value: "221.70B", status: "correct", bgColor: "rgb(5, 150, 105)" }}
                price={{ value: "$310.68", status: "correct", bgColor: "rgb(5, 150, 105)" }}
                peRatio={{ value: "26.53x", status: "correct", bgColor: "rgb(5, 150, 105)" }}
                dividend={{ value: "2.39%", status: "correct", bgColor: "rgb(5, 150, 105)" }}
              />
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center">
            <Button onClick={onClose} className="px-12">
              Got it!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

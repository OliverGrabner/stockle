"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { createChart, IChartApi, ISeriesApi, AreaSeries, ColorType } from "lightweight-charts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const RANGES = ["1W", "1M", "1Y", "5Y"] as const
type Range = (typeof RANGES)[number]

interface ChartDataPoint {
  time: string
  value: number
}

export function PriceChart({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const [range, setRange] = useState<Range>("1Y")
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { percentChange, isPositive } = useMemo(() => {
    if (data.length < 2) return { percentChange: 0, isPositive: true }
    const firstValue = data[0]?.value ?? 0
    const lastValue = data[data.length - 1]?.value ?? 0
    if (firstValue === 0) return { percentChange: 0, isPositive: true }
    const change = ((lastValue - firstValue) / firstValue) * 100
    return { percentChange: change, isPositive: change >= 0 }
  }, [data])

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/puzzle/today/chart?range=${range}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data) {
          setData(json.data)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [range])

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      height: 400,
      layout: {
        textColor: "#888",
        background: { type: ColorType.Solid, color: "transparent" },
        attributionLogo: false,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#333" },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      localization: {
        priceFormatter: (price: number) => `$${price.toFixed(2)}`,
      },
      crosshair: {
        horzLine: { visible: false },
        vertLine: { labelVisible: false },
      },
    })

    chartRef.current = chart

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    }
    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!chartRef.current || data.length === 0) return

    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current)
    }

    const lineColor = isPositive ? "#22c55e" : "#ef4444"
    const areaTopColor = isPositive ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)"
    const areaBottomColor = isPositive ? "rgba(34, 197, 94, 0.0)" : "rgba(239, 68, 68, 0.0)"

    const series = chartRef.current.addSeries(AreaSeries, {
      lineColor: lineColor,
      topColor: areaTopColor,
      bottomColor: areaBottomColor,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    series.setData(data)
    seriesRef.current = series

    chartRef.current.timeScale().fitContent()
  }, [data, isPositive])

  return (
    <div className={cn("w-full max-w-4xl", className)}>
      <div className="flex items-center justify-center gap-4 mb-3">
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
              className="min-w-[48px]"
            >
              {r}
            </Button>
          ))}
        </div>
        {data.length > 0 && (
          <span
            className={cn(
              "text-lg font-semibold",
              isPositive ? "text-emerald-500" : "text-red-500"
            )}
          >
            {isPositive ? "+" : ""}
            {percentChange.toFixed(2)}%
          </span>
        )}
      </div>
      <div
        ref={containerRef}
        className={cn(
          "w-full rounded-lg bg-card/50 transition-opacity",
          isLoading && "opacity-50"
        )}
      />
    </div>
  )
}

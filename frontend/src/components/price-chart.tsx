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

const filterDataByRange = (data: ChartDataPoint[], range: Range): ChartDataPoint[] => {
  if (data.length === 0) return []

  const latestDate = new Date(data[data.length - 1].time)
  let cutoffDate: Date

  switch (range) {
    case "1W":
      cutoffDate = new Date(latestDate)
      cutoffDate.setDate(cutoffDate.getDate() - 7)
      return data.filter(point => new Date(point.time) >= cutoffDate)

    case "1M":
      cutoffDate = new Date(latestDate)
      cutoffDate.setMonth(cutoffDate.getMonth() - 1)
      return data.filter(point => new Date(point.time) >= cutoffDate)

    case "1Y":
      cutoffDate = new Date(latestDate)
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1)
      return data.filter(point => new Date(point.time) >= cutoffDate)

    case "5Y":
    default:
      return data
  }
}

export function PriceChart({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
  const [range, setRange] = useState<Range>("5Y")
  const [fullData, setFullData] = useState<ChartDataPoint[]>([])
  const [filteredData, setFilteredData] = useState<ChartDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { percentChange, isPositive } = useMemo(() => {
    if (filteredData.length < 2) return { percentChange: 0, isPositive: true }
    const firstValue = filteredData[0]?.value ?? 0
    const lastValue = filteredData[filteredData.length - 1]?.value ?? 0
    if (firstValue === 0) return { percentChange: 0, isPositive: true }
    const change = ((lastValue - firstValue) / firstValue) * 100
    return { percentChange: change, isPositive: change >= 0 }
  }, [filteredData])

  useEffect(() => {
    if (fullData.length === 0) return
    const filtered = filterDataByRange(fullData, range)
    setFilteredData(filtered)
  }, [fullData, range])

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/puzzle/today/chart`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((json) => {
        if (json.data) {
          setFullData(json.data)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!containerRef.current) return

    const isMobile = window.innerWidth < 768
    const chart = createChart(containerRef.current, {
      height: isMobile ? 250 : 400,
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
        rightOffset: 0,
        barSpacing: 6,
        fixLeftEdge: true,
        fixRightEdge: true,
        lockVisibleTimeRangeOnResize: true,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      localization: {
        priceFormatter: (price: number) => isMobile ? `$${Math.round(price)}` : `$${price.toFixed(2)}`,
      },
      crosshair: {
        horzLine: { visible: false },
        vertLine: { labelVisible: false },
      },
    })

    chartRef.current = chart

    const handleResize = () => {
      if (containerRef.current) {
        const isMobile = window.innerWidth < 768
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: isMobile ? 250 : 400,
          localization: {
            priceFormatter: (price: number) => isMobile ? `$${Math.round(price)}` : `$${price.toFixed(2)}`,
          },
        })
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
    if (!chartRef.current || filteredData.length === 0) return

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

    series.setData(filteredData)
    seriesRef.current = series

    chartRef.current.timeScale().fitContent()
  }, [filteredData, isPositive])

  return (
    <div className={cn("w-full max-w-4xl", className)}>
      <div className="flex items-center justify-center gap-2 md:gap-4 mb-2 md:mb-3">
        <div className="flex gap-1 md:gap-2">
          {RANGES.map((r) => (
            <Button
              key={r}
              variant={range === r ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r)}
              className="min-w-[40px] md:min-w-[48px] text-xs md:text-sm px-2 md:px-3"
            >
              {r}
            </Button>
          ))}
        </div>
        {filteredData.length > 0 && (
          <span
            className={cn(
              "text-base md:text-lg font-semibold",
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

'use client'

import { useEffect, useRef } from 'react'
import {
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
  CandlestickSeries,
} from 'lightweight-charts'

const DARK = {
  bg: '#131722', text: '#9598a1', grid: '#2a2e39', border: '#2a2e39',
  up: '#26a69a', down: '#ef5350',
}
const LIGHT = {
  bg: '#ffffff', text: '#787b86', grid: '#f0f3fa', border: '#e0e3eb',
  up: '#26a69a', down: '#ef5350',
}

type Props = { data: CandlestickData[]; height?: number; isDark?: boolean }

export function FedSimChart({ data, height = 380, isDark = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)
  const seriesRef    = useRef<ISeriesApi<'Candlestick'> | null>(null)

  // Reinitialize whenever height OR theme changes
  useEffect(() => {
    if (!containerRef.current) return
    const t = isDark ? DARK : LIGHT

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.offsetWidth,
      height,
      layout: {
        background: { color: t.bg },
        textColor:  t.text,
        fontSize:   11,
        fontFamily: 'Space Mono, monospace',
      },
      grid: {
        vertLines: { color: t.grid },
        horzLines: { color: t.grid },
      },
      timeScale:       { borderColor: t.border, timeVisible: true, secondsVisible: false, fixLeftEdge: true },
      rightPriceScale: { borderColor: t.border, scaleMargins: { top: 0.15, bottom: 0.1 } },
      crosshair: {
        horzLine: { labelBackgroundColor: '#131722' },
        vertLine: { labelBackgroundColor: '#131722' },
      },
    })

    chartRef.current  = chart
    seriesRef.current = chart.addSeries(CandlestickSeries, {
      upColor: t.up, downColor: t.down,
      borderVisible: false,
      wickUpColor: t.up, wickDownColor: t.down,
      priceFormat: {
        type: 'custom',
        formatter: (p: number) => `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
      },
    })

    // Re-apply data after reinit
    if (data.length > 0) {
      seriesRef.current.setData(data)
      chart.timeScale().fitContent()
    }

    const handleResize = () => {
      if (containerRef.current) chart.resize(containerRef.current.offsetWidth, height)
    }
    window.addEventListener('resize', handleResize)
    return () => { window.removeEventListener('resize', handleResize); chart.remove() }
  }, [height, isDark]) // eslint-disable-line react-hooks/exhaustive-deps

  // Update data when it changes (without reinit)
  useEffect(() => {
    if (!seriesRef.current || data.length === 0) return
    seriesRef.current.setData(data)
    chartRef.current?.timeScale().fitContent()
  }, [data])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}

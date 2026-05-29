import { useEffect, useRef } from "react";
import { createChart, type CandlestickData } from "lightweight-charts";

/**
 * TradingView Lightweight-Charts candlestick view fed by OHLCV candles
 * from the backend /api/pools data + websocket ticks.
 */
export default function CandlestickChart({ data }: { data: CandlestickData[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, { height: 300, layout: { background: { color: "#000" }, textColor: "#ddd" } });
    const series = chart.addCandlestickSeries();
    series.setData(data);
    return () => chart.remove();
  }, [data]);

  return <div ref={ref} className="w-full" />;
}

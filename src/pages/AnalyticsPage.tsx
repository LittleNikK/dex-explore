import { usePools, useCandles } from "../hooks/api";
import CandlestickChart from "../components/charts/CandlestickChart";

export default function AnalyticsPage() {
  const poolsQuery = usePools();
  const firstPoolAddress = poolsQuery.data?.[0]?.poolAddress;

  const candlesQuery = useCandles(firstPoolAddress, "1h");
  const candles = candlesQuery.data || [];

  const chartData = candles.map((c) => ({
    time: c.time as any,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Analytics</h2>
      {poolsQuery.isLoading || candlesQuery.isLoading ? (
        <div className="text-zinc-500 animate-pulse">Loading real historical charts...</div>
      ) : chartData.length === 0 ? (
        <div className="text-zinc-500">No pools registered or no chart data found. Run a swap or add liquidity.</div>
      ) : (
        <CandlestickChart data={chartData} />
      )}
    </div>
  );
}

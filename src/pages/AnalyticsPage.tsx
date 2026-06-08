import CandlestickChart from "../components/charts/CandlestickChart";

const DEMO: any[] = [
  { time: "2024-01-01", open: 100, high: 110, low: 95, close: 105 },
  { time: "2024-01-02", open: 105, high: 112, low: 102, close: 108 }
];

export default function AnalyticsPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Analytics</h2>
      <CandlestickChart data={DEMO} />
    </div>
  );
}

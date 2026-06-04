import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPortfolioUsd } from "../utils/portfolio-format";
import type { PortfolioChartPoint, PortfolioTimeframe } from "../types";

const TIMEFRAMES: PortfolioTimeframe[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

interface PortfolioValueChartProps {
  data: PortfolioChartPoint[];
  selectedTimeframe: PortfolioTimeframe;
  onTimeframeChange: (timeframe: PortfolioTimeframe) => void;
  isLoading?: boolean;
  isError?: boolean;
  error?: string | null;
  valueUsd?: number;
}

export function PortfolioValueChart({
  data,
  selectedTimeframe,
  onTimeframeChange,
  isLoading,
  isError,
  error,
  valueUsd,
}: PortfolioValueChartProps) {
  const chartData = useMemo(
    () => data.map((point) => ({ ...point, label: new Date(point.time * 1000).toLocaleDateString() })),
    [data],
  );
  const latest = chartData.at(-1)?.value ?? valueUsd ?? 0;

  return (
    <Card className="glass overflow-hidden rounded-[2rem] border-white/60 shadow-float">
      <CardHeader className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Portfolio value</div>
          {isLoading ? <Skeleton className="mt-2 h-8 w-40 rounded-2xl" /> : <div className="mt-2 text-4xl font-semibold tracking-tight">{formatPortfolioUsd(latest)}</div>}
        </div>

        <div className="flex flex-wrap gap-2 rounded-full border border-border/70 bg-surface/80 p-1">
          {TIMEFRAMES.map((timeframe) => (
            <button
              key={timeframe}
              type="button"
              onClick={() => onTimeframeChange(timeframe)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe
                  ? "bg-background text-foreground shadow-soft"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <div className="space-y-4 rounded-[1.5rem] border border-border/60 bg-background/60 p-4">
            <Skeleton className="h-[280px] w-full rounded-[1.5rem]" />
          </div>
        ) : isError ? (
          <StateBox title="Unable to load portfolio chart" body={error ?? "Please try again in a moment."} />
        ) : chartData.length === 0 ? (
          <StateBox title="No portfolio history yet" body="Connect a wallet or refresh to populate chart history." />
        ) : (
          <div className="h-[320px] w-full rounded-[1.5rem] border border-border/60 bg-background/60 p-2 sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="portfolioValueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.34} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.16)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={12} minTickGap={32} />
                <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value: number) => formatPortfolioUsd(value, true)} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  fill="url(#portfolioValueFill)"
                  dot={false}
                  activeDot={{ r: 5, fill: "var(--primary)", stroke: "white", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-deep backdrop-blur-xl">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold">{formatPortfolioUsd(value)}</div>
    </div>
  );
}

function StateBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-background/50 p-8 text-center">
      <div className="max-w-sm space-y-2">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}
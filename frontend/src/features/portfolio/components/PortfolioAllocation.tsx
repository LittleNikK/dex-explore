import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TokenAvatar } from "@/components/swap/TokenSelectorModal";
import { formatPortfolioUsd, formatPortfolioPct } from "../utils/portfolio-format";
import type { PortfolioAsset } from "../types";

interface PortfolioAllocationProps {
  assets: PortfolioAsset[];
  isLoading?: boolean;
  isError?: boolean;
  error?: string | null;
}

const COLORS = ["#5b5cf0", "#06b6d4", "#f59e0b", "#10b981", "#94a3b8"];

export function PortfolioAllocation({ assets, isLoading, isError, error }: PortfolioAllocationProps) {
  const sorted = useMemo(() => [...assets].sort((a, b) => b.valueUsd - a.valueUsd), [assets]);
  const total = sorted.reduce((sum, asset) => sum + asset.valueUsd, 0);
  const chartData = sorted.map((asset, index) => ({
    name: asset.symbol,
    value: asset.valueUsd,
    allocation: asset.allocation,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card className="glass overflow-hidden rounded-[2rem] border-white/60 shadow-float">
      <CardHeader className="p-5 sm:p-6">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Asset allocation</div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{isLoading ? <Skeleton className="h-8 w-32 rounded-2xl" /> : formatPortfolioUsd(total)}</div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0 sm:p-6 sm:pt-0">
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-[1.5rem]" />
        ) : isError ? (
          <StateBox title="Unable to load allocation" body={error ?? "Please refresh the portfolio."} />
        ) : chartData.length === 0 ? (
          <StateBox title="No assets found" body="Allocation will populate once assets are available." />
        ) : (
          <>
            <div className="h-[240px] rounded-[1.5rem] border border-border/60 bg-background/60 p-3 sm:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    innerRadius="62%"
                    outerRadius="86%"
                    paddingAngle={3}
                    stroke="rgba(255,255,255,0.12)"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<AllocationTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AllocationTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: { name?: string; value?: number; allocation?: number } }> }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload;
  if (!item) return null;
  return (
    <div className="rounded-2xl border border-border/70 bg-background/95 px-4 py-3 shadow-deep backdrop-blur-xl">
      <div className="text-sm font-semibold">{item.name}</div>
      <div className="mt-1 text-sm text-muted-foreground">{formatPortfolioUsd(item.value ?? 0)}</div>
      <div className="mt-1 text-xs text-muted-foreground">{formatPortfolioPct(item.allocation ?? 0)}</div>
    </div>
  );
}

function StateBox({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[260px] items-center justify-center rounded-[1.5rem] border border-dashed border-border/70 bg-background/50 p-8 text-center">
      <div className="max-w-sm space-y-2">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-sm text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}

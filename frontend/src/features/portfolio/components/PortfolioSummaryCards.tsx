import type { Portfolio } from "../types";
import { PortfolioMetricCard } from "./PortfolioMetricCard";
import { formatPortfolioPct, formatPortfolioUsd } from "../utils/portfolio-format";

interface PortfolioSummaryCardsProps {
  portfolio: Portfolio | null;
  isLoading?: boolean;
}

export function PortfolioSummaryCards({ portfolio, isLoading }: PortfolioSummaryCardsProps) {
  const stats = portfolio?.stats;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <PortfolioMetricCard label="Total assets" value={String(stats?.totalAssets ?? 0)} helper="Tracked positions across your wallet" loading={isLoading} />
      <PortfolioMetricCard label="Total networks" value={String(stats?.totalNetworks ?? 0)} helper="Cross-chain exposure" loading={isLoading} />
      <PortfolioMetricCard label="Total positions" value={String(stats?.totalPositions ?? 0)} helper="LP positions and vaults" loading={isLoading} />
      <PortfolioMetricCard label="Transactions" value={String(stats?.transactions ?? 0)} helper="Recent onchain activity" loading={isLoading} />
      <PortfolioMetricCard
        label="Portfolio change"
        value={formatPortfolioPct(stats?.portfolioChange24h ?? 0)}
        helper="24H portfolio performance"
        loading={isLoading}
        tone={(stats?.portfolioChange24h ?? 0) >= 0 ? "success" : "destructive"}
      />
      <PortfolioMetricCard
        label="Largest holding"
        value={stats ? stats.largestHolding.symbol : "—"}
        helper={stats ? `${formatPortfolioUsd(stats.largestHolding.valueUsd)} • ${stats.largestHolding.allocation.toFixed(2)}%` : "Largest allocation"}
        loading={isLoading}
      />
    </div>
  );
}

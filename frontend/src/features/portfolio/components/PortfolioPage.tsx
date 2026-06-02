import { useMemo } from "react";
import { useAccount, useChainId } from "wagmi";
import { usePortfolio } from "../hooks/use-portfolio";
import { usePortfolioAssets } from "../hooks/use-portfolio-assets";
import { usePortfolioActivity } from "../hooks/use-portfolio-activity";
import { usePortfolioPositions } from "../hooks/use-portfolio-positions";
import { usePortfolioHistory } from "../hooks/use-portfolio-history";
import { useWalletPortfolio } from "../hooks/use-wallet-portfolio";
import { usePortfolioStore } from "../store/portfolio-store";
import { PortfolioHeader } from "./PortfolioHeader";
import { PortfolioSummaryCards } from "./PortfolioSummaryCards";
import { PortfolioValueChart } from "./PortfolioValueChart";
import { PortfolioAllocation } from "./PortfolioAllocation";
import { PortfolioAssetsBoxes } from "./PortfolioAssetsBoxes";

import { PortfolioTabs } from "./PortfolioTabs";

export function PortfolioPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const selectedTimeframe = usePortfolioStore((state) => state.selectedTimeframe);
  const selectedTab = usePortfolioStore((state) => state.selectedTab);
  const setTimeframe = usePortfolioStore((state) => state.setTimeframe);
  const setTab = usePortfolioStore((state) => state.setTab);
  const refreshPortfolio = usePortfolioStore((state) => state.refreshPortfolio);
  const storedPortfolio = usePortfolioStore((state) => state.portfolio);
  const storedAssets = usePortfolioStore((state) => state.assets);
  const storedActivity = usePortfolioStore((state) => state.activity);
  const storedPositions = usePortfolioStore((state) => state.positions);
  const storedChartData = usePortfolioStore((state) => state.chartData);

  const walletPortfolioQuery = useWalletPortfolio(address ?? undefined, chainId, isConnected);
  const portfolioQuery = usePortfolio(address ?? undefined, !isConnected);
  const assetsQuery = usePortfolioAssets(address ?? undefined, !isConnected);
  const activityQuery = usePortfolioActivity(address ?? undefined, !isConnected);
  const positionsQuery = usePortfolioPositions(address ?? undefined, !isConnected);
  const historyQuery = usePortfolioHistory(address ?? undefined, !isConnected);

  const livePortfolio = walletPortfolioQuery.data?.portfolio ?? storedPortfolio;
  const liveAssets = walletPortfolioQuery.data?.assets ?? storedAssets;
  const liveActivity = walletPortfolioQuery.data?.activity ?? storedActivity;
  const livePositions = walletPortfolioQuery.data?.positions ?? storedPositions;
  const liveHistory = storedChartData.length > 0 ? storedChartData : walletPortfolioQuery.data ? [walletPortfolioQuery.data.chartPoint] : [];

  const activePortfolio = isConnected ? livePortfolio : portfolioQuery.data ?? storedPortfolio;
  const activeAssets = isConnected ? liveAssets : assetsQuery.data ?? storedAssets;
  const activeActivity = isConnected ? liveActivity : activityQuery.data ?? storedActivity;
  const activePositions = isConnected ? livePositions : positionsQuery.data ?? storedPositions;
  const activeHistory = isConnected ? liveHistory : historyQuery.data ?? storedChartData;
  const walletAddress = useMemo(
    () => address ?? activePortfolio?.address ?? "0xA7B4c1d2E3f4567890AbCDef1234567890abF31",
    [activePortfolio?.address, address],
  );

  const isLoading = isConnected ? walletPortfolioQuery.isLoading : portfolioQuery.isLoading;

  const liveChartLoading = isConnected ? walletPortfolioQuery.isLoading : historyQuery.isLoading;

  const liveAssetsLoading = isConnected ? walletPortfolioQuery.isLoading : assetsQuery.isLoading;

  const liveActivityLoading = isConnected ? walletPortfolioQuery.isLoading : activityQuery.isLoading;

  const livePositionsLoading = isConnected ? walletPortfolioQuery.isLoading : positionsQuery.isLoading;

  return (
    <div className="space-y-6 py-6 sm:py-8">
      <PortfolioHeader
        portfolio={activePortfolio}
        ensName={activePortfolio?.ensName ?? null}
        walletAddress={walletAddress}
        isLoading={isLoading}
        onRefresh={refreshPortfolio}
      />

      <PortfolioSummaryCards portfolio={activePortfolio} isLoading={isLoading} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
        <PortfolioValueChart
          data={activeHistory}
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setTimeframe}
          isLoading={liveChartLoading}
          isError={Boolean(isConnected ? walletPortfolioQuery.error : historyQuery.error)}
          error={
            isConnected
              ? walletPortfolioQuery.error instanceof Error
                ? walletPortfolioQuery.error.message
                : null
              : historyQuery.error instanceof Error
                ? historyQuery.error.message
                : null
          }
          valueUsd={activePortfolio?.valueUsd}
        />

        <PortfolioAllocation
          assets={activeAssets}
          isLoading={liveAssetsLoading}
          isError={Boolean(isConnected ? walletPortfolioQuery.error : assetsQuery.error)}
          error={
            isConnected
              ? walletPortfolioQuery.error instanceof Error
                ? walletPortfolioQuery.error.message
                : null
              : assetsQuery.error instanceof Error
                ? assetsQuery.error.message
                : null
          }
        />
      </div>

      {activeAssets.length > 0 && (
        <PortfolioAssetsBoxes assets={activeAssets} />
      )}

      <PortfolioTabs
        selectedTab={selectedTab}
        onTabChange={setTab}
        assets={activeAssets}
        activity={activeActivity}
        positions={activePositions}
        assetsLoading={liveAssetsLoading}
        activityLoading={liveActivityLoading}
        positionsLoading={livePositionsLoading}
        assetsError={
          isConnected
            ? walletPortfolioQuery.error instanceof Error
              ? walletPortfolioQuery.error.message
              : null
            : assetsQuery.error instanceof Error
              ? assetsQuery.error.message
              : null
        }
        activityError={
          isConnected
            ? walletPortfolioQuery.error instanceof Error
              ? walletPortfolioQuery.error.message
              : null
            : activityQuery.error instanceof Error
              ? activityQuery.error.message
              : null
        }
        positionsError={
          isConnected
            ? walletPortfolioQuery.error instanceof Error
              ? walletPortfolioQuery.error.message
              : null
            : positionsQuery.error instanceof Error
              ? positionsQuery.error.message
              : null
        }
      />
    </div>
  );
}

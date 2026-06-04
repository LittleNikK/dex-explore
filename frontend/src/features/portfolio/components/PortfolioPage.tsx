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
import type { PortfolioAsset, PortfolioActivity, PortfolioChartPoint, PortfolioTimeframe } from "../types";

import { PortfolioTabs } from "./PortfolioTabs";

function reconstructHistory(
  assets: PortfolioAsset[],
  activity: PortfolioActivity[],
  timeframe: PortfolioTimeframe,
  liveMstPrice: number
): PortfolioChartPoint[] {
  const now = Math.floor(Date.now() / 1000);
  
  // 1. Determine start time and interval step
  let startTime = now - 30 * 24 * 3600; // default 30 days
  let step = 24 * 3600; // default 1 day
  let pointsCount = 30;

  if (timeframe === "1D") {
    startTime = now - 24 * 3600;
    step = 3600; // 1 hour
    pointsCount = 24;
  } else if (timeframe === "1W") {
    startTime = now - 7 * 24 * 3600;
    step = 12 * 3600; // 12 hours
    pointsCount = 14;
  } else if (timeframe === "1M") {
    startTime = now - 30 * 24 * 3600;
    step = 24 * 3600; // 1 day
    pointsCount = 30;
  } else if (timeframe === "3M") {
    startTime = now - 90 * 24 * 3600;
    step = 3 * 24 * 3600; // 3 days
    pointsCount = 30;
  } else if (timeframe === "1Y") {
    startTime = now - 365 * 24 * 3600;
    step = 7 * 24 * 3600; // 1 week
    pointsCount = 52;
  } else if (timeframe === "ALL") {
    const oldestTx = activity.length > 0 ? Math.min(...activity.map(a => Math.floor(a.timestamp / 1000))) : now - 30 * 24 * 3600;
    startTime = Math.min(oldestTx - 24 * 3600, now - 7 * 24 * 3600); // at least 7 days, or starting a day before oldest tx
    step = Math.max(3600, Math.floor((now - startTime) / 30));
    pointsCount = 30;
  }

  // 2. Map current asset balances
  const currentBalances: Record<string, number> = {};
  const tokenPrices: Record<string, number> = {};

  assets.forEach((asset) => {
    const symbol = asset.symbol.toUpperCase();
    currentBalances[symbol] = asset.balance;
    tokenPrices[symbol] = asset.priceUsd;
  });

  tokenPrices["USDC"] = 1.0;
  if (tokenPrices["MST"] === undefined || tokenPrices["MST"] === 0) {
    tokenPrices["MST"] = liveMstPrice || 0.5;
  }
  if (tokenPrices["WMST"] === undefined || tokenPrices["WMST"] === 0) {
    tokenPrices["WMST"] = liveMstPrice || 0.5;
  }

  // 3. Build chronological list of state-changing transactions
  const sortedTxs = [...activity]
    .map(tx => ({
      ...tx,
      timeSec: Math.floor(tx.timestamp / 1000)
    }))
    .filter(tx => tx.timeSec <= now)
    .sort((a, b) => b.timeSec - a.timeSec);

  // 4. Reconstruct historical balances at each transaction time boundary
  const balanceHistory: Array<{ timestamp: number; balances: Record<string, number> }> = [];

  let runningBalances = { ...currentBalances };
  balanceHistory.push({
    timestamp: now,
    balances: { ...runningBalances }
  });

  sortedTxs.forEach((tx) => {
    const txAsset = tx.asset.toUpperCase();
    
    if (tx.type === "send") {
      runningBalances[txAsset] = (runningBalances[txAsset] || 0) + tx.amount;
    } else if (tx.type === "receive") {
      runningBalances[txAsset] = Math.max(0, (runningBalances[txAsset] || 0) - tx.amount);
    } else if (tx.type === "swap") {
      const parts = txAsset.split("→").map(s => s.trim());
      if (parts.length === 2) {
        const [sendSymbol, receiveSymbol] = parts;
        runningBalances[receiveSymbol] = Math.max(0, (runningBalances[receiveSymbol] || 0) - tx.amount);
        const sendPrice = tokenPrices[sendSymbol] || liveMstPrice || 0.5;
        const sendAmount = sendPrice > 0 ? tx.amountUsd / sendPrice : tx.amount;
        runningBalances[sendSymbol] = (runningBalances[sendSymbol] || 0) + sendAmount;
      }
    }
    
    balanceHistory.push({
      timestamp: tx.timeSec,
      balances: { ...runningBalances }
    });
  });

  balanceHistory.sort((a, b) => a.timestamp - b.timestamp);

  function getBalancesAtTimestamp(t: number): Record<string, number> {
    const snapshot = balanceHistory.find(s => s.timestamp >= t);
    return snapshot ? snapshot.balances : runningBalances;
  }

  // 5. Generate regular chart points
  const points: PortfolioChartPoint[] = [];
  for (let i = 0; i <= pointsCount; i++) {
    const t = startTime + i * step;
    if (t > now && i < pointsCount) continue;
    const effectiveT = Math.min(t, now);
    
    const balances = getBalancesAtTimestamp(effectiveT);
    
    let valueUsd = 0;
    Object.entries(balances).forEach(([symbol, bal]) => {
      const price = tokenPrices[symbol] || 0;
      valueUsd += bal * price;
    });

    points.push({
      time: effectiveT,
      value: Number(valueUsd.toFixed(2))
    });
  }

  return points;
}

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
  const historyQuery = usePortfolioHistory(address ?? undefined, true); // Keep active for both modes to fetch timeline

  const livePortfolio = walletPortfolioQuery.data?.portfolio ?? null;
  const liveAssets = walletPortfolioQuery.data?.assets ?? [];
  const liveActivity = walletPortfolioQuery.data?.activity ?? [];
  const livePositions = walletPortfolioQuery.data?.positions ?? [];

  const activePortfolioRaw = isConnected ? livePortfolio : portfolioQuery.data ?? null;
  const activeAssets = isConnected ? liveAssets : assetsQuery.data ?? [];
  const activeActivity = isConnected ? liveActivity : activityQuery.data ?? [];
  const activePositions = isConnected ? livePositions : positionsQuery.data ?? [];

  // Reconstruct history dynamically if connected, otherwise use mock history
  const activeHistory = useMemo(() => {
    if (!isConnected) return historyQuery.data ?? [];
    if (!walletPortfolioQuery.data) return [];

    const assets = walletPortfolioQuery.data.assets;
    const activity = walletPortfolioQuery.data.activity;
    const positions = walletPortfolioQuery.data.positions;
    
    const mstAsset = assets.find(a => a.symbol === "MST" || a.symbol === "WMST");
    const liveMstPrice = mstAsset ? mstAsset.priceUsd : 0.5;

    return reconstructHistory(assets, activity, selectedTimeframe, liveMstPrice);
  }, [historyQuery.data, isConnected, walletPortfolioQuery.data, selectedTimeframe]);

  // Compute live change percentage from history
  const computedChange24h = useMemo(() => {
    if (activeHistory.length < 2) return 0;
    const first = activeHistory[0].value;
    const last = activeHistory[activeHistory.length - 1].value;
    if (first === 0) return 0;
    return ((last - first) / first) * 100;
  }, [activeHistory]);

  // Inject dynamic computed change
  const activePortfolio = useMemo(() => {
    if (!activePortfolioRaw) return null;
    return {
      ...activePortfolioRaw,
      change24h: computedChange24h,
      stats: {
        ...activePortfolioRaw.stats,
        portfolioChange24h: computedChange24h,
      },
    };
  }, [activePortfolioRaw, computedChange24h]);

  const walletAddress = useMemo(
    () => address ?? activePortfolio?.address ?? "0xA7B4c1d2E3f4567890AbCDef1234567890abF31",
    [activePortfolio?.address, address],
  );

  const isLoading = isConnected ? (walletPortfolioQuery.isLoading || historyQuery.isLoading) : portfolioQuery.isLoading;

  const liveChartLoading = isConnected ? (walletPortfolioQuery.isLoading || historyQuery.isLoading) : historyQuery.isLoading;

  const liveAssetsLoading = isConnected ? walletPortfolioQuery.isLoading : assetsQuery.isLoading;

  const liveActivityLoading = isConnected ? walletPortfolioQuery.isLoading : activityQuery.isLoading;

  const livePositionsLoading = isConnected ? walletPortfolioQuery.isLoading : positionsQuery.isLoading;

  return (
    <div className="space-y-8">
      <PortfolioHeader
        portfolio={activePortfolio}
        ensName={activePortfolio?.ensName ?? null}
        walletAddress={walletAddress}
        isLoading={isLoading}
        onRefresh={refreshPortfolio}
      />

      <PortfolioSummaryCards portfolio={activePortfolio} isLoading={isLoading} selectedTimeframe={selectedTimeframe} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
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

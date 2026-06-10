import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { type Address } from "viem";
import { getWalletPortfolioSnapshot } from "../services/wallet-portfolio.service";
import { usePortfolioStore } from "../store/portfolio-store";
import type { PortfolioChartPoint } from "../types";
import { usePriceWs } from "@/hooks/usePriceWs";

export function useWalletPortfolio(address?: string, chainId?: number, enabled = false) {
  const publicClient = usePublicClient({ chainId });
  const queryClient = useQueryClient();

  usePriceWs(() => {
    queryClient.invalidateQueries({ queryKey: ["wallet-portfolio"] });
  });
  const refreshToken = usePortfolioStore((state) => state.refreshToken);
  const resetPortfolioState = usePortfolioStore((state) => state.resetPortfolioState);
  const setPortfolio = usePortfolioStore((state) => state.setPortfolio);
  const setAssets = usePortfolioStore((state) => state.setAssets);
  const setActivity = usePortfolioStore((state) => state.setActivity);
  const setPositions = usePortfolioStore((state) => state.setPositions);
  const setLoading = usePortfolioStore((state) => state.setLoading);
  const setError = usePortfolioStore((state) => state.setError);
  const appendChartPoint = usePortfolioStore((state) => state.appendChartPoint);
  const chartData = usePortfolioStore((state) => state.chartData);
  const setChartData = usePortfolioStore((state) => state.setChartData);

  useEffect(() => {
    if (!enabled) return;
    resetPortfolioState();
  }, [address, chainId, enabled, resetPortfolioState]);

  const query = useQuery({
    queryKey: ["wallet-portfolio", address ?? "default", chainId ?? 1, refreshToken],
    enabled: enabled && Boolean(address) && Boolean(chainId) && Boolean(publicClient),
    staleTime: 10000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!publicClient || !address || !chainId) return null;
      return getWalletPortfolioSnapshot({
        address: address as Address,
        chainId,
        publicClient: publicClient as never,
      });
    },
  });

  useEffect(() => {
    if (!enabled) return;
    setLoading(query.isLoading);
  }, [enabled, query.isLoading, setLoading]);

  useEffect(() => {
    if (!enabled || !query.data) return;

    const current = query.data;

    let activeChartData = [...chartData];
    if (activeChartData.length === 0 && current.portfolio.valueUsd > 0) {
      activeChartData = generateMockHistoryForValue(current.portfolio.valueUsd);
      setChartData(activeChartData);
    }

    const first = activeChartData[0]?.value;
    const latest = activeChartData[activeChartData.length - 1]?.value;
    const change24h = first && first > 0 ? ((current.chartPoint.value - first) / first) * 100 : latest && latest > 0 ? ((current.chartPoint.value - latest) / latest) * 100 : 0;

    setPortfolio({
      ...current.portfolio,
      change24h,
      stats: {
        ...current.portfolio.stats,
        portfolioChange24h: change24h,
      },
    });
    setAssets(
      current.assets.map((asset) => ({
        ...asset,
        allocation: current.portfolio.valueUsd > 0 ? (asset.valueUsd / current.portfolio.valueUsd) * 100 : 0,
      })),
    );
    setActivity(current.activity);
    setPositions(current.positions);
    setError(null);

    const lastPoint = activeChartData.at(-1);
    const shouldAppend = !lastPoint || lastPoint.time !== current.chartPoint.time || lastPoint.value !== current.chartPoint.value;
    if (shouldAppend) {
      appendChartPoint(current.chartPoint);
    }
  }, [appendChartPoint, chartData, enabled, query.data, setActivity, setAssets, setError, setPortfolio, setPositions, setChartData]);

  useEffect(() => {
    if (!enabled) return;
    if (query.error instanceof Error) {
      setError(query.error.message);
    }
  }, [enabled, query.error, setError]);

  return query;
}

function generateMockHistoryForValue(value: number): PortfolioChartPoint[] {
  const points = 30; // 30 days
  const stepSeconds = 24 * 60 * 60; // 1 day steps
  const now = Math.floor(Date.now() / 1000);
  let currentVal = value;
  const series: PortfolioChartPoint[] = [];

  for (let i = 0; i < points; i++) {
    series.unshift({
      time: now - i * stepSeconds,
      value: Number(currentVal.toFixed(2)),
    });
    // Slight random walk
    const change = (Math.random() - 0.48) * (value * 0.02);
    currentVal = Math.max(0, currentVal - change);
  }
  return series;
}

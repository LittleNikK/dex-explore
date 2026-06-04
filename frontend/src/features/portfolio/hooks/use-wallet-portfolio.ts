import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { type Address } from "viem";
import { getWalletPortfolioSnapshot } from "../services/wallet-portfolio.service";
import { usePortfolioStore } from "../store/portfolio-store";

export function useWalletPortfolio(address?: string, chainId?: number, enabled = false) {
  const publicClient = usePublicClient({ chainId });
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

  useEffect(() => {
    if (!enabled) return;
    resetPortfolioState();
  }, [address, chainId, enabled, resetPortfolioState]);

  const query = useQuery({
    queryKey: ["wallet-portfolio", address ?? "default", chainId ?? 1, refreshToken],
    enabled: enabled && Boolean(address) && Boolean(chainId) && Boolean(publicClient),
    refetchInterval: 15_000,
    staleTime: 10_000,
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
    const first = chartData[0]?.value;
    const latest = chartData[chartData.length - 1]?.value;
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

    const lastPoint = chartData.at(-1);
    const shouldAppend = !lastPoint || lastPoint.time !== current.chartPoint.time || lastPoint.value !== current.chartPoint.value;
    if (shouldAppend) {
      appendChartPoint(current.chartPoint);
    }
  }, [appendChartPoint, chartData, enabled, query.data, setActivity, setAssets, setError, setPortfolio, setPositions]);

  useEffect(() => {
    if (!enabled) return;
    if (query.error instanceof Error) {
      setError(query.error.message);
    }
  }, [enabled, query.error, setError]);

  return query;
}

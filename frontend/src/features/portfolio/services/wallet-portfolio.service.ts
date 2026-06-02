import { formatUnits, type Address, type PublicClient } from "viem";
import { ERC20_ABI } from "@/config/uniswap";
import { TOKENS, tokensForChain, type Token } from "@/config/tokens";
import type {
  Portfolio,
  PortfolioActivity,
  PortfolioAsset,
  PortfolioChartPoint,
  PortfolioPosition,
} from "../types";
import { SUPPORTED_CHAINS } from "@/config/wagmi";

const CHAIN_NATIVE_SYMBOL: Record<number, string> = {
  1: "ETH",
  8453: "ETH",
  42161: "ETH",
  10: "ETH",
  137: "MATIC",
};

function tokenPrice(symbol: string) {
  const token = TOKENS.find((entry) => entry.symbol === symbol);
  return token?.priceUsd ?? 0;
}

function chainLabel(chainId: number) {
  return SUPPORTED_CHAINS.find((chain) => chain.id === chainId)?.name ?? "Network";
}

function nativeTokenForChain(chainId: number): Token | null {
  const symbol = CHAIN_NATIVE_SYMBOL[chainId] ?? "ETH";
  return TOKENS.find((token) => token.symbol === symbol) ?? null;
}

function safeNumber(value: bigint, decimals: number) {
  return Number(formatUnits(value, decimals));
}

export interface WalletPortfolioSnapshot {
  portfolio: Portfolio;
  assets: PortfolioAsset[];
  activity: PortfolioActivity[];
  positions: PortfolioPosition[];
  chartPoint: PortfolioChartPoint;
}

export async function getWalletPortfolioSnapshot({
  address,
  chainId,
  publicClient,
}: {
  address: Address;
  chainId: number;
  publicClient: PublicClient;
}): Promise<WalletPortfolioSnapshot> {
  const portfolioTokens = tokensForChain(chainId);
  const [nativeBalance, tokenBalances] = await Promise.all([
    publicClient.getBalance({ address }),
    portfolioTokens.length
      ? publicClient.multicall({
          contracts: portfolioTokens.map((token) => ({
            abi: ERC20_ABI,
            address: token.address as Address,
            functionName: "balanceOf",
            args: [address],
          })),
        })
      : Promise.resolve([]),
  ]);

  const nativeToken = nativeTokenForChain(chainId);
  const nativeValueUsd = nativeToken ? safeNumber(nativeBalance, nativeToken.decimals) * (nativeToken.priceUsd ?? 0) : 0;

  const assets: PortfolioAsset[] = [];

  if (nativeToken && nativeBalance > 0n) {
    const balance = safeNumber(nativeBalance, nativeToken.decimals);
    assets.push({
      id: `native-${chainId}`,
      symbol: nativeToken.symbol,
      name: nativeToken.name,
      network: chainLabel(chainId),
      chainId,
      priceUsd: nativeToken.priceUsd ?? 0,
      balance,
      valueUsd: nativeValueUsd,
      change24h: 0,
      allocation: 0,
      address: nativeToken.address ?? "",
    });
  }

  portfolioTokens.forEach((token, index) => {
    const raw = tokenBalances[index] as { result?: unknown } | undefined;
    const balance = typeof raw?.result === "bigint" ? raw.result : 0n;
    if (balance <= 0n) return;

    const amount = safeNumber(balance, token.decimals);
    const valueUsd = amount * (token.priceUsd ?? 0);

    assets.push({
      id: token.symbol.toLowerCase(),
      symbol: token.symbol,
      name: token.name,
      network: chainLabel(chainId),
      chainId,
      priceUsd: token.priceUsd ?? 0,
      balance: amount,
      valueUsd,
      change24h: 0,
      allocation: 0,
      address: token.address ?? "",
    });
  });

  const totalValueUsd = assets.reduce((sum, asset) => sum + asset.valueUsd, 0);
  const sortedAssets = [...assets].sort((a, b) => b.valueUsd - a.valueUsd);

  const withAllocation = sortedAssets.map((asset) => ({
    ...asset,
    allocation: totalValueUsd > 0 ? (asset.valueUsd / totalValueUsd) * 100 : 0,
  }));

  const largestHolding = withAllocation[0];

  const portfolio: Portfolio = {
    address,
    portfolioName: "Connected Wallet",
    walletLabel: chainLabel(chainId),
    ensName: null,
    valueUsd: totalValueUsd,
    change24h: 0,
    networkCount: totalValueUsd > 0 ? 1 : 0,
    assetCount: withAllocation.length,
    stats: {
      totalAssets: withAllocation.length,
      totalNetworks: totalValueUsd > 0 ? 1 : 0,
      totalPositions: 0,
      transactions: 0,
      portfolioChange24h: 0,
      largestHolding: largestHolding
        ? {
            symbol: largestHolding.symbol,
            valueUsd: largestHolding.valueUsd,
            allocation: largestHolding.allocation,
          }
        : { symbol: "—", valueUsd: 0, allocation: 0 },
    },
  };

  return {
    portfolio,
    assets: withAllocation,
    activity: [],
    positions: [],
    chartPoint: {
      time: Math.floor(Date.now() / 1000),
      value: totalValueUsd,
    },
  };
}

import { TOKENS } from "@/config/tokens";
import type {
  Portfolio,
  PortfolioActivity,
  PortfolioAsset,
  PortfolioChartPoint,
  PortfolioPosition,
  PortfolioTimeframe,
} from "../types";

const WALLET_ADDRESS = "0xA7B4c1d2E3f4567890AbCDef1234567890abF31";

function makeHash(seed: string, prefix = "0x") {
  const hex = Array.from(seed)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}${hex}`.padEnd(66, "0").slice(0, 66);
}

function createRng(seed: string) {
  let value = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    value ^= seed.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }

  return () => {
    value += value << 13;
    value ^= value >>> 7;
    value += value << 3;
    value ^= value >>> 17;
    value += value << 5;
    return ((value >>> 0) % 1_000_000) / 1_000_000;
  };
}

function buildSeries({
  seed,
  points,
  stepSeconds,
  base,
  drift,
}: {
  seed: string;
  points: number;
  stepSeconds: number;
  base: number;
  drift: number;
}): PortfolioChartPoint[] {
  const rand = createRng(seed);
  const now = Math.floor(Date.now() / 1000);
  let value = base * 0.92;

  return Array.from({ length: points }, (_, index) => {
    const wave = Math.sin(index / 2.4) * base * 0.012;
    const move = (rand() - 0.46) * base * drift + wave;
    value = Math.max(base * 0.72, value + move);

    return {
      time: now - (points - 1 - index) * stepSeconds,
      value: Number(value.toFixed(2)),
    };
  });
}

export const MOCK_PORTFOLIO: Portfolio = {
  address: WALLET_ADDRESS,
  portfolioName: "Main Portfolio",
  walletLabel: "Personal wallet",
  ensName: "dex.eth",
  valueUsd: 12_845.42,
  change24h: 4.21,
  networkCount: 3,
  assetCount: 5,
  stats: {
    totalAssets: 5,
    totalNetworks: 3,
    totalPositions: 4,
    transactions: 48,
    portfolioChange24h: 4.21,
    largestHolding: {
      symbol: "ETH",
      valueUsd: 7_891.67,
      allocation: 61.43,
    },
  },
};

export const MOCK_ASSETS: PortfolioAsset[] = [
  {
    id: "eth",
    symbol: "ETH",
    name: "Ether",
    network: "Ethereum",
    chainId: 1,
    priceUsd: TOKENS.find((token) => token.symbol === "ETH")?.priceUsd ?? 0,
    balance: 2.31,
    valueUsd: 7_891.67,
    change24h: 4.8,
    allocation: 61.43,
    address: TOKENS.find((token) => token.symbol === "ETH")?.address ?? "",
  },
  {
    id: "usdc",
    symbol: "USDC",
    name: "USD Coin",
    network: "Base",
    chainId: 8453,
    priceUsd: 1,
    balance: 2_450.12,
    valueUsd: 2_450.12,
    change24h: 0.02,
    allocation: 19.08,
    address: TOKENS.find((token) => token.symbol === "USDC")?.address ?? "",
  },
  {
    id: "wbtc",
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    network: "Ethereum",
    chainId: 1,
    priceUsd: TOKENS.find((token) => token.symbol === "WBTC")?.priceUsd ?? 0,
    balance: 0.061,
    valueUsd: 4_102.7,
    change24h: 2.13,
    allocation: 31.94,
    address: TOKENS.find((token) => token.symbol === "WBTC")?.address ?? "",
  },
  {
    id: "uni",
    symbol: "UNI",
    name: "Uniswap",
    network: "Optimism",
    chainId: 10,
    priceUsd: TOKENS.find((token) => token.symbol === "UNI")?.priceUsd ?? 0,
    balance: 84.5,
    valueUsd: 711.07,
    change24h: -1.92,
    allocation: 5.54,
    address: TOKENS.find((token) => token.symbol === "UNI")?.address ?? "",
  },
  {
    id: "other",
    symbol: "Others",
    name: "Multi-chain assets",
    network: "Multi-chain",
    chainId: 1,
    priceUsd: 1,
    balance: 0,
    valueUsd: 1_589.86,
    change24h: 1.68,
    allocation: 12.38,
    address: "0x0000000000000000000000000000000000000001",
  },
];

export const MOCK_ACTIVITY: PortfolioActivity[] = [
  {
    id: "swap-1",
    type: "swap",
    asset: "ETH → USDC",
    amount: 0.84,
    amountUsd: 2_892.41,
    network: "Ethereum",
    hash: makeHash("swap-1"),
    timestamp: Date.now() - 12 * 60 * 1000,
    status: "confirmed",
    explorerUrl: "https://etherscan.io/tx/0xswap1",
  },
  {
    id: "send-1",
    type: "send",
    asset: "USDC",
    amount: 900,
    amountUsd: 900,
    network: "Base",
    hash: makeHash("send-1"),
    timestamp: Date.now() - 43 * 60 * 1000,
    status: "confirmed",
    explorerUrl: "https://basescan.org/tx/0xsend1",
  },
  {
    id: "receive-1",
    type: "receive",
    asset: "ETH",
    amount: 0.35,
    amountUsd: 1_205.31,
    network: "Ethereum",
    hash: makeHash("receive-1"),
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    status: "confirmed",
    explorerUrl: "https://etherscan.io/tx/0xreceive1",
  },
  {
    id: "approve-1",
    type: "approve",
    asset: "UNI",
    amount: 84.5,
    amountUsd: 711.07,
    network: "Optimism",
    hash: makeHash("approve-1"),
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    status: "confirmed",
    explorerUrl: "https://optimistic.etherscan.io/tx/0xapprove1",
  },
  {
    id: "bridge-1",
    type: "bridge",
    asset: "USDC",
    amount: 1_200,
    amountUsd: 1_200,
    network: "Arbitrum",
    hash: makeHash("bridge-1"),
    timestamp: Date.now() - 11 * 60 * 60 * 1000,
    status: "pending",
    explorerUrl: "https://arbiscan.io/tx/0xbridge1",
  },
  {
    id: "liquidity-1",
    type: "liquidity",
    asset: "ETH / USDC",
    amount: 3.2,
    amountUsd: 4_390.18,
    network: "Ethereum",
    hash: makeHash("liquidity-1"),
    timestamp: Date.now() - 18 * 60 * 60 * 1000,
    status: "confirmed",
    explorerUrl: "https://etherscan.io/tx/0xliquidity1",
  },
  {
    id: "swap-2",
    type: "swap",
    asset: "WBTC → ETH",
    amount: 0.013,
    amountUsd: 875.21,
    network: "Ethereum",
    hash: makeHash("swap-2"),
    timestamp: Date.now() - 28 * 60 * 60 * 1000,
    status: "confirmed",
    explorerUrl: "https://etherscan.io/tx/0xswap2",
  },
  {
    id: "send-2",
    type: "send",
    asset: "LINK",
    amount: 52,
    amountUsd: 739.0,
    network: "Polygon",
    hash: makeHash("send-2"),
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    status: "failed",
    explorerUrl: "https://polygonscan.com/tx/0xsend2",
  },
];

export const MOCK_POSITIONS: PortfolioPosition[] = [
  {
    id: "eth-usdc",
    pool: "ETH / USDC 0.05%",
    assets: ["ETH", "USDC"],
    network: "Ethereum",
    liquidityUsd: 24_180.32,
    apr: 14.2,
    feesEarnedUsd: 412.54,
    status: "In Range",
    hash: makeHash("eth-usdc"),
  },
  {
    id: "wbtc-eth",
    pool: "WBTC / ETH 0.30%",
    assets: ["WBTC", "ETH"],
    network: "Ethereum",
    liquidityUsd: 16_940.87,
    apr: 8.7,
    feesEarnedUsd: 301.03,
    status: "In Range",
    hash: makeHash("wbtc-eth"),
  },
  {
    id: "uni-eth",
    pool: "UNI / ETH 0.30%",
    assets: ["UNI", "ETH"],
    network: "Optimism",
    liquidityUsd: 8_227.11,
    apr: 18.4,
    feesEarnedUsd: 126.93,
    status: "Out Of Range",
    hash: makeHash("uni-eth"),
  },
  {
    id: "usdc-dai",
    pool: "USDC / DAI 0.01%",
    assets: ["USDC", "DAI"],
    network: "Base",
    liquidityUsd: 5_126.77,
    apr: 5.1,
    feesEarnedUsd: 61.82,
    status: "In Range",
    hash: makeHash("usdc-dai"),
  },
];

const TIMEFRAME_CONFIG: Record<PortfolioTimeframe, { points: number; stepSeconds: number; drift: number }> = {
  "1D": { points: 24, stepSeconds: 60 * 60, drift: 0.011 },
  "1W": { points: 7, stepSeconds: 60 * 60 * 24, drift: 0.016 },
  "1M": { points: 30, stepSeconds: 60 * 60 * 24, drift: 0.018 },
  "3M": { points: 90, stepSeconds: 60 * 60 * 24, drift: 0.02 },
  "1Y": { points: 52, stepSeconds: 60 * 60 * 24 * 7, drift: 0.024 },
  ALL: { points: 36, stepSeconds: 60 * 60 * 24 * 30, drift: 0.03 },
};

export const MOCK_HISTORY: Record<PortfolioTimeframe, PortfolioChartPoint[]> = {
  "1D": buildSeries({ seed: "portfolio-1d", base: 12_845.42, ...TIMEFRAME_CONFIG["1D"] }),
  "1W": buildSeries({ seed: "portfolio-1w", base: 12_240.75, ...TIMEFRAME_CONFIG["1W"] }),
  "1M": buildSeries({ seed: "portfolio-1m", base: 11_780.48, ...TIMEFRAME_CONFIG["1M"] }),
  "3M": buildSeries({ seed: "portfolio-3m", base: 10_940.18, ...TIMEFRAME_CONFIG["3M"] }),
  "1Y": buildSeries({ seed: "portfolio-1y", base: 8_900.22, ...TIMEFRAME_CONFIG["1Y"] }),
  ALL: buildSeries({ seed: "portfolio-all", base: 6_420.11, ...TIMEFRAME_CONFIG.ALL }),
};

export function clonePortfolio() {
  return structuredClone(MOCK_PORTFOLIO);
}

export function cloneAssets() {
  return structuredClone(MOCK_ASSETS);
}

export function cloneActivity() {
  return structuredClone(MOCK_ACTIVITY);
}

export function clonePositions() {
  return structuredClone(MOCK_POSITIONS);
}

export function cloneHistory(timeframe: PortfolioTimeframe) {
  return structuredClone(MOCK_HISTORY[timeframe]);
}

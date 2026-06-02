import addresses from "./addresses.json";

export interface Token {
  symbol: string;
  name: string;
  decimals: number;
  priceUsd: number;
  address?: string;
  chainId: number;
}

export const TOKENS: Token[] = [
  {
    symbol: "MST",
    name: "tMST Native Token",
    decimals: 18,
    priceUsd: 1.85,
    chainId: 91562037, // MST Testnet
  },
  {
    symbol: "WMST",
    name: "Wrapped MST",
    decimals: 18,
    priceUsd: 1.85,
    address: addresses.WMST_ADDRESS,
    chainId: 91562037,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: Number(addresses.USDC_DECIMALS ?? 6),
    priceUsd: 1.0,
    address: addresses.USDC_ADDRESS,
    chainId: 91562037,
  },
  {
    symbol: "USDT",
    name: "Tether",
    decimals: 6,
    priceUsd: 1.0,
    address: addresses.USDT_ADDRESS,
    chainId: 91562037,
  },
  {
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    priceUsd: 65000.0,
    address: addresses.WBTC_ADDRESS,
    chainId: 91562037,
  },
  {
    symbol: "ETH",
    name: "Ether",
    decimals: 18,
    priceUsd: 3400.0,
    address: "0x2170ed8265b2828478396136587c470a1a14c241", // mock mainnet addresses for tracking UI demo
    chainId: 1,
  },
  {
    symbol: "WBTC_ETH",
    name: "Wrapped Bitcoin (Ethereum)",
    decimals: 8,
    priceUsd: 65000.0,
    address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    chainId: 1,
  },
  {
    symbol: "UNI",
    name: "Uniswap Token",
    decimals: 18,
    priceUsd: 8.4,
    address: "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
    chainId: 10, // Optimism
  }
];

export function tokensForChain(chainId: number): Token[] {
  return TOKENS.filter((token) => token.chainId === chainId && token.address);
}


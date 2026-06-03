export interface MockToken {
  address: string;
  symbol: string;
  name: string;
  priceUsd: number;
  change24h: number;
  volume24h: number;
  tvl: number;
}

export interface MockPool {
  address: string;
  token0: string;
  token1: string;
  feeTier: number;
  tvl: number;
  volume24h: number;
  apr: number;
}

export interface MockTx {
  hash: string;
  type: "swap" | "add" | "remove";
  token0: string;
  token1: string;
  usd: number;
  account: string;
  timestamp: number;
}

export async function topTokens(): Promise<MockToken[]> {
  return [
    {
      address: "native",
      symbol: "MST",
      name: "tMST Native Token",
      priceUsd: 1.85,
      change24h: 1.25,
      volume24h: 2450000,
      tvl: 8500000
    },
    {
      address: "0xAa0Ab95AA3d885c00711541000eA2c2E66b9472b",
      symbol: "WMST",
      name: "Wrapped MST",
      priceUsd: 1.85,
      change24h: 1.25,
      volume24h: 1245000,
      tvl: 4500000
    },
    {
      address: "0x3468b4ac95f03534a15F633790d9BbD88b130170",
      symbol: "USDC",
      name: "USD Coin",
      priceUsd: 1.0,
      change24h: 0.01,
      volume24h: 4890000,
      tvl: 12000000
    }
  ];
}

export async function topPools(): Promise<MockPool[]> {
  return [
    {
      address: "0xBc3479D30b0216d435e27A4BAeF08de9719F8265",
      token0: "WMST",
      token1: "USDC",
      feeTier: 3000,
      tvl: 2500000,
      volume24h: 420000,
      apr: 12.4
    }
  ];
}

export async function recentTxs(count: number): Promise<MockTx[]> {
  const txs: MockTx[] = [
    {
      hash: "0x82f2bd92e10693ce6a6a1bfbfbf21b6b187deefa02641c27ec527a09f8484dc4",
      type: "swap",
      token0: "USDC",
      token1: "WMST",
      usd: 1250,
      account: "0xA7B4c1d2E3f4567890AbCDef1234567890abF31",
      timestamp: Date.now() - 30 * 60000
    },
    {
      hash: "0x1d5f09e5f88d4a30f2140e2a091a9cc39b13673d1e211f30c441cc4f4a7c5b91",
      type: "add",
      token0: "WMST",
      token1: "USDC",
      usd: 5000,
      account: "0xA7B4c1d2E3f4567890AbCDef1234567890abF31",
      timestamp: Date.now() - 140 * 60000
    },
    {
      hash: "0xbadf51d5f09e5f88d4a30f2140e2a091a9cc39b13673d1e211f30c441cc4f4a7",
      type: "remove",
      token0: "WMST",
      token1: "USDC",
      usd: 2500,
      account: "0xA7B4c1d2E3f4567890AbCDef1234567890abF31",
      timestamp: Date.now() - 500 * 60000
    }
  ];
  return txs.slice(0, count);
}

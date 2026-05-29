import type { Address } from "viem";

export const V3_FEE = 3000;
export const ZERO_SQRT_PRICE_LIMIT = 0n;

export const CONTRACTS = {
  wmst: (import.meta.env.VITE_WMST_ADDRESS ?? "0x97f517A686bfc21D8398C9f6bf0fC0b8d30785Fc") as Address,
  swapRouter: (import.meta.env.VITE_SWAP_ROUTER_ADDRESS ?? "0xefa02641c27ec527a09f8484dc491b525cb035f6") as Address,
  quoterV2: (import.meta.env.VITE_QUOTER_V2_ADDRESS ?? "0x9b65cc383c258895ad0a6cf4157df924becfc86a") as Address
};

export interface TokenConfig {
  symbol: string;
  name: string;
  decimals: number;
  address?: Address;
  isNativeWrapped?: boolean;
}

export const TOKENS: TokenConfig[] = [
  {
    symbol: "WMST",
    name: "Wrapped MST",
    decimals: 18,
    address: CONTRACTS.wmst,
    isNativeWrapped: true
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    decimals: Number(import.meta.env.VITE_USDC_DECIMALS ?? 18),
    address: (import.meta.env.VITE_USDC_ADDRESS ?? "0x3468b4ac95f03534a15F633790d9BbD88b130170") as Address | undefined
  },
  {
    symbol: "USDT",
    name: "Tether",
    decimals: 6,
    address: import.meta.env.VITE_USDT_ADDRESS as Address | undefined
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    decimals: 8,
    address: import.meta.env.VITE_WBTC_ADDRESS as Address | undefined
  }
];

export function getToken(symbol: string) {
  return TOKENS.find((token) => token.symbol === symbol);
}

export const erc20Abi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" }
    ],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  }
] as const;

export const quoterV2Abi = [
  {
    type: "function",
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "amountIn", type: "uint256" },
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceLimitX96", type: "uint160" }
        ]
      }
    ],
    outputs: [
      { name: "amountOut", type: "uint256" },
      { name: "sqrtPriceX96After", type: "uint160" },
      { name: "initializedTicksCrossed", type: "uint32" },
      { name: "gasEstimate", type: "uint256" }
    ]
  }
] as const;

export const swapRouterAbi = [
  {
    type: "function",
    name: "exactInputSingle",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "tokenIn", type: "address" },
          { name: "tokenOut", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "recipient", type: "address" },
          { name: "deadline", type: "uint256" },
          { name: "amountIn", type: "uint256" },
          { name: "amountOutMinimum", type: "uint256" },
          { name: "sqrtPriceLimitX96", type: "uint160" }
        ]
      }
    ],
    outputs: [{ name: "amountOut", type: "uint256" }]
  }
] as const;

import type { Address } from "viem";
import addresses from "./addresses.json";

export const V3_FEE = 3000;
export const ZERO_SQRT_PRICE_LIMIT = 0n;

export const CONTRACTS = {
  wmst: (import.meta.env.VITE_WMST_ADDRESS || addresses.WMST_ADDRESS) as Address,
  swapRouter: (import.meta.env.VITE_SWAP_ROUTER_ADDRESS || addresses.SWAP_ROUTER_ADDRESS) as Address,
  quoterV2: (import.meta.env.VITE_QUOTER_V2_ADDRESS || addresses.QUOTER_V2_ADDRESS) as Address,
  testingExecutor: (import.meta.env.VITE_TESTING_EXECUTOR_ADDRESS || addresses.TESTING_EXECUTOR_ADDRESS) as Address,
  lpStateStorage: (import.meta.env.VITE_LP_STATE_STORAGE_ADDRESS || addresses.LP_STATE_STORAGE_ADDRESS) as Address,
  usdc: (import.meta.env.VITE_USDC_ADDRESS || addresses.USDC_ADDRESS) as Address
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
    decimals: Number(import.meta.env.VITE_USDC_DECIMALS || addresses.USDC_DECIMALS || 6),
    address: CONTRACTS.usdc
  },
  {
    symbol: "USDT",
    name: "Tether",
    decimals: 6,
    address: (import.meta.env.VITE_USDT_ADDRESS || addresses.USDT_ADDRESS) as Address | undefined
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    decimals: 8,
    address: (import.meta.env.VITE_WBTC_ADDRESS || addresses.WBTC_ADDRESS) as Address | undefined
  }
];

export function getToken(symbol: string) {
  return TOKENS.find((token) => token.symbol === symbol);
}

export const NATIVE_TOKEN_SYMBOL = "MST";
export const NATIVE_TOKEN_DISPLAY_SYMBOL = "tMST";
export const NATIVE_TOKEN_DISPLAY_NAME = "tMST Native Token";

export function displayTokenSymbol(symbol: string) {
  return symbol === NATIVE_TOKEN_SYMBOL ? NATIVE_TOKEN_DISPLAY_SYMBOL : symbol;
}

export function displayTokenName(symbol: string) {
  return symbol === NATIVE_TOKEN_SYMBOL ? NATIVE_TOKEN_DISPLAY_NAME : getToken(symbol)?.name ?? symbol;
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

export const testingExecutorAbi = [
  {
    type: "function",
    name: "activeTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "initiatePoolAndLiquidity",
    stateMutability: "payable",
    inputs: [
      {
        name: "params",
        type: "tuple",
        components: [
          { name: "fee", type: "uint24" },
          { name: "sqrtPriceX96", type: "uint160" },
          { name: "wmstDesired", type: "uint256" },
          { name: "usdcDesired", type: "uint256" },
          { name: "tickLower", type: "int24" },
          { name: "tickUpper", type: "int24" }
        ]
      }
    ],
    outputs: [
      { name: "pool", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "liquidity", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "increaseActiveLiquidity",
    stateMutability: "payable",
    inputs: [
      { name: "wmstDesired", type: "uint256" },
      { name: "usdcDesired", type: "uint256" }
    ],
    outputs: [
      { name: "liquidityAdded", type: "uint128" },
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "decreaseActiveLiquidity",
    stateMutability: "nonpayable",
    inputs: [{ name: "liquidityToRemove", type: "uint128" }],
    outputs: [
      { name: "amount0", type: "uint256" },
      { name: "amount1", type: "uint256" }
    ]
  },
  {
    type: "function",
    name: "collectActiveFees",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [
      { name: "amount0Collected", type: "uint256" },
      { name: "amount1Collected", type: "uint256" }
    ]
  }
] as const;

export const lpStateStorageAbi = [
  {
    type: "function",
    name: "poolAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "lpTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "lpLiquidity",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "lpAmount0",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "lpAmount1",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

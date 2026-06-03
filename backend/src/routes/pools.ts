import { Router } from "express";
import addresses from "../config/addresses.json" with { type: "json" };
import { publicClient } from "../config/client.js";
import { formatUnits, parseUnits, type Address, parseAbiItem } from "viem";

export const poolsRouter = Router();

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

export async function getDynamicPoolDetails() {
  const poolId = addresses.POOL_ADDRESS as Address;
  const wmstAddress = addresses.WMST_ADDRESS as Address;
  const usdcAddress = addresses.USDC_ADDRESS as Address;
  const quoterAddress = addresses.QUOTER_V2_ADDRESS as Address;

  let tvlUsd = 0;
  let wmstReserve = 0;
  let usdcReserve = 0;
  let liveMstPrice = 0;

  try {
    // 1. Fetch pool token balances
    const [wmstBal, usdcBal] = await Promise.all([
      publicClient.readContract({
        address: wmstAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [poolId]
      }),
      publicClient.readContract({
        address: usdcAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [poolId]
      })
    ]);

    wmstReserve = Number(formatUnits(wmstBal, 18));
    usdcReserve = Number(formatUnits(usdcBal, 18));

    // 2. Fetch live MST price
    try {
      const oneUnitRaw = parseUnits("1", 18);
      const { result } = await publicClient.simulateContract({
        address: quoterAddress,
        abi: [
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
        ],
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: wmstAddress,
            tokenOut: usdcAddress,
            amountIn: oneUnitRaw,
            fee: 3000,
            sqrtPriceLimitX96: 0n
          }
        ]
      });

      if (result) {
        liveMstPrice = Number(formatUnits(result[0], 18));
      }
    } catch {}

    tvlUsd = wmstReserve * liveMstPrice + usdcReserve;
  } catch (err) {
    console.error("Error reading pool reserves in backend", err);
  }

  return {
    id: poolId,
    token0: "WMST",
    token1: "USDC",
    feeTier: 3000,
    tvlUSD: tvlUsd,
    volumeUSD: tvlUsd * 7.5,
    wmstReserve,
    usdcReserve,
    liveMstPrice
  };
}

export async function getDynamicPoolTransactions() {
  const poolId = addresses.POOL_ADDRESS as Address;
  const wmstAddress = addresses.WMST_ADDRESS as Address;
  const usdcAddress = addresses.USDC_ADDRESS as Address;

  try {
    // Query logs of Swap, Mint, Burn from pool contract
    const [swapLogs, mintLogs, burnLogs] = await Promise.all([
      publicClient.getLogs({
        address: poolId,
        event: parseAbiItem("event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)"),
        fromBlock: 0n
      }),
      publicClient.getLogs({
        address: poolId,
        event: parseAbiItem("event Mint(address sender, address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)"),
        fromBlock: 0n
      }),
      publicClient.getLogs({
        address: poolId,
        event: parseAbiItem("event Burn(address indexed owner, int24 indexed tickLower, int24 indexed tickUpper, uint128 amount, uint256 amount0, uint256 amount1)"),
        fromBlock: 0n
      })
    ]);

    const txs: any[] = [];
    const poolDetails = await getDynamicPoolDetails();
    const liveMstPrice = poolDetails.liveMstPrice;
    const isWmstToken0 = wmstAddress.toLowerCase() < usdcAddress.toLowerCase();

    for (const log of swapLogs) {
      const { amount0, amount1, sender } = log.args;
      if (amount0 !== undefined && amount1 !== undefined) {
        const amount0Dec = Number(formatUnits(amount0 < 0n ? -amount0 : amount0, 18));
        const amount1Dec = Number(formatUnits(amount1 < 0n ? -amount1 : amount1, 18));
        const usdValue = isWmstToken0 ? amount1Dec : amount0Dec; // USDC is our dollar peg

        txs.push({
          hash: log.transactionHash,
          blockNumber: log.blockNumber,
          type: "swap",
          token0: "USDC",
          token1: "WMST",
          usd: usdValue,
          account: sender || "0x",
          timestamp: 0
        });
      }
    }

    for (const log of mintLogs) {
      const { amount0, amount1, owner } = log.args;
      if (amount0 !== undefined && amount1 !== undefined) {
        const wmstDec = isWmstToken0 ? amount0 : amount1;
        const usdcDec = isWmstToken0 ? amount1 : amount0;

        const wmstAmount = Number(formatUnits(wmstDec, 18));
        const usdcAmount = Number(formatUnits(usdcDec, 18));
        const usdValue = wmstAmount * liveMstPrice + usdcAmount;

        txs.push({
          hash: log.transactionHash,
          blockNumber: log.blockNumber,
          type: "add",
          token0: "WMST",
          token1: "USDC",
          usd: usdValue,
          account: owner || "0x",
          timestamp: 0
        });
      }
    }

    for (const log of burnLogs) {
      const { amount0, amount1, owner } = log.args;
      if (amount0 !== undefined && amount1 !== undefined) {
        const wmstDec = isWmstToken0 ? amount0 : amount1;
        const usdcDec = isWmstToken0 ? amount1 : amount0;

        const wmstAmount = Number(formatUnits(wmstDec, 18));
        const usdcAmount = Number(formatUnits(usdcDec, 18));
        const usdValue = wmstAmount * liveMstPrice + usdcAmount;

        txs.push({
          hash: log.transactionHash,
          blockNumber: log.blockNumber,
          type: "remove",
          token0: "WMST",
          token1: "USDC",
          usd: usdValue,
          account: owner || "0x",
          timestamp: 0
        });
      }
    }

    // Sort by block number descending
    txs.sort((a, b) => Number(b.blockNumber - a.blockNumber));

    const recentTxs = txs.slice(0, 30);
    const uniqueBlockNumbers = Array.from(new Set(recentTxs.map(t => t.blockNumber)));

    const blockTimestamps: Record<string, number> = {};
    await Promise.all(
      uniqueBlockNumbers.map(async (bn) => {
        try {
          const block = await publicClient.getBlock({ blockNumber: bn });
          blockTimestamps[bn.toString()] = Number(block.timestamp) * 1000;
        } catch {
          blockTimestamps[bn.toString()] = Date.now();
        }
      })
    );

    recentTxs.forEach(t => {
      t.timestamp = blockTimestamps[t.blockNumber.toString()] || Date.now();
    });

    return recentTxs;
  } catch (err) {
    console.error("Error reading pool transactions in backend", err);
    return [];
  }
}

// GET /api/pools  -> list indexed pools
poolsRouter.get("/", async (_req, res) => {
  const details = await getDynamicPoolDetails();
  res.json({ pools: [details] });
});

// GET /api/pools/transactions -> live transactions
poolsRouter.get("/transactions", async (_req, res) => {
  const txs = await getDynamicPoolTransactions();
  res.json({ transactions: txs });
});

// GET /api/pools/:id
poolsRouter.get("/:id", async (_req, res) => {
  const details = await getDynamicPoolDetails();
  res.json(details);
});

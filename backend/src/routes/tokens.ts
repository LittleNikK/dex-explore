import { Router } from "express";
import addresses from "../config/addresses.json" with { type: "json" };
import { publicClient } from "../config/client.js";
import { type Address } from "viem";
import { getDynamicPoolDetails } from "./pools.js";

export const tokensRouter = Router();

const decimalsAbi = [
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  }
] as const;

// GET /api/tokens -> token list with live price, volume, and TVL details
tokensRouter.get("/", async (_req, res) => {
  let wmstDecimals = 18;
  let usdcDecimals = 18;

  try {
    const [wDec, uDec] = await Promise.all([
      publicClient.readContract({
        address: addresses.WMST_ADDRESS as Address,
        abi: decimalsAbi,
        functionName: "decimals"
      }),
      publicClient.readContract({
        address: addresses.USDC_ADDRESS as Address,
        abi: decimalsAbi,
        functionName: "decimals"
      })
    ]);
    wmstDecimals = Number(wDec);
    usdcDecimals = Number(uDec);
  } catch (err) {
    console.error("Error reading token decimals in backend router", err);
  }

  // Get dynamic pool details for live pricing and reserves
  const poolDetails = await getDynamicPoolDetails();
  const liveMstPrice = poolDetails.liveMstPrice;
  const wmstTvl = poolDetails.wmstReserve * liveMstPrice;
  const usdcTvl = poolDetails.usdcReserve;

  res.json({
    tokens: [
      {
        address: "native",
        symbol: "MST",
        name: "tMST Native Token",
        decimals: 18,
        priceUsd: liveMstPrice,
        change24h: 1.25,
        volume24h: poolDetails.volumeUSD * 0.6,
        tvl: wmstTvl
      },
      {
        address: addresses.WMST_ADDRESS,
        symbol: "WMST",
        name: "Wrapped MST",
        decimals: wmstDecimals,
        priceUsd: liveMstPrice,
        change24h: 1.25,
        volume24h: poolDetails.volumeUSD * 0.4,
        tvl: wmstTvl
      },
      {
        address: addresses.USDC_ADDRESS,
        symbol: "USDC",
        name: "USD Coin",
        decimals: usdcDecimals,
        priceUsd: 1.0,
        change24h: 0.01,
        volume24h: poolDetails.volumeUSD,
        tvl: usdcTvl
      }
    ]
  });
});

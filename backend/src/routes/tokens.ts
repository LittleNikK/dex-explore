import { Router } from "express";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { publicClient } from "../config/client.js";
import { type Address } from "viem";
import { getDynamicPoolDetails } from "./pools.js";

const getAddresses = () => {
  const srcPath = join(process.cwd(), "src/config/addresses.json");
  const distPath = join(process.cwd(), "dist/config/addresses.json");
  const path = existsSync(srcPath) ? srcPath : distPath;
  return JSON.parse(readFileSync(path, "utf8"));
};
const addresses = getAddresses();

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
        change24h: poolDetails.change24h || 0.0,
        volume24h: poolDetails.volumeUSD * 0.6,
        tvl: wmstTvl
      },
      {
        address: addresses.WMST_ADDRESS,
        symbol: "WMST",
        name: "Wrapped MST",
        decimals: wmstDecimals,
        priceUsd: liveMstPrice,
        change24h: poolDetails.change24h || 0.0,
        volume24h: poolDetails.volumeUSD * 0.4,
        tvl: wmstTvl
      },
      {
        address: addresses.USDC_ADDRESS,
        symbol: "USDC",
        name: "USD Coin",
        decimals: usdcDecimals,
        priceUsd: 1.0,
        change24h: 0.0,
        volume24h: poolDetails.volumeUSD,
        tvl: usdcTvl
      }
    ]
  });
});

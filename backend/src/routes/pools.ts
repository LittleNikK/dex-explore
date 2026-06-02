import { Router } from "express";
import addresses from "../config/addresses.json" with { type: "json" };

export const poolsRouter = Router();

// GET /api/pools  -> list indexed pools
poolsRouter.get("/", async (_req, res) => {
  res.json({
    pools: [
      {
        id: addresses.POOL_ADDRESS,
        token0: "WMST",
        token1: "USDC",
        feeTier: 3000,
        tvlUSD: 2450000,
        volumeUSD: 18420500
      }
    ]
  });
});

// GET /api/pools/:id
poolsRouter.get("/:id", async (req, res) => {
  res.json({ 
    id: addresses.POOL_ADDRESS, 
    token0: "WMST", 
    token1: "USDC", 
    feeTier: 3000,
    tvlUSD: 2450000,
    volumeUSD: 18420500
  });
});


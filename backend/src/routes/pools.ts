import { Router } from "express";

export const poolsRouter = Router();

// GET /api/pools  -> list indexed pools
poolsRouter.get("/", async (_req, res) => {
  res.json({
    pools: [
      {
        id: "0x884E9554Ed3E44c72D4a1052515BA3e72a495f15",
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
    id: "0x884E9554Ed3E44c72D4a1052515BA3e72a495f15", 
    token0: "WMST", 
    token1: "USDC", 
    feeTier: 3000,
    tvlUSD: 2450000,
    volumeUSD: 18420500
  });
});


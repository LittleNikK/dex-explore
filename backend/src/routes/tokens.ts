import { Router } from "express";
import addresses from "../config/addresses.json" with { type: "json" };

export const tokensRouter = Router();

const TOKENS = [
  { symbol: "WMST", name: "Wrapped MST", decimals: 18, address: addresses.WMST_ADDRESS },
  { symbol: "USDC", name: "USD Coin", decimals: Number(addresses.USDC_DECIMALS ?? 6), address: addresses.USDC_ADDRESS }
];

// GET /api/tokens -> token list for the frontend fuzzy search
tokensRouter.get("/", (_req, res) => {
  res.json({ tokens: TOKENS });
});


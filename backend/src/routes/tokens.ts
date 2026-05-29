import { Router } from "express";

export const tokensRouter = Router();

const TOKENS = [
  { symbol: "WMST", name: "Wrapped MST", decimals: 18, address: "0x97f517A686bfc21D8398C9f6bf0fC0b8d30785Fc" },
  { symbol: "USDC", name: "USD Coin", decimals: 6, address: "0x3468b4ac95f03534a15F633790d9BbD88b130170" }
];

// GET /api/tokens -> token list for the frontend fuzzy search
tokensRouter.get("/", (_req, res) => {
  res.json({ tokens: TOKENS });
});


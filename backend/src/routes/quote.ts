import { Router } from "express";
import { z } from "zod";
import { Sor } from "../services/sor.js";

export const quoteRouter = Router();

const QuoteSchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string()
});

const sor = new Sor();

// POST /api/quote -> best-path quote via the Smart Order Router
quoteRouter.post("/", async (req, res) => {
  const parsed = QuoteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }
  const { tokenIn, tokenOut, amountIn } = parsed.data;
  const route = sor.findBestRoute(tokenIn, tokenOut, BigInt(amountIn));
  res.json(route);
});

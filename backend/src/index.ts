import express from "express";
import cors from "cors";
import helmet from "helmet";
import * as dotenv from "dotenv";
import { poolsRouter } from "./routes/pools.js";
import { quoteRouter } from "./routes/quote.js";
import { tokensRouter } from "./routes/tokens.js";
import { metricsHandler } from "./metrics.js";

dotenv.config();
dotenv.config({ path: "../.env" });

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/metrics", metricsHandler);

app.use("/api/pools", poolsRouter);
app.use("/api/quote", quoteRouter);
app.use("/api/tokens", tokensRouter);

const PORT = Number(process.env.PORT ?? 3001);

// Only start listening when run directly (not when imported by tests).
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`MST Swap backend listening on :${PORT}`);
  });
}

export default app;

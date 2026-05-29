CREATE INDEX idx_pool_tokens
ON "Pool" ("token0", "token1");

CREATE INDEX idx_swap_pool
ON "Swap" ("poolId");

CREATE INDEX idx_swap_timestamp
ON "Swap" ("timestamp");

CREATE INDEX idx_ohlcv_pool_time
ON "OHLCV" ("poolId", "timestamp");

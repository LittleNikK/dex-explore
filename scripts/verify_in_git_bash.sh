#!/usr/bin/env bash
set -euo pipefail

set -a
source .env
set +a

echo "== Factory getPool =="
cast call "$V3_FACTORY_ADDRESS" "getPool(address,address,uint24)(address)" "$WMST_ADDRESS" "$USDC_ADDRESS" 3000 --rpc-url "$RPC_URL"

echo "\n== Stored pool in LPStateStorage =="
cast call "$LP_STATE_STORAGE_ADDRESS" "poolAddress()(address)" --rpc-url "$RPC_URL"

echo "\n== Position owner =="
cast call "$POSITION_MANAGER_ADDRESS" "ownerOf(uint256)(address)" "$LP_TOKEN_ID" --rpc-url "$RPC_URL"

echo "\n== Position data (positions(...)) =="
cast call "$POSITION_MANAGER_ADDRESS" "positions(uint256)((uint96,address,address,address,uint24,int24,int24,uint128,uint256,uint256,uint128,uint128))" "$LP_TOKEN_ID" --rpc-url "$RPC_URL" || true

echo "\n== Pool liquidity =="
cast call "$POOL_ADDRESS" "liquidity()(uint128)" --rpc-url "$RPC_URL"

echo "\nVerifier script completed."

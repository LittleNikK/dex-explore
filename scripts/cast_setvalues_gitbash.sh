#!/usr/bin/env bash
set -euo pipefail

# Sources .env and runs cast send to update LPStateStorage
if ! command -v cast >/dev/null 2>&1; then
  echo "cast not found in PATH. Ensure Foundry's cast is installed and in PATH." >&2
  exit 1
fi

set -a
if [ -f .env ]; then
  source .env
else
  echo ".env not found in current directory; please run from repo root." >&2
  exit 1
fi
set +a

echo "Calling cast send to update LPStateStorage at $LP_STATE_STORAGE_ADDRESS"
PRIORITY_GAS_PRICE=${PRIORITY_GAS_PRICE:-1000000000}
GAS_PRICE=${GAS_PRICE:-1000000000}
echo "Using PRIORITY_GAS_PRICE=$PRIORITY_GAS_PRICE GAS_PRICE=$GAS_PRICE"
cast send "$LP_STATE_STORAGE_ADDRESS" 'setValues(address,uint256,uint256,uint256,uint256)' \
  "$POOL_ADDRESS" "$LP_TOKEN_ID" "$LP_LIQUIDITY" "$LP_AMOUNT0" "$LP_AMOUNT1" \
  --private-key "$PRIVATE_KEY" --rpc-url "$RPC_URL" \
  --priority-gas-price "$PRIORITY_GAS_PRICE" --gas-price "$GAS_PRICE"

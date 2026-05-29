#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/update_lp_state_from_broadcast.sh [BROADCAST_RUN_JSON] [LP_STATE_STORAGE_ADDRESS]
# If BROADCAST_RUN_JSON omitted, the script picks the most recent

BROADCAST_JSON=${1:-}
LP_STATE_ADDR=${2:-${LP_STATE_STORAGE_ADDRESS:-}}

if [ -z "$BROADCAST_JSON" ]; then
  BROADCAST_JSON=$(ls -td broadcast/DeploySwapDemo.s.sol/*/run-latest.json 2>/dev/null | head -n1 || true)
fi

if [ -z "$BROADCAST_JSON" ] || [ ! -f "$BROADCAST_JSON" ]; then
  echo "No broadcast run-latest.json found. Pass the path as first arg." >&2
  exit 1
fi

if [ -z "$LP_STATE_ADDR" ]; then
  echo "LPStateStorage address not provided. Pass as second arg or set LP_STATE_STORAGE_ADDRESS env var." >&2
  exit 1
fi

if ! command -v cast >/dev/null 2>&1; then
  echo "cast is required (from foundry). Install it first." >&2
  exit 1
fi

RPC_URL=${RPC_URL:-}
PRIVATE_KEY=${PRIVATE_KEY:-}

if [ -z "$RPC_URL" ] || [ -z "$PRIVATE_KEY" ]; then
  echo "RPC_URL and PRIVATE_KEY must be set in environment." >&2
  exit 1
fi

echo "Parsing values from: $BROADCAST_JSON"

POOL_ADDRESS=$(grep -oE 'POOL_ADDRESS=[^[:space:],]+' "$BROADCAST_JSON" | head -n1 | sed 's/POOL_ADDRESS=//')
LP_TOKEN_ID=$(grep -oE 'LP_TOKEN_ID=[^[:space:],]+' "$BROADCAST_JSON" | head -n1 | sed 's/LP_TOKEN_ID=//')
LP_LIQUIDITY=$(grep -oE 'LP_LIQUIDITY=[^[:space:],]+' "$BROADCAST_JSON" | head -n1 | sed 's/LP_LIQUIDITY=//')
LP_AMOUNT0=$(grep -oE 'LP_AMOUNT0=[^[:space:],]+' "$BROADCAST_JSON" | head -n1 | sed 's/LP_AMOUNT0=//')
LP_AMOUNT1=$(grep -oE 'LP_AMOUNT1=[^[:space:],]+' "$BROADCAST_JSON" | head -n1 | sed 's/LP_AMOUNT1=//')

if [ -z "$POOL_ADDRESS" ] || [ -z "$LP_TOKEN_ID" ]; then
  echo "Failed to parse required values from broadcast JSON." >&2
  exit 1
fi

echo "Found: POOL_ADDRESS=$POOL_ADDRESS LP_TOKEN_ID=$LP_TOKEN_ID LP_LIQUIDITY=$LP_LIQUIDITY"

echo "Sending setValues to $LP_STATE_ADDR"
cast send "$LP_STATE_ADDR" \
  "setValues(address,uint256,uint256,uint256,uint256)" \
  "$POOL_ADDRESS" "$LP_TOKEN_ID" "$LP_LIQUIDITY" "$LP_AMOUNT0" "$LP_AMOUNT1" \
  --private-key "$PRIVATE_KEY" \
  --rpc-url "$RPC_URL" \
  --gas-price 1000000000 \
  --priority-gas-price 1000000000

echo "Done."

#!/usr/bin/env bash
set -euo pipefail

# Update .env (or specified env file) from the most recent broadcast run-latest.json
# Usage: ./scripts/update_env_from_broadcast.sh [BROADCAST_JSON] [ENV_FILE]

BROADCAST_JSON=${1:-}
ENV_FILE=${2:-.env}

if [ -z "$BROADCAST_JSON" ]; then
  BROADCAST_JSON=$(ls -td broadcast/*/*/run-latest.json 2>/dev/null | head -n1 || true)
fi

if [ -z "$BROADCAST_JSON" ] || [ ! -f "$BROADCAST_JSON" ]; then
  echo "No broadcast run-latest.json found. Pass the path as first arg." >&2
  exit 1
fi

tmpfile=$(mktemp)
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$tmpfile"
else
  touch "$tmpfile"
fi

echo "Parsing broadcast file: $BROADCAST_JSON"

# Helper to set or replace a key in env file
set_key() {
  key="$1"
  value="$2"
  if grep -qE "^${key}=" "$tmpfile"; then
    sed -E "s|^(${key})=.*|\1=${value}|" -i "$tmpfile"
  else
    echo "${key}=${value}" >> "$tmpfile"
  fi
}

# Extract uppercase KEY=0x... patterns (addresses)
grep -oE '([A-Z0-9_]+)=\s*0x[0-9a-fA-F]{40}' "$BROADCAST_JSON" | while read -r line; do
  k=$(echo "$line" | sed -E 's/([A-Z0-9_]+)=.*/\1/')
  v=$(echo "$line" | sed -E 's/.*(0x[0-9a-fA-F]{40}).*/\1/')
  set_key "$k" "$v"
  echo "Set $k=$v"
done

# Extract numeric LP fields
grep -oE '(LP_TOKEN_ID|LP_LIQUIDITY|LP_AMOUNT0|LP_AMOUNT1)=[0-9]+' "$BROADCAST_JSON" | while read -r line; do
  k=$(echo "$line" | sed -E 's/([A-Z0-9_]+)=.*/\1/')
  v=$(echo "$line" | sed -E 's/.*=([0-9]+).*/\1/')
  set_key "$k" "$v"
  echo "Set $k=$v"
done

# Extract lines like 'WMST deployed at: 0x...'
wmst=$(grep -oE 'WMST deployed at: 0x[0-9a-fA-F]{40}' "$BROADCAST_JSON" | head -n1 | sed -E 's/.*(0x[0-9a-fA-F]{40}).*/\1/') || true
if [ -n "$wmst" ]; then
  set_key "WMST_ADDRESS" "$wmst"
  echo "Set WMST_ADDRESS=$wmst"
fi

# Extract LPStateStorage deployed address
lpst=$(grep -oE 'LPStateStorage deployed at: 0x[0-9a-fA-F]{40}' "$BROADCAST_JSON" | head -n1 | sed -E 's/.*(0x[0-9a-fA-F]{40}).*/\1/') || true
if [ -n "$lpst" ]; then
  set_key "LP_STATE_STORAGE_ADDRESS" "$lpst"
  echo "Set LP_STATE_STORAGE_ADDRESS=$lpst"
fi

# Move tempfile back to env file
mv "$tmpfile" "$ENV_FILE"
echo "Updated $ENV_FILE"

# Dynamically generate frontend/src/config/addresses.json and backend/src/config/addresses.json
echo "Generating dynamic addresses.json configurations..."

WMST_ADDRESS=$(grep -E "^WMST_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0x97f517A686bfc21D8398C9f6bf0fC0b8d30785Fc")
V3_FACTORY_ADDRESS=$(grep -E "^V3_FACTORY_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0xac925e9887070962a6089909007e936089dd0cde")
POSITION_MANAGER_ADDRESS=$(grep -E "^POSITION_MANAGER_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0x487e0e9c69ca6bc08b0f61384afab831b6b187de")
SWAP_ROUTER_ADDRESS=$(grep -E "^SWAP_ROUTER_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0xefa02641c27ec527a09f8484dc491b525cb035f6")
QUOTER_V2_ADDRESS=$(grep -E "^QUOTER_V2_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0x9b65cc383c258895ad0a6cf4157df924becfc86a")
USDC_ADDRESS=$(grep -E "^USDC_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0x3468b4ac95f03534a15F633790d9BbD88b130170")
USDC_DECIMALS=$(grep -E "^VITE_USDC_DECIMALS=" "$ENV_FILE" | cut -d'=' -f2 || echo "6")
USDT_ADDRESS=$(grep -E "^USDT_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0x3468b4ac95f03534a15F633790d9BbD88b130170")
WBTC_ADDRESS=$(grep -E "^WBTC_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0x3468b4ac95f03534a15F633790d9BbD88b130170")
LP_STATE_STORAGE_ADDRESS=$(grep -E "^LP_STATE_STORAGE_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0x7aEbeFbeFBE84a3884Cc7Aa6A8219c475A48C183")
TESTING_EXECUTOR_ADDRESS=$(grep -E "^TESTING_EXECUTOR_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0x945F0451B7a4c24340dFfdF94d8fA6921D910b8B")
POOL_ADDRESS=$(grep -E "^POOL_ADDRESS=" "$ENV_FILE" | cut -d'=' -f2 || echo "0x884E9554Ed3E44c72D4a1052515BA3e72a495f15")

JSON_CONTENT=$(cat <<EOF
{
  "WMST_ADDRESS": "${WMST_ADDRESS}",
  "V3_FACTORY_ADDRESS": "${V3_FACTORY_ADDRESS}",
  "POSITION_MANAGER_ADDRESS": "${POSITION_MANAGER_ADDRESS}",
  "SWAP_ROUTER_ADDRESS": "${SWAP_ROUTER_ADDRESS}",
  "QUOTER_V2_ADDRESS": "${QUOTER_V2_ADDRESS}",
  "USDC_ADDRESS": "${USDC_ADDRESS}",
  "USDC_DECIMALS": ${USDC_DECIMALS},
  "USDT_ADDRESS": "${USDT_ADDRESS}",
  "WBTC_ADDRESS": "${WBTC_ADDRESS}",
  "LP_STATE_STORAGE_ADDRESS": "${LP_STATE_STORAGE_ADDRESS}",
  "TESTING_EXECUTOR_ADDRESS": "${TESTING_EXECUTOR_ADDRESS}",
  "POOL_ADDRESS": "${POOL_ADDRESS}"
}
EOF
)

mkdir -p frontend/src/config backend/src/config
echo "$JSON_CONTENT" > frontend/src/config/addresses.json
echo "$JSON_CONTENT" > backend/src/config/addresses.json

echo "Dynamic address synchronization complete!"

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

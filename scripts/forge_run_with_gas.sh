#!/usr/bin/env bash
set -euo pipefail

# Wrapper to run `forge script` with default gas price settings to avoid RPC rejections.
# Usage: ./scripts/forge_run_with_gas.sh <fully-qualified-script> [--broadcast args...]

SCRIPT=${1:-}
if [ -z "$SCRIPT" ]; then
  echo "Usage: $0 <script:Contract> [forge args...]" >&2
  exit 1
fi

shift

# Default to 1 gwei if not provided in env
PRIORITY_GAS_PRICE=${PRIORITY_GAS_PRICE:-1000000000}
GAS_PRICE=${GAS_PRICE:-1000000000}

echo "Running: forge script $SCRIPT with priority-gas-price=$PRIORITY_GAS_PRICE and with-gas-price=$GAS_PRICE"

forge script "$SCRIPT" \
  --priority-gas-price "$PRIORITY_GAS_PRICE" \
  --with-gas-price "$GAS_PRICE" "$@"

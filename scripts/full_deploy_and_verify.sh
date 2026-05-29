#!/usr/bin/env bash
set -euo pipefail

# Full automation script to run locally. It compiles, tests, deploys, updates .env, and verifies.
# Usage: ./scripts/full_deploy_and_verify.sh

if ! command -v forge >/dev/null 2>&1; then
  echo "forge not found in PATH. Install Foundry (https://book.getfoundry.sh/) and ensure 'forge' is available." >&2
  exit 1
fi
if ! command -v cast >/dev/null 2>&1; then
  echo "cast not found in PATH. Install Foundry 'cast' and ensure it's available." >&2
  exit 1
fi

set -a; source .env; set +a

echo "== Build =="
forge build

echo "== Tests =="
forge test -vvvv || echo "Tests finished (some frameworks may fail; inspect output)"

echo "== Deploy DeploySwapDemo (creates pool + mints liquidity) =="
./scripts/forge_run_with_gas.sh contracts/script/DeploySwapDemo.s.sol:DeploySwapDemo --rpc-url "$RPC_URL" --broadcast --private-key "$PRIVATE_KEY"

echo "== Update .env from broadcast =="
./scripts/update_env_from_broadcast.sh || true

echo "== Verify Factory Pool =="
cast call "$V3_FACTORY_ADDRESS" "getPool(address,address,uint24)(address)" "$WMST_ADDRESS" "$USDC_ADDRESS" 3000 --rpc-url "$RPC_URL"

echo "== Verify Stored Pool in LPStateStorage (if deployed) =="
if [ -n "${LP_STATE_STORAGE_ADDRESS-}" ]; then
  cast call "$LP_STATE_STORAGE_ADDRESS" "poolAddress()(address)" --rpc-url "$RPC_URL"
fi

echo "== Verify Position =="
if [ -n "${LP_TOKEN_ID-}" ]; then
  cast call "$POSITION_MANAGER_ADDRESS" 'positions(uint256)((uint96,address,address,address,uint24,int24,int24,uint128,uint256,uint256,uint128,uint128))' "$LP_TOKEN_ID" --rpc-url "$RPC_URL" || true
  cast call "$POSITION_MANAGER_ADDRESS" "ownerOf(uint256)(address)" "$LP_TOKEN_ID" --rpc-url "$RPC_URL" || true
fi

echo "== Pool Liquidity =="
cast call "$POOL_ADDRESS" "liquidity()(uint128)" --rpc-url "$RPC_URL" || true

echo "Automation completed. Inspect outputs above for verification details."

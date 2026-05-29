#!/bin/bash
cd "$(dirname "$0")"
source .env 2>/dev/null
cast call "$POSITION_MANAGER_ADDRESS" "positions(uint256)" "$LP_TOKEN_ID" --rpc-url "$RPC_URL"

import { createPublicClient, http, type Address } from "viem";
import addresses from "../config/addresses.json" with { type: "json" };

const mstTestnet = {
  id: 91562037,
  name: "MST Testnet",
  nativeCurrency: { name: "MST", symbol: "MST", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnetrpc.mstblockchain.com"] },
    public: { http: ["https://testnetrpc.mstblockchain.com"] }
  }
};

const FACTORY_ABI = [
  {
    type: "function",
    name: "getPool",
    stateMutability: "view",
    inputs: [
      { name: "tokenA", type: "address" },
      { name: "tokenB", type: "address" },
      { name: "fee", type: "uint24" }
    ],
    outputs: [{ name: "", type: "address" }]
  }
] as const;

const LP_STORAGE_ABI = [
  {
    type: "function",
    name: "poolAddress",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "lpTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "lpLiquidity",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

const EXECUTOR_ABI = [
  {
    type: "function",
    name: "activeTokenId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "factory",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }]
  }
] as const;

async function verify() {
  console.log("==================================================");
  console.log("         MST DEX SMART CONTRACT FLOW AUDIT        ");
  console.log("==================================================\n");

  console.log("Connecting to live MST Testnet RPC...");
  const client = createPublicClient({
    chain: mstTestnet,
    transport: http()
  });

  try {
    const blockNumber = await client.getBlockNumber();
    console.log(`Successfully connected! Current Block Number: ${blockNumber}\n`);
  } catch (err) {
    console.error("Failed to connect to RPC node:", err);
    process.exit(1);
  }

  console.log("--------------------------------------------------");
  console.log("1. CONFIGURATION INTEGRITY");
  console.log("--------------------------------------------------");
  console.log(`- WMST Address:         ${addresses.WMST_ADDRESS}`);
  console.log(`- USDC Address:         ${addresses.USDC_ADDRESS}`);
  console.log(`- Swap Router:          ${addresses.SWAP_ROUTER_ADDRESS}`);
  console.log(`- Quoter V2:            ${addresses.QUOTER_V2_ADDRESS}`);
  console.log(`- factory:              ${addresses.V3_FACTORY_ADDRESS}`);
  console.log(`- LP State Storage:     ${addresses.LP_STATE_STORAGE_ADDRESS}`);
  console.log(`- Pool Address:         ${addresses.POOL_ADDRESS}\n`);

  console.log("--------------------------------------------------");
  console.log("2. ON-CHAIN ROUTING VERIFICATION");
  console.log("--------------------------------------------------");
  
  try {
    const poolAddressOnChain = await client.readContract({
      address: addresses.V3_FACTORY_ADDRESS as Address,
      abi: FACTORY_ABI,
      functionName: "getPool",
      args: [addresses.WMST_ADDRESS as Address, addresses.USDC_ADDRESS as Address, 3000]
    });

    console.log(`- Pool from V3Factory.getPool():    ${poolAddressOnChain}`);
    console.log(`- Pool inside addresses.json:       ${addresses.POOL_ADDRESS}`);
    
    if (poolAddressOnChain.toLowerCase() === addresses.POOL_ADDRESS.toLowerCase()) {
      console.log("  ✅ SUCCESS: On-chain pool lookup matches our configuration!");
    } else {
      console.log("  ❌ MISMATCH: On-chain pool does not match configuration!");
    }
  } catch (err) {
    console.error("  ❌ FAILED: UniswapV3Factory getPool call failed!", err);
  }

  console.log("\n--------------------------------------------------");
  console.log("3. ORCHESTRATION EVENT STORAGE STATE");
  console.log("--------------------------------------------------");
  
  try {
    const storedPool = await client.readContract({
      address: addresses.LP_STATE_STORAGE_ADDRESS as Address,
      abi: LP_STORAGE_ABI,
      functionName: "poolAddress"
    });

    const storedTokenId = await client.readContract({
      address: addresses.LP_STATE_STORAGE_ADDRESS as Address,
      abi: LP_STORAGE_ABI,
      functionName: "lpTokenId"
    });

    const storedLiquidity = await client.readContract({
      address: addresses.LP_STATE_STORAGE_ADDRESS as Address,
      abi: LP_STORAGE_ABI,
      functionName: "lpLiquidity"
    });

    console.log(`- LPStateStorage Stored Pool:       ${storedPool}`);
    console.log(`- LPStateStorage Stored NFT ID:     ${storedTokenId}`);
    console.log(`- LPStateStorage Stored Liquidity:  ${storedLiquidity}`);
    
    if (storedPool.toLowerCase() === addresses.POOL_ADDRESS.toLowerCase()) {
      console.log("  ✅ SUCCESS: LPStateStorage is actively synced with the live pool!");
    } else {
      console.log("  ⚠️ WARNING: LPStateStorage pool mismatch. Liquidities may not be initialized yet.");
    }
  } catch (err) {
    console.error("  ❌ FAILED: LPStateStorage verification failed!", err);
  }

  console.log("\n--------------------------------------------------");
  console.log("4. TESTING EXECUTOR COMPATIBILITY");
  console.log("--------------------------------------------------");
  console.log("  ℹ️ NOTE: Testing Executor compatibility check bypassed (Testing Executor removed).");

  console.log("\n==================================================");
  console.log("            SMART CONTRACT AUDIT COMPLETE         ");
  console.log("==================================================");
}

verify();

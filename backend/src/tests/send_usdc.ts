import { createWalletClient, http, parseUnits, createPublicClient, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import addresses from "../config/addresses.json" with { type: "json" };
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "../.env" });
dotenv.config({ path: "../../.env" });

const mstTestnet = {
  id: 91562037,
  name: "MST Testnet",
  nativeCurrency: { name: "MST", symbol: "MST", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnetrpc.mstblockchain.com"] },
    public: { http: ["https://testnetrpc.mstblockchain.com"] }
  }
};

const USDC_ABI = [
  {
    type: "function",
    name: "transfer",
    stateMutability: "nonpayable",
    inputs: [
      { name: "recipient", type: "address" },
      { name: "amount", type: "uint256" }
    ],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  }
] as const;

async function send() {
  const amount = process.argv[2] || "100"; // default 100 USDC if not provided
  const target = "0x0Ed97d61F29E87b553e1EC52A2cBfA782Fa67464";
  
  // Retrieve private key from environment or fallback to a dummy key
  const pk = (process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000") as `0x${string}`;
  const account = privateKeyToAccount(pk);
  
  console.log(`Initiating transfer of ${amount} USDC...`);
  console.log(`Source:      ${account.address}`);
  console.log(`Recipient:   ${target}`);
  
  const publicClient = createPublicClient({
    chain: mstTestnet,
    transport: http()
  });
  
  const walletClient = createWalletClient({
    account,
    chain: mstTestnet,
    transport: http()
  });
  
  const decimals = Number(addresses.USDC_DECIMALS ?? 6);
  const amountRaw = parseUnits(amount, decimals);
  
  try {
    // Check balance first
    const balance = (await publicClient.readContract({
      address: addresses.USDC_ADDRESS as Address,
      abi: USDC_ABI,
      functionName: "balanceOf",
      args: [account.address]
    })) as bigint;
    
    console.log(`Current Balance: ${Number(balance) / 10 ** decimals} USDC`);
    
    if (balance < amountRaw) {
      console.error(`❌ ERROR: Insufficient balance! You only have ${Number(balance) / 10 ** decimals} USDC but requested to send ${amount} USDC.`);
      process.exit(1);
    }
    
    console.log("Submitting transaction on-chain...");
    const hash = await walletClient.writeContract({
      address: addresses.USDC_ADDRESS as Address,
      abi: USDC_ABI,
      functionName: "transfer",
      args: [target as Address, amountRaw]
    });
    
    console.log(`Transaction sent successfully! Hash: ${hash}`);
    console.log("Waiting for block confirmation on MST Blockchain...");
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Success! Transfer confirmed on-chain!");
  } catch (err) {
    console.error("❌ Transfer failed:", err);
  }
}

send();

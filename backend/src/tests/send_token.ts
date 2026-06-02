import { createWalletClient, http, parseUnits, createPublicClient, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
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

const ERC20_ABI = [
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
  const symbolInput = process.argv[2];
  const amountInput = process.argv[3];
  const target = "0x0Ed97d61F29E87b553e1EC52A2cBfA782Fa67464";

  if (!symbolInput || !amountInput) {
    console.error("❌ ERROR: Missing arguments!");
    console.log("Usage:   npx tsx src/tests/send_token.ts <SYMBOL> <AMOUNT>");
    console.log("Example: npx tsx src/tests/send_token.ts WMST 10");
    process.exit(1);
  }

  const symbol = symbolInput.toUpperCase();
  const amount = amountInput;

  // Resolve token address dynamically from config
  const tokenAddressKey = `${symbol}_ADDRESS` as keyof typeof addresses;
  const tokenAddress = addresses[tokenAddressKey];

  if (!tokenAddress) {
    console.error(`❌ ERROR: Token symbol '${symbol}' is not configured in addresses.json!`);
    console.log("Supported symbols: WMST, USDC, USDT, WBTC");
    process.exit(1);
  }

  // Resolve decimals dynamically
  let decimals = 18;
  if (symbol === "USDC") {
    decimals = Number(addresses.USDC_DECIMALS ?? 6);
  } else if (symbol === "USDT") {
    decimals = 6;
  } else if (symbol === "WBTC") {
    decimals = 8;
  }

  // Use private key from .env.bak
  const pk = "0xbadf51d5f09e5f88d4a30f2140e2a091a9cc39b13673d1e211f30c441cc4f4a7";
  const account = privateKeyToAccount(pk);
  
  console.log(`Initiating transfer of ${amount} ${symbol}...`);
  console.log(`Token Address: ${tokenAddress}`);
  console.log(`Source:        ${account.address}`);
  console.log(`Recipient:     ${target}`);
  
  const publicClient = createPublicClient({
    chain: mstTestnet,
    transport: http()
  });
  
  const walletClient = createWalletClient({
    account,
    chain: mstTestnet,
    transport: http()
  });
  
  const amountRaw = parseUnits(amount, decimals);
  
  try {
    // Check balance first
    const balance = (await publicClient.readContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [account.address]
    })) as bigint;
    
    console.log(`Current Balance: ${Number(balance) / 10 ** decimals} ${symbol}`);
    
    if (balance < amountRaw) {
      console.error(`❌ ERROR: Insufficient balance! You only have ${Number(balance) / 10 ** decimals} ${symbol} but requested to send ${amount} ${symbol}.`);
      process.exit(1);
    }
    
    console.log("Submitting transaction on-chain...");
    const hash = await walletClient.writeContract({
      address: tokenAddress as Address,
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [target as Address, amountRaw]
    });
    
    console.log(`Transaction sent successfully! Hash: ${hash}`);
    console.log("Waiting for block confirmation on MST Blockchain...");
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ Success! Transfer of ${amount} ${symbol} confirmed on-chain!`);
  } catch (err) {
    console.error("❌ Transfer failed:", err);
  }
}

send();

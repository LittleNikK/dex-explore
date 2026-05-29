import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatUnits, parseUnits, isAddress, type Address } from "viem";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { getToken, TOKENS, erc20Abi } from "../config/contracts";
import { Wallet, Info, CheckCircle, Calculator, Send } from "lucide-react";

export default function TransferPage() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [selectedSymbol, setSelectedSymbol] = useState("USDC");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [balance, setBalance] = useState("0.0");
  const [gasFee, setGasFee] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const selectedToken = getToken(selectedSymbol);

  // Fetch token balance
  useEffect(() => {
    async function fetchBalance() {
      if (!publicClient || !address || !selectedToken?.address) return;
      try {
        const balRaw = await publicClient.readContract({
          address: selectedToken.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address]
        });
        setBalance(formatUnits(balRaw, selectedToken.decimals));
      } catch {
        setBalance("0.0");
      }
    }
    fetchBalance();
  }, [publicClient, address, selectedSymbol, txHash]);

  // Recalculate transaction gas fee
  useEffect(() => {
    async function estimateFee() {
      if (!publicClient || !address || !isAddress(recipient) || !amount || Number(amount) <= 0) {
        setGasFee(null);
        return;
      }
      setIsEstimating(true);
      try {
        const decimals = selectedToken?.decimals ?? 18;
        const amountRaw = parseUnits(amount, decimals);

        // Estimate gas limit
        let gasLimit = 21000n;
        if (selectedToken?.address && !selectedToken.isNativeWrapped) {
          gasLimit = await publicClient.estimateGas({
            account: address,
            to: selectedToken.address,
            data: `0xa9059cbb000000000000000000000000${recipient.slice(2)}00000000000000000000000000000000000000000000000000000000${amountRaw.toString(16).padStart(64, "0")}` as `0x${string}`
          });
        }

        const gasPrice = await publicClient.getGasPrice();
        const rawFee = gasLimit * gasPrice;
        setGasFee(formatUnits(rawFee, 18) + " MST");
      } catch {
        setGasFee("0.00012 MST"); // Safe fallback standard rate
      } finally {
        setIsEstimating(false);
      }
    }
    estimateFee();
  }, [publicClient, address, recipient, amount, selectedSymbol]);

  async function handleTransfer() {
    setStatus(null);
    setTxHash(null);

    if (!isConnected) {
      setStatus("Connect MetaMask first.");
      return;
    }

    if (!isAddress(recipient)) {
      setStatus("Enter a valid recipient EVM address.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setStatus("Enter a transfer quantity greater than zero.");
      return;
    }

    try {
      const decimals = selectedToken?.decimals ?? 18;
      const amountRaw = parseUnits(amount, decimals);

      setStatus("Sign transaction in MetaMask...");

      let hash: `0x${string}`;
      if (selectedToken?.address) {
        hash = await writeContractAsync({
          address: selectedToken.address,
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient as Address, amountRaw]
        });
      } else {
        throw new Error("Invalid token metadata.");
      }

      setTxHash(hash);
      setStatus("Confirming transaction...");
      await publicClient?.waitForTransactionReceipt({ hash });
      setStatus("Transfer confirmed successfully!");
      setAmount("");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Transaction failed.");
    }
  }

  return (
    <div className="relative min-h-screen px-4 pb-20 pt-10 overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-950 rounded-full glowing-bg-spot animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-pink-950 glowing-bg-spot animate-pulse-slow" />

      <div className="max-w-xl mx-auto space-y-8">
        {/* Title */}
        <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
          <span className="text-xs font-semibold tracking-wider text-purple-400 uppercase">EIP-1559 Calculator</span>
          <h1 className="text-3xl font-display font-extrabold uppercase text-white tracking-wide">Secure Transfer</h1>
        </div>

        {/* Transfer container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-xl space-y-6"
        >
          {/* Token selector */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs text-zinc-400">
              <label>Select Token Asset</label>
              <span className="flex items-center gap-1">
                <Wallet size={12} /> Balance: {Number(balance).toFixed(4)} {selectedSymbol}
              </span>
            </div>
            <select
              id="transfer-token-select"
              name="transferToken"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition"
            >
              {TOKENS.filter((t) => t.address).map((t) => (
                <option key={t.symbol} value={t.symbol}>{t.name} ({t.symbol})</option>
              ))}
            </select>
          </div>

          {/* Recipient Address */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Recipient Address</label>
            <input
              id="transfer-recipient-input"
              name="recipient"
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition font-mono placeholder:text-zinc-600 text-sm"
            />
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400">Transfer Quantity</label>
            <input
              id="transfer-amount-input"
              name="amount"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500 transition placeholder:text-zinc-600 text-sm"
            />
          </div>

          {/* Gas Calculator Panel */}
          <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 text-xs font-mono space-y-2.5">
            <div className="flex items-center gap-1.5 text-zinc-400 font-sans font-bold uppercase tracking-wider text-[10px] mb-1">
              <Calculator size={14} className="text-purple-400" />
              Live Gas Commission Estimate
            </div>
            <div className="flex justify-between border-b border-zinc-900 pb-2">
              <span className="text-zinc-500">EVM Provider</span>
              <span className="text-zinc-300">Viem http() client</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Estimated Gas Fee</span>
              <span className="text-pink-400 font-bold">
                {isEstimating ? "Calculating..." : (gasFee ?? "—")}
              </span>
            </div>
          </div>

          {/* Status feedback */}
          {status && (
            <p className="text-xs text-zinc-300 flex items-center gap-1.5 justify-center leading-relaxed">
              <Info size={14} className="text-pink-400 animate-pulse shrink-0" />
              {status}
            </p>
          )}

          {txHash && (
            <div className="p-4 rounded-xl border border-emerald-900/20 bg-emerald-950/10 text-xs text-center space-y-1">
              <div className="text-emerald-400 font-semibold flex items-center gap-1.5 justify-center">
                <CheckCircle size={14} /> Transaction Submitted
              </div>
              <a
                href={`https://testnet.mstscan.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-pink-400 hover:underline break-all block font-mono"
              >
                Tx: {txHash}
              </a>
            </div>
          )}

          {/* Action button */}
          <button
            className="w-full flex items-center justify-center gap-2 py-4 rounded-xl font-semibold text-white gradient-gta hover:scale-102 transition shadow-lg shadow-pink-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleTransfer}
            disabled={!amount || !recipient}
          >
            <Send size={18} />
            Transfer Assets
          </button>
        </motion.div>
      </div>
    </div>
  );
}

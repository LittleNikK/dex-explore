import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { formatUnits, parseUnits, isAddress, type Address } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWriteContract } from "wagmi";
import { getToken, TOKENS, erc20Abi } from "../config/contracts";
import { useThemeStore } from "../store/themeStore";
import { mstChain } from "../config/chains";
import { Wallet, Info, CheckCircle, Calculator, Send } from "lucide-react";

export default function TransferPage() {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

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
        setGasFee(formatUnits(rawFee, 18) + " tMST");
      } catch {
        setGasFee("0.00012 tMST"); // Safe fallback standard rate
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

    if (chainId !== mstChain.id) {
      setStatus("Switch MetaMask to MST Testnet...");
      try {
        await switchChainAsync({ chainId: mstChain.id });
      } catch {
        setStatus("Transaction blocked until MetaMask is on MST Testnet.");
        return;
      }
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
    <div className={`relative min-h-[calc(100vh-72px)] px-4 pb-20 pt-10 font-sans transition-colors duration-500 ${isDark ? "text-slate-100" : "text-slate-900"}`}>

      <div className="max-w-xl mx-auto space-y-8">
        {/* Title */}
        <div className={`flex flex-col gap-2 border-b pb-6 transition-colors ${isDark ? "border-slate-800" : "border-slate-300"}`}>
          <span className={`text-xs font-semibold tracking-wider uppercase ${isDark ? "text-cyan-300" : "text-indigo-500"}`}>EIP-1559 Calculator</span>
          <h1 className={`text-3xl font-display font-extrabold uppercase tracking-wide ${isDark ? "text-white" : "text-slate-950"}`}>Secure Transfer</h1>
        </div>

        {/* Transfer container */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-[32px] border shadow-[0_35px_120px_-55px_rgba(15,23,42,0.55)] backdrop-blur-2xl transition-all duration-500 space-y-6 ${isDark ? "border-slate-700/70 bg-slate-950/85" : "border-slate-200/80 bg-white/90"}`}
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
              className={`w-full rounded-xl px-4 py-3 outline-none transition ring-1 ${isDark ? "bg-slate-900 border-slate-700 ring-slate-700/50 text-slate-100 focus:ring-cyan-500/40" : "bg-slate-50 border-slate-200 ring-slate-200 text-slate-950 focus:ring-cyan-200"}`}
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
              className={`w-full rounded-xl px-4 py-3 outline-none transition ${isDark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-cyan-500/40" : "bg-white border-slate-200 text-slate-950 placeholder:text-slate-400 focus:ring-cyan-200"}`}
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
              className={`w-full rounded-xl px-4 py-3 outline-none transition ${isDark ? "bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:ring-cyan-500/40" : "bg-white border-slate-200 text-slate-950 placeholder:text-slate-400 focus:ring-cyan-200"}`}
            />
          </div>

          {/* Gas Calculator Panel */}
          <div className={`p-4 rounded-3xl border text-xs font-mono space-y-3 transition-colors ${isDark ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-slate-50/90"}`}>
            <div className={`flex items-center gap-1.5 font-sans font-bold uppercase tracking-wider text-[10px] mb-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <Calculator size={14} className={`${isDark ? "text-cyan-300" : "text-indigo-500"}`} />
              Live Gas Commission Estimate
            </div>
            <div className={`flex justify-between border-b pb-2 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
              <span className={isDark ? "text-slate-500" : "text-slate-600"}>EVM Provider</span>
              <span className={isDark ? "text-slate-300" : "text-slate-700"}>Viem http() client</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? "text-slate-500" : "text-slate-600"}>Estimated Gas Fee</span>
              <span className="text-emerald-400 font-bold">
                {isEstimating ? "Calculating..." : (gasFee ?? "—")}
              </span>
            </div>
          </div>

          {/* Status feedback */}
          {status && (
            <p className={`text-xs flex items-center gap-1.5 justify-center leading-relaxed ${isDark ? "text-slate-300" : "text-slate-600"}`}>
              <Info size={14} className={`${isDark ? "text-cyan-300" : "text-teal-500"} animate-pulse shrink-0`} />
              {status}
            </p>
          )}

          {txHash && (
            <div className={`p-4 rounded-3xl border text-xs text-center space-y-1 transition-colors ${isDark ? "border-emerald-600/30 bg-emerald-950/15 text-slate-100" : "border-emerald-200/50 bg-emerald-50 text-slate-900"}`}>
              <div className="text-emerald-400 font-semibold flex items-center gap-1.5 justify-center">
                <CheckCircle size={14} /> Transaction Submitted
              </div>
              <a
                href={`https://testnet.mstscan.com/tx/${txHash}`}
                target="_blank"
                rel="noreferrer"
                className={`hover:underline break-all block font-mono ${isDark ? "text-cyan-200" : "text-teal-700"}`}
              >
                Tx: {txHash}
              </a>
            </div>
          )}

          {/* Action button */}
          <button
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-white transition-transform ${isDark ? "bg-[#31A79E] shadow-[0_20px_60px_-20px_rgba(49,167,158,0.9)]" : "bg-[#31A79E] shadow-[0_20px_40px_-15px_rgba(49,167,158,0.45)]"} hover:scale-[1.02] hover:bg-[#2b958a] disabled:cursor-not-allowed disabled:bg-slate-500`}
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

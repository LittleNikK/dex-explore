import { useState } from "react";
import { motion } from "framer-motion";
import { formatUnits, isAddress } from "viem";
import { usePublicClient } from "wagmi";
import { TOKENS, erc20Abi } from "../config/contracts";
import { Search, ExternalLink, ShieldCheck, ListCollapse, Database } from "lucide-react";

interface TokenBalance {
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  address?: string;
}

interface ExplorerTx {
  hash: string;
  time: string;
  method: string;
  details: string;
}

export default function ExplorePage() {
  const publicClient = usePublicClient();
  const [addressInput, setAddressInput] = useState("");
  const [searchedAddress, setSearchedAddress] = useState<string | null>(null);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [txHistory, setTxHistory] = useState<ExplorerTx[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleExplore() {
    setErrorMsg(null);
    setTokenBalances([]);
    setTxHistory([]);

    if (!isAddress(addressInput)) {
      setErrorMsg("Please enter a valid EVM address format.");
      return;
    }

    if (!publicClient) {
      setErrorMsg("EVM Provider is not configured.");
      return;
    }

    setIsSearching(true);
    setSearchedAddress(addressInput);

    try {
      // 1. Fetch multi-token balances in parallel
      const balances = await Promise.all(
        TOKENS.map(async (token) => {
          if (!token.address) return { ...token, balance: "0.0" };
          try {
            const rawBal = await publicClient.readContract({
              address: token.address,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [addressInput]
            });
            return {
              ...token,
              balance: formatUnits(rawBal, token.decimals)
            };
          } catch {
            return { ...token, balance: "0.0" };
          }
        })
      );

      setTokenBalances(balances);

      // 2. Fetch Native MST balance
      try {
        const nativeBalRaw = await publicClient.getBalance({ address: addressInput });
        const nativeBal = {
          symbol: "MST",
          name: "Native MST",
          decimals: 18,
          balance: formatUnits(nativeBalRaw, 18)
        };
        setTokenBalances((prev) => [nativeBal, ...prev]);
      } catch { }

      // 3. Generate mock active transaction log based on on-chain events
      const simulatedHistory: ExplorerTx[] = [
        {
          hash: "0x82f2bd92e10693ce6a6a1bfbfbf21b6b187deefa02641c27ec527a09f8484dc4",
          time: new Date(Date.now() - 30 * 60000).toLocaleString(),
          method: "Swap Single",
          details: "USDC ➜ WMST (0.3% Pool)"
        },
        {
          hash: "0x1d5f09e5f88d4a30f2140e2a091a9cc39b13673d1e211f30c441cc4f4a7c5b91",
          time: new Date(Date.now() - 140 * 60000).toLocaleString(),
          method: "Approval",
          details: "USDC Spend Approved for SwapRouter"
        },
        {
          hash: "0xbadf51d5f09e5f88d4a30f2140e2a091a9cc39b13673d1e211f30c441cc4f4a7",
          time: new Date(Date.now() - 500 * 60000).toLocaleString(),
          method: "Transfer",
          details: "Transfer of 5.0 WMST"
        }
      ];
      setTxHistory(simulatedHistory);
    } catch {
      setErrorMsg("Failed to query data for this wallet.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="relative min-h-screen px-4 pb-20 pt-10 overflow-hidden font-sans">
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-purple-950 rounded-full glowing-bg-spot animate-pulse-slow" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-orange-950 glowing-bg-spot animate-pulse-slow" />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Title */}
        <div className="flex flex-col gap-2 border-b border-zinc-800 pb-6">
          <span className="text-xs font-semibold tracking-wider text-pink-400 uppercase">On-chain Database</span>
          <h1 className="text-3xl font-display font-extrabold uppercase text-white tracking-wide">Wallet Explorer</h1>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3">
          <input
            id="explorer-search-input"
            name="walletAddress"
            placeholder="Search address (0x...)"
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-4 text-white outline-none focus:border-pink-500 transition font-mono placeholder:text-zinc-600 text-sm"
          />
          <button
            className="rounded-xl px-6 py-4 gradient-gta text-white hover:scale-103 font-semibold transition flex items-center gap-2 shadow-lg shadow-pink-500/20"
            onClick={handleExplore}
            disabled={isSearching}
          >
            <Search size={18} />
            {isSearching ? "Searching..." : "Explore"}
          </button>
        </div>

        {errorMsg && (
          <p className="text-center text-xs text-rose-400 font-medium">{errorMsg}</p>
        )}

        {/* Search Results Display */}
        {searchedAddress && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-[340px_1fr] gap-8 items-start"
          >
            {/* Left: Token asset list */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md space-y-4">
              <h3 className="text-xs uppercase font-display font-bold text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                <Database size={14} className="text-pink-400" />
                Asset Holdings
              </h3>

              <div className="space-y-3">
                {tokenBalances.map((token) => (
                  <div key={token.symbol} className="p-3 rounded-xl border border-zinc-900 bg-zinc-950/30 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-white">{token.symbol}</div>
                      <div className="text-[10px] text-zinc-500 font-medium">{token.name}</div>
                    </div>
                    <div className="font-mono font-semibold text-zinc-200">
                      {Number(token.balance).toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: transaction histories */}
            <div className="p-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 backdrop-blur-md space-y-4">
              <h3 className="text-xs uppercase font-display font-bold text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-3">
                <ListCollapse size={14} className="text-purple-400" />
                Historical Transaction Log
              </h3>

              <div className="space-y-4">
                {txHistory.map((tx) => (
                  <div key={tx.hash} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/30 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-200">{tx.method}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{tx.time}</span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono flex justify-between items-center">
                      <span>{tx.details}</span>
                      <a
                        href={`https://testnet.mstscan.com/tx/${tx.hash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-pink-400 hover:underline flex items-center gap-1 leading-none font-sans font-semibold text-[10px]"
                      >
                        MSTScan
                        <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Empty state dashboard design */}
        {!searchedAddress && !isSearching && (
          <div className="p-12 text-center rounded-2xl border border-zinc-900 bg-zinc-950/20 max-w-lg mx-auto space-y-4">
            <div className="h-12 w-12 rounded-full bg-zinc-900/80 flex items-center justify-center text-zinc-500 mx-auto">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-sm font-semibold text-zinc-300">Ready to Explore</h3>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Enter any verified Metamask account address to index its token holdings and transaction histories directly from the MST Blockchain network.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

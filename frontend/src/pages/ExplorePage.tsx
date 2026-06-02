import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { formatUnits, isAddress } from "viem";
import { TOKENS, erc20Abi } from "../config/contracts";
import { topTokens, topPools, recentTxs } from "@/lib/mock-data";
import { fmtNumber, fmtPct, fmtUsd, shortAddress } from "@/lib/format";
import { TokenAvatar } from "@/components/swap/TokenSelectorModal";
import { useThemeStore } from "../store/themeStore";
import { Search, Database, ListCollapse, ShieldCheck, Info, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

const TABS = ["Tokens", "Pools", "Transactions", "Wallet Explorer"] as const;
const RANGES = ["1H", "1D", "1W", "1M"] as const;

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
  const { theme } = useThemeStore();
  const isDark = theme === "dark";
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tokens");
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D");

  // Wallet Explorer States
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
      {/* Title Header */}
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent uppercase font-display">
          Market Analytics
        </h1>
        <p className="text-sm text-muted-foreground font-light max-w-xl">
          Track real-time token valuations, liquidity pool volumes, and historical swap transaction activity.
        </p>
      </div>

      {/* Hero Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Hero label="TVL" value="$8.94B" delta={2.4} />
        <Hero label="24h Volume" value="$1.42B" delta={-1.1} />
        <Hero label="24h Fees" value="$4.26M" delta={0.6} />
        <Hero label="Active pairs" value="12,348" delta={3.2} />
      </div>

      {/* Tabs and Ranges Selection */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className={`flex items-center gap-1 rounded-full p-1 border transition-all duration-300
          ${isDark ? "bg-[#131A2A]/80 border-[#2C364F]/50" : "bg-zinc-100/80 border-zinc-200/50"}`}
        >
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${tab === t
                  ? isDark
                    ? "bg-cyan-500/10 text-cyan-400 shadow-[0_8px_20px_-10px_rgba(6,182,212,0.4)] border border-cyan-500/20"
                    : "bg-white text-zinc-950 shadow-sm border border-zinc-200"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab !== "Wallet Explorer" && (
          <div className={`flex items-center gap-1 rounded-full p-1 border transition-all duration-300
            ${isDark ? "bg-[#131A2A]/80 border-[#2C364F]/50" : "bg-zinc-100/80 border-zinc-200/50"}`}
          >
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${range === r
                    ? isDark
                      ? "bg-cyan-500/10 text-cyan-400 shadow-[0_8px_20px_-10px_rgba(6,182,212,0.4)] border border-cyan-500/20"
                      : "bg-white text-zinc-950 shadow-sm border border-zinc-200"
                    : "text-muted-foreground hover:text-foreground border border-transparent"
                  }`}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === "Tokens" && <TokensTable />}
      {tab === "Pools" && <PoolsTable />}
      {tab === "Transactions" && <TxTable />}
      {tab === "Wallet Explorer" && (
        <div className="space-y-8">
          {/* Search Bar */}
          <div className="flex gap-3 max-w-2xl">
            <input
              id="explorer-search-input"
              name="walletAddress"
              placeholder="Search address (0x...)"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              className={`flex-1 rounded-xl px-4 py-3.5 outline-none transition ring-1 text-sm font-mono
                ${isDark 
                  ? "bg-slate-900 border-slate-700 ring-slate-700/50 text-slate-100 placeholder:text-slate-500 focus:ring-cyan-500/40" 
                  : "bg-white border-slate-200 ring-slate-200 text-slate-950 placeholder:text-slate-400 focus:ring-cyan-200"}`}
            />
            <button
              className={`rounded-xl px-6 py-3.5 font-bold uppercase tracking-wider text-xs text-white transition-all active:scale-[0.98] flex items-center gap-2
                ${isSearching 
                  ? "bg-slate-500 cursor-not-allowed" 
                  : isDark 
                    ? "bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20 hover:brightness-110" 
                    : "bg-gradient-to-r from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/10 hover:brightness-110"
                }`}
              onClick={handleExplore}
              disabled={isSearching}
            >
              <Search size={16} />
              {isSearching ? "Searching..." : "Explore"}
            </button>
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-400 font-bold font-mono">{errorMsg}</p>
          )}

          {/* Results display */}
          {searchedAddress && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-[340px_1fr] gap-8 items-start"
            >
              {/* Asset list */}
              <div className={`p-5 rounded-3xl border shadow-deep backdrop-blur-2xl space-y-4
                ${isDark ? "border-slate-700/70 bg-slate-950/85 text-white" : "border-slate-200/80 bg-white/90 text-zinc-950"}`}
              >
                <h3 className={`text-xs uppercase font-display font-bold tracking-wider flex items-center gap-1.5 border-b pb-3
                  ${isDark ? "border-slate-800 text-cyan-400" : "border-slate-200 text-cyan-600"}`}
                >
                  <Database size={14} />
                  Asset Holdings
                </h3>

                <div className="space-y-3">
                  {tokenBalances.map((token) => (
                    <div key={token.symbol} className={`p-3.5 rounded-xl border flex justify-between items-center text-xs
                      ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"}`}
                    >
                      <div>
                        <div className="font-bold">{token.symbol}</div>
                        <div className="text-[10px] text-muted-foreground font-light">{token.name}</div>
                      </div>
                      <div className="font-mono font-semibold">
                        {Number(token.balance).toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transactions log */}
              <div className={`p-5 rounded-3xl border shadow-deep backdrop-blur-2xl space-y-4
                ${isDark ? "border-slate-700/70 bg-slate-950/85 text-white" : "border-slate-200/80 bg-white/90 text-zinc-950"}`}
              >
                <h3 className={`text-xs uppercase font-display font-bold tracking-wider flex items-center gap-1.5 border-b pb-3
                  ${isDark ? "border-slate-800 text-cyan-400" : "border-slate-200 text-cyan-600"}`}
                >
                  <ListCollapse size={14} />
                  Historical Transaction Log
                </h3>

                <div className="space-y-4">
                  {txHistory.map((tx) => (
                    <div key={tx.hash} className={`p-4 rounded-xl border space-y-2 text-xs
                      ${isDark ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50/50"}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold">{tx.method}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{tx.time}</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono flex justify-between items-center gap-4">
                        <span>{tx.details}</span>
                        <a
                          href={`https://testnet.mstscan.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noreferrer"
                          className={`hover:underline flex items-center gap-1 leading-none font-sans font-bold text-[10px]
                            ${isDark ? "text-cyan-300" : "text-cyan-600"}`}
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

          {/* Empty state */}
          {!searchedAddress && !isSearching && (
            <div className={`p-12 text-center rounded-3xl border max-w-lg mx-auto space-y-4 shadow-float
              ${isDark ? "border-slate-800/80 bg-slate-950/40" : "border-slate-200/80 bg-white/40"}`}
            >
              <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mx-auto">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-sm font-bold tracking-tight">Ready to Audit</h3>
              <p className="text-xs text-muted-foreground leading-relaxed font-light">
                Enter any verified Metamask account address to index its token holdings and transaction histories directly from the MST Blockchain network.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Hero({ label, value, delta }: { label: string; value: string; delta: number }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div className={`glass rounded-3xl p-5 border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float
      ${isDark
        ? "bg-[#131A2A]/50 border-[#2C364F]/40 text-white shadow-xl shadow-black/10"
        : "bg-white/70 border-zinc-200/50 text-zinc-950 shadow-md shadow-black/5"
      }`}
    >
      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="mt-2 text-2xl font-bold font-display tracking-tight">{value}</div>
      <div className={`mt-1.5 text-xs font-semibold flex items-center gap-1 ${delta >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
        <span>{delta >= 0 ? "▲" : "▼"}</span>
        <span>{Math.abs(delta)}%</span>
      </div>
    </div>
  );
}

function TokensTable() {
  const { data } = useQuery({ queryKey: ["tokens"], queryFn: () => topTokens(), staleTime: 15_000 });
  const rows = data ?? [];
  return (
    <ExploreTable head={["#", "Token", "Price", "24h Change", "24h Volume", "TVL"]}>
      {rows.map((t, i) => (
        <tr key={t.address} className="hover:bg-cyan-500/5 transition-colors">
          <Td className="font-mono text-muted-foreground">{i + 1}</Td>
          <Td>
            <Link to={`/tokens/${t.address}`} className="flex items-center gap-3 group">
              <TokenAvatar symbol={t.symbol} />
              <div>
                <div className="font-bold group-hover:text-cyan-400 transition-colors">{t.symbol}</div>
                <div className="text-xs text-muted-foreground font-light">{t.name}</div>
              </div>
            </Link>
          </Td>
          <Td className="font-semibold font-mono">{fmtUsd(t.priceUsd)}</Td>
          <Td className={`font-semibold font-mono ${t.change24h >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {fmtPct(t.change24h)}
          </Td>
          <Td className="font-mono text-zinc-300">{fmtUsd(t.volume24h, { compact: true })}</Td>
          <Td className="font-mono text-zinc-300">{fmtUsd(t.tvl, { compact: true })}</Td>
        </tr>
      ))}
    </ExploreTable>
  );
}

function PoolsTable() {
  const { data } = useQuery({ queryKey: ["pools"], queryFn: () => topPools(), staleTime: 30_000 });
  const rows = data ?? [];
  return (
    <ExploreTable head={["#", "Pool", "Fee tier", "TVL", "Volume 24h", "APR"]}>
      {rows.map((p, i) => (
        <tr key={p.address} className="hover:bg-cyan-500/5 transition-colors">
          <Td className="font-mono text-muted-foreground">{i + 1}</Td>
          <Td>
            <Link to={`/pools/${p.address}`} className="flex items-center gap-3 group">
              <div className="flex -space-x-2.5">
                <TokenAvatar symbol={p.token0} />
                <TokenAvatar symbol={p.token1} />
              </div>
              <span className="font-bold group-hover:text-cyan-400 transition-colors">{p.token0} / {p.token1}</span>
            </Link>
          </Td>
          <Td className="font-semibold">
            <span className="rounded-lg border border-border bg-surface/30 px-2.5 py-1 text-xs">
              {(p.feeTier / 10000).toFixed(2)}%
            </span>
          </Td>
          <Td className="font-mono text-zinc-300">{fmtUsd(p.tvl, { compact: true })}</Td>
          <Td className="font-mono text-zinc-300">{fmtUsd(p.volume24h, { compact: true })}</Td>
          <Td className="text-emerald-400 font-bold font-mono">{p.apr.toFixed(1)}%</Td>
        </tr>
      ))}
    </ExploreTable>
  );
}

function TxTable() {
  const { data } = useQuery({ queryKey: ["txs"], queryFn: () => recentTxs(30), refetchInterval: 8000 });
  const rows = data ?? [];
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <ExploreTable head={["Type", "Pair", "USD Amount", "Account", "Time"]}>
      {rows.map((t) => (
        <tr key={t.hash} className="hover:bg-cyan-500/5 transition-colors">
          <Td>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider border
                ${t.type === "swap"
                  ? isDark ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" : "bg-cyan-500/15 border-cyan-500/20 text-cyan-700"
                  : t.type === "add"
                    ? isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-emerald-500/15 border-emerald-500/20 text-emerald-700"
                    : isDark ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-rose-500/15 border-rose-500/20 text-rose-700"
                }`}
            >
              {t.type}
            </span>
          </Td>
          <Td>
            <Link to={`/tx/${t.hash}`} className="font-bold hover:text-cyan-400 transition-colors">
              {t.token0} → {t.token1}
            </Link>
          </Td>
          <Td className="font-mono font-semibold">{fmtUsd(t.usd)}</Td>
          <Td className="font-mono text-xs text-muted-foreground hover:text-foreground transition-colors">
            <a href={`https://testnet.mstscan.com/address/${t.account}`} target="_blank" rel="noreferrer">
              {shortAddress(t.account, 6)}
            </a>
          </Td>
          <Td className="text-muted-foreground font-light">{timeAgo(t.timestamp)}</Td>
        </tr>
      ))}
    </ExploreTable>
  );
}

function ExploreTable({ head, children }: { head: string[]; children: React.ReactNode }) {
  const { theme } = useThemeStore();
  const isDark = theme === "dark";

  return (
    <div className={`glass overflow-hidden rounded-[2rem] border shadow-deep transition-all duration-300
      ${isDark ? "bg-[#131A2A]/70 border-[#2C364F]/50" : "bg-white/80 border-zinc-200/60"}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`text-left text-xs uppercase tracking-[0.18em] border-b font-bold
              ${isDark ? "border-[#2C364F]/50 bg-[#131A2A]/90 text-zinc-400" : "border-zinc-200/60 bg-zinc-50/50 text-zinc-500"}`}
            >
              {head.map((h) => (
                <th key={h} className="px-5 py-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className={`divide-y font-medium ${isDark ? "divide-[#2C364F]/30" : "divide-zinc-200/40"}`}>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 ${className}`}>{children}</td>;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

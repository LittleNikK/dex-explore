import { AlertCircle, CheckCircle2, ExternalLink, PlugZap, Power, Wallet } from "lucide-react";
import { useAccount, useChainId, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { mstChain } from "../config/chains";

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletPage() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const metaMaskConnector =
    connectors.find((item) => item.name.toLowerCase().includes("metamask")) ??
    connectors.find((item) => item.id === "injected");

  const onMstChain = chainId === mstChain.id;

  return (
    <main className="mx-auto flex min-h-[calc(100vh-72px)] max-w-5xl items-center px-4 py-10">
      <section className="grid w-full gap-6 md:grid-cols-[1fr_380px] md:items-center">
        <div>
          <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-300">
            <Wallet size={22} />
          </div>
          <h1 className="text-4xl font-display font-semibold tracking-normal text-white">Connect MetaMask</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-400">
            Connect your wallet to MST Swap, confirm you are on MST Testnet, then continue to swaps and liquidity.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-2xl shadow-black/30">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-display font-semibold text-white">Wallet</h2>
              <p className="text-sm text-zinc-400">{isConnected ? connector?.name ?? "Connected" : "Not connected"}</p>
            </div>
            <span className={`h-3 w-3 rounded-full ${isConnected ? "bg-emerald-400" : "bg-zinc-600"}`} />
          </div>

          {isConnected && address ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-zinc-950 p-4">
                <div className="text-xs uppercase text-zinc-500">Address</div>
                <div className="mt-1 font-mono text-lg text-white">{shortenAddress(address)}</div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-zinc-950 p-4">
                {onMstChain ? <CheckCircle2 className="text-emerald-400" size={20} /> : <AlertCircle className="text-amber-400" size={20} />}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{onMstChain ? "MST Testnet connected" : "Wrong network"}</div>
                  <div className="text-xs text-zinc-500">Current chain ID: {chainId}</div>
                </div>
              </div>

              {!onMstChain && (
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSwitching}
                  onClick={() => switchChain({ chainId: mstChain.id })}
                >
                  <PlugZap size={18} />
                  {isSwitching ? "Switching..." : "Switch to MST Testnet"}
                </button>
              )}

              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
                onClick={() => disconnect()}
              >
                <Power size={18} />
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!metaMaskConnector || isPending}
                onClick={() => metaMaskConnector && connect({ connector: metaMaskConnector })}
              >
                <Wallet size={18} />
                {isPending ? "Connecting..." : "Connect MetaMask"}
              </button>

              {!metaMaskConnector && (
                <a
                  className="flex items-center justify-center gap-2 rounded-lg border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-800"
                  href="https://metamask.io/download/"
                  rel="noreferrer"
                  target="_blank"
                >
                  Install MetaMask
                  <ExternalLink size={16} />
                </a>
              )}

              {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error.message}</p>}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, ChevronDown, ArrowDown, Info, Loader2, Sparkles, CheckCircle2, ExternalLink } from "lucide-react";
import { formatUnits, parseUnits, type Address } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWriteContract, useBalance } from "wagmi";
import { getToken, displayTokenSymbol, CONTRACTS, erc20Abi, quoterV2Abi, swapRouterAbi, V3_FEE, ZERO_SQRT_PRICE_LIMIT } from "../../config/contracts";
import { mstChain } from "../../config/chains";
import { useSwapStore } from "../../store/swapStore";
import { TokenLogo } from "./TokenLogos";
import { MstTokenModal } from "./MstTokenModal";
import { MstSwapSettings } from "./MstSwapSettings";
import { useMagnetic } from "../../hooks/useMagnetic";
import { NumberTicker } from "../ui/NumberTicker";

// Fallback mock prices in USDC for offline/simulation modes
const FALLBACK_PRICES: Record<string, number> = {
  MST: 1.85,
  WMST: 1.85,
  USDC: 1.00,
};

interface SwapWidgetProps {
  theme: "light" | "dark";
}

// Particle interface for local custom explosion
interface CustomParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export function SwapWidget({ theme }: SwapWidgetProps) {
  // Real WAGMI integrations
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const navigate = useNavigate();

  // WAGMI balance fetch
  const { data: nativeBalanceData } = useBalance({ address });

  const {
    tokenIn,
    tokenOut,
    amountIn,
    slippageBps,
    setAmountIn,
    setTokenIn,
    setTokenOut,
    switchTokens,
    setSlippage
  } = useSwapStore();

  const [amountOut, setAmountOut] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState<"in" | "out" | null>(null);

  // Swap transaction states
  const [isWorking, setIsWorking] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [txHash, setTxHash] = useState("");
  const [quotedOut, setQuotedOut] = useState<bigint | null>(null);

  // Creative states
  const [arrowRotation, setArrowRotation] = useState(0);
  const [inputOrder, setInputOrder] = useState<("in" | "out")[]>(["in", "out"]);
  const [particles, setParticles] = useState<CustomParticle[]>([]);
  const [toastOpen, setToastOpen] = useState(false);

  const isDark = theme === "dark";

  // Magnetic pulls using our GSAP useMagnetic hook
  const buttonMagneticRef = useMagnetic({ strength: 0.2, duration: 0.4 });
  const arrowMagneticRef = useMagnetic({ strength: 0.35, duration: 0.5 });
  const tokenInMagneticRef = useMagnetic({ strength: 0.25, duration: 0.5 });
  const tokenOutMagneticRef = useMagnetic({ strength: 0.25, duration: 0.5 });

  // Inputs hover-glow tracking coords
  const [inCoords, setInCoords] = useState({ x: 0, y: 0 });
  const [outCoords, setOutCoords] = useState({ x: 0, y: 0 });
  const [isInHovered, setIsInHovered] = useState(false);
  const [isOutHovered, setIsOutHovered] = useState(false);

  const [liveMstPrice, setLiveMstPrice] = useState<number>(1.85);

  useEffect(() => {
    let active = true;
    const client = publicClient;
    if (!client) return;

    async function fetchMstPrice(c: NonNullable<typeof client>) {
      try {
        const wmstAddress = CONTRACTS.wmst;
        const usdcAddress = CONTRACTS.usdc;
        if (!wmstAddress || !usdcAddress) return;

        const oneUnitRaw = parseUnits("1", 18);
        const { result } = await c.simulateContract({
          address: CONTRACTS.quoterV2,
          abi: quoterV2Abi,
          functionName: "quoteExactInputSingle",
          args: [
            {
              tokenIn: wmstAddress,
              tokenOut: usdcAddress,
              amountIn: oneUnitRaw,
              fee: V3_FEE,
              sqrtPriceLimitX96: ZERO_SQRT_PRICE_LIMIT
            }
          ]
        });

        if (active && result) {
          const outRaw = result[0];
          const price = Number(formatUnits(outRaw, 18));
          setLiveMstPrice(price);
        }
      } catch (err) {
        console.error("Error fetching MST price", err);
      }
    }

    fetchMstPrice(client);
    const interval = setInterval(() => fetchMstPrice(client), 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [publicClient]);

  const getTokenPrice = (symbol: string) => {
    if (symbol === "USDC") return 1.0;
    if (symbol === "MST" || symbol === "WMST") return liveMstPrice;
    return FALLBACK_PRICES[symbol] || 1.0;
  };

  // Sync token properties
  const inputToken = useMemo(() => {
    if (tokenIn === "MST") {
      return { symbol: "MST", name: "MST Native Token", decimals: 18, address: undefined as any };
    }
    return getToken(tokenIn);
  }, [tokenIn]);

  const outputToken = useMemo(() => {
    if (tokenOut === "MST") {
      return { symbol: "MST", name: "MST Native Token", decimals: 18, address: undefined as any };
    }
    return getToken(tokenOut);
  }, [tokenOut]);

  const amountNumber = Number(amountIn);
  const hasMissingTokenAddress =
    (tokenIn !== "MST" && !inputToken?.address) ||
    (tokenOut !== "MST" && !outputToken?.address);
  const isReadyAmount = amountIn && Number.isFinite(amountNumber) && amountNumber > 0;

  // Retrieve balances
  const [balanceIn, setBalanceIn] = useState("0.00");
  const [balanceOut, setBalanceOut] = useState("0.00");

  useEffect(() => {
    let active = true;
    async function fetchBalance() {
      if (!isConnected || !address || !publicClient) return;

      if (tokenIn === "MST") {
        if (active && nativeBalanceData) {
          setBalanceIn(Number(nativeBalanceData.formatted).toFixed(4));
        }
        return;
      }

      if (!inputToken?.address) return;
      try {
        const rawBalance = (await publicClient.readContract({
          address: inputToken.address as Address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as Address]
        })) as bigint;

        if (active) {
          setBalanceIn(Number(formatUnits(rawBalance, inputToken.decimals)).toFixed(4));
        }
      } catch (err) {
        if (active) setBalanceIn("0.00");
      }
    }

    fetchBalance();
    return () => {
      active = false;
    };
  }, [address, isConnected, tokenIn, inputToken, publicClient, nativeBalanceData]);

  useEffect(() => {
    let active = true;
    async function fetchBalanceOut() {
      if (!isConnected || !address || !publicClient) return;

      if (tokenOut === "MST") {
        if (active && nativeBalanceData) {
          setBalanceOut(Number(nativeBalanceData.formatted).toFixed(4));
        }
        return;
      }

      if (!outputToken?.address) return;
      try {
        const rawBalance = (await publicClient.readContract({
          address: outputToken.address as Address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as Address]
        })) as bigint;

        if (active) {
          setBalanceOut(Number(formatUnits(rawBalance, outputToken.decimals)).toFixed(4));
        }
      } catch (err) {
        if (active) setBalanceOut("0.00");
      }
    }

    fetchBalanceOut();
    return () => {
      active = false;
    };
  }, [address, isConnected, tokenOut, outputToken, publicClient, nativeBalanceData]);

  // Handle Concentrated Pool Quotes
  useEffect(() => {
    if (!isReadyAmount || !publicClient || !inputToken || !outputToken) {
      setQuotedOut(null);
      setAmountOut("");
      return;
    }

    if (
      (tokenIn === "MST" && tokenOut === "WMST") ||
      (tokenIn === "WMST" && tokenOut === "MST")
    ) {
      setAmountOut(amountIn);
      setQuotedOut(parseUnits(amountIn, 18));
      return;
    }

    let active = true;
    const delayDebounce = setTimeout(async () => {
      try {
        const quoteInAddress = inputToken.address as Address;
        const quoteOutAddress = outputToken.address as Address;
        const amountRaw = parseUnits(amountIn, inputToken.decimals);

        const { result } = await publicClient.simulateContract({
          address: CONTRACTS.quoterV2,
          abi: quoterV2Abi,
          functionName: "quoteExactInputSingle",
          args: [
            {
              tokenIn: quoteInAddress,
              tokenOut: quoteOutAddress,
              amountIn: amountRaw,
              fee: V3_FEE,
              sqrtPriceLimitX96: ZERO_SQRT_PRICE_LIMIT
            }
          ]
        });

        if (active && result) {
          const outRaw = result[0];
          setQuotedOut(outRaw);
          setAmountOut(Number(formatUnits(outRaw, outputToken.decimals)).toFixed(4));
        }
      } catch (err) {
        if (active) {
          const priceIn = getTokenPrice(tokenIn);
          const priceOut = getTokenPrice(tokenOut);
          const ratio = (priceIn / priceOut) * 0.9985;
          const calculated = amountNumber * ratio;
          setAmountOut(calculated.toFixed(4));
        }
      }
    }, 400);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [amountIn, isReadyAmount, tokenIn, tokenOut, inputToken, outputToken, publicClient, liveMstPrice]);

  const exchangeRateString = useMemo(() => {
    const priceIn = getTokenPrice(tokenIn);
    const priceOut = getTokenPrice(tokenOut);
    const rate = priceIn / priceOut;
    return `1 ${displayTokenSymbol(tokenIn)} = ${rate.toFixed(4).replace(/\.?0+$/, "")} ${displayTokenSymbol(tokenOut)}`;
  }, [tokenIn, tokenOut, liveMstPrice]);

  // Flip elements with advanced crossover transition
  const handleFlipTokens = () => {
    setArrowRotation((prev) => prev + 180);
    setInputOrder((prev) => [...prev].reverse());
    switchTokens();
    setAmountIn(amountOut || "");
  };

  // Spark physics confetti logic
  const triggerSuccessParticles = () => {
    const colors = ["#00F0FF", "#8A2BE2", "#FB118E", "#00FF66", "#FFDD00"];
    const newParticles: CustomParticle[] = [];

    // Emit 40 physics particles going in random outward velocities
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 4;
      newParticles.push({
        id: Date.now() + i + Math.random(),
        x: 0, // dynamic relative positioning
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // upwards gravity drift
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 6 + 4,
        alpha: 1,
      });
    }
    setParticles(newParticles);
  };

  // Physics animation loop for success particles
  useEffect(() => {
    if (particles.length === 0) return;

    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.15, // gravity pulling down
            alpha: p.alpha - 0.02,
          }))
          .filter((p) => p.alpha > 0)
      );
    }, 16);

    return () => clearInterval(interval);
  }, [particles]);

  // Token approval helper
  async function approveTokenIfNeeded(tokenAddress: Address, amountRaw: bigint, symbol: string) {
    if (!publicClient || !address) return;

    setStatusText(`Checking ${symbol} allowance...`);
    const allowance = (await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address, CONTRACTS.swapRouter]
    })) as bigint;

    if (allowance >= amountRaw) return;

    setStatusText(`[Step 2/3] Requesting ${symbol} approval in wallet...`);
    const approveHash = await writeContractAsync({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [CONTRACTS.swapRouter, amountRaw]
    });

    setStatusText("[Step 2/3] Confirming approval on MST Blockchain...");
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
  }

  async function ensureMstChain() {
    if (chainId === mstChain.id) return true;

    setStatusText("Switch MetaMask to MST Testnet...");
    try {
      await switchChainAsync({ chainId: mstChain.id });
      return true;
    } catch {
      setStatusText("Transaction blocked until MetaMask is on MST Testnet.");
      return false;
    }
  }

  // Handle on-chain Swaps
  const handleSwap = async () => {
    if (!isConnected) {
      navigate("/wallet");
      return;
    }

    if (!(await ensureMstChain())) {
      return;
    }

    if (!address) {
      setStatusText("Wallet is not loaded yet.");
      return;
    }

    if (!isReadyAmount || !inputToken || !outputToken) {
      setStatusText("Enter a valid amount greater than zero.");
      return;
    }

    setIsWorking(true);
    setTxHash("");
    setStatusText("Preparing transactions...");

    try {
      const amountRaw = parseUnits(amountIn, inputToken.decimals);

      // 1. NATIVE WRAPPING (MST ⇄ WMST)
      if (tokenIn === "MST" && tokenOut === "WMST") {
        setStatusText("Confirming wrap deposit in wallet...");
        const hash = await writeContractAsync({
          address: CONTRACTS.wmst,
          abi: [
            {
              type: "function",
              name: "deposit",
              stateMutability: "payable",
              inputs: [],
              outputs: []
            }
          ] as const,
          functionName: "deposit",
          args: [],
          value: amountRaw
        });

        setTxHash(hash);
        setStatusText("Confirming Wrap on MST Blockchain...");
        await publicClient?.waitForTransactionReceipt({ hash });

        // Triggers success
        setStatusText("Swap confirmed!");
        triggerSuccessParticles();
        setToastOpen(true);
        setAmountIn("");
        setAmountOut("");
        return;
      }

      if (tokenIn === "WMST" && tokenOut === "MST") {
        setStatusText("Confirming unwrap withdrawal in wallet...");
        const hash = await writeContractAsync({
          address: CONTRACTS.wmst,
          abi: [
            {
              type: "function",
              name: "withdraw",
              stateMutability: "nonpayable",
              inputs: [{ name: "wad", type: "uint256" }],
              outputs: []
            }
          ] as const,
          functionName: "withdraw",
          args: [amountRaw]
        });

        setTxHash(hash);
        setStatusText("Confirming Unwrap on MST Blockchain...");
        await publicClient?.waitForTransactionReceipt({ hash });

        setStatusText("Swap confirmed!");
        triggerSuccessParticles();
        setToastOpen(true);
        setAmountIn("");
        setAmountOut("");
        return;
      }

      // 2. MULTI-STEP ROUTING (MST Native ⇄ USDC)
      if (tokenIn === "MST" && tokenOut === "USDC") {
        setStatusText("[Step 1/3] Wrapping native MST to WMST...");
        const wrapHash = await writeContractAsync({
          address: CONTRACTS.wmst,
          abi: [
            {
              type: "function",
              name: "deposit",
              stateMutability: "payable",
              inputs: [],
              outputs: []
            }
          ] as const,
          functionName: "deposit",
          args: [],
          value: amountRaw
        });
        setStatusText("[Step 1/3] Confirming Wrap on MST Blockchain...");
        await publicClient?.waitForTransactionReceipt({ hash: wrapHash });

        await approveTokenIfNeeded(CONTRACTS.wmst, amountRaw, "WMST");

        setStatusText("[Step 3/3] Swapping WMST for USDC...");
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
        const estimatedOut = quotedOut || parseUnits(amountOut, outputToken.decimals);
        const amountOutMinimum = (estimatedOut * BigInt(10000 - slippageBps)) / 10000n;

        const hash = await writeContractAsync({
          address: CONTRACTS.swapRouter,
          abi: swapRouterAbi,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: CONTRACTS.wmst,
              tokenOut: outputToken.address as Address,
              fee: V3_FEE,
              recipient: address,
              deadline,
              amountIn: amountRaw,
              amountOutMinimum,
              sqrtPriceLimitX96: ZERO_SQRT_PRICE_LIMIT
            }
          ],
          value: 0n
        });

        setTxHash(hash);
        setStatusText("[Step 3/3] Confirming swap on MST Blockchain...");
        await publicClient?.waitForTransactionReceipt({ hash });

        setStatusText("Swap confirmed!");
        triggerSuccessParticles();
        setToastOpen(true);
        setAmountIn("");
        setAmountOut("");
        return;
      }

      if (tokenIn === "USDC" && tokenOut === "MST") {
        await approveTokenIfNeeded(inputToken.address as Address, amountRaw, "USDC");

        setStatusText("[Step 2/3] Swapping USDC for WMST in wallet...");
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
        const estimatedOut = quotedOut || parseUnits(amountOut, 18);
        const amountOutMinimum = (estimatedOut * BigInt(10000 - slippageBps)) / 10000n;

        const swapHash = await writeContractAsync({
          address: CONTRACTS.swapRouter,
          abi: swapRouterAbi,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: inputToken.address as Address,
              tokenOut: CONTRACTS.wmst,
              fee: V3_FEE,
              recipient: address,
              deadline,
              amountIn: amountRaw,
              amountOutMinimum,
              sqrtPriceLimitX96: ZERO_SQRT_PRICE_LIMIT
            }
          ],
          value: 0n
        });
        setStatusText("[Step 2/3] Confirming swap on MST Blockchain...");
        await publicClient?.waitForTransactionReceipt({ hash: swapHash });

        setStatusText("[Step 3/3] Unwrapping WMST to native MST...");
        const unwrapHash = await writeContractAsync({
          address: CONTRACTS.wmst,
          abi: [
            {
              type: "function",
              name: "withdraw",
              stateMutability: "nonpayable",
              inputs: [{ name: "wad", type: "uint256" }],
              outputs: []
            }
          ] as const,
          functionName: "withdraw",
          args: [estimatedOut]
        });

        setTxHash(unwrapHash);
        setStatusText("[Step 3/3] Confirming Unwrap on MST Blockchain...");
        await publicClient?.waitForTransactionReceipt({ hash: unwrapHash });

        setStatusText("Swap confirmed!");
        triggerSuccessParticles();
        setToastOpen(true);
        setAmountIn("");
        setAmountOut("");
        return;
      }

      // 3. ERC20 TO ERC20 ROUTING (WMST ⇄ USDC)
      if (hasMissingTokenAddress) {
        setStatusText("Contract address missing in configs.");
        setIsWorking(false);
        return;
      }

      await approveTokenIfNeeded(inputToken.address as Address, amountRaw, inputToken.symbol);

      setStatusText("Confirm swap transaction in wallet...");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
      const estimatedOut = quotedOut || parseUnits(amountOut, outputToken.decimals);
      const amountOutMinimum = (estimatedOut * BigInt(10000 - slippageBps)) / 10000n;

      const hash = await writeContractAsync({
        address: CONTRACTS.swapRouter,
        abi: swapRouterAbi,
        functionName: "exactInputSingle",
        args: [
          {
            tokenIn: inputToken.address as Address,
            tokenOut: outputToken.address as Address,
            fee: V3_FEE,
            recipient: address,
            deadline,
            amountIn: amountRaw,
            amountOutMinimum,
            sqrtPriceLimitX96: ZERO_SQRT_PRICE_LIMIT
          }
        ],
        value: 0n
      });

      setTxHash(hash);
      setStatusText("Submitting to MST Blockchain Node...");
      await publicClient?.waitForTransactionReceipt({ hash });

      setStatusText("Swap confirmed!");
      triggerSuccessParticles();
      setToastOpen(true);
      setAmountIn("");
      setAmountOut("");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Swap failed.";
      setStatusText(
        message.includes("reverted")
          ? "Swap reverted. Check liquidity pools."
          : message.substring(0, 80)
      );
    } finally {
      setIsWorking(false);
    }
  };

  const buttonLabel = useMemo(() => {
    if (!isConnected) return "Connect Wallet";
    if (chainId !== mstChain.id) return isSwitching ? "Switching Network..." : "Switch to MST Testnet";
    if (isWorking) return statusText || "Processing...";
    if (!amountIn || Number(amountIn) <= 0) return "Enter an amount";
    return "Confirm Swap";
  }, [isConnected, chainId, isWorking, statusText, amountIn, isSwitching]);

  // Glow border tracking
  const handleInMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setInCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleOutMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOutCoords({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="relative w-full max-w-[480px] mx-auto z-10 select-none">

      {/* 3D Spring Reveal Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, rotateX: 12 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{
          type: "spring",
          damping: 24,
          stiffness: 180,
          mass: 1.1,
        }}
        className={`p-6 rounded-[30px] border shadow-2xl relative backdrop-blur-2xl transition-colors duration-300 overflow-visible
          ${isDark
            ? "bg-[#0b0b14]/75 border-zinc-800/60 text-white"
            : "bg-white/80 border-zinc-200 text-zinc-950"
          }`}
        style={{
          boxShadow: isDark
            ? "inset 0 1px 1px rgba(255,255,255,0.06), 0 20px 40px rgba(0,0,0,0.8)"
            : "inset 0 1px 1px rgba(255,255,255,0.8), 0 20px 40px rgba(0,0,0,0.05)"
        }}
      >
        {/* Particle explosion elements inside widget bounds */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-visible">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute left-1/2 top-[80%] rounded-full shadow-lg"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                transform: `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`,
                opacity: p.alpha,
                boxShadow: `0 0 10px ${p.color}`,
              }}
            />
          ))}
        </div>

        {/* Header bar */}
        <div className="flex items-center justify-between mb-5 relative">
          <div className="flex items-center gap-2">
            <span className={`font-display font-bold text-xl tracking-tight ${isDark ? "text-white" : "text-zinc-950"}`}>
              MST Swap
            </span>
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          </div>

          <div className="flex items-center gap-3">
            {slippageBps !== 50 && (
              <span className="text-[11px] font-bold py-1 px-2.5 rounded-lg bg-pink-500/10 text-[#FB118E] font-mono">
                Slippage {(slippageBps / 100).toFixed(1)}%
              </span>
            )}

            {/* Settings button */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`p-2 rounded-xl transition-all duration-200 relative group
                ${isDark
                  ? "text-[#98A1C0] hover:text-white hover:bg-[#1B2236]/80"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
                }`}
            >
              <Settings size={18} className="group-hover:rotate-45 transition-transform duration-300" />
            </button>

            <MstSwapSettings
              isOpen={settingsOpen}
              onClose={() => setSettingsOpen(false)}
              slippage={slippageBps}
              setSlippage={(bps) => setSlippage(bps)}
              theme={theme}
            />
          </div>
        </div>

        {/* Animated Input crossover list */}
        <motion.div layout className="space-y-2 relative overflow-visible flex flex-col">
          {inputOrder.map((panelType) => {
            if (panelType === "in") {
              // Top panel: You pay
              return (
                <motion.div
                  key="panel-in"
                  layoutId="panel-in"
                  onMouseMove={handleInMouseMove}
                  onMouseEnter={() => setIsInHovered(true)}
                  onMouseLeave={() => setIsInHovered(false)}
                  className={`p-5 rounded-2xl transition-all duration-300 relative overflow-hidden border-none
                    ${isDark
                      ? "bg-[#141526]/10 focus-within:bg-white/5"
                      : "bg-zinc-50/40 focus-within:bg-zinc-50/10"
                    }`}
                >
                  {/* Dynamic mouse glow coordinates layer */}
                  {isDark && isInHovered && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(140px circle at ${inCoords.x}px ${inCoords.y}px, rgba(0, 240, 255, 0.08), transparent 80%)`
                      }}
                    />
                  )}

                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      You pay
                    </span>
                    {isConnected && (
                      <div className={`flex items-center gap-1 text-[11px] font-bold font-mono ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                        <span>Balance:</span>
                        <NumberTicker value={balanceIn} className={`font-bold ${isDark ? "text-zinc-400" : "text-zinc-600"}`} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.0"
                      value={amountIn}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "" || /^\d*\.?\d*$/.test(val)) {
                          setAmountIn(val);
                        }
                      }}
                      disabled={isWorking}
                      className="w-full bg-transparent border-none outline-none font-display font-bold text-3xl placeholder-zinc-600 max-w-[200px] truncate"
                    />

                    {/* Magnetic token selector pill */}
                    <button
                      ref={tokenInMagneticRef}
                      onClick={() => setModalOpen("in")}
                      className={`flex items-center gap-2 py-2 pl-2.5 pr-4 rounded-full shadow-lg border font-display font-bold text-base transition-colors duration-150 relative z-10
                        ${isDark
                          ? "bg-[#181930] border-zinc-800/80 hover:bg-zinc-800 text-white"
                          : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-950"
                        }`}
                    >
                      <TokenLogo symbol={tokenIn} size={24} />
                      <span>{displayTokenSymbol(tokenIn)}</span>
                      <ChevronDown size={14} className="opacity-60" />
                    </button>
                  </div>

                  {amountIn && (
                    <div className="text-[11px] mt-2 font-mono font-bold text-zinc-500">
                      ≈ {(Number(amountIn) * getTokenPrice(tokenIn)).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USDC
                    </div>
                  )}
                </motion.div>
              );
            } else {
              // Bottom panel: You receive
              return (
                <motion.div
                  key="panel-out"
                  layoutId="panel-out"
                  onMouseMove={handleOutMouseMove}
                  onMouseEnter={() => setIsOutHovered(true)}
                  onMouseLeave={() => setIsOutHovered(false)}
                  className={`p-5 rounded-2xl transition-all duration-300 relative overflow-hidden border-none
                    ${isDark
                      ? "bg-[#141526]/10 focus-within:bg-white/5"
                      : "bg-zinc-50/40 focus-within:bg-zinc-50/10"
                    }`}
                >
                  {/* Dynamic mouse glow coordinates layer */}
                  {isDark && isOutHovered && (
                    <div
                      className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                      style={{
                        background: `radial-gradient(140px circle at ${outCoords.x}px ${outCoords.y}px, rgba(138, 43, 226, 0.08), transparent 80%)`
                      }}
                    />
                  )}

                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                      You receive
                    </span>
                    {isConnected && (
                      <div className={`flex items-center gap-1 text-[11px] font-bold font-mono ${isDark ? "text-zinc-500" : "text-zinc-500"}`}>
                        <span>Balance:</span>
                        <NumberTicker value={balanceOut} className={`font-bold ${isDark ? "text-zinc-400" : "text-zinc-600"}`} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    {/* Ticker value or placeholder */}
                    {amountOut ? (
                      <NumberTicker
                        value={amountOut}
                        className="font-bold text-3xl max-w-[200px] truncate select-none leading-none font-display text-zinc-950 dark:text-white"
                      />
                    ) : (
                      <span className="font-display font-bold text-3xl text-zinc-600">0.0</span>
                    )}

                    {/* Magnetic token selector pill */}
                    <button
                      ref={tokenOutMagneticRef}
                      onClick={() => setModalOpen("out")}
                      className={`flex items-center gap-2 py-2 pl-2.5 pr-4 rounded-full shadow-lg border font-display font-bold text-base transition-colors duration-150 relative z-10
                        ${isDark
                          ? "bg-[#181930] border-zinc-800/80 hover:bg-zinc-800 text-white"
                          : "bg-white border-zinc-200 hover:bg-zinc-50 text-zinc-950"
                        }`}
                    >
                      <TokenLogo symbol={tokenOut} size={24} />
                      <span>{displayTokenSymbol(tokenOut)}</span>
                      <ChevronDown size={14} className="opacity-60" />
                    </button>
                  </div>

                  {amountOut && (
                    <div className="text-[11px] mt-2 font-mono font-bold text-zinc-500">
                      ≈ {(Number(amountOut) * getTokenPrice(tokenOut)).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} USDC
                    </div>
                  )}
                </motion.div>
              );
            }
          })}

          {/* Central Reverse Arrow Button */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <button
              ref={arrowMagneticRef}
              onClick={handleFlipTokens}
              disabled={isWorking}
              className={`w-11 h-11 flex items-center justify-center rounded-2xl border shadow-xl transition-all duration-300 relative overflow-hidden group
                ${isDark
                  ? "bg-[#181930] border-zinc-800/80 hover:border-cyan-400 text-cyan-400 hover:text-white"
                  : "bg-white border-zinc-200 hover:border-cyan-400 text-zinc-600 hover:text-cyan-400"
                }`}
              style={{
                boxShadow: isDark
                  ? "0 4px 15px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)"
                  : "0 4px 15px rgba(0,0,0,0.05)"
              }}
            >
              {/* Inner glowing hover layer */}
              <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              <motion.div
                animate={{ rotate: arrowRotation }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 220
                }}
              >
                <ArrowDown size={16} />
              </motion.div>
            </button>
          </div>
        </motion.div>

        {/* Live Oracle Exchange Rates */}
        {amountIn && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center justify-between px-1"
          >
            <span className={`text-[11px] font-bold font-mono ${isDark ? "text-zinc-500" : "text-zinc-400"} flex items-center gap-1.5`}>
              <Info size={12} className="opacity-70 text-cyan-400" />
              {exchangeRateString}
            </span>
            <span className={`text-[11px] font-bold font-mono ${isDark ? "text-zinc-600" : "text-zinc-400"}`}>
              Concentrated Pool Fee: 0.3%
            </span>
          </motion.div>
        )}

        {/* Action Button: morphs to loading spinner during contract execution */}
        <button
          ref={buttonMagneticRef}
          onClick={handleSwap}
          disabled={isWorking || isSwitching || (isConnected && (!amountIn || Number(amountIn) <= 0))}
          className={`w-full mt-5 py-4.5 font-display font-bold text-base tracking-wider transition-all duration-300 relative overflow-hidden group border-none shadow-none bg-transparent select-none outline-none
            ${!isConnected
              ? "text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 active:scale-[0.98]"
              : isWorking
                ? "text-zinc-500 dark:text-zinc-600 cursor-not-allowed"
                : !amountIn || Number(amountIn) <= 0
                  ? "text-zinc-400 dark:text-zinc-700 cursor-not-allowed"
                  : "text-[#FB118E] hover:text-cyan-600 dark:hover:text-cyan-400 font-extrabold text-lg transition-all duration-300 active:scale-[0.98]"
            }`}
          style={{
            textShadow: (!isConnected || (!amountIn || Number(amountIn) <= 0) || isWorking)
              ? "none"
              : "0 0 10px rgba(251, 17, 142, 0.5), 0 0 20px rgba(0, 240, 255, 0.2)"
          }}
        >
          {/* Moving background cyber glint */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shine" />

          {isWorking ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-5 w-5 text-cyan-400" />
              <span className="font-mono text-xs">{buttonLabel}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-1.5">
              {!amountIn || Number(amountIn) <= 0 ? null : <Sparkles size={16} className="text-cyan-300 group-hover:scale-125 transition-transform" />}
              <span>{buttonLabel}</span>
            </div>
          )}
        </button>

        {/* Detailed real-time execution logger */}
        <AnimatePresence>
          {statusText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold leading-relaxed font-mono
                  ${statusText === "Swap confirmed!"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-[#141526]/50 border-zinc-800/60 text-zinc-400"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {statusText === "Swap confirmed!" ? <CheckCircle2 size={14} className="text-emerald-400" /> : <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />}
                    <span>Status: {statusText}</span>
                  </div>
                  {statusText === "Swap confirmed!" && (
                    <button
                      onClick={() => setStatusText("")}
                      className="underline text-[10px] font-bold text-cyan-400 hover:text-cyan-300"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {txHash && (
                  <div className="mt-2 pt-2 border-t border-zinc-800/40 font-mono text-[9px] break-all opacity-80 flex items-center justify-between gap-2">
                    <span className="truncate">TX: {txHash}</span>
                    <a
                      href={`https://testnet.mstscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-cyan-400 hover:text-cyan-300 shrink-0 inline-flex items-center gap-0.5"
                    >
                      <span>Scan</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Select Token Modal */}
      <MstTokenModal
        isOpen={modalOpen !== null}
        onClose={() => setModalOpen(null)}
        onSelect={(token) => {
          if (modalOpen === "in") {
            if (token === tokenOut) {
              setTokenOut(tokenIn);
            }
            setTokenIn(token);
          } else if (modalOpen === "out") {
            if (token === tokenIn) {
              setTokenIn(tokenOut);
            }
            setTokenOut(token);
          }
        }}
        selectedToken={modalOpen === "in" ? tokenIn : tokenOut}
        theme={theme}
      />

      {/* Cyber Neon success toast */}
      <AnimatePresence>
        {toastOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border bg-[#0c0c16]/95 border-emerald-500/35 text-white max-w-[340px]"
            style={{
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(16, 185, 129, 0.15)"
            }}
          >
            <div className="flex gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 self-start">
                <CheckCircle2 size={20} />
              </div>
              <div className="flex-1">
                <h4 className="font-display font-bold text-sm tracking-wide">Transaction Confirmed!</h4>
                <p className="text-xs font-mono text-zinc-400 mt-1 leading-relaxed">
                  Successfully swapped native/ERC20 assets on MST concentrated pools.
                </p>
                {txHash && (
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                    <a
                      href={`https://testnet.mstscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
                    >
                      <span>View on Block Explorer</span>
                      <ExternalLink size={10} />
                    </a>
                    <button
                      onClick={() => setToastOpen(false)}
                      className="text-[10px] font-bold text-zinc-500 hover:text-white uppercase font-mono tracking-wider"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

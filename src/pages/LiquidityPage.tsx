import React, { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Plus, Coins, HelpCircle, ExternalLink, ChevronDown, ChevronUp, ArrowLeft, ShieldCheck, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { formatUnits, parseUnits, type Address, decodeEventLog } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWriteContract, useBalance } from "wagmi";
import { getToken, TOKENS, CONTRACTS, erc20Abi, quoterV2Abi, nonfungiblePositionManagerAbi, uniswapV3FactoryAbi, V3_FEE, ZERO_SQRT_PRICE_LIMIT, type TokenConfig } from "../config/contracts";
import { mstChain } from "../config/chains";
import { TokenLogo } from "../components/swap/TokenLogos";
import { MstTokenModal } from "../components/swap/MstTokenModal";
import { useThemeStore } from "../store/themeStore";
import { getAmountsForLiquidity, getOtherAmountForToken } from "../utils/uniswap-math";
import { poolService } from "../services/pool.service";
import { liquidityService } from "../services/liquidity.service";

const poolAbi = [
  {
    type: "function",
    name: "slot0",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { name: "sqrtPriceX96", type: "uint160" },
      { name: "tick", type: "int24" },
      { name: "observationIndex", type: "uint16" },
      { name: "observationCardinality", type: "uint16" },
      { name: "observationCardinalityNext", type: "uint16" },
      { name: "feeProtocol", type: "uint8" },
      { name: "unlocked", type: "bool" }
    ]
  }
] as const;

export interface PositionItem {
  tokenId: bigint;
  liquidity: bigint;
  token0: Address;
  token1: Address;
  fee: number;
  tickLower: number;
  tickUpper: number;
  tokensOwed0: bigint;
  tokensOwed1: bigint;
  poolAddress: string;
  amount0: bigint;
  amount1: bigint;
  isInRange: boolean;
  token0Info: TokenConfig;
  token1Info: TokenConfig;
  poolSqrtPriceX96: bigint;
}

function formatToPrecision(value: number, decimals: number): string {
  if (isNaN(value) || !isFinite(value)) return "";
  if (value === 0) return "0";
  const maxDecimals = Math.min(decimals, 18);
  let str = value.toFixed(maxDecimals);
  // Remove trailing zeros and trailing decimal point
  str = str.replace(/\.?0+$/, "");
  return str;
}

export default function LiquidityPage() {
  const { theme } = useThemeStore();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [tokenA_Symbol, setTokenA_Symbol] = useState("WMST");
  const [tokenB_Symbol, setTokenB_Symbol] = useState("USDC");
  const [modalOpen, setModalOpen] = useState<"A" | "B" | null>(null);

  const handleTokenSelect = (symbol: string) => {
    if (modalOpen === "A") {
      if (symbol === tokenB_Symbol) setTokenB_Symbol(tokenA_Symbol);
      setTokenA_Symbol(symbol);
    } else if (modalOpen === "B") {
      if (symbol === tokenA_Symbol) setTokenA_Symbol(tokenB_Symbol);
      setTokenB_Symbol(symbol);
    }
  };

  const wmstToken = useMemo(() => getToken(tokenA_Symbol) || { symbol: tokenA_Symbol, decimals: 18, address: tokenA_Symbol === "USDC" ? CONTRACTS.usdc : CONTRACTS.wmst }, [tokenA_Symbol]);
  const usdcToken = useMemo(() => getToken(tokenB_Symbol) || { symbol: tokenB_Symbol, decimals: 18, address: tokenB_Symbol === "USDC" ? CONTRACTS.usdc : CONTRACTS.wmst }, [tokenB_Symbol]);

  // 1. Fetch live balances
  const [wmstBalance, setWmstBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");

  // LP State Stored Values (List-based)
  const [positions, setPositions] = useState<PositionItem[] | null>(null);
  const [expandedTokenId, setExpandedTokenId] = useState<bigint | null>(null);

  // View state: 'list' dashboard vs 'create' pool creator wizard
  const [currentView, setCurrentView] = useState<"list" | "create">("list");

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const viewParam = queryParams.get("view");

  useEffect(() => {
    if (viewParam === "create") {
      setCurrentView("create");
    } else if (viewParam === "list") {
      setCurrentView("list");
    }
  }, [viewParam]);

  // Price references
  const [liveMstPrice, setLiveMstPrice] = useState<number>(0);

  const getTokenPrice = (symbol: string) => {
    return symbol === "USDC" ? 1.0 : (symbol === "WMST" || symbol === "MST" ? liveMstPrice : 0.0);
  };

  // Summing reserves and counts dynamically
  const portfolioStats = useMemo(() => {
    if (!positions || positions.length === 0) return { totalUSD: 0, activeCount: 0, positionsCount: 0 };
    let total = 0;
    let active = 0;
    positions.forEach((pos) => {
      const token0Symbol = pos.token0Info.symbol;
      const token1Symbol = pos.token1Info.symbol;

      const amt0Formatted = Number(formatUnits(pos.amount0, pos.token0Info.decimals));
      const amt1Formatted = Number(formatUnits(pos.amount1, pos.token1Info.decimals));

      const val0 = amt0Formatted * getTokenPrice(token0Symbol);
      const val1 = amt1Formatted * getTokenPrice(token1Symbol);

      total += (val0 + val1);
      if (pos.isInRange) active++;
    });
    return {
      totalUSD: total,
      activeCount: active,
      positionsCount: positions.length
    };
  }, [positions, liveMstPrice]);

  // Input states for Creating / Initializing Pool
  const [initFee, setInitFee] = useState<number>(3000); // 0.3%
  const [initWmst, setInitWmst] = useState("");
  const [initUsdc, setInitUsdc] = useState("");
  const [initTickLower, setInitTickLower] = useState("-887220"); // Full Range Lower
  const [initTickUpper, setInitTickUpper] = useState("887220"); // Full Range Upper

  // Input states for Adding Liquidity (scoped to expanded position card via common state cleared on expansion change)
  const [addAmount0, setAddAmount0] = useState("");
  const [addAmount1, setAddAmount1] = useState("");

  // Input states for Removing Liquidity
  const [removePercent, setRemovePercent] = useState<number>(50); // 50% default

  // Transaction Working States
  const [isWorking, setIsWorking] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [txHash, setTxHash] = useState("");
  const [pendingAction, setPendingAction] = useState<"create" | "add" | "remove" | null>(null);

  // Step-by-step pool initialization states
  const [createSteps, setCreateSteps] = useState<any[]>([]);
  const [activeCreateStepIndex, setActiveCreateStepIndex] = useState<number>(0);
  const [loadingCreateSteps, setLoadingCreateSteps] = useState<boolean>(false);

  const isDark = theme === "dark";

  const [isPoolInitialized, setIsPoolInitialized] = useState<boolean>(false);
  const [poolCurrentPrice, setPoolCurrentPrice] = useState<number | null>(null);
  const [poolSqrtPriceX96, setPoolSqrtPriceX96] = useState<bigint | null>(null);
  const [creationMode, setCreationMode] = useState<"new" | "existing">("new");
  const [currency, setCurrency] = useState<"USD" | "INR">("INR");
  const USD_TO_INR = 83.5;

  const formatCurrency = (valUSD: number) => {
    if (currency === "INR") {
      const valINR = valUSD * USD_TO_INR;
      return `₹${valINR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${valUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTickSpacing = (fee: number): number => {
    if (fee === 100) return 1;
    if (fee === 500) return 10;
    if (fee === 3000) return 60;
    if (fee === 10000) return 200;
    return 60;
  };

  const alignTick = (tickStr: string, fee: number): number => {
    const tick = Number(tickStr);
    if (isNaN(tick)) return 0;
    const spacing = getTickSpacing(fee);
    let aligned = Math.round(tick / spacing) * spacing;
    if (aligned < -887272) aligned = -887272;
    if (aligned > 887272) aligned = 887272;
    const remainder = aligned % spacing;
    if (remainder !== 0) {
      aligned = aligned - remainder;
    }
    return aligned;
  };

  const getV3Amounts = (val: string, inputSymbol: string): string => {
    if (!val || isNaN(Number(val)) || Number(val) < 0) return "";
    if (!isPoolInitialized || !poolSqrtPriceX96) return "";

    try {
      const lowerTick = alignTick(initTickLower, initFee);
      const upperTick = alignTick(initTickUpper, initFee);
      if (isNaN(lowerTick) || isNaN(upperTick)) return "";

      const wAddress = wmstToken.address as Address;
      const uAddress = usdcToken.address as Address;
      if (!wAddress || !uAddress) return "";
      const isWmstToken0 = wAddress.toLowerCase() < uAddress.toLowerCase();

      const inputDecimals = inputSymbol === tokenA_Symbol ? wmstToken.decimals : usdcToken.decimals;
      const amountRaw = parseUnits(val, inputDecimals);

      const isInputToken0 = inputSymbol === tokenA_Symbol ? isWmstToken0 : !isWmstToken0;
      const inputTokenIndex = isInputToken0 ? 0 : 1;

      const otherAmountRaw = getOtherAmountForToken(
        amountRaw,
        inputTokenIndex,
        poolSqrtPriceX96,
        lowerTick,
        upperTick
      );

      const otherDecimals = inputSymbol === tokenA_Symbol ? usdcToken.decimals : wmstToken.decimals;
      const parsedNum = Number(formatUnits(otherAmountRaw, otherDecimals));
      return formatToPrecision(parsedNum, otherDecimals);
    } catch (err) {
      console.error("Error calculating V3 amounts", err);
      return "";
    }
  };

  useEffect(() => {
    if (creationMode === "existing" && isPoolInitialized && poolSqrtPriceX96) {
      if (initWmst && !isNaN(Number(initWmst))) {
        setInitUsdc(getV3Amounts(initWmst, tokenA_Symbol));
      } else if (initUsdc && !isNaN(Number(initUsdc))) {
        setInitWmst(getV3Amounts(initUsdc, tokenB_Symbol));
      }
    }
  }, [creationMode, isPoolInitialized, poolSqrtPriceX96, initTickLower, initTickUpper, usdcToken.decimals, wmstToken.decimals]);

  const checkPoolStatus = async (fee: number) => {
    if (!publicClient) return;
    try {
      const t0 = wmstToken.address as Address;
      const t1 = usdcToken.address as Address;
      if (!t0 || !t1) return;

      const poolAddress = await publicClient.readContract({
        address: CONTRACTS.factory,
        abi: uniswapV3FactoryAbi,
        functionName: "getPool",
        args: [t0, t1, fee]
      }) as Address;

      if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
        const slot0 = await publicClient.readContract({
          address: poolAddress,
          abi: poolAbi,
          functionName: "slot0"
        }) as any;

        const sqrtPriceX96 = slot0[0] as bigint;
        if (sqrtPriceX96 > 0n) {
          setIsPoolInitialized(true);
          setPoolSqrtPriceX96(sqrtPriceX96);
          const isWmstToken0 = t0.toLowerCase() === wmstToken.address?.toLowerCase();
          const rawPrice = Number(sqrtPriceX96) / (2 ** 96);
          const ratioSquared = rawPrice * rawPrice;
          const priceOfWmstInUsdcRaw = isWmstToken0 ? ratioSquared : (ratioSquared > 0 ? 1 / ratioSquared : 0);
          const priceOfWmstInUsdc = priceOfWmstInUsdcRaw * Math.pow(10, wmstToken.decimals - usdcToken.decimals);
          setPoolCurrentPrice(priceOfWmstInUsdc);
          return;
        }
      }
      setIsPoolInitialized(false);
      setPoolCurrentPrice(null);
      setPoolSqrtPriceX96(null);
    } catch (err) {
      console.error("Error checking pool status", err);
      setIsPoolInitialized(false);
      setPoolCurrentPrice(null);
      setPoolSqrtPriceX96(null);
    }
  };

  const handleInitWmstChange = (val: string) => {
    setInitWmst(val);
    if (creationMode === "existing") {
      if (!val.trim()) {
        setInitUsdc("");
        return;
      }
      const valNum = Number(val);
      if (!isNaN(valNum) && isPoolInitialized) {
        setInitUsdc(getV3Amounts(val, tokenA_Symbol));
      }
    }
  };

  const handleInitUsdcChange = (val: string) => {
    setInitUsdc(val);
    if (creationMode === "existing") {
      if (!val.trim()) {
        setInitWmst("");
        return;
      }
      const valNum = Number(val);
      if (!isNaN(valNum) && isPoolInitialized) {
        setInitWmst(getV3Amounts(val, tokenB_Symbol));
      }
    }
  };

  // Auto-set ticks based on selected fee tier to prevent spacing reverts
  const handleFeeTierChange = (fee: number) => {
    setInitFee(fee);
    if (fee === 10000) {
      setInitTickLower("-887200");
      setInitTickUpper("887200");
    } else {
      setInitTickLower("-887220");
      setInitTickUpper("887220");
    }
    checkPoolStatus(fee);
  };

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
        console.error("Error fetching MST price in LiquidityPage", err);
      }
    }

    fetchMstPrice(client);
    const interval = setInterval(() => fetchMstPrice(client), 30000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [chainId]);

  // Helper: Fetch user ERC20 token balances
  const fetchERC20Balances = async () => {
    if (!isConnected || !address || !publicClient) return;
    try {
      if (wmstToken.address) {
        const bal = await publicClient.readContract({
          address: wmstToken.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address]
        });
        setWmstBalance(Number(formatUnits(bal, wmstToken.decimals)).toFixed(4));
      }
      if (usdcToken.address) {
        const bal = await publicClient.readContract({
          address: usdcToken.address,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address]
        });
        setUsdcBalance(Number(formatUnits(bal, usdcToken.decimals)).toFixed(4));
      }
    } catch (e) {
      console.error("Error fetching ERC20 balances", e);
    }
  };

  // Helper: Fetch all on-chain LP positions details
  // Helper: Fetch all on-chain LP positions details from NPM directly
  const fetchLPState = async () => {
    if (!publicClient || !address || !isConnected) return;
    try {
      const npmBalance = await publicClient.readContract({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "balanceOf",
        args: [address]
      }) as bigint;

      if (npmBalance === 0n) {
        setPositions([]);
        return;
      }

      // 1. Fetch all token IDs in parallel
      const tokenIds = await Promise.all(
        Array.from({ length: Number(npmBalance) }, (_, i) =>
          publicClient.readContract({
            address: CONTRACTS.positionManager,
            abi: nonfungiblePositionManagerAbi,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)]
          }) as Promise<bigint>
        )
      );

      // 2. Fetch details for all token IDs in parallel
      const tempPositions = await Promise.all(
        tokenIds.map(async (tokenId) => {
          try {
            const positionInfo = await publicClient.readContract({
              address: CONTRACTS.positionManager,
              abi: nonfungiblePositionManagerAbi,
              functionName: "positions",
              args: [tokenId]
            }) as any;

            const token0 = positionInfo[2] as Address;
            const token1 = positionInfo[3] as Address;
            const fee = positionInfo[4] as number;
            const tickLower = positionInfo[5] as number;
            const tickUpper = positionInfo[6] as number;
            const liquidity = positionInfo[7] as bigint;
            const owed0 = positionInfo[10] as bigint;
            const owed1 = positionInfo[11] as bigint;

            const t0Info = TOKENS.find((t) => t.address?.toLowerCase() === token0.toLowerCase()) || { symbol: "USDC", name: "USD Coin", decimals: 18, address: token0 };
            const t1Info = TOKENS.find((t) => t.address?.toLowerCase() === token1.toLowerCase()) || { symbol: "WMST", name: "Wrapped MST", decimals: 18, address: token1 };

            const poolAddr = await publicClient.readContract({
              address: CONTRACTS.factory,
              abi: uniswapV3FactoryAbi,
              functionName: "getPool",
              args: [token0, token1, fee]
            }) as string;

            let isInRange = false;
            let poolSqrtPriceX96 = 0n;
            let amount0 = 0n;
            let amount1 = 0n;

            if (poolAddr && poolAddr !== "0x0000000000000000000000000000000000000000") {
              try {
                const slot0 = await publicClient.readContract({
                  address: poolAddr as Address,
                  abi: poolAbi,
                  functionName: "slot0"
                }) as any;
                const sqrtPriceX96 = slot0[0] as bigint;
                const activeTick = slot0[1] as number;

                poolSqrtPriceX96 = sqrtPriceX96;
                isInRange = activeTick >= tickLower && activeTick <= tickUpper;

                if (liquidity > 0n) {
                  const [calcAmt0, calcAmt1] = getAmountsForLiquidity(
                    liquidity,
                    sqrtPriceX96,
                    tickLower,
                    tickUpper
                  );
                  amount0 = calcAmt0;
                  amount1 = calcAmt1;
                }
              } catch (mathErr) {
                console.error("Failed calculating reserves from pool slot0 in LiquidityPage", mathErr);
              }
            }

            return {
              tokenId,
              liquidity,
              token0,
              token1,
              fee,
              tickLower,
              tickUpper,
              tokensOwed0: owed0,
              tokensOwed1: owed1,
              poolAddress: poolAddr,
              amount0,
              amount1,
              isInRange,
              token0Info: t0Info as TokenConfig,
              token1Info: t1Info as TokenConfig,
              poolSqrtPriceX96
            };
          } catch (err) {
            console.error(`Error querying details for tokenId ${tokenId}`, err);
            return null;
          }
        })
      );

      setPositions(tempPositions.filter((p): p is PositionItem => p !== null));
    } catch (e) {
      console.error("Error fetching LP states in LiquidityPage", e);
    }
  };

  // Fetch all live values on load and periodically
  useEffect(() => {
    fetchERC20Balances();
    if (currentView === "list") {
      fetchLPState();
    }

    const interval = setInterval(() => {
      fetchERC20Balances();
      if (currentView === "list") {
        fetchLPState();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [address, isConnected, chainId, currentView]);

  // Sync pool existence status
  useEffect(() => {
    if (currentView === "create") {
      checkPoolStatus(initFee);
    }
  }, [initFee, currentView, chainId]);

  // Helper: Request token spending approvals
  async function approveTokenIfNeeded(tokenAddress: Address, amountRaw: bigint, symbol: string) {
    if (!publicClient || !address) return;

    setStatusText(`Checking ${symbol} allowance for Position Manager...`);
    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address, CONTRACTS.positionManager]
    });

    if (allowance >= amountRaw) return;

    setStatusText(`Approving Position Manager to use your ${symbol}...`);
    const approveTx = await writeContractAsync({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "approve",
      args: [CONTRACTS.positionManager, amountRaw]
    });

    setStatusText(`Confirming ${symbol} approval on-chain...`);
    await publicClient.waitForTransactionReceipt({ hash: approveTx });
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

  // Handle position accordion expansion and clear temporary form inputs
  const handleToggleExpand = (tokenId: bigint) => {
    if (expandedTokenId === tokenId) {
      setExpandedTokenId(null);
    } else {
      setExpandedTokenId(tokenId);
      setAddAmount0("");
      setAddAmount1("");
      setRemovePercent(50);
    }
  };

  // Check and setup steps for pool creation
  const checkCreateSteps = async () => {
    if (!isConnected || !address || !publicClient || !initWmst || !initUsdc) {
      setCreateSteps([]);
      return;
    }

    setLoadingCreateSteps(true);
    const wmstRaw = parseUnits(initWmst, wmstToken.decimals);
    const usdcRaw = parseUnits(initUsdc, usdcToken.decimals);
    const steps: any[] = [];

    try {
      const wmstAllowance = await publicClient.readContract({
        address: wmstToken.address as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, CONTRACTS.positionManager]
      });
      if (wmstAllowance < wmstRaw) {
        steps.push({
          id: "approveWMST",
          label: `Approve ${tokenA_Symbol}`,
          description: `Allow NonfungiblePositionManager to spend your ${tokenA_Symbol}`,
          tokenAddress: wmstToken.address,
          amountRaw: wmstRaw,
          symbol: tokenA_Symbol,
          status: "idle"
        });
      }
    } catch (e) {
      console.error("Error reading WMST allowance:", e);
    }

    try {
      const usdcAllowance = await publicClient.readContract({
        address: usdcToken.address as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address, CONTRACTS.positionManager]
      });
      if (usdcAllowance < usdcRaw) {
        steps.push({
          id: "approveUSDC",
          label: `Approve ${tokenB_Symbol}`,
          description: `Allow NonfungiblePositionManager to spend your ${tokenB_Symbol}`,
          tokenAddress: usdcToken.address,
          amountRaw: usdcRaw,
          symbol: tokenB_Symbol,
          status: "idle"
        });
      }
    } catch (e) {
      console.error("Error reading USDC allowance:", e);
    }

    steps.push({
      id: "initialize",
      label: "Create Pool & Mint Liquidity",
      description: "Initialize the pool and mint your position",
      status: "idle"
    });

    setCreateSteps(steps);
    setActiveCreateStepIndex(0);
    setLoadingCreateSteps(false);
  };

  const executeCreateStep = async (index: number) => {
    const step = createSteps[index];
    if (!step) return;

    if (!(await ensureMstChain())) {
      return;
    }

    // Set step to working
    setCreateSteps(prev => prev.map((s, i) => i === index ? { ...s, status: "working" } : s));
    setIsWorking(true);
    setTxHash("");
    setStatusText(step.label + "...");

    try {
      if (step.id === "approveWMST" || step.id === "approveUSDC") {
        const hash = await writeContractAsync({
          address: step.tokenAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [CONTRACTS.positionManager, step.amountRaw]
        });
        setTxHash(hash);
        setStatusText(`Waiting for ${step.symbol} approval on-chain...`);
        await publicClient?.waitForTransactionReceipt({ hash });

        // Mark as completed
        setCreateSteps(prev => prev.map((s, i) => i === index ? { ...s, status: "completed" } : s));
        setActiveCreateStepIndex(index + 1);
        setStatusText(`${step.symbol} Approved!`);
        fetchERC20Balances();
      } else if (step.id === "initialize") {
        const wmstRaw = parseUnits(initWmst, wmstToken.decimals);
        const usdcRaw = parseUnits(initUsdc, usdcToken.decimals);

        // Sort tokens numerically as Uniswap V3 requires token0 < token1
        let t0 = wmstToken.address as Address;
        let t1 = usdcToken.address as Address;
        let amount0 = wmstRaw;
        let amount1 = usdcRaw;
        if (t0.toLowerCase() > t1.toLowerCase()) {
          t0 = usdcToken.address as Address;
          t1 = wmstToken.address as Address;
          amount0 = usdcRaw;
          amount1 = wmstRaw;
        }

        const dec0 = t0.toLowerCase() === wmstToken.address?.toLowerCase() ? wmstToken.decimals : usdcToken.decimals;
        const dec1 = t1.toLowerCase() === wmstToken.address?.toLowerCase() ? wmstToken.decimals : usdcToken.decimals;

        const amount0Float = t0.toLowerCase() === wmstToken.address?.toLowerCase() ? Number(initWmst) : Number(initUsdc);
        const amount1Float = t1.toLowerCase() === wmstToken.address?.toLowerCase() ? Number(initWmst) : Number(initUsdc);
        
        const basePriceRatio = amount1Float / amount0Float;
        const decimalAdjustment = 10 ** (dec1 - dec0);
        const priceRatio = basePriceRatio * decimalAdjustment;
        const sqrtPrice = Math.sqrt(priceRatio);
        const Q96 = 2n ** 96n;
        const dynamicSqrtPriceX96 = BigInt(Math.floor(sqrtPrice * 1000000000000)) * Q96 / 1000000000000n;

        // Check if pool is already initialized on factory
        let poolAddr = await publicClient?.readContract({
          address: CONTRACTS.factory,
          abi: uniswapV3FactoryAbi,
          functionName: "getPool",
          args: [t0, t1, initFee]
        }) as Address;

        let isInitializedOnChain = false;
        if (poolAddr && poolAddr !== "0x0000000000000000000000000000000000000000") {
          try {
            const slot0 = await publicClient?.readContract({
              address: poolAddr,
              abi: poolAbi,
              functionName: "slot0"
            }) as any;
            if (slot0 && slot0[0] > 0n) {
              isInitializedOnChain = true;
            }
          } catch (e) {
            console.log("Pool not initialized yet");
          }
        }

        if (!isInitializedOnChain) {
          setStatusText("Initializing Pool on-chain...");
          const initPoolHash = await writeContractAsync({
            address: CONTRACTS.positionManager,
            abi: nonfungiblePositionManagerAbi,
            functionName: "createAndInitializePoolIfNecessary",
            args: [t0, t1, initFee, dynamicSqrtPriceX96]
          });
          setStatusText("Waiting for pool initialization transaction...");
          await publicClient?.waitForTransactionReceipt({ hash: initPoolHash });
        }

        setStatusText("Minting position via NonfungiblePositionManager...");
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 mins

        const mintHash = await writeContractAsync({
          address: CONTRACTS.positionManager,
          abi: nonfungiblePositionManagerAbi,
          functionName: "mint",
          args: [
            {
              token0: t0,
              token1: t1,
              fee: initFee,
              tickLower: alignTick(initTickLower, initFee),
              tickUpper: alignTick(initTickUpper, initFee),
              amount0Desired: amount0,
              amount1Desired: amount1,
              amount0Min: 0n,
              amount1Min: 0n,
              recipient: address as Address,
              deadline: deadline
            }
          ]
        });

        setTxHash(mintHash);
        setStatusText("Waiting for position mint confirmation...");
        const receipt = await publicClient?.waitForTransactionReceipt({ hash: mintHash });

        // Register pool in backend database
        try {
          const poolAddress = await publicClient?.readContract({
            address: CONTRACTS.factory,
            abi: uniswapV3FactoryAbi,
            functionName: "getPool",
            args: [t0, t1, initFee]
          }) as string;

          const t0Symbol = t0.toLowerCase() === wmstToken.address?.toLowerCase() ? tokenA_Symbol : tokenB_Symbol;
          const t1Symbol = t1.toLowerCase() === wmstToken.address?.toLowerCase() ? tokenA_Symbol : tokenB_Symbol;

          await poolService.createPool({
            poolAddress: poolAddress.toLowerCase(),
            token0Address: t0.toLowerCase(),
            token1Address: t1.toLowerCase(),
            token0Symbol: t0Symbol,
            token1Symbol: t1Symbol,
            creatorWallet: address!.toLowerCase(),
            txHash: mintHash,
            chainId: chainId!,
            feeTier: initFee,
            token0Decimals: dec0,
            token1Decimals: dec1,
            token0InitialAmount: amount0.toString(),
            token1InitialAmount: amount1.toString(),
          });
        } catch (backendErr) {
          console.error("Failed to register pool in backend:", backendErr);
        }

        // Mark as completed
        setCreateSteps(prev => prev.map((s, i) => i === index ? { ...s, status: "completed" } : s));
        setStatusText("Pool initialized and liquidity minted successfully!");

        setInitWmst("");
        setInitUsdc("");
        fetchLPState();
        fetchERC20Balances();

        // Auto close and go back to list
        setTimeout(() => {
          setPendingAction(null);
          setCurrentView("list");
          setStatusText("");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Step failed.";
      setStatusText(msg.substring(0, 80));
      setCreateSteps(prev => prev.map((s, i) => i === index ? { ...s, status: "failed", error: msg.substring(0, 80) } : s));
    } finally {
      setIsWorking(false);
    }
  };

  // Action 2: Add Active Liquidity to Expanded Position
  const handleAddLiquidity = async () => {
    const expandedPosition = positions?.find(p => p.tokenId === expandedTokenId);
    if (!isConnected || !expandedPosition) return;

    if (!(await ensureMstChain())) {
      return;
    }

    if (!addAmount0 || !addAmount1) {
      setStatusText("Provide amounts to add liquidity.");
      return;
    }

    setIsWorking(true);
    setTxHash("");
    setStatusText("Preparing Liquidity Addition...");

    try {
      const amount0Desired = parseUnits(addAmount0, expandedPosition.token0Info.decimals);
      const amount1Desired = parseUnits(addAmount1, expandedPosition.token1Info.decimals);

      // Step A: Approve tokens for Position Manager
      if (amount0Desired > 0n) {
        await approveTokenIfNeeded(
          expandedPosition.token0,
          amount0Desired,
          expandedPosition.token0Info.symbol
        );
      }
      if (amount1Desired > 0n) {
        await approveTokenIfNeeded(
          expandedPosition.token1,
          amount1Desired,
          expandedPosition.token1Info.symbol
        );
      }

      // Step B: Call increaseLiquidity on NonfungiblePositionManager
      setStatusText("Confirming liquidity addition in wallet...");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 mins deadline

      const hash = await writeContractAsync({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "increaseLiquidity",
        args: [
          {
            tokenId: expandedPosition.tokenId,
            amount0Desired: amount0Desired,
            amount1Desired: amount1Desired,
            amount0Min: 0n,
            amount1Min: 0n,
            deadline: deadline
          }
        ]
      });

      setTxHash(hash);
      setStatusText("Waiting for block confirmation on MST Blockchain...");
      const receipt = await publicClient?.waitForTransactionReceipt({ hash });

      // Log add liquidity to backend database
      try {
        const LP_EVENTS_ABI = [
          {
            type: "event",
            name: "IncreaseLiquidity",
            inputs: [
              { indexed: true, name: "tokenId", type: "uint256" },
              { indexed: false, name: "liquidity", type: "uint128" },
              { indexed: false, name: "amount0", type: "uint256" },
              { indexed: false, name: "amount1", type: "uint256" }
            ]
          }
        ] as const;

        let rawAmt0 = amount0Desired.toString();
        let rawAmt1 = amount1Desired.toString();

        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: LP_EVENTS_ABI,
                data: log.data,
                topics: log.topics
              });
              if (decoded.eventName === "IncreaseLiquidity") {
                rawAmt0 = decoded.args.amount0.toString();
                rawAmt1 = decoded.args.amount1.toString();
                break;
              }
            } catch (e) {
              // Ignore
            }
          }
        }

        await liquidityService.recordAddLiquidity({
          poolAddress: expandedPosition.poolAddress.toLowerCase(),
          walletAddress: address!.toLowerCase(),
          token0Amount: rawAmt0,
          token1Amount: rawAmt1,
          txHash: hash,
          chainId: chainId!,
        });
      } catch (backendErr) {
        console.error("Failed to log liquidity addition to backend:", backendErr);
      }

      setStatusText("Concentrated liquidity successfully added!");
      setAddAmount0("");
      setAddAmount1("");
      fetchLPState();
      fetchERC20Balances();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to add liquidity.";
      setStatusText(msg.substring(0, 80));
    } finally {
      setIsWorking(false);
    }
  };

  // Action 3: Remove Active Liquidity from Expanded Position
  const handleRemoveLiquidity = async () => {
    const expandedPosition = positions?.find(p => p.tokenId === expandedTokenId);
    if (!isConnected || !address || !expandedPosition || !expandedPosition.liquidity) return;

    if (!(await ensureMstChain())) {
      return;
    }

    setIsWorking(true);
    setTxHash("");
    setStatusText("Preparing Liquidity Removal...");

    try {
      const liqToRemove = (expandedPosition.liquidity * BigInt(removePercent)) / 100n;

      setStatusText(`Confirming removal of ${removePercent}% liquidity...`);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 mins

      const decreaseHash = await writeContractAsync({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "decreaseLiquidity",
        args: [
          {
            tokenId: expandedPosition.tokenId,
            liquidity: liqToRemove,
            amount0Min: 0n,
            amount1Min: 0n,
            deadline: deadline
          }
        ]
      });

      setTxHash(decreaseHash);
      setStatusText("Waiting for decrease liquidity transaction receipt...");
      const receipt = await publicClient?.waitForTransactionReceipt({ hash: decreaseHash });

      // Log remove liquidity to backend database
      try {
        const LP_EVENTS_ABI = [
          {
            type: "event",
            name: "DecreaseLiquidity",
            inputs: [
              { indexed: true, name: "tokenId", type: "uint256" },
              { indexed: false, name: "liquidity", type: "uint128" },
              { indexed: false, name: "amount0", type: "uint256" },
              { indexed: false, name: "amount1", type: "uint256" }
            ]
          }
        ] as const;

        let rawAmt0 = "0";
        let rawAmt1 = "0";

        if (receipt && receipt.logs) {
          for (const log of receipt.logs) {
            try {
              const decoded = decodeEventLog({
                abi: LP_EVENTS_ABI,
                data: log.data,
                topics: log.topics
              });
              if (decoded.eventName === "DecreaseLiquidity") {
                rawAmt0 = decoded.args.amount0.toString();
                rawAmt1 = decoded.args.amount1.toString();
                break;
              }
            } catch (e) {
              // Ignore
            }
          }
        }

        await liquidityService.recordRemoveLiquidity({
          poolAddress: expandedPosition.poolAddress.toLowerCase(),
          walletAddress: address!.toLowerCase(),
          token0Amount: rawAmt0,
          token1Amount: rawAmt1,
          txHash: decreaseHash,
          chainId: chainId!,
        });
      } catch (backendErr) {
        console.error("Failed to log liquidity removal to backend:", backendErr);
      }

      // Now collect the tokens from decrease liquidity
      setStatusText("Collecting tokens from position...");
      const collectHash = await writeContractAsync({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "collect",
        args: [
          {
            tokenId: expandedPosition.tokenId,
            recipient: address,
            amount0Max: 340282366920938463463374607431768211455n, // type(uint128).max
            amount1Max: 340282366920938463463374607431768211455n  // type(uint128).max
          }
        ]
      });

      setTxHash(collectHash);
      setStatusText("Waiting for token collection receipt...");
      await publicClient?.waitForTransactionReceipt({ hash: collectHash });

      setStatusText("Liquidity successfully removed and tokens collected!");
      fetchLPState();
      fetchERC20Balances();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Failed to remove liquidity.";
      setStatusText(msg.substring(0, 80));
    } finally {
      setIsWorking(false);
    }
  };

  // Action 4: Collect Active LP Fees
  const handleCollectFees = async () => {
    const expandedPosition = positions?.find(p => p.tokenId === expandedTokenId);
    if (!isConnected || !address || !expandedPosition) return;

    if (!(await ensureMstChain())) {
      return;
    }

    setIsWorking(true);
    setTxHash("");
    setStatusText("Requesting LP Fee Collection...");

    try {
      setStatusText("Confirming fee collection in wallet...");
      const hash = await writeContractAsync({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "collect",
        args: [
          {
            tokenId: expandedPosition.tokenId,
            recipient: address,
            amount0Max: 340282366920938463463374607431768211455n, // type(uint128).max
            amount1Max: 340282366920938463463374607431768211455n  // type(uint128).max
          }
        ]
      });

      setTxHash(hash);
      setStatusText("Withdrawing fees from NonfungiblePositionManager...");
      await publicClient?.waitForTransactionReceipt({ hash });
      setStatusText("Accrued LP fees successfully collected!");
      fetchLPState();
      fetchERC20Balances();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Fee collection failed.";
      setStatusText(msg.substring(0, 80));
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 pb-20 pt-10 overflow-hidden font-sans">
      <main className="relative z-10 max-w-[1000px] mx-auto space-y-8">

        {/* VIEW 1: POSITIONS LIST DASHBOARD */}
        {currentView === "list" && (
          <div className="space-y-6">

            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-5xl md:text-6xl font-black tracking-tight">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                    Liquidity Pools
                  </span>
                </h1>
                <p className={`text-base md:text-lg ${isDark ? "text-zinc-400" : "text-zinc-600"} font-light leading-relaxed`}>
                  Manage your V3 concentrated liquidity positions, track fees, and analyze tick ranges.
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Currency Selector */}
                <div className={`flex rounded-xl p-1 border backdrop-blur-md transition-all
                  ${isDark ? "bg-[#131A2A]/40 border-[#2C364F]/30" : "bg-white border-zinc-200/80 shadow-sm"}`}>
                  <button
                    onClick={() => setCurrency("USD")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                      ${currency === "USD"
                        ? isDark ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    USD ($)
                  </button>
                  <button
                    onClick={() => setCurrency("INR")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                      ${currency === "INR"
                        ? isDark ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-sm"
                        : "text-zinc-400 hover:text-zinc-200"}`}
                  >
                    INR (₹)
                  </button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setCurrentView("create")}
                  className={`flex items-center gap-2.5 py-4 px-6 rounded-xl font-bold text-base transition-all shadow-lg
                    ${isDark
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/15"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-blue-500/10"}`}
                >
                  <Plus size={20} />
                  New Position
                </motion.button>
              </div>
            </div>

            {/* Portfolio Metrics Summary (Only if positions exist) */}
            {positions && positions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5"
              >
                <div
                  className={`p-6 rounded-[30px] border shadow-2xl relative backdrop-blur-2xl transition-all duration-300 overflow-hidden hover:-translate-y-0.5
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
                  <div className="absolute top-[-30px] right-[-30px] w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Total Deposited Value (TVL)
                  </p>
                  <p className="text-3xl font-black mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    ≈ {formatCurrency(portfolioStats.totalUSD)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Valuation based on live MST/USDC rates</p>
                </div>

                <div className={`glass p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float relative overflow-hidden
                  ${isDark ? "bg-[#131A2A]/50 border-[#2C364F]/40 text-white shadow-xl shadow-black/10" : "bg-white/70 border-zinc-200/50 text-zinc-950 shadow-md shadow-black/5"}`}>
                  <div className="absolute top-[-30px] right-[-30px] w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Active Ranges
                  </p>
                  <p className="text-3xl font-black mt-2 text-emerald-400">
                    {portfolioStats.activeCount} <span className={`text-xl font-bold ${isDark ? "text-zinc-555" : "text-zinc-400"}`}>/ {portfolioStats.positionsCount} active</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Positions earning swap fees right now</p>
                </div>

                <div className={`glass p-6 rounded-3xl border transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float relative overflow-hidden
                  ${isDark ? "bg-[#131A2A]/50 border-[#2C364F]/40 text-white shadow-xl shadow-black/10" : "bg-white/70 border-zinc-200/50 text-zinc-950 shadow-md shadow-black/5"}`}>
                  <div className="absolute top-[-30px] right-[-30px] w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    LP Positions Owned
                  </p>
                  <p className="text-3xl font-black mt-2 text-purple-400">
                    {portfolioStats.positionsCount} <span className="text-base font-medium text-zinc-500">NFTs</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">ERC-721 liquidity tokens in wallet</p>
                </div>
              </motion.div>
            )}

            {/* Positions container */}
            <div className="space-y-4">

              {positions === null ? (
                // Pulse loading skeleton list
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className={`p-6 rounded-[30px] border animate-pulse flex flex-col gap-4 transition-all duration-300 backdrop-blur-2xl
                        ${isDark
                          ? "bg-[#0b0b14]/75 border-zinc-800/60"
                          : "bg-white/80 border-zinc-200"
                        }`}
                      style={{
                        boxShadow: isDark
                          ? "inset 0 1px 1px rgba(255,255,255,0.06), 0 20px 40px rgba(0,0,0,0.8)"
                          : "inset 0 1px 1px rgba(255,255,255,0.8), 0 20px 40px rgba(0,0,0,0.05)"
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-zinc-700/30" />
                          <div className="w-24 h-6 bg-zinc-700/30 rounded" />
                        </div>
                        <div className="w-16 h-6 bg-zinc-700/30 rounded" />
                      </div>
                      <div className="h-4 bg-zinc-700/20 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : positions.length === 0 ? (
                // Elegant empty state
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-16 rounded-[30px] border text-center flex flex-col items-center justify-center gap-6 shadow-2xl relative backdrop-blur-2xl transition-all duration-300
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
                  <div className={`p-5 rounded-2xl ${isDark ? "bg-cyan-500/10 text-cyan-400" : "bg-cyan-50 text-cyan-600"}`}>
                    <Coins size={48} />
                  </div>
                  <div className="space-y-2 max-w-md">
                    <h3 className="font-bold text-2xl">No positions found</h3>
                    <p className={`text-base ${isDark ? "text-zinc-400" : "text-zinc-505"} leading-relaxed`}>
                      Your Uniswap V3 concentrated liquidity NFTs will list here. Deploy liquidity to start earning fee rewards.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setCurrentView("create")}
                    className={`py-3.5 px-6 rounded-xl font-bold text-base transition-all
                      ${isDark ? "bg-[#1e293b] hover:bg-[#334155] text-cyan-400 border border-cyan-500/20" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-900"}`}
                  >
                    Deploy First Position
                  </motion.button>
                </motion.div>
              ) : (
                // Position List Cards
                <div className="space-y-4">
                  {positions.map((pos) => {
                    const isExpanded = expandedTokenId === pos.tokenId;
                    const token0Symbol = pos.token0Info.symbol;
                    const token1Symbol = pos.token1Info.symbol;

                    const amt0Formatted = Number(formatUnits(pos.amount0, pos.token0Info.decimals));
                    const amt1Formatted = Number(formatUnits(pos.amount1, pos.token1Info.decimals));

                    const val0 = amt0Formatted * getTokenPrice(token0Symbol);
                    const val1 = amt1Formatted * getTokenPrice(token1Symbol);
                    const totalUSD = val0 + val1;

                    const feeFormatted = (pos.fee / 10000).toFixed(2);

                    return (
                      <div
                        key={pos.tokenId.toString()}
                        className={`rounded-[30px] border relative backdrop-blur-2xl transition-all duration-300 overflow-hidden shadow-2xl
                          ${isExpanded
                            ? isDark ? "bg-[#0b0b14]/90 border-cyan-500/50 shadow-cyan-500/10" : "bg-white/95 border-cyan-500/40"
                            : isDark ? "bg-[#0b0b14]/75 border-zinc-800/60 hover:border-zinc-700/80" : "bg-white/80 border-zinc-200 hover:border-zinc-300"
                          }`}
                        style={{
                          boxShadow: isDark
                            ? "inset 0 1px 1px rgba(255,255,255,0.06), 0 20px 40px rgba(0,0,0,0.8)"
                            : "inset 0 1px 1px rgba(255,255,255,0.8), 0 20px 40px rgba(0,0,0,0.05)"
                        }}
                      >
                        {/* Header details block (Always visible, triggers expand/collapse on click) */}
                        <div
                          onClick={() => handleToggleExpand(pos.tokenId)}
                          className="p-6 md:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-4">
                            {/* Overlayed double token logo */}
                            <div className="flex items-center shrink-0">
                              <TokenLogo symbol={token0Symbol} size={32} />
                              <div className="ml-[-12px] relative z-10 border-2 border-[#131A2A] rounded-full">
                                <TokenLogo symbol={token1Symbol} size={32} />
                              </div>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-black">{token0Symbol} / {token1Symbol}</h3>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-lg
                                  ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}`}>
                                  {feeFormatted}%
                                </span>
                              </div>
                              <p className={`text-sm font-mono mt-1 ${isDark ? "text-zinc-505" : "text-zinc-400"}`}>
                                ID: #{pos.tokenId.toString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-6">
                            {/* Reserve Value indicator */}
                            <div className="text-left md:text-right">
                              <p className={`text-xs uppercase tracking-wider font-semibold ${isDark ? "text-zinc-505" : "text-zinc-400"}`}>
                                Reserves Value
                              </p>
                              <p className="text-lg font-black mt-0.5">
                                ≈ {formatCurrency(totalUSD)}
                              </p>
                            </div>

                            {/* Range badge */}
                            <div className="flex items-center gap-3">
                              {pos.isInRange ? (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm shadow-emerald-500/5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                  In Range
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                                  Out of Range
                                </span>
                              )}

                              {isExpanded ? (
                                <ChevronUp className={isDark ? "text-zinc-400" : "text-zinc-600"} size={22} />
                              ) : (
                                <ChevronDown className={isDark ? "text-zinc-400" : "text-zinc-600"} size={22} />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Collapsible content (Accordion Details) */}
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              className="overflow-hidden border-t border-[#2C364F]/30"
                            >
                              <div className="p-6 md:p-8 space-y-8 bg-zinc-950/20">

                                {/* 1. Detailed underlying reserves */}
                                <div className="space-y-3">
                                  <h4 className={`text-sm uppercase tracking-wider font-bold ${isDark ? "text-zinc-400" : "text-zinc-505"}`}>
                                    Underlying Liquidity Reserves
                                  </h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Token 0 */}
                                    <div className={`p-5 rounded-xl border flex justify-between items-center backdrop-blur-sm
                                      ${isDark ? "bg-[#1B2236]/40 border-[#2C364F]/25" : "bg-zinc-50 border-zinc-200"}`}>
                                      <div className="flex items-center gap-3">
                                        <TokenLogo symbol={token0Symbol} size={28} />
                                        <div>
                                          <p className="font-bold text-lg">{token0Symbol}</p>
                                          <p className={`text-xs font-mono font-medium ${isDark ? "text-zinc-505" : "text-zinc-400"}`}>
                                            Decimals: {pos.token0Info.decimals}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-2xl font-black">{amt0Formatted.toFixed(pos.token0Info.decimals > 6 ? 4 : 2)}</p>
                                        <p className={`text-sm font-mono mt-0.5 ${isDark ? "text-zinc-550" : "text-zinc-400"}`}>
                                          ≈ {formatCurrency(val0)}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Token 1 */}
                                    <div className={`p-5 rounded-xl border flex justify-between items-center backdrop-blur-sm
                                      ${isDark ? "bg-[#1B2236]/40 border-[#2C364F]/25" : "bg-zinc-50 border-zinc-200"}`}>
                                      <div className="flex items-center gap-3">
                                        <TokenLogo symbol={token1Symbol} size={28} />
                                        <div>
                                          <p className="font-bold text-lg">{token1Symbol}</p>
                                          <p className={`text-xs font-mono font-medium ${isDark ? "text-zinc-550" : "text-zinc-400"}`}>
                                            Decimals: {pos.token1Info.decimals}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-2xl font-black">{amt1Formatted.toFixed(pos.token1Info.decimals > 6 ? 4 : 2)}</p>
                                        <p className={`text-sm font-mono mt-0.5 ${isDark ? "text-zinc-550" : "text-zinc-400"}`}>
                                          ≈ {formatCurrency(val1)}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Raw Liquidity and Position Details */}
                                <div className={`p-4.5 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-4 text-sm backdrop-blur-sm
                                  ${isDark ? "bg-[#1B2236]/30 border-[#2C364F]/20 text-zinc-300" : "bg-zinc-50 border-zinc-200 text-zinc-700"}`}>
                                  <div className="flex items-center gap-2">
                                    <Info size={16} className="text-cyan-400 shrink-0" />
                                    <span className="font-semibold">Raw Liquidity Amount:</span>
                                    <span className="font-mono text-cyan-400 font-black tracking-wide">
                                      {Number(formatUnits(pos.liquidity, 18)).toFixed(6)} units
                                    </span>
                                    <span className="text-xs font-mono opacity-60">({pos.liquidity.toString()})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold">Position Scope:</span>
                                    <span className="font-mono text-cyan-400 font-bold">{pos.tickUpper - pos.tickLower} ticks</span>
                                  </div>
                                </div>

                                {/* 2. Active Price Bounds and range visualization */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                                  <div className={`p-4 rounded-xl border text-center ${isDark ? "bg-[#1B2236]/20 border-[#2C364F]/20" : "bg-zinc-50 border-zinc-200"}`}>
                                    <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-550" : "text-zinc-400"}`}>Min Price</p>
                                    <p className="text-xl font-bold mt-1">{pos.tickLower}</p>
                                    <p className={`text-xs font-mono mt-1 ${isDark ? "text-zinc-550" : "text-zinc-400"}`}>Lower Tick Bound</p>
                                  </div>

                                  <div className="text-center py-2">
                                    <div className={`text-sm font-semibold mb-1 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                                      Pool address
                                    </div>
                                    <a
                                      href={`https://testnet.mstscan.com/address/${pos.poolAddress}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`text-sm font-mono hover:underline flex items-center justify-center gap-1.5 ${isDark ? "text-cyan-400" : "text-cyan-600"}`}
                                    >
                                      {pos.poolAddress.slice(0, 8)}...{pos.poolAddress.slice(-6)}
                                      <ExternalLink size={12} />
                                    </a>
                                  </div>

                                  <div className={`p-4 rounded-xl border text-center ${isDark ? "bg-[#1B2236]/20 border-[#2C364F]/20" : "bg-zinc-50 border-zinc-200"}`}>
                                    <p className={`text-xs font-bold uppercase ${isDark ? "text-zinc-550" : "text-zinc-400"}`}>Max Price</p>
                                    <p className="text-xl font-bold mt-1">{pos.tickUpper}</p>
                                    <p className={`text-xs font-mono mt-1 ${isDark ? "text-zinc-550" : "text-zinc-400"}`}>Upper Tick Bound</p>
                                  </div>
                                </div>

                                {/* 3. Inner Actions Layout (Add, Remove and Collect side-by-side/stacked) */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 border-t border-[#2C364F]/20">

                                  {/* Actions column: Add/Increase Liquidity (Spans 6) */}
                                  <div className="lg:col-span-6 space-y-4">
                                    <h5 className="text-base font-bold flex items-center gap-2 text-emerald-400">
                                      <span className="w-1.5 h-4 bg-emerald-400 rounded-full" />
                                      Increase Liquidity
                                    </h5>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                                          Add {token0Symbol}
                                        </label>
                                        <div className="relative">
                                          <input
                                            type="text"
                                            placeholder="0.0"
                                            value={addAmount0}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setAddAmount0(val);
                                              if (!val.trim()) {
                                                setAddAmount1("");
                                                return;
                                              }
                                              const valNum = Number(val);
                                              if (!isNaN(valNum) && pos.poolSqrtPriceX96 && pos.poolSqrtPriceX96 > 0n) {
                                                const amountRaw = parseUnits(val, pos.token0Info.decimals);
                                                const otherRaw = getOtherAmountForToken(
                                                  amountRaw,
                                                  0,
                                                  pos.poolSqrtPriceX96,
                                                  pos.tickLower,
                                                  pos.tickUpper
                                                );
                                                const otherVal = Number(formatUnits(otherRaw, pos.token1Info.decimals));
                                                setAddAmount1(formatToPrecision(otherVal, pos.token1Info.decimals));
                                              }
                                            }}
                                            disabled={isWorking}
                                            className={`w-full py-3 px-3.5 rounded-lg border text-sm font-medium outline-none bg-transparent transition
                                              ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300 focus:border-cyan-500"}`}
                                          />
                                        </div>
                                        <span className="text-[11px] text-zinc-550 mt-1 block">Bal: {token0Symbol === "WMST" ? wmstBalance : usdcBalance}</span>
                                        {addAmount0 !== "" && (Number(addAmount0) <= 0 || isNaN(Number(addAmount0))) && (
                                          <span className="text-[10px] text-red-500 mt-1 block font-semibold">
                                            Amount must be positive.
                                          </span>
                                        )}
                                      </div>

                                      <div>
                                        <label className={`block text-xs font-bold mb-1.5 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                                          Add {token1Symbol}
                                        </label>
                                        <div className="relative">
                                          <input
                                            type="text"
                                            placeholder="0.0"
                                            value={addAmount1}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setAddAmount1(val);
                                              if (!val.trim()) {
                                                setAddAmount0("");
                                                return;
                                              }
                                              const valNum = Number(val);
                                              if (!isNaN(valNum) && pos.poolSqrtPriceX96 && pos.poolSqrtPriceX96 > 0n) {
                                                const amountRaw = parseUnits(val, pos.token1Info.decimals);
                                                const otherRaw = getOtherAmountForToken(
                                                  amountRaw,
                                                  1,
                                                  pos.poolSqrtPriceX96,
                                                  pos.tickLower,
                                                  pos.tickUpper
                                                );
                                                const otherVal = Number(formatUnits(otherRaw, pos.token0Info.decimals));
                                                setAddAmount0(formatToPrecision(otherVal, pos.token0Info.decimals));
                                              }
                                            }}
                                            disabled={isWorking}
                                            className={`w-full py-3 px-3.5 rounded-lg border text-sm font-medium outline-none bg-transparent transition
                                              ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300 focus:border-cyan-500"}`}
                                          />
                                        </div>
                                        <span className="text-[11px] text-zinc-550 mt-1 block">Bal: {token1Symbol === "USDC" ? usdcBalance : wmstBalance}</span>
                                        {addAmount1 !== "" && (Number(addAmount1) <= 0 || isNaN(Number(addAmount1))) && (
                                          <span className="text-[10px] text-red-500 mt-1 block font-semibold">
                                            Amount must be positive.
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    <button
                                      onClick={handleAddLiquidity}
                                      disabled={isWorking || !addAmount0 || !addAmount1 || Number(addAmount0) <= 0 || Number(addAmount1) <= 0}
                                      className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98]
                                        ${isWorking || !addAmount0 || !addAmount1 || Number(addAmount0) <= 0 || Number(addAmount1) <= 0
                                          ? isDark ? "bg-emerald-500/10 text-emerald-500/40 cursor-not-allowed" : "bg-emerald-500/10 text-emerald-600/40 cursor-not-allowed"
                                          : isDark ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 shadow-md shadow-emerald-500/5" : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 shadow-md shadow-emerald-500/5"
                                        }`}
                                    >
                                      {isWorking ? "Processing..." : "Increase Liquidity"}
                                    </button>
                                  </div>

                                  {/* Actions column: Remove/Collect (Spans 6) */}
                                  <div className="lg:col-span-6 space-y-6">
                                    {/* Remove block */}
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <h5 className="text-base font-bold flex items-center gap-2 text-red-400">
                                          <span className="w-1.5 h-4 bg-red-400 rounded-full" />
                                          Remove Liquidity
                                        </h5>
                                        <span className="text-sm font-black text-red-400">{removePercent}%</span>
                                      </div>

                                      <div className="space-y-2">
                                        <input
                                          type="range"
                                          min="1"
                                          max="100"
                                          value={removePercent}
                                          onChange={(e) => setRemovePercent(Number(e.target.value))}
                                          disabled={isWorking}
                                          className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition
                                            ${isDark ? "bg-[#2C364F]/30" : "bg-zinc-200"} accent-red-500`}
                                        />
                                        <div className="flex justify-between text-[10px] text-zinc-550 font-mono">
                                          <span>0%</span>
                                          <span>50%</span>
                                          <span>100%</span>
                                        </div>
                                      </div>

                                      <button
                                        onClick={handleRemoveLiquidity}
                                        disabled={isWorking || !pos.liquidity || pos.liquidity === 0n}
                                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98]
                                          ${isWorking || !pos.liquidity || pos.liquidity === 0n
                                            ? isDark ? "bg-red-500/10 text-red-500/40" : "bg-red-500/10 text-red-600/40"
                                            : isDark ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 shadow-md shadow-red-500/5" : "bg-red-500/15 hover:bg-red-500/25 text-red-600 shadow-md shadow-red-500/5"
                                          }`}
                                      >
                                        {isWorking ? "Processing..." : `Decrease Liquidity`}
                                      </button>
                                    </div>

                                    {/* Collect fee block */}
                                    <div className={`p-4 rounded-xl border space-y-4 backdrop-blur-sm
                                      ${isDark ? "bg-[#1B2236]/20 border-[#2C364F]/20" : "bg-zinc-50 border-zinc-200"}`}>
                                      <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold">Unclaimed Fee Rewards</span>
                                        <button
                                          onClick={handleCollectFees}
                                          disabled={isWorking}
                                          className={`py-2 px-4 rounded-lg font-bold text-xs transition-all active:scale-[0.98]
                                            ${isWorking
                                              ? isDark ? "bg-amber-500/10 text-amber-500/40" : "bg-amber-500/10 text-amber-600/40"
                                              : isDark ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 shadow-md shadow-amber-500/5" : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 shadow-md shadow-amber-500/5"
                                            }`}
                                        >
                                          {isWorking ? "Collecting..." : "Collect Fees"}
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="flex items-center gap-1.5 font-semibold">
                                          <TokenLogo symbol={token0Symbol} size={16} />
                                          <span className="text-zinc-400">{token0Symbol}:</span>
                                          <span className="font-mono text-cyan-400">
                                            {Number(formatUnits(pos.tokensOwed0, pos.token0Info.decimals)).toFixed(5)}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 font-semibold">
                                          <TokenLogo symbol={token1Symbol} size={16} />
                                          <span className="text-zinc-400">{token1Symbol}:</span>
                                          <span className="font-mono text-cyan-400">
                                            {Number(formatUnits(pos.tokensOwed1, pos.token1Info.decimals)).toFixed(5)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                  </div>

                                </div>

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

          </div>
        )}

        {/* VIEW 2: CREATE POOL & INITIALIZE POSITION WIZARD */}
        {currentView === "create" && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[650px] mx-auto space-y-6"
          >

            {/* Navigation back and header */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView("list")}
                className={`p-2.5 rounded-xl border transition-all ${isDark ? "bg-[#131A2A]/40 border-[#2C364F]/30 text-zinc-400 hover:text-white" : "bg-white border-zinc-200 text-zinc-600 hover:text-black"}`}
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-cyan-400" : "text-cyan-600"}`}>
                  Step-by-Step wizard
                </span>
                <h2 className="text-3xl font-black">Create Pool & Initialize</h2>
              </div>
            </div>

            {/* Creation Wizard Card */}
            <div
              className={`p-8 rounded-[30px] border shadow-2xl relative backdrop-blur-2xl transition-all duration-300 overflow-visible
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

              <div className="relative z-10 space-y-6">


                {/* 1. Fee Tier Selector */}
                <div>
                  <label className={`block text-base font-bold mb-3 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                    Pool Fee Tier
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[500, 3000, 10000].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => handleFeeTierChange(fee)}
                        className={`py-3 px-3.5 rounded-xl border text-sm font-bold transition-all flex flex-col items-center justify-center gap-0.5
                          ${initFee === fee
                            ? isDark ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-md" : "bg-cyan-500/15 border-cyan-500/35 text-cyan-700 shadow-sm"
                            : isDark ? "bg-[#1B2236]/40 border-[#2C364F]/25 text-zinc-400 hover:border-[#2C364F]/50" : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                          }`}
                      >
                        <span className="text-base font-black">{(fee / 10000).toFixed(2)}%</span>
                        <span className="text-xs font-normal opacity-75">
                          {fee === 3000 ? "Typical" : fee === 500 ? "Stable" : "Exotic"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Token Inputs */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className={`text-sm font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Initial {tokenA_Symbol} amount</label>
                      <span className="text-xs font-mono text-zinc-550">Bal: {wmstBalance}</span>
                    </div>
                    <div className={`relative flex items-center justify-between rounded-xl border transition bg-transparent p-2 pl-4 pr-2
                      ${isDark ? "border-[#2C364F]/50 focus-within:border-cyan-500/50" : "border-zinc-300 focus-within:border-cyan-500"}`}
                    >
                      <input
                        type="text"
                        placeholder="0.0"
                        value={initWmst}
                        onChange={(e) => handleInitWmstChange(e.target.value)}
                        disabled={isWorking}
                        className="w-full bg-transparent border-none outline-none text-base font-medium"
                      />
                      <button
                        onClick={() => setModalOpen("A")}
                        disabled={isWorking}
                        className={`flex items-center gap-2 py-2 pl-3 pr-4 rounded-lg font-bold text-sm transition-colors relative z-10
                          ${isDark
                            ? "bg-[#181930] hover:bg-zinc-800 text-white"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-950"
                          }`}
                      >
                        <TokenLogo symbol={tokenA_Symbol} size={20} />
                        <span>{tokenA_Symbol}</span>
                        <ChevronDown size={14} className="opacity-60" />
                      </button>
                    </div>
                    {initWmst !== "" && (Number(initWmst) <= 0 || isNaN(Number(initWmst))) && (
                      <span className="text-xs text-red-500 mt-1.5 block font-semibold">
                        {tokenA_Symbol} amount must be a positive number.
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className={`text-sm font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Initial {tokenB_Symbol} amount</label>
                      <span className="text-xs font-mono text-zinc-550">Bal: {usdcBalance}</span>
                    </div>
                    <div className={`relative flex items-center justify-between rounded-xl border transition bg-transparent p-2 pl-4 pr-2
                      ${isDark ? "border-[#2C364F]/50 focus-within:border-cyan-500/50" : "border-zinc-300 focus-within:border-cyan-500"}`}
                    >
                      <input
                        type="text"
                        placeholder="0.0"
                        value={initUsdc}
                        onChange={(e) => handleInitUsdcChange(e.target.value)}
                        disabled={isWorking}
                        className="w-full bg-transparent border-none outline-none text-base font-medium"
                      />
                      <button
                        onClick={() => setModalOpen("B")}
                        disabled={isWorking}
                        className={`flex items-center gap-2 py-2 pl-3 pr-4 rounded-lg font-bold text-sm transition-colors relative z-10
                          ${isDark
                            ? "bg-[#181930] hover:bg-zinc-800 text-white"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-950"
                          }`}
                      >
                        <TokenLogo symbol={tokenB_Symbol} size={20} />
                        <span>{tokenB_Symbol}</span>
                        <ChevronDown size={14} className="opacity-60" />
                      </button>
                    </div>
                    {initUsdc !== "" && (Number(initUsdc) <= 0 || isNaN(Number(initUsdc))) && (
                      <span className="text-xs text-red-500 mt-1.5 block font-semibold">
                        {tokenB_Symbol} amount must be a positive number.
                      </span>
                    )}
                  </div>
                </div>

                {creationMode === "new" && initWmst && initUsdc && !isNaN(Number(initWmst)) && !isNaN(Number(initUsdc)) && Number(initWmst) > 0 && Number(initUsdc) > 0 && (
                  <div className={`p-4 rounded-xl border flex items-center justify-between text-sm backdrop-blur-sm
                    ${isDark ? "bg-[#1B2236]/35 border-[#2C364F]/30 text-zinc-350" : "bg-zinc-50 border-zinc-200 text-zinc-700"}`}>
                    <span className="font-semibold text-zinc-400">Calculated Starting Price:</span>
                    <span className="font-mono font-bold text-cyan-400">
                      1 WMST = {(Number(initUsdc) / Number(initWmst)).toFixed(4)} USDC
                    </span>
                  </div>
                )}

                {/* 3. Ticks boundaries (Centered Concentrated bounds) */}
                <div>
                  <label className={`block text-base font-bold mb-3 ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                    Price Range boundaries
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        value={initTickLower}
                        onChange={(e) => setInitTickLower(e.target.value)}
                        disabled={isWorking}
                        className={`w-full py-3.5 px-4 rounded-xl border text-sm font-mono outline-none bg-transparent transition
                          ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300 focus:border-cyan-500"}`}
                      />
                      <span className="text-xs text-zinc-550 mt-1.5 block">Lower Tick limit</span>
                    </div>

                    <div>
                      <input
                        type="number"
                        value={initTickUpper}
                        onChange={(e) => setInitTickUpper(e.target.value)}
                        disabled={isWorking}
                        className={`w-full py-3.5 px-4 rounded-xl border text-sm font-mono outline-none bg-transparent transition
                          ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300 focus:border-cyan-500"}`}
                      />
                      <span className="text-xs text-zinc-550 mt-1.5 block">Upper Tick limit</span>
                    </div>
                  </div>
                </div>

                {/* Info block */}
                {creationMode === "new" ? (
                  <div className={`p-4.5 rounded-xl border flex items-start gap-3 text-sm leading-relaxed
                    ${isDark ? "bg-[#1B2236]/30 border-cyan-500/25 text-zinc-400" : "bg-cyan-50/50 border-cyan-300/20 text-zinc-700"}`}>
                    <Info size={20} className="text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <p className={`font-bold mb-0.5 ${isDark ? "text-cyan-400" : "text-cyan-700"}`}>Deploying Pool</p>
                      This will submit the pool creation and initialization transaction on-chain using your inputs as the starting price ratio.
                    </div>
                  </div>
                ) : (
                  isPoolInitialized ? (
                    <div className={`p-4.5 rounded-xl border flex items-start gap-3 text-sm leading-relaxed
                      ${isDark ? "bg-[#1B2236]/30 border-emerald-500/25 text-zinc-400" : "bg-emerald-50/50 border-emerald-300/20 text-zinc-700"}`}>
                      <Info size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className={`font-bold mb-0.5 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>Depositing to Active Pool</p>
                        This pool is initialized. The current rate is <span className="font-mono font-bold text-cyan-400">1 WMST = {poolCurrentPrice?.toFixed(4)} USDC</span>. Input values are auto-aligned to guarantee all deposited funds are used.
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4.5 rounded-xl border flex items-start gap-3 text-sm leading-relaxed
                      ${isDark ? "bg-[#1B2236]/30 border-amber-500/25 text-zinc-400" : "bg-amber-50/50 border-amber-300/20 text-zinc-700"}`}>
                      <Info size={20} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className={`font-bold mb-0.5 ${isDark ? "text-amber-400" : "text-amber-700"}`}>Pool Not Initialized Yet</p>
                        This pool does not exist on-chain. To initialize the starting price first, switch to the <span className="font-bold text-cyan-400">"Create Brand New Pool"</span> tab.
                      </div>
                    </div>
                  )
                )}

                <button
                  onClick={() => {
                    checkCreateSteps();
                    setPendingAction("create");
                  }}
                  disabled={
                    isWorking ||
                    !initWmst ||
                    !initUsdc ||
                    Number(initWmst) <= 0 ||
                    Number(initUsdc) <= 0 ||
                    (creationMode === "existing" && !isPoolInitialized)
                  }
                  className={`w-full py-4.5 rounded-xl font-bold text-base tracking-wide transition-all active:scale-[0.98]
                    ${isWorking ||
                      !initWmst ||
                      !initUsdc ||
                      Number(initWmst) <= 0 ||
                      Number(initUsdc) <= 0 ||
                      (creationMode === "existing" && !isPoolInitialized)
                      ? isDark ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400/40 cursor-not-allowed" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      : isDark
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/15"
                        : "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/10"
                    }`}
                >
                  {isWorking
                    ? creationMode === "new" ? "Initializing Pool..." : "Adding Position..."
                    : creationMode === "new" ? "Initialize & Deploy" : "Add Position"
                  }
                </button>
              </div>

            </div>

          </motion.div>
        )}

        {/* Dynamic transaction notifications */}
        <AnimatePresence>
          {statusText && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: "auto", opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              className="overflow-hidden"
            >
              <div
                className={`p-5 rounded-2xl border backdrop-blur-sm text-sm font-medium leading-relaxed shadow-lg
                  ${statusText.includes("minted") || statusText.includes("added") || statusText.includes("removed") || statusText.includes("collected") || statusText.includes("successfully")
                    ? isDark ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-emerald-500/5" : "bg-emerald-50 border-emerald-500/20 text-emerald-800"
                    : isDark ? "bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-blue-500/5" : "bg-blue-50 border-blue-500/20 text-blue-800"
                  }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold flex items-center gap-2">
                    <ShieldCheck size={18} className="shrink-0" />
                    {statusText}
                  </span>
                  <button
                    onClick={() => setStatusText("")}
                    className={`text-xs font-bold px-2 py-1 rounded hover:bg-black/10 transition`}
                  >
                    ✕
                  </button>
                </div>
                {txHash && (
                  <div className="text-xs font-mono mt-2 pt-2 border-t border-current/10">
                    <a
                      href={`https://testnet.mstscan.com/tx/${txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:underline"
                    >
                      Tx hash: {txHash.slice(0, 18)}...{txHash.slice(-14)}
                      <ExternalLink size={10} />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review Transaction Modal */}
        <AnimatePresence>
          {pendingAction && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!isWorking) {
                    setPendingAction(null);
                    setCreateSteps([]);
                  }
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={`relative w-full max-w-md rounded-[30px] p-6 shadow-2xl border
                  ${isDark ? "bg-[#0b0b14]/95 border-zinc-800/80 text-white" : "bg-white/95 border-zinc-200 text-zinc-900"}
                `}
                style={{
                  boxShadow: isDark
                    ? "inset 0 1px 1px rgba(255,255,255,0.06), 0 20px 40px rgba(0,0,0,0.8)"
                    : "inset 0 1px 1px rgba(255,255,255,0.8), 0 20px 40px rgba(0,0,0,0.05)"
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xl font-bold">Review Transaction</h3>
                  <button
                    onClick={() => {
                      if (!isWorking) {
                        setPendingAction(null);
                        setCreateSteps([]);
                      }
                    }}
                    className="text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    ✕
                  </button>
                </div>

                {pendingAction === "create" && (
                  <div className="mb-6 space-y-4">
                    <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                      You are about to initiate a blockchain transaction. Please review the details below.
                    </p>
                    <div className={`p-4 rounded-2xl border space-y-3 font-medium text-sm
                      ${isDark ? "bg-[#1B2236]/30 border-[#2C364F]/50" : "bg-zinc-50 border-zinc-200"}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Action</span>
                        <span className="font-bold text-cyan-500">Create Pool & Add Liquidity</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">{tokenA_Symbol} Amount</span>
                        <span className="font-bold">{initWmst}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">{tokenB_Symbol} Amount</span>
                        <span className="font-bold">{initUsdc}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-500">Fee Tier</span>
                        <span className="font-bold">{(initFee / 10000).toFixed(2)}%</span>
                      </div>
                    </div>

                    {/* Step-by-Step Confirmations Container */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Required Steps
                      </h4>

                      {loadingCreateSteps ? (
                        <div className="flex items-center justify-center py-6 gap-2">
                          <Loader2 className="animate-spin text-cyan-400 h-5 w-5" />
                          <span className="text-xs font-mono text-zinc-500">Estimating required steps...</span>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {createSteps.map((step, idx) => {
                            const isCompleted = step.status === "completed";
                            const isCurrent = idx === activeCreateStepIndex;
                            const isWorkingStep = step.status === "working";
                            const isFailed = step.status === "failed";

                            return (
                              <div
                                key={step.id}
                                className={`flex items-start justify-between p-3.5 rounded-2xl border transition-all duration-300
                                  ${isCompleted
                                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400"
                                    : isCurrent
                                      ? isDark ? "bg-[#1C2438] border-cyan-500/30 text-white" : "bg-cyan-50 border-cyan-300 text-zinc-900"
                                      : "bg-transparent border-zinc-800/40 text-zinc-550 opacity-60"
                                  }`}
                              >
                                <div className="flex gap-3 min-w-0">
                                  <div className="mt-0.5 shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2 size={18} className="text-emerald-400" />
                                    ) : isWorkingStep ? (
                                      <Loader2 size={18} className="text-cyan-400 animate-spin" />
                                    ) : isFailed ? (
                                      <XCircle size={18} className="text-rose-500" />
                                    ) : (
                                      <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                                        ${isCurrent ? "border-cyan-400 text-cyan-400" : "border-zinc-600 text-zinc-650"}`}
                                      >
                                        {idx + 1}
                                      </div>
                                    )}
                                  </div>

                                  <div className="min-w-0">
                                    <div className="text-sm font-bold truncate">{step.label}</div>
                                    <div className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{step.description}</div>
                                    {step.error && (
                                      <div className="text-[11px] font-bold text-rose-500 mt-1 font-mono break-words">{step.error}</div>
                                    )}
                                  </div>
                                </div>

                                {/* Active step action button */}
                                {isCurrent && !isWorking && (
                                  <button
                                    onClick={() => executeCreateStep(idx)}
                                    className={`ml-3 py-1.5 px-4 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0
                                      ${isDark
                                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/10"
                                        : "bg-cyan-500 hover:bg-cyan-600 text-white"
                                      }`}
                                  >
                                    {step.id.startsWith("approve") ? "Approve" : "Confirm"}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MstTokenModal rendering */}
        <MstTokenModal
          isOpen={modalOpen !== null}
          onClose={() => setModalOpen(null)}
          onSelect={handleTokenSelect}
          selectedToken={modalOpen === "A" ? tokenA_Symbol : (modalOpen === "B" ? tokenB_Symbol : "")}
          theme={theme}
        />

      </main>
    </div>
  );
}

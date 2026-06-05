import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Plus, Coins, HelpCircle, ExternalLink, ChevronDown, ChevronUp, ArrowLeft, ShieldCheck } from "lucide-react";
import { formatUnits, parseUnits, type Address } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWriteContract, useBalance } from "wagmi";
import { getToken, TOKENS, CONTRACTS, erc20Abi, quoterV2Abi, nonfungiblePositionManagerAbi, uniswapV3FactoryAbi, V3_FEE, ZERO_SQRT_PRICE_LIMIT, type TokenConfig } from "../config/contracts";
import { mstChain } from "../config/chains";
import { TokenLogo } from "../components/swap/TokenLogos";
import { useThemeStore } from "../store/themeStore";
import { getAmountsForLiquidity, getOtherAmountForToken } from "../utils/uniswap-math";

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

  const wmstToken = useMemo(() => getToken("WMST") || { symbol: "WMST", decimals: 18, address: CONTRACTS.wmst }, []);
  const usdcToken = useMemo(() => getToken("USDC") || { symbol: "USDC", decimals: 18, address: CONTRACTS.usdc }, []);

  // 1. Fetch live balances
  const [wmstBalance, setWmstBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");

  // LP State Stored Values (List-based)
  const [positions, setPositions] = useState<PositionItem[] | null>(null);
  const [expandedTokenId, setExpandedTokenId] = useState<bigint | null>(null);

  // View state: 'list' dashboard vs 'create' pool creator wizard
  const [currentView, setCurrentView] = useState<"list" | "create">("list");

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

  const getV3Amounts = (val: string, inputSymbol: "WMST" | "USDC"): string => {
    if (!val || isNaN(Number(val)) || Number(val) < 0) return "";
    if (!isPoolInitialized || !poolSqrtPriceX96) return "";

    try {
      const lowerTick = Number(initTickLower);
      const upperTick = Number(initTickUpper);
      if (isNaN(lowerTick) || isNaN(upperTick)) return "";

      const wAddress = wmstToken.address as Address;
      const uAddress = usdcToken.address as Address;
      if (!wAddress || !uAddress) return "";
      const isWmstToken0 = wAddress.toLowerCase() < uAddress.toLowerCase();

      const inputDecimals = inputSymbol === "WMST" ? wmstToken.decimals : usdcToken.decimals;
      const amountRaw = parseUnits(val, inputDecimals);

      const isInputToken0 = inputSymbol === "WMST" ? isWmstToken0 : !isWmstToken0;
      const inputTokenIndex = isInputToken0 ? 0 : 1;

      const otherAmountRaw = getOtherAmountForToken(
        amountRaw,
        inputTokenIndex,
        poolSqrtPriceX96,
        lowerTick,
        upperTick
      );

      const otherDecimals = inputSymbol === "WMST" ? usdcToken.decimals : wmstToken.decimals;
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
        setInitUsdc(getV3Amounts(initWmst, "WMST"));
      } else if (initUsdc && !isNaN(Number(initUsdc))) {
        setInitWmst(getV3Amounts(initUsdc, "USDC"));
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
        setInitUsdc(getV3Amounts(val, "WMST"));
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
        setInitWmst(getV3Amounts(val, "USDC"));
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
    const interval = setInterval(() => fetchMstPrice(client), 15000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [publicClient]);

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

      // Query token IDs
      const tokenIds: bigint[] = [];
      for (let i = 0n; i < npmBalance; i++) {
        try {
          const tokenId = await publicClient.readContract({
            address: CONTRACTS.positionManager,
            abi: nonfungiblePositionManagerAbi,
            functionName: "tokenOfOwnerByIndex",
            args: [address, i]
          }) as bigint;
          tokenIds.push(tokenId);
        } catch (err) {
          console.error("Error calling tokenOfOwnerByIndex in LiquidityPage", err);
        }
      }

      // Fetch details for all positions in parallel
      const fetchedPositions = await Promise.all(
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

            // Query factory for poolAddress
            let poolAddr = "0x0000000000000000000000000000000000000000";
            try {
              poolAddr = await publicClient.readContract({
                address: CONTRACTS.factory,
                abi: uniswapV3FactoryAbi,
                functionName: "getPool",
                args: [token0, token1, fee]
              }) as string;
            } catch (factoryErr) {
              console.error("Error calling factory.getPool in LiquidityPage", factoryErr);
            }

            // Resolve token info
            const t0Info = TOKENS.find((t) => t.address?.toLowerCase() === token0.toLowerCase()) || 
                           { symbol: "USDC", decimals: 18, address: token0 };
            const t1Info = TOKENS.find((t) => t.address?.toLowerCase() === token1.toLowerCase()) || 
                           { symbol: "WMST", decimals: 18, address: token1 };

            // Calculate reserves from slot0 of pool
            let amount0 = 0n;
            let amount1 = 0n;
            let isInRange = false;
            let poolSqrtPriceX96 = 0n;

            if (poolAddr && poolAddr !== "0x0000000000000000000000000000000000000000") {
              try {
                const slot0 = await publicClient.readContract({
                  address: poolAddr as Address,
                  abi: poolAbi,
                  functionName: "slot0"
                });
                const sqrtPriceX96 = slot0[0];
                const activeTick = slot0[1];
                
                poolSqrtPriceX96 = sqrtPriceX96;
                // Active range check
                isInRange = activeTick >= tickLower && activeTick <= tickUpper;

                const [calculatedAmt0, calculatedAmt1] = getAmountsForLiquidity(
                  liquidity,
                  sqrtPriceX96,
                  tickLower,
                  tickUpper
                );
                amount0 = calculatedAmt0;
                amount1 = calculatedAmt1;
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
              token0Info: t0Info,
              token1Info: t1Info,
              poolSqrtPriceX96
            } as PositionItem;
          } catch (err) {
            console.error(`Error querying details for tokenId ${tokenId}`, err);
            return null;
          }
        })
      );

      const validPositions = fetchedPositions.filter((p): p is PositionItem => p !== null);
      // Sort positions descending by tokenId so latest is at the top
      validPositions.sort((a, b) => (b.tokenId > a.tokenId ? 1 : b.tokenId < a.tokenId ? -1 : 0));
      setPositions(validPositions);
    } catch (e) {
      console.error("Error fetching LP states in LiquidityPage", e);
    }
  };

  // Fetch all live values on load and periodically
  useEffect(() => {
    fetchERC20Balances();
    fetchLPState();

    const interval = setInterval(() => {
      fetchERC20Balances();
      fetchLPState();
    }, 8000);

    return () => clearInterval(interval);
  }, [address, isConnected, publicClient]);

  // Sync pool existence status
  useEffect(() => {
    if (currentView === "create") {
      checkPoolStatus(initFee);
    }
  }, [initFee, currentView, publicClient]);

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

  // Action 1: Create Pool and Initialize Concentrated Liquidity
  const handleInitializePool = async () => {
    if (!isConnected || !address) return;
    if (!(await ensureMstChain())) {
      return;
    }

    if (!initWmst || !initUsdc) {
      setStatusText("Please provide WMST and USDC amounts to create pool.");
      return;
    }

    setIsWorking(true);
    setTxHash("");
    setStatusText("Preparing Pool Initialization...");

    try {
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

      if (creationMode === "new") {
        // BRAND NEW POOL: Only call createAndInitializePoolIfNecessary (no approvals needed since no tokens are deposited yet)
        setStatusText("Initializing Uniswap V3 Pool in wallet...");
        const amount0Float = t0.toLowerCase() === wmstToken.address?.toLowerCase() ? Number(initWmst) : Number(initUsdc);
        const amount1Float = t1.toLowerCase() === wmstToken.address?.toLowerCase() ? Number(initWmst) : Number(initUsdc);
        const priceRatio = amount1Float / amount0Float;
        const sqrtPrice = Math.sqrt(priceRatio);
        const Q96 = 2n ** 96n;
        const dynamicSqrtPriceX96 = BigInt(Math.floor(sqrtPrice * 1000000000000)) * Q96 / 1000000000000n;

        const initHash = await writeContractAsync({
          address: CONTRACTS.positionManager,
          abi: nonfungiblePositionManagerAbi,
          functionName: "createAndInitializePoolIfNecessary",
          args: [t0, t1, initFee, dynamicSqrtPriceX96]
        });

        setTxHash(initHash);
        setStatusText("Waiting for pool initialization confirmation...");
        await publicClient?.waitForTransactionReceipt({ hash: initHash });
        setStatusText("Pool successfully created and initialized on-chain!");
      } else {
        // PRE-EXISTING POOL: Approve tokens and mint position NFT
        await approveTokenIfNeeded(wmstToken.address as Address, wmstRaw, "WMST");
        await approveTokenIfNeeded(usdcToken.address as Address, usdcRaw, "USDC");

        setStatusText("Confirming liquidity minting in wallet...");
        const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
        const mintHash = await writeContractAsync({
          address: CONTRACTS.positionManager,
          abi: nonfungiblePositionManagerAbi,
          functionName: "mint",
          args: [
            {
              token0: t0,
              token1: t1,
              fee: initFee,
              tickLower: Number(initTickLower),
              tickUpper: Number(initTickUpper),
              amount0Desired: amount0,
              amount1Desired: amount1,
              amount0Min: 0n,
              amount1Min: 0n,
              recipient: address as Address,
              deadline
            }
          ]
        });

        setTxHash(mintHash);
        setStatusText("Submitting concentrated liquidity mint to MST Blockchain...");
        await publicClient?.waitForTransactionReceipt({ hash: mintHash });
        setStatusText("Concentrated liquidity successfully minted!");
      }

      setInitWmst("");
      setInitUsdc("");
      fetchLPState();
      fetchERC20Balances();
      
      // Auto return back to dashboard list
      setTimeout(() => {
        setCurrentView("list");
      }, 1500);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Initialization failed.";
      setStatusText(msg.substring(0, 80));
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
      setStatusText("Confirming active range addition in wallet...");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      const hash = await writeContractAsync({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "increaseLiquidity",
        args: [
          {
            tokenId: expandedPosition.tokenId,
            amount0Desired,
            amount1Desired,
            amount0Min: 0n,
            amount1Min: 0n,
            deadline
          }
        ]
      });

      setTxHash(hash);
      setStatusText("Waiting for block confirmation on MST Blockchain...");
      await publicClient?.waitForTransactionReceipt({ hash });
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
      
      setStatusText(`Confirming removal of ${removePercent}% liquidity in wallet...`);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
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
            deadline
          }
        ]
      });

      setStatusText("Confirming liquidity reduction on-chain...");
      await publicClient?.waitForTransactionReceipt({ hash: decreaseHash });

      setStatusText("Withdrawing principal tokens from pool...");
      const collectHash = await writeContractAsync({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "collect",
        args: [
          {
            tokenId: expandedPosition.tokenId,
            recipient: address as Address,
            amount0Max: 340282366920938463463374607431768211455n, // uint128 max
            amount1Max: 340282366920938463463374607431768211455n
          }
        ]
      });

      setTxHash(collectHash);
      setStatusText("Reclaiming principal tokens back to your wallet...");
      await publicClient?.waitForTransactionReceipt({ hash: collectHash });

      setStatusText("Liquidity successfully removed!");
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
            recipient: address as Address,
            amount0Max: 340282366920938463463374607431768211455n, // uint128 max
            amount1Max: 340282366920938463463374607431768211455n
          }
        ]
      });

      setTxHash(hash);
      setStatusText("Withdrawing fees from Uniswap V3 Pool...");
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
    <div
      className={`min-h-[calc(100vh-72px)] relative font-sans transition-colors duration-300 ease-in-out select-none overflow-x-hidden pb-24 ${
        isDark ? "bg-[#0b0f19] text-white" : "bg-[#f8fafc] text-zinc-950"
      }`}
    >
      {/* Dynamic ambient backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-cyan-500/10 to-transparent blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-bl from-purple-500/10 to-transparent blur-[120px] pointer-events-none" />

      <main className="relative z-10 px-4 pt-12 md:pt-16 max-w-[1000px] mx-auto space-y-8">
        
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
                <div className={`p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden
                  ${isDark ? "bg-[#131A2A]/50 border-[#2C364F]/30" : "bg-white border-zinc-200/80 shadow-sm"}`}>
                  <div className="absolute top-[-30px] right-[-30px] w-20 h-20 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Total Deposited Value (TVL)
                  </p>
                  <p className="text-3xl font-black mt-2 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    ≈ {formatCurrency(portfolioStats.totalUSD)}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Valuation based on live MST/USDC rates</p>
                </div>

                <div className={`p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden
                  ${isDark ? "bg-[#131A2A]/50 border-[#2C364F]/30" : "bg-white border-zinc-200/80 shadow-sm"}`}>
                  <div className="absolute top-[-30px] right-[-30px] w-20 h-20 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-full blur-xl pointer-events-none" />
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-zinc-500"}`}>
                    Active Ranges
                  </p>
                  <p className="text-3xl font-black mt-2 text-emerald-400">
                    {portfolioStats.activeCount} <span className={`text-xl font-bold ${isDark ? "text-zinc-555" : "text-zinc-400"}`}>/ {portfolioStats.positionsCount} active</span>
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Positions earning swap fees right now</p>
                </div>

                <div className={`p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden
                  ${isDark ? "bg-[#131A2A]/50 border-[#2C364F]/30" : "bg-white border-zinc-200/80 shadow-sm"}`}>
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
                      className={`p-6 rounded-2xl border animate-pulse flex flex-col gap-4
                        ${isDark ? "bg-[#131A2A]/40 border-[#2C364F]/30" : "bg-white border-zinc-200"}`}
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
                  className={`p-16 rounded-2xl border text-center backdrop-blur-md flex flex-col items-center justify-center gap-6
                    ${isDark ? "bg-[#131A2A]/40 border-[#2C364F]/30" : "bg-white border-zinc-200 shadow-sm"}`}
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
                        className={`rounded-2xl border transition-all duration-300 backdrop-blur-md overflow-hidden
                          ${isExpanded 
                            ? isDark ? "bg-[#131a2c]/85 border-cyan-500/50 shadow-xl shadow-cyan-500/5" : "bg-white border-cyan-500/40 shadow-xl"
                            : isDark ? "bg-[#131A2A]/40 border-[#2C364F]/30 hover:border-cyan-500/35" : "bg-white border-zinc-200 shadow-sm hover:border-zinc-300"
                          }`}
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
              className={`p-8 rounded-2xl border backdrop-blur-md relative
                ${isDark ? "bg-[#131A2A]/70 border-[#2C364F]/50 shadow-2xl" : "bg-white border-zinc-200/80 shadow-xl"}`}
            >
              <div className="absolute -right-40 -top-40 w-80 h-80 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">

                 {/* Creation Mode Tabs */}
                 <div className="flex rounded-xl p-1 bg-zinc-950/15 dark:bg-[#1B2236]/40 border border-zinc-200/50 dark:border-[#2C364F]/30">
                   <button
                     type="button"
                     onClick={() => setCreationMode("new")}
                     className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all
                       ${creationMode === "new"
                         ? isDark 
                           ? "bg-[#1d293d] text-cyan-400 border border-cyan-500/30" 
                           : "bg-white text-zinc-900 border border-zinc-200 shadow-sm"
                         : "text-zinc-550 hover:text-zinc-400 dark:hover:text-white"
                       }`}
                   >
                     Create Brand New Pool
                   </button>
                   <button
                     type="button"
                     onClick={() => setCreationMode("existing")}
                     className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all
                       ${creationMode === "existing"
                         ? isDark 
                           ? "bg-[#1d293d] text-cyan-400 border border-cyan-500/30" 
                           : "bg-white text-zinc-900 border border-zinc-200 shadow-sm"
                         : "text-zinc-550 hover:text-zinc-400 dark:hover:text-white"
                       }`}
                   >
                     Add to Pre-existing Pool
                   </button>
                 </div>

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
                      <label className={`text-sm font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Initial WMST amount</label>
                      <span className="text-xs font-mono text-zinc-550">Bal: {wmstBalance}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="0.0"
                        value={initWmst}
                        onChange={(e) => handleInitWmstChange(e.target.value)}
                        disabled={isWorking}
                        className={`w-full py-4 px-4 rounded-xl border text-base font-medium outline-none bg-transparent transition
                          ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300 focus:border-cyan-500"}`}
                      />
                      <div className="absolute right-4 top-4 flex items-center gap-1.5">
                        <TokenLogo symbol="WMST" size={20} />
                        <span className="text-sm font-bold">WMST</span>
                      </div>
                    </div>
                    {initWmst !== "" && (Number(initWmst) <= 0 || isNaN(Number(initWmst))) && (
                      <span className="text-xs text-red-500 mt-1.5 block font-semibold">
                        WMST amount must be a positive number.
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className={`text-sm font-bold ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>Initial USDC amount</label>
                      <span className="text-xs font-mono text-zinc-550">Bal: {usdcBalance}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="0.0"
                        value={initUsdc}
                        onChange={(e) => handleInitUsdcChange(e.target.value)}
                        disabled={isWorking}
                        className={`w-full py-4 px-4 rounded-xl border text-base font-medium outline-none bg-transparent transition
                          ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300 focus:border-cyan-500"}`}
                      />
                      <div className="absolute right-4 top-4 flex items-center gap-1.5">
                        <TokenLogo symbol="USDC" size={20} />
                        <span className="text-sm font-bold">USDC</span>
                      </div>
                    </div>
                    {initUsdc !== "" && (Number(initUsdc) <= 0 || isNaN(Number(initUsdc))) && (
                      <span className="text-xs text-red-500 mt-1.5 block font-semibold">
                        USDC amount must be a positive number.
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

                {/* Action button */}
                <button
                  onClick={handleInitializePool}
                  disabled={
                    isWorking || 
                    !initWmst || 
                    !initUsdc || 
                    Number(initWmst) <= 0 ||
                    Number(initUsdc) <= 0 ||
                    (creationMode === "existing" && !isPoolInitialized)
                  }
                  className={`w-full py-4.5 rounded-xl font-bold text-base tracking-wide transition-all active:scale-[0.98]
                    ${
                      isWorking || 
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
                  ${
                    statusText.includes("minted") || statusText.includes("added") || statusText.includes("removed") || statusText.includes("collected") || statusText.includes("successfully")
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

      </main>
    </div>
  );
}

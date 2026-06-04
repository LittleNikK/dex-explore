import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Info, Plus, ShieldCheck, Coins, HelpCircle, ArrowRight, ExternalLink } from "lucide-react";
import { formatUnits, parseUnits, type Address } from "viem";
import { useAccount, useChainId, usePublicClient, useSwitchChain, useWriteContract, useBalance } from "wagmi";
import { getToken, TOKENS, CONTRACTS, erc20Abi, quoterV2Abi, nonfungiblePositionManagerAbi, uniswapV3FactoryAbi, V3_FEE, ZERO_SQRT_PRICE_LIMIT } from "../config/contracts";
import { mstChain } from "../config/chains";
import { TokenLogo } from "../components/swap/TokenLogos";
import { useThemeStore } from "../store/themeStore";
import { getAmountsForLiquidity } from "../utils/uniswap-math";

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

export default function LiquidityPage() {
  const { theme, toggleTheme } = useThemeStore();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const wmstToken = useMemo(() => getToken("WMST") || { symbol: "WMST", decimals: 18, address: CONTRACTS.wmst }, []);
  const usdcToken = useMemo(() => getToken("USDC") || { symbol: "USDC", decimals: 18, address: CONTRACTS.usdc }, []);

  // 1. Fetch live balances (native tMST vs ERC20 tokens)
  const { data: nativeBalanceData } = useBalance({ address });
  const [wmstBalance, setWmstBalance] = useState("0.00");
  const [usdcBalance, setUsdcBalance] = useState("0.00");

  // LP State Stored Values
  const [activeTokenId, setActiveTokenId] = useState<bigint | null>(null);
  const [lpLiquidity, setLpLiquidity] = useState<bigint | null>(null);
  const [lpAmount0, setLpAmount0] = useState<bigint | null>(null);
  const [lpAmount1, setLpAmount1] = useState<bigint | null>(null);
  const [poolAddress, setPoolAddress] = useState<string>("");
  const [token0Address, setToken0Address] = useState<string>("");
  const [token1Address, setToken1Address] = useState<string>("");
  const [tokensOwed0, setTokensOwed0] = useState<bigint | null>(null);
  const [tokensOwed1, setTokensOwed1] = useState<bigint | null>(null);

  const token0Info = useMemo(() => {
    if (!token0Address) return usdcToken; // Default fallback to USDC
    const match = TOKENS.find((token) => token.address?.toLowerCase() === token0Address.toLowerCase());
    return match || { symbol: "USDC", decimals: 18, address: token0Address as Address };
  }, [token0Address, usdcToken]);

  const token1Info = useMemo(() => {
    if (!token1Address) return wmstToken; // Default fallback to WMST
    const match = TOKENS.find((token) => token.address?.toLowerCase() === token1Address.toLowerCase());
    return match || { symbol: "WMST", decimals: 18, address: token1Address as Address };
  }, [token1Address, wmstToken]);

  const getTokenPrice = (symbol: string) => {
    return symbol === "USDC" ? 1.0 : (symbol === "WMST" || symbol === "MST" ? liveMstPrice : 0.0);
  };

  // Input states for Creating / Initializing Pool
  const [initFee, setInitFee] = useState<number>(3000); // 0.3%
  const [initWmst, setInitWmst] = useState("");
  const [initUsdc, setInitUsdc] = useState("");
  const [initTickLower, setInitTickLower] = useState("-887220"); // Full Range Lower
  const [initTickUpper, setInitTickUpper] = useState("887220"); // Full Range Upper

  // Input states for Adding Liquidity
  const [addWmst, setAddWmst] = useState("");
  const [addUsdc, setAddUsdc] = useState("");

  // Input states for Removing Liquidity
  const [removePercent, setRemovePercent] = useState<number>(50); // 50% default

  // Transaction Working States
  const [isWorking, setIsWorking] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [txHash, setTxHash] = useState("");

  const isDark = theme === "dark";

  const [liveMstPrice, setLiveMstPrice] = useState<number>(0);

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

  // Helper: Fetch on-chain LP position details from NonfungiblePositionManager and Factory
  const fetchLPState = async () => {
    if (!publicClient || !address || !isConnected) return;
    try {
      // 1. Fetch balance of NFTs on Position Manager
      const npmBalance = await publicClient.readContract({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "balanceOf",
        args: [address]
      }) as bigint;

      let activeId = 0n;
      let activeLiq = 0n;
      let activePool = "";
      let token0 = "";
      let token1 = "";
      let tickLower = 0;
      let tickUpper = 0;
      let owed0 = 0n;
      let owed1 = 0n;

      if (npmBalance > 0n) {
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

        // Find the first position that has active liquidity, or fall back to the first token ID overall
        for (const tokenId of tokenIds) {
          try {
            const positionInfo = await publicClient.readContract({
              address: CONTRACTS.positionManager,
              abi: nonfungiblePositionManagerAbi,
              functionName: "positions",
              args: [tokenId]
            }) as any;
            
            const lpLiquidityVal = positionInfo[7] as bigint;
            if (activeId === 0n || lpLiquidityVal > 0n) {
              activeId = tokenId;
              activeLiq = lpLiquidityVal;
              token0 = positionInfo[2];
              token1 = positionInfo[3];
              tickLower = positionInfo[5];
              tickUpper = positionInfo[6];
              owed0 = positionInfo[10];
              owed1 = positionInfo[11];
              
              // Query factory for poolAddress
              const fee = positionInfo[4] as number;
              try {
                activePool = await publicClient.readContract({
                  address: CONTRACTS.factory,
                  abi: uniswapV3FactoryAbi,
                  functionName: "getPool",
                  args: [token0 as Address, token1 as Address, fee]
                }) as string;
              } catch (factoryErr) {
                console.error("Error calling factory.getPool in LiquidityPage", factoryErr);
              }
              
              // If we found a position with non-zero liquidity, break so we prioritize it
              if (lpLiquidityVal > 0n) {
                break;
              }
            }
          } catch (err) {
            console.error(`Error querying details for tokenId ${tokenId}`, err);
          }
        }
      }

      if (activeId > 0n) {
        setActiveTokenId(activeId);
        setLpLiquidity(activeLiq);
        setPoolAddress(activePool);
        setToken0Address(token0);
        setToken1Address(token1);
        setTokensOwed0(owed0);
        setTokensOwed1(owed1);

        // Fetch slot0 of pool to calculate reserves
        let calculated = false;
        if (activePool && activePool !== "0x0000000000000000000000000000000000000000") {
          try {
            const slot0 = await publicClient.readContract({
              address: activePool as Address,
              abi: poolAbi,
              functionName: "slot0"
            });
            const sqrtPriceX96 = slot0[0];
            const [calculatedAmt0, calculatedAmt1] = getAmountsForLiquidity(
              activeLiq,
              sqrtPriceX96,
              tickLower,
              tickUpper
            );
            setLpAmount0(calculatedAmt0);
            setLpAmount1(calculatedAmt1);
            calculated = true;
          } catch (mathErr) {
            console.error("Failed calculating reserves from pool slot0 in LiquidityPage", mathErr);
          }
        }
        if (!calculated) {
          setLpAmount0(0n);
          setLpAmount1(0n);
        }
      } else {
        setActiveTokenId(null);
        setLpLiquidity(0n);
        setLpAmount0(0n);
        setLpAmount1(0n);
        setPoolAddress("");
        setToken0Address("");
        setToken1Address("");
        setTokensOwed0(0n);
        setTokensOwed1(0n);
      }
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

  // Helper: Request token spending approvals to NonfungiblePositionManager
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

      // Step A: Approve WMST and USDC for Position Manager
      await approveTokenIfNeeded(wmstToken.address as Address, wmstRaw, "WMST");
      await approveTokenIfNeeded(usdcToken.address as Address, usdcRaw, "USDC");

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

      // Step B: Call createAndInitializePoolIfNecessary
      setStatusText("Initializing Uniswap V3 Pool in wallet...");
      // Calculate initial pool price ratio dynamically based on user's input amounts
      const amount0Float = t0.toLowerCase() === wmstToken.address?.toLowerCase() ? Number(initWmst) : Number(initUsdc);
      const amount1Float = t1.toLowerCase() === wmstToken.address?.toLowerCase() ? Number(initWmst) : Number(initUsdc);
      const priceRatio = amount1Float / amount0Float;
      const sqrtPrice = Math.sqrt(priceRatio);
      const Q96 = 79228162514264337593543950336n;
      const dynamicSqrtPriceX96 = BigInt(Math.floor(sqrtPrice * 1000000000000)) * Q96 / 1000000000000n;

      const initHash = await writeContractAsync({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "createAndInitializePoolIfNecessary",
        args: [t0, t1, initFee, dynamicSqrtPriceX96]
      });

      setStatusText("Waiting for pool initialization confirmation...");
      await publicClient?.waitForTransactionReceipt({ hash: initHash });

      // Step C: Mint position on NonfungiblePositionManager
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
      setStatusText("Pool successfully initialized and concentrated liquidity minted!");
      setInitWmst("");
      setInitUsdc("");
      fetchLPState();
      fetchERC20Balances();
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "Initialization failed.";
      setStatusText(msg.substring(0, 80));
    } finally {
      setIsWorking(false);
    }
  };

  // Action 2: Add Active Liquidity
  const handleAddLiquidity = async () => {
    if (!isConnected || !activeTokenId) return;

    if (!(await ensureMstChain())) {
      return;
    }

    if (!addWmst || !addUsdc) {
      setStatusText("Provide WMST and USDC amounts to add liquidity.");
      return;
    }

    setIsWorking(true);
    setTxHash("");
    setStatusText("Preparing Liquidity Addition...");

    try {
      const wmstRaw = parseUnits(addWmst, wmstToken.decimals);
      const usdcRaw = parseUnits(addUsdc, usdcToken.decimals);

      // Step A: Approve tokens for Position Manager
      await approveTokenIfNeeded(wmstToken.address as Address, wmstRaw, "WMST");
      await approveTokenIfNeeded(usdcToken.address as Address, usdcRaw, "USDC");

      // Sort desired amounts according to token0/token1 addresses
      let amount0Desired = wmstRaw;
      let amount1Desired = usdcRaw;
      if (token0Address.toLowerCase() === usdcToken.address?.toLowerCase()) {
        amount0Desired = usdcRaw;
        amount1Desired = wmstRaw;
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
            tokenId: activeTokenId,
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
      setAddWmst("");
      setAddUsdc("");
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

  // Action 3: Remove Active Liquidity
  const handleRemoveLiquidity = async () => {
    if (!isConnected || !address || !activeTokenId || !lpLiquidity) return;

    if (!(await ensureMstChain())) {
      return;
    }

    setIsWorking(true);
    setTxHash("");
    setStatusText("Preparing Liquidity Removal...");

    try {
      const liqToRemove = (lpLiquidity * BigInt(removePercent)) / 100n;
      
      setStatusText(`Confirming removal of ${removePercent}% liquidity in wallet...`);
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
      const decreaseHash = await writeContractAsync({
        address: CONTRACTS.positionManager,
        abi: nonfungiblePositionManagerAbi,
        functionName: "decreaseLiquidity",
        args: [
          {
            tokenId: activeTokenId,
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
            tokenId: activeTokenId,
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
    if (!isConnected || !address || !activeTokenId) return;

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
            tokenId: activeTokenId,
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

  const walletAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  return (
    <div
      className={`min-h-[calc(100vh-72px)] relative font-sans transition-colors duration-300 ease-in-out select-none overflow-x-hidden pb-20 ${isDark ? "text-white" : "text-zinc-950"}`}
    >



      {/* Main dashboard view grid */}
      <main className="relative z-10 px-4 pt-12 md:pt-20 max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* HEADER SECTION */}
        <div className="lg:col-span-12 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <h1 className="text-5xl md:text-6xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                Liquidity Pool
              </span>
            </h1>
            <p className={`text-base ${isDark ? "text-zinc-400" : "text-zinc-600"} max-w-2xl font-light leading-relaxed`}>
              Manage your concentrated LP position and deploy liquidity across custom price ranges on Uniswap V3.
            </p>
          </motion.div>
        </div>

        {/* LEFT COLUMN (Active Position & Actions - Spans 7 cols) */}
        <div className="lg:col-span-7 space-y-6">

          <AnimatePresence mode="wait">
            {activeTokenId === null ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-12 rounded-2xl border backdrop-blur-md flex flex-col items-center justify-center gap-5 text-center
                  ${isDark ? "bg-[#131A2A]/60 border-[#2C364F]/40" : "bg-white/70 border-zinc-200/60 shadow-lg shadow-black/5"}`}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <HelpCircle size={52} className={`${isDark ? "text-cyan-400/50" : "text-cyan-500/50"}`} />
                </motion.div>
                <div>
                  <h3 className="font-bold text-xl mb-1">Checking Pool State</h3>
                  <p className={`text-sm ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>Querying blockchain for active position</p>
                </div>
              </motion.div>
            ) : activeTokenId === 0n ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-12 rounded-2xl border backdrop-blur-md flex flex-col items-center justify-center gap-5 text-center
                  ${isDark ? "bg-[#131A2A]/60 border-[#2C364F]/40" : "bg-white/70 border-zinc-200/60 shadow-lg shadow-black/5"}`}
              >
                <Coins size={52} className={`${isDark ? "text-zinc-500/50" : "text-zinc-400/50"}`} />
                <div>
                  <h3 className="font-bold text-xl mb-1">No Active Position</h3>
                  <p className={`text-sm ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>Create and initialize a pool on the right panel</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Active Position Details Panel */}
                <div
                  className={`p-7 rounded-2xl border backdrop-blur-md overflow-hidden relative
                    ${isDark ? "bg-[#131A2A]/70 border-[#2C364F]/50 shadow-xl shadow-black/20" : "bg-white/80 border-zinc-200/60 shadow-lg shadow-black/5"}`}
                >
                  <div className="absolute -right-32 -top-32 w-64 h-64 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-3xl" />
                  
                  <div className="relative z-10 flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`inline-block text-[11px] font-bold py-1.5 px-3 rounded-lg mb-2 ${isDark ? "bg-cyan-500/15 text-cyan-400" : "bg-cyan-500/10 text-cyan-600"}`}>
                          NFT Token ID #{activeTokenId.toString()}
                        </span>
                        <h3 className="text-xl font-bold">Your Concentrated Position</h3>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-600"} mb-1`}>Active Range</p>
                        <p className="text-xs font-mono font-bold">{initTickLower} → {initTickUpper}</p>
                      </div>
                    </div>

                    <div className="h-px bg-gradient-to-r from-transparent via-[#2C364F]/20 to-transparent" />

                    <div className="grid grid-cols-2 gap-4">
                      {/* Dynamic Token0 Reserve box (matches lpAmount0) */}
                      <div className={`p-5 rounded-xl border backdrop-blur-sm ${isDark ? "bg-[#1B2236]/50 border-[#2C364F]/30" : "bg-zinc-50/70 border-zinc-200/40"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <TokenLogo symbol={token0Info.symbol} size={18} />
                          <span className={`text-xs font-semibold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{token0Info.symbol} Reserve</span>
                        </div>
                        <span className="text-xl font-bold block">
                          {lpAmount0 !== null ? Number(formatUnits(lpAmount0, token0Info.decimals)).toFixed(4) : "0.0000"}
                        </span>
                        {lpAmount0 !== null && (
                          <span className={`text-xs font-mono font-bold block mt-1.5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            ≈ ${(Number(formatUnits(lpAmount0, token0Info.decimals)) * getTokenPrice(token0Info.symbol)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>

                      {/* Dynamic Token1 Reserve box (matches lpAmount1) */}
                      <div className={`p-5 rounded-xl border backdrop-blur-sm ${isDark ? "bg-[#1B2236]/50 border-[#2C364F]/30" : "bg-zinc-50/70 border-zinc-200/40"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <TokenLogo symbol={token1Info.symbol} size={18} />
                          <span className={`text-xs font-semibold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>{token1Info.symbol} Reserve</span>
                        </div>
                        <span className="text-xl font-bold block">
                          {lpAmount1 !== null ? Number(formatUnits(lpAmount1, token1Info.decimals)).toFixed(4) : "0.0000"}
                        </span>
                        {lpAmount1 !== null && (
                          <span className={`text-xs font-mono font-bold block mt-1.5 ${isDark ? "text-zinc-500" : "text-zinc-400"}`}>
                            ≈ ${(Number(formatUnits(lpAmount1, token1Info.decimals)) * getTokenPrice(token1Info.symbol)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg border ${isDark ? "bg-[#1B2236]/30 border-[#2C364F]/20" : "bg-zinc-50/50 border-zinc-200/30"}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-xs font-semibold ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>Liquidity Amount</span>
                        <span className="text-sm font-bold text-cyan-400">
                          {lpLiquidity !== null ? Number(formatUnits(lpLiquidity, 18)).toFixed(4) : "0.0000"}
                        </span>
                      </div>
                      <a
                        href={`https://testnet.mstscan.com/address/${poolAddress}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`text-xs font-mono underline flex items-center gap-1.5 ${isDark ? "text-zinc-500 hover:text-cyan-400" : "text-zinc-600 hover:text-cyan-600"}`}
                      >
                        Pool: {poolAddress.slice(0, 10)}...{poolAddress.slice(-8)}
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Add Liquidity Operation panel */}
                <div
                  className={`p-7 rounded-2xl border backdrop-blur-md
                    ${isDark ? "bg-[#131A2A]/70 border-[#2C364F]/50 shadow-xl shadow-black/20" : "bg-white/80 border-zinc-200/60 shadow-lg shadow-black/5"}`}
                >
                  <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                    <Plus size={20} className="text-emerald-400" />
                    Add Liquidity to Position
                  </h3>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-bold mb-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                          WMST Amount
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="0.0"
                            value={addWmst}
                            onChange={(e) => setAddWmst(e.target.value)}
                            disabled={isWorking}
                            className={`w-full py-3 px-3.5 rounded-lg border text-sm font-medium outline-none bg-transparent transition
                              ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300/50 focus:border-cyan-500/50"}`}
                          />
                          <span className={`absolute right-3 top-3 text-xs font-bold ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>WMST</span>
                        </div>
                        <span className={`text-xs mt-1.5 block ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>Bal: {wmstBalance}</span>
                      </div>

                      <div>
                        <label className={`block text-xs font-bold mb-2 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                          USDC Amount
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="0.0"
                            value={addUsdc}
                            onChange={(e) => setAddUsdc(e.target.value)}
                            disabled={isWorking}
                            className={`w-full py-3 px-3.5 rounded-lg border text-sm font-medium outline-none bg-transparent transition
                              ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300/50 focus:border-cyan-500/50"}`}
                          />
                          <span className={`absolute right-3 top-3 text-xs font-bold ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>USDC</span>
                        </div>
                        <span className={`text-xs mt-1.5 block ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>Bal: {usdcBalance}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleAddLiquidity}
                      disabled={isWorking || !addWmst || !addUsdc}
                      className={`w-full py-3.5 rounded-lg font-bold text-sm tracking-wide transition-all active:scale-[0.98]
                        ${isWorking || !addWmst || !addUsdc 
                          ? isDark ? "bg-emerald-500/20 text-emerald-400/50" : "bg-emerald-500/15 text-emerald-600/50"
                          : isDark ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10" : "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 shadow-lg shadow-emerald-500/5"
                        }`}
                    >
                      {isWorking ? "Processing..." : "Increase Liquidity"}
                    </button>
                  </div>
                </div>

                {/* Remove Liquidity slider and collect LP fees */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Remove Liquidity card */}
                  <div
                    className={`p-7 rounded-2xl border backdrop-blur-md
                      ${isDark ? "bg-[#131A2A]/70 border-[#2C364F]/50 shadow-xl shadow-black/20" : "bg-white/80 border-zinc-200/60 shadow-lg shadow-black/5"}`}
                  >
                    <h3 className="text-xl font-bold mb-5">Remove Liquidity</h3>
                    
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <label className={`text-xs font-bold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Withdraw Amount</label>
                          <span className="text-sm font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">{removePercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="100"
                          value={removePercent}
                          onChange={(e) => setRemovePercent(Number(e.target.value))}
                          disabled={isWorking}
                          className={`w-full h-2 rounded-lg appearance-none cursor-pointer transition
                            ${isDark ? "bg-[#2C364F]/30" : "bg-zinc-300/30"} accent-red-500`}
                        />
                        <div className="flex justify-between text-[10px] text-zinc-500 mt-2">
                          <span>0%</span>
                          <span>50%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <button
                        onClick={handleRemoveLiquidity}
                        disabled={isWorking || !lpLiquidity || lpLiquidity === 0n}
                        className={`w-full py-3.5 rounded-lg font-bold text-sm transition-all active:scale-[0.98]
                          ${isWorking || !lpLiquidity || lpLiquidity === 0n
                            ? isDark ? "bg-red-500/20 text-red-400/50" : "bg-red-500/15 text-red-600/50"
                            : isDark ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 shadow-lg shadow-red-500/10" : "bg-red-500/15 hover:bg-red-500/25 text-red-600 shadow-lg shadow-red-500/5"
                          }`}
                      >
                        {isWorking ? "Processing..." : "Decrease Liquidity"}
                      </button>
                    </div>
                  </div>

                  {/* Collect fees card */}
                  <div
                    className={`p-7 rounded-2xl border backdrop-blur-md flex flex-col justify-between
                      ${isDark ? "bg-[#131A2A]/70 border-[#2C364F]/50 shadow-xl shadow-black/20" : "bg-white/80 border-zinc-200/60 shadow-lg shadow-black/5"}`}
                  >
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-bold mb-2">LP Fee Rewards</h3>
                        <p className={`text-xs ${isDark ? "text-zinc-400" : "text-zinc-600"} leading-relaxed`}>
                          Accrued fees from swaps within your price range.
                        </p>
                      </div>

                      <div className={`p-4 rounded-xl border space-y-2.5 backdrop-blur-sm ${isDark ? "bg-[#1B2236]/30 border-[#2C364F]/20" : "bg-zinc-50/50 border-zinc-200/30"}`}>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className={`${isDark ? "text-zinc-400" : "text-zinc-600"} flex items-center gap-1.5`}>
                            <TokenLogo symbol={token0Info.symbol} size={14} />
                            {token0Info.symbol} Fees
                          </span>
                          <span className="font-mono text-cyan-400">
                            {tokensOwed0 !== null ? Number(formatUnits(tokensOwed0, token0Info.decimals)).toFixed(6) : "0.000000"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className={`${isDark ? "text-zinc-400" : "text-zinc-600"} flex items-center gap-1.5`}>
                            <TokenLogo symbol={token1Info.symbol} size={14} />
                            {token1Info.symbol} Fees
                          </span>
                          <span className="font-mono text-cyan-400">
                            {tokensOwed1 !== null ? Number(formatUnits(tokensOwed1, token1Info.decimals)).toFixed(6) : "0.000000"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleCollectFees}
                      disabled={isWorking}
                      className={`w-full py-3.5 rounded-lg font-bold text-sm mt-6 transition-all active:scale-[0.98]
                        ${isWorking 
                          ? isDark ? "bg-amber-500/20 text-amber-400/50" : "bg-amber-500/15 text-amber-600/50"
                          : isDark ? "bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10" : "bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 shadow-lg shadow-amber-500/5"
                        }`}
                    >
                      {isWorking ? "Collecting..." : "Collect Fees"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Working status feedback box */}
          <AnimatePresence>
            {statusText && (
              <motion.div
                initial={{ height: 0, opacity: 0, y: -10 }}
                animate={{ height: "auto", opacity: 1, y: 0 }}
                exit={{ height: 0, opacity: 0, y: -10 }}
                className="overflow-hidden"
              >
                <div
                  className={`p-5 rounded-xl border backdrop-blur-sm text-xs font-medium leading-relaxed
                    ${
                      statusText.includes("minted") || statusText.includes("added") || statusText.includes("removed") || statusText.includes("collected")
                        ? isDark ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700"
                        : isDark ? "bg-blue-500/15 border-blue-500/30 text-blue-400" : "bg-blue-500/10 border-blue-500/20 text-blue-700"
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span>{statusText}</span>
                    <button
                      onClick={() => setStatusText("")}
                      className={`text-[10px] uppercase font-bold ${isDark ? "hover:text-white" : "hover:text-black"} transition`}
                    >
                      ✕
                    </button>
                  </div>
                  {txHash && (
                    <div className={`text-[10px] font-mono mt-2 pt-2 border-t ${isDark ? "border-blue-500/20" : "border-blue-500/10"}`}>
                      <a 
                        href={`https://testnet.mstscan.com/tx/${txHash}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="flex items-center gap-1.5 hover:underline"
                      >
                        {txHash.slice(0, 16)}...{txHash.slice(-12)}
                        <ExternalLink size={9} />
                      </a>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT COLUMN (Create Pool Panel - Spans 5 cols) */}
        <div className="lg:col-span-5">
          <div
            className={`p-8 rounded-2xl border backdrop-blur-md relative
              ${
                isDark
                  ? "bg-[#131A2A]/70 border-[#2C364F]/50 shadow-xl shadow-black/20"
                  : "bg-white/80 border-zinc-200/60 shadow-lg shadow-black/5"
              }`}
          >
            <div className="absolute -right-40 -top-40 w-80 h-80 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="mb-6">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
                  <Coins size={24} className="text-cyan-400" />
                  Create Pool
                </h2>
                <p className={`text-sm ${isDark ? "text-zinc-400" : "text-zinc-600"} leading-relaxed`}>
                  Deploy a new concentrated liquidity pool and initialize your first position.
                </p>
              </div>

              <div className="space-y-5">
                {/* Fee Tier */}
                <div>
                  <label className={`block text-xs font-bold mb-3 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Pool Fee Tier
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[500, 3000, 10000].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setInitFee(fee)}
                        className={`py-3 px-3 rounded-lg border text-xs font-bold transition-all
                          ${
                            initFee === fee
                              ? isDark ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/10" : "bg-cyan-500/15 border-cyan-500/30 text-cyan-600 shadow-lg shadow-cyan-500/5"
                              : isDark ? "bg-[#1B2236]/50 border-[#2C364F]/30 text-zinc-400 hover:border-[#2C364F]/60" : "bg-zinc-50/50 border-zinc-300/30 text-zinc-600 hover:border-zinc-300/60"
                          }`}
                      >
                        {(fee / 10000).toFixed(2)}%
                        <div className="text-[10px] font-normal mt-0.5 opacity-75">
                          {fee === 3000 ? "Typical" : fee === 500 ? "Stable" : "Exotic"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Token inputs */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className={`text-xs font-bold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Initial WMST</label>
                      <span className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>Bal: {wmstBalance}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="0.0"
                        value={initWmst}
                        onChange={(e) => setInitWmst(e.target.value)}
                        disabled={isWorking}
                        className={`w-full py-3 px-3.5 rounded-lg border text-sm font-medium outline-none bg-transparent transition
                          ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300/50 focus:border-cyan-500/50"}`}
                      />
                      <div className="absolute right-3 top-3 flex items-center gap-1">
                        <TokenLogo symbol="WMST" size={16} />
                        <span className="text-xs font-bold">WMST</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className={`text-xs font-bold ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>Initial USDC</label>
                      <span className={`text-xs ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>Bal: {usdcBalance}</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="0.0"
                        value={initUsdc}
                        onChange={(e) => setInitUsdc(e.target.value)}
                        disabled={isWorking}
                        className={`w-full py-3 px-3.5 rounded-lg border text-sm font-medium outline-none bg-transparent transition
                          ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300/50 focus:border-cyan-500/50"}`}
                      />
                      <div className="absolute right-3 top-3 flex items-center gap-1">
                        <TokenLogo symbol="USDC" size={16} />
                        <span className="text-xs font-bold">USDC</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tick bounds */}
                <div>
                  <label className={`block text-xs font-bold mb-3 ${isDark ? "text-zinc-400" : "text-zinc-600"}`}>
                    Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="number"
                        value={initTickLower}
                        onChange={(e) => setInitTickLower(e.target.value)}
                        disabled={isWorking}
                        className={`w-full py-3 px-3 rounded-lg border text-xs font-mono outline-none bg-transparent transition
                          ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300/50 focus:border-cyan-500/50"}`}
                      />
                      <span className={`text-[10px] mt-1.5 block ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>Lower Tick</span>
                    </div>

                    <div>
                      <input
                        type="number"
                        value={initTickUpper}
                        onChange={(e) => setInitTickUpper(e.target.value)}
                        disabled={isWorking}
                        className={`w-full py-3 px-3 rounded-lg border text-xs font-mono outline-none bg-transparent transition
                          ${isDark ? "border-[#2C364F]/50 focus:border-cyan-500/50" : "border-zinc-300/50 focus:border-cyan-500/50"}`}
                      />
                      <span className={`text-[10px] mt-1.5 block ${isDark ? "text-zinc-500" : "text-zinc-600"}`}>Upper Tick</span>
                    </div>
                  </div>
                </div>

                {/* Info banner */}
                <div className={`p-4 rounded-lg border flex items-start gap-3 text-xs leading-relaxed
                  ${isDark ? "bg-[#1B2236]/50 border-cyan-500/20 text-zinc-400" : "bg-cyan-50/50 border-cyan-300/20 text-zinc-700"}`}>
                  <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <p className={`font-bold mb-1 ${isDark ? "text-cyan-400" : "text-cyan-700"}`}>Price Initialization</p>
                    Deploys at your input token ratio dynamically. Full-range concentrated position enabled by default.
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={handleInitializePool}
                  disabled={isWorking || !initWmst || !initUsdc}
                  className={`w-full py-4 rounded-lg font-bold text-sm tracking-wide transition-all active:scale-[0.98]
                    ${isWorking || !initWmst || !initUsdc 
                      ? isDark ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400/50" : "bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-cyan-600/50"
                      : isDark ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 hover:from-cyan-500/40 hover:to-blue-500/40 text-cyan-400 shadow-lg shadow-cyan-500/20" : "bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/35 hover:to-blue-500/35 text-cyan-600 shadow-lg shadow-cyan-500/10"
                    }`}
                >
                  {isWorking ? "Deploying..." : "Initialize Pool"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

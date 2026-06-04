import { formatUnits, parseUnits, type Address, type PublicClient } from "viem";
import { ERC20_ABI } from "@/config/uniswap";
import { TOKENS, tokensForChain, type Token } from "@/config/tokens";
import type {
  Portfolio,
  PortfolioActivity,
  PortfolioActivityType,
  PortfolioAsset,
  PortfolioChartPoint,
  PortfolioPosition,
} from "../types";
import { SUPPORTED_CHAINS } from "@/config/wagmi";
import { CONTRACTS, quoterV2Abi, V3_FEE, ZERO_SQRT_PRICE_LIMIT, testingExecutorAbi, lpStateStorageAbi, nonfungiblePositionManagerAbi } from "@/config/contracts";
import { mstChain } from "@/config/chains";
import { getAmountsForLiquidity } from "@/utils/uniswap-math";
import { fetchUserSwapsFromSubgraph } from "./subgraph.service";

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

const CHAIN_NATIVE_SYMBOL: Record<number, string> = {
  1: "ETH",
  8453: "ETH",
  42161: "ETH",
  10: "ETH",
  137: "MATIC",
  91562037: "MST",
};

function tokenPrice(symbol: string) {
  const token = TOKENS.find((entry) => entry.symbol === symbol);
  return token?.priceUsd ?? 0;
}

function chainLabel(chainId: number) {
  return SUPPORTED_CHAINS.find((chain) => chain.id === chainId)?.name ?? "Network";
}

function nativeTokenForChain(chainId: number): Token | null {
  const symbol = CHAIN_NATIVE_SYMBOL[chainId] ?? "ETH";
  return TOKENS.find((token) => token.symbol === symbol) ?? null;
}

function safeNumber(value: bigint, decimals: number) {
  return Number(formatUnits(value, decimals));
}

export interface WalletPortfolioSnapshot {
  portfolio: Portfolio;
  assets: PortfolioAsset[];
  activity: PortfolioActivity[];
  positions: PortfolioPosition[];
  chartPoint: PortfolioChartPoint;
}

export async function getWalletPortfolioSnapshot({
  address,
  chainId,
  publicClient,
}: {
  address: Address;
  chainId: number;
  publicClient: PublicClient;
}): Promise<WalletPortfolioSnapshot> {
  // Fetch live MST price from pool dynamically
  let liveMstPrice = 0.5; // Default fallback price of $0.50 for tMST
  try {
    const wmstAddress = CONTRACTS.wmst;
    const usdcAddress = CONTRACTS.usdc;
    if (wmstAddress && usdcAddress) {
      const oneUnitRaw = parseUnits("1", 18);
      const { result } = await publicClient.simulateContract({
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

      if (result) {
        liveMstPrice = Number(formatUnits(result[0], 18));
      }
    }
  } catch (err) {
    console.error("Error fetching live MST price in portfolio service", err);
  }
  if (liveMstPrice <= 0) {
    liveMstPrice = 0.5; // Fallback nominal price
  }

  // Fetch activeTokenId from TestingExecutor
  let activeTokenId = 0n;
  try {
    const tokenId = await publicClient.readContract({
      address: CONTRACTS.testingExecutor,
      abi: testingExecutorAbi,
      functionName: "activeTokenId"
    });
    activeTokenId = tokenId;
  } catch (err) {
    console.error("Error fetching activeTokenId in portfolio service", err);
  }

  const portfolioTokens = tokensForChain(chainId);
  
  // We can construct a Promise.all for all the read queries
  const balancesPromise = Promise.all([
    publicClient.getBalance({ address }),
    Promise.all(
      portfolioTokens.map(async (token) => {
        try {
          const balance = await publicClient.readContract({
            abi: ERC20_ABI,
            address: token.address as Address,
            functionName: "balanceOf",
            args: [address],
          });
          return { result: balance };
        } catch (err) {
          console.error(`Error reading balance for ${token.symbol}`, err);
          return { result: 0n };
        }
      })
    ),
  ]);

  const lpPromise = activeTokenId > 0n
    ? Promise.all([
        publicClient.readContract({
          address: CONTRACTS.lpStateStorage,
          abi: lpStateStorageAbi,
          functionName: "lpLiquidity"
        }),
        publicClient.readContract({
          address: CONTRACTS.lpStateStorage,
          abi: lpStateStorageAbi,
          functionName: "lpAmount0"
        }),
        publicClient.readContract({
          address: CONTRACTS.lpStateStorage,
          abi: lpStateStorageAbi,
          functionName: "lpAmount1"
        }),
        publicClient.readContract({
          address: CONTRACTS.lpStateStorage,
          abi: lpStateStorageAbi,
          functionName: "poolAddress"
        }),
        publicClient.readContract({
          address: CONTRACTS.positionManager,
          abi: nonfungiblePositionManagerAbi,
          functionName: "positions",
          args: [activeTokenId]
        })
      ])
    : Promise.resolve(null);

  const [balancesResult, lpResult] = await Promise.all([
    balancesPromise,
    lpPromise
  ]);

  const [nativeBalance, tokenBalances] = balancesResult;

  const nativeToken = nativeTokenForChain(chainId);
  const nativePrice = nativeToken ? (nativeToken.symbol === "MST" || nativeToken.symbol === "tMST" ? liveMstPrice : nativeToken.priceUsd ?? 0) : 0;
  const nativeValueUsd = nativeToken ? safeNumber(nativeBalance, nativeToken.decimals) * nativePrice : 0;

  const assets: PortfolioAsset[] = [];

  if (nativeToken) {
    const balance = safeNumber(nativeBalance, nativeToken.decimals);
    assets.push({
      id: `native-${chainId}`,
      symbol: nativeToken.symbol,
      name: nativeToken.name,
      network: chainLabel(chainId),
      chainId,
      priceUsd: nativePrice,
      balance,
      valueUsd: nativeValueUsd,
      change24h: 0,
      allocation: 0,
      address: nativeToken.address ?? "",
    });
  }

  portfolioTokens.forEach((token, index) => {
    const raw = tokenBalances[index] as { result?: unknown } | undefined;
    const balance = typeof raw?.result === "bigint" ? raw.result : 0n;

    const tokenPriceValue = token.symbol === "USDC" ? 1.0 : (token.symbol === "WMST" ? liveMstPrice : token.priceUsd ?? 0);
    const amount = safeNumber(balance, token.decimals);
    const valueUsd = amount * tokenPriceValue;

    assets.push({
      id: token.symbol.toLowerCase(),
      symbol: token.symbol,
      name: token.name,
      network: chainLabel(chainId),
      chainId,
      priceUsd: tokenPriceValue,
      balance: amount,
      valueUsd,
      change24h: 0,
      allocation: 0,
      address: token.address ?? "",
    });
  });

  const positions: PortfolioPosition[] = [];
  let lpValueUsd = 0;

  if (activeTokenId > 0n && lpResult) {
    const [lpLiquidity, lpAmount0, lpAmount1, poolAddress, positionInfo] = lpResult as [bigint, bigint, bigint, string, any];
    
    const token0Address = positionInfo[2] as Address;
    const token1Address = positionInfo[3] as Address;
    const tokensOwed0 = positionInfo[10] as bigint;
    const tokensOwed1 = positionInfo[11] as bigint;

    const wmstToken = TOKENS.find((token) => token.symbol === "WMST") || { symbol: "WMST", decimals: 18, address: CONTRACTS.wmst };
    const usdcToken = TOKENS.find((token) => token.symbol === "USDC") || { symbol: "USDC", decimals: 18, address: CONTRACTS.usdc };

    const match0 = TOKENS.find((token) => token.address?.toLowerCase() === token0Address.toLowerCase());
    const token0Info = match0 || (token0Address.toLowerCase() === CONTRACTS.usdc?.toLowerCase() ? usdcToken : { symbol: "USDC", decimals: 18, address: token0Address });

    const match1 = TOKENS.find((token) => token.address?.toLowerCase() === token1Address.toLowerCase());
    const token1Info = match1 || (token1Address.toLowerCase() === CONTRACTS.wmst?.toLowerCase() ? wmstToken : { symbol: "WMST", decimals: 18, address: token1Address });

    const price0 = token0Info.symbol === "USDC" ? 1.0 : (token0Info.symbol === "WMST" || token0Info.symbol === "MST" || token0Info.symbol === "tMST" ? liveMstPrice : (token0Info as any).priceUsd ?? 0);
    const price1 = token1Info.symbol === "USDC" ? 1.0 : (token1Info.symbol === "WMST" || token1Info.symbol === "MST" || token1Info.symbol === "tMST" ? liveMstPrice : (token1Info as any).priceUsd ?? 0);

    let finalAmt0 = lpAmount0;
    let finalAmt1 = lpAmount1;

    if (poolAddress && poolAddress !== "0x0000000000000000000000000000000000000000") {
      try {
        const slot0 = await publicClient.readContract({
          address: poolAddress as Address,
          abi: poolAbi,
          functionName: "slot0"
        });
        const sqrtPriceX96 = slot0[0];
        const tickLower = positionInfo[5];
        const tickUpper = positionInfo[6];
        const [calcAmt0, calcAmt1] = getAmountsForLiquidity(
          lpLiquidity,
          sqrtPriceX96,
          tickLower,
          tickUpper
        );
        finalAmt0 = calcAmt0;
        finalAmt1 = calcAmt1;
      } catch (mathErr) {
        console.error("Failed calculating V3 reserves in portfolio, using storage fallback", mathErr);
      }
    }

    const val0 = safeNumber(finalAmt0, token0Info.decimals) * price0;
    const val1 = safeNumber(finalAmt1, token1Info.decimals) * price1;
    const liquidityUsd = val0 + val1;
    lpValueUsd = liquidityUsd;

    const fees0 = safeNumber(tokensOwed0, token0Info.decimals) * price0;
    const fees1 = safeNumber(tokensOwed1, token1Info.decimals) * price1;
    const feesEarnedUsd = fees0 + fees1;

    positions.push({
      id: activeTokenId.toString(),
      pool: `${token0Info.symbol} / ${token1Info.symbol} 0.30%`,
      assets: [token0Info.symbol, token1Info.symbol],
      network: chainLabel(chainId),
      liquidityUsd,
      apr: 12.4,
      feesEarnedUsd,
      status: "In Range",
      hash: poolAddress,
    });
  }

  // Fetch on-chain transaction activity
  let activity: PortfolioActivity[] = [];
  try {
    console.log(`Querying transaction history from GraphQL Subgraph for ${address}...`);
    activity = await fetchUserSwapsFromSubgraph(address, chainId);
  } catch (subgraphErr) {
    console.warn("GraphQL Subgraph query failed, falling back to direct on-chain logs query", subgraphErr);
    try {
      let logs: any[] = [];
      let approvals: any[] = [];
      
      // Fetch logs in parallel
      const [sentLogs, receivedLogs, approvalLogs] = await Promise.all([
        publicClient.getLogs({
          address: [CONTRACTS.usdc, CONTRACTS.wmst],
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', name: 'from', indexed: true },
              { type: 'address', name: 'to', indexed: true },
              { type: 'uint256', name: 'value' }
            ]
          },
          args: {
            from: address
          },
          fromBlock: 0n
        }).catch(() => []),
        publicClient.getLogs({
          address: [CONTRACTS.usdc, CONTRACTS.wmst],
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', name: 'from', indexed: true },
              { type: 'address', name: 'to', indexed: true },
              { type: 'uint256', name: 'value' }
            ]
          },
          args: {
            to: address
          },
          fromBlock: 0n
        }).catch(() => []),
        publicClient.getLogs({
          address: [CONTRACTS.usdc, CONTRACTS.wmst],
          event: {
            type: 'event',
            name: 'Approval',
            inputs: [
              { type: 'address', name: 'owner', indexed: true },
              { type: 'address', name: 'spender', indexed: true },
              { type: 'uint256', name: 'value' }
            ]
          },
          args: {
            owner: address
          },
          fromBlock: 0n
        }).catch(() => [])
      ]);

      logs = [...sentLogs, ...receivedLogs];
      approvals = approvalLogs;

      // Get unique block numbers to fetch timestamps
      const uniqueBlocks = Array.from(new Set([...logs, ...approvals].map(l => l.blockNumber).filter(Boolean))) as bigint[];
      const blockTimestamps: Record<string, number> = {};
      if (uniqueBlocks.length > 0) {
        try {
          const blocksToFetch = uniqueBlocks.slice(0, 10);
          const blockData = await Promise.all(
            blocksToFetch.map(b => publicClient.getBlock({ blockNumber: b }))
          );
          blockData.forEach(b => {
            blockTimestamps[b.number.toString()] = Number(b.timestamp) * 1000;
          });
        } catch (err) {
          console.error("Error fetching block timestamps", err);
        }
      }

      // Group logs by transaction hash
      const logsByTx: Record<string, any[]> = {};
      for (const log of logs) {
        const hash = log.transactionHash;
        if (!hash) continue;
        if (!logsByTx[hash]) {
          logsByTx[hash] = [];
        }
        logsByTx[hash].push(log);
      }

      for (const [hash, txLogs] of Object.entries(logsByTx)) {
        txLogs.sort((a, b) => (a.logIndex ?? 0) - (b.logIndex ?? 0));
        
        const userOut = txLogs.find(l => l.args?.from?.toLowerCase() === address.toLowerCase());
        const userIn = txLogs.find(l => l.args?.to?.toLowerCase() === address.toLowerCase());
        
        const firstLog = txLogs[0];
        const blockNum = firstLog.blockNumber;
        const timestamp = blockTimestamps[blockNum?.toString() || ""] || Date.now();
        
        const hasRouter = txLogs.some(l => 
          [CONTRACTS.swapRouter?.toLowerCase(), CONTRACTS.testingExecutor?.toLowerCase()].includes(l.args?.from?.toLowerCase() || "") ||
          [CONTRACTS.swapRouter?.toLowerCase(), CONTRACTS.testingExecutor?.toLowerCase()].includes(l.args?.to?.toLowerCase() || "")
        );
        
        const hasPositionManager = txLogs.some(l =>
          [CONTRACTS.positionManager?.toLowerCase()].includes(l.args?.from?.toLowerCase() || "") ||
          [CONTRACTS.positionManager?.toLowerCase()].includes(l.args?.to?.toLowerCase() || "")
        );

        if (userOut && userIn && (hasRouter || hasPositionManager || txLogs.length >= 2)) {
          const tokenOut = TOKENS.find(t => t.address?.toLowerCase() === userOut.address?.toLowerCase());
          const tokenIn = TOKENS.find(t => t.address?.toLowerCase() === userIn.address?.toLowerCase());
          
          if (tokenOut && tokenIn) {
            const amountOut = safeNumber(userOut.args.value, tokenOut.decimals);
            const amountIn = safeNumber(userIn.args.value, tokenIn.decimals);
            
            const priceOut = tokenOut.symbol === "USDC" ? 1.0 : (tokenOut.symbol === "WMST" || tokenOut.symbol === "MST" ? liveMstPrice : tokenOut.priceUsd ?? 0);
            const amountUsd = amountOut * priceOut;
            
            activity.push({
              id: hash,
              type: hasPositionManager ? "liquidity" : "swap",
              asset: `${tokenOut.symbol} → ${tokenIn.symbol}`,
              amount: amountIn,
              amountUsd,
              network: chainLabel(chainId),
              hash,
              timestamp,
              status: "confirmed",
              explorerUrl: `${mstChain.blockExplorers.default.url}/tx/${hash}`
            });
            continue;
          }
        }
        
        for (const log of txLogs) {
          const token = TOKENS.find(t => t.address?.toLowerCase() === log.address?.toLowerCase());
          if (!token) continue;
          
          const valueRaw = log.args?.value;
          if (typeof valueRaw !== 'bigint') continue;
          
          const amount = safeNumber(valueRaw, token.decimals);
          const price = token.symbol === "USDC" ? 1.0 : (token.symbol === "WMST" || token.symbol === "MST" ? liveMstPrice : token.priceUsd ?? 0);
          const amountUsd = amount * price;
          
          const from = log.args?.from;
          let type: PortfolioActivity["type"] = "send";
          if (from?.toLowerCase() === address.toLowerCase()) {
            type = "send";
          } else {
            type = "receive";
          }
          
          if (hasPositionManager) {
            type = "liquidity";
          } else if (hasRouter) {
            type = "swap";
          }
          
          activity.push({
            id: `${hash}-${log.logIndex}`,
            type,
            asset: token.symbol,
            amount,
            amountUsd,
            network: chainLabel(chainId),
            hash,
            timestamp,
            status: "confirmed",
            explorerUrl: `${mstChain.blockExplorers.default.url}/tx/${hash}`
          });
        }
      }

      for (const log of approvals) {
        const hash = log.transactionHash;
        if (!hash) continue;
        
        const token = TOKENS.find(t => t.address?.toLowerCase() === log.address?.toLowerCase());
        if (!token) continue;
        
        const valueRaw = log.args?.value;
        if (typeof valueRaw !== 'bigint') continue;
        
        const amount = safeNumber(valueRaw, token.decimals);
        const price = token.symbol === "USDC" ? 1.0 : (token.symbol === "WMST" || token.symbol === "MST" ? liveMstPrice : token.priceUsd ?? 0);
        const amountUsd = amount * price;
        
        activity.push({
          id: `${hash}-approve-${log.logIndex}`,
          type: "approve",
          asset: token.symbol,
          amount,
          amountUsd,
          network: chainLabel(chainId),
          hash,
          timestamp: blockTimestamps[log.blockNumber?.toString() || ""] || Date.now(),
          status: "confirmed",
          explorerUrl: `${mstChain.blockExplorers.default.url}/tx/${hash}`
        });
      }
      
      activity.sort((a, b) => b.timestamp - a.timestamp);
    } catch (logErr) {
      console.error("Error processing transaction logs in portfolio service fallback", logErr);
    }
  }

  const totalValueUsd = assets.reduce((sum, asset) => sum + asset.valueUsd, 0) + lpValueUsd;
  const sortedAssets = [...assets].sort((a, b) => b.valueUsd - a.valueUsd);

  const withAllocation = sortedAssets.map((asset) => ({
    ...asset,
    allocation: totalValueUsd > 0 ? (asset.valueUsd / totalValueUsd) * 100 : 0,
  }));

  const largestHolding = withAllocation[0];


  const portfolio: Portfolio = {
    address,
    portfolioName: "Connected Wallet",
    walletLabel: chainLabel(chainId),
    ensName: null,
    valueUsd: totalValueUsd,
    change24h: 0,
    networkCount: totalValueUsd > 0 ? 1 : 0,
    assetCount: withAllocation.length,
    stats: {
      totalAssets: withAllocation.length,
      totalNetworks: totalValueUsd > 0 ? 1 : 0,
      totalPositions: positions.length,
      transactions: activity.length,
      portfolioChange24h: 0,
      largestHolding: largestHolding
        ? {
            symbol: largestHolding.symbol,
            valueUsd: largestHolding.valueUsd,
            allocation: totalValueUsd > 0 ? (largestHolding.valueUsd / totalValueUsd) * 100 : 0,
          }
        : { symbol: "—", valueUsd: 0, allocation: 0 },
    },
  };

  return {
    portfolio,
    assets: withAllocation,
    activity,
    positions,
    chartPoint: {
      time: Math.floor(Date.now() / 1000),
      value: totalValueUsd,
    },
  };
}

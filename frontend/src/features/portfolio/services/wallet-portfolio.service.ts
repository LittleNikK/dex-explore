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
import { CONTRACTS, quoterV2Abi, V3_FEE, ZERO_SQRT_PRICE_LIMIT } from "@/config/contracts";
import { MOCK_ACTIVITY, MOCK_POSITIONS } from "../mock/portfolio.mock";

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

  const portfolioTokens = tokensForChain(chainId);
  const [nativeBalance, tokenBalances] = await Promise.all([
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

  const nativeToken = nativeTokenForChain(chainId);
  const nativePrice = nativeToken ? (nativeToken.symbol === "MST" ? liveMstPrice : nativeToken.priceUsd ?? 0) : 0;
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

  const totalValueUsd = assets.reduce((sum, asset) => sum + asset.valueUsd, 0);
  const sortedAssets = [...assets].sort((a, b) => b.valueUsd - a.valueUsd);

  const withAllocation = sortedAssets.map((asset) => ({
    ...asset,
    allocation: totalValueUsd > 0 ? (asset.valueUsd / totalValueUsd) * 100 : 0,
  }));

  const largestHolding = withAllocation[0];

  const parsedActivities: PortfolioActivity[] = [];

  try {
    const transferInterface = {
      type: "event",
      name: "Transfer",
      inputs: [
        { type: "address", name: "from", indexed: true },
        { type: "address", name: "to", indexed: true },
        { type: "uint256", name: "value" }
      ]
    } as const;

    const [sentLogs, receivedLogs] = await Promise.all([
      publicClient.getLogs({
        event: transferInterface,
        args: {
          from: address
        },
        fromBlock: 0n,
        toBlock: "latest"
      }).catch(() => []),
      publicClient.getLogs({
        event: transferInterface,
        args: {
          to: address
        },
        fromBlock: 0n,
        toBlock: "latest"
      }).catch(() => [])
    ]);

    const logsByHash: Record<string, any[]> = {};
    for (const log of [...sentLogs, ...receivedLogs]) {
      if (!log.transactionHash) continue;
      if (!logsByHash[log.transactionHash]) {
        logsByHash[log.transactionHash] = [];
      }
      if (!logsByHash[log.transactionHash].some(l => l.logIndex === log.logIndex)) {
        logsByHash[log.transactionHash].push(log);
      }
    }

    const tokenByAddress = (addr: string) => {
      return TOKENS.find(t => t.address?.toLowerCase() === addr.toLowerCase());
    };

    for (const [hash, txLogs] of Object.entries(logsByHash)) {
      try {
        const sends = txLogs.filter(l => l.args.from?.toLowerCase() === address.toLowerCase());
        const receives = txLogs.filter(l => l.args.to?.toLowerCase() === address.toLowerCase());

        let type: PortfolioActivityType = "send";
        let assetLabel = "";
        let amount = 0;
        let amountUsd = 0;

        const txObj = await publicClient.getTransaction({ hash: hash as Address }).catch(() => null);
        const nativeValueSent = txObj && txObj.from.toLowerCase() === address.toLowerCase() ? Number(formatUnits(txObj.value, 18)) : 0;

        if (sends.length > 0 && receives.length > 0) {
          type = "swap";
          const sendToken = tokenByAddress(sends[0].address);
          const receiveToken = tokenByAddress(receives[0].address);
          
          if (sendToken && receiveToken) {
            assetLabel = `${sendToken.symbol} → ${receiveToken.symbol}`;
            amount = Number(formatUnits(receives[0].args.value || 0n, receiveToken.decimals));
            const price = receiveToken.symbol === "USDC" ? 1.0 : (receiveToken.symbol === "WMST" ? liveMstPrice : receiveToken.priceUsd ?? 0);
            amountUsd = amount * price;
          } else {
            continue;
          }
        } else if (sends.length > 0) {
          const sendToken = tokenByAddress(sends[0].address);
          if (sendToken) {
            const isSwapToNative = txObj && txObj.to?.toLowerCase() === CONTRACTS.swapRouter.toLowerCase();
            if (isSwapToNative) {
              type = "swap";
              assetLabel = `${sendToken.symbol} → MST`;
              amount = Number(formatUnits(sends[0].args.value || 0n, sendToken.decimals));
              const sendPrice = sendToken.symbol === "USDC" ? 1.0 : (sendToken.symbol === "WMST" ? liveMstPrice : sendToken.priceUsd ?? 0);
              amountUsd = amount * sendPrice;
            } else {
              type = "send";
              assetLabel = sendToken.symbol;
              amount = Number(formatUnits(sends[0].args.value || 0n, sendToken.decimals));
              const price = sendToken.symbol === "USDC" ? 1.0 : (sendToken.symbol === "WMST" ? liveMstPrice : sendToken.priceUsd ?? 0);
              amountUsd = amount * price;
            }
          } else {
            continue;
          }
        } else if (receives.length > 0) {
          const receiveToken = tokenByAddress(receives[0].address);
          if (receiveToken) {
            if (nativeValueSent > 0) {
              type = "swap";
              assetLabel = `MST → ${receiveToken.symbol}`;
              amount = Number(formatUnits(receives[0].args.value || 0n, receiveToken.decimals));
              const price = receiveToken.symbol === "USDC" ? 1.0 : (receiveToken.symbol === "WMST" ? liveMstPrice : receiveToken.priceUsd ?? 0);
              amountUsd = amount * price;
            } else {
              type = "receive";
              assetLabel = receiveToken.symbol;
              amount = Number(formatUnits(receives[0].args.value || 0n, receiveToken.decimals));
              const price = receiveToken.symbol === "USDC" ? 1.0 : (receiveToken.symbol === "WMST" ? liveMstPrice : receiveToken.priceUsd ?? 0);
              amountUsd = amount * price;
            }
          } else {
            continue;
          }
        } else {
          continue;
        }

        let timestamp = Date.now();
        const firstLog = txLogs[0];
        if (firstLog.blockNumber) {
          const block = await publicClient.getBlock({ blockNumber: firstLog.blockNumber }).catch(() => null);
          if (block && block.timestamp) {
            timestamp = Number(block.timestamp) * 1000;
          }
        }

        parsedActivities.push({
          id: `${address}-${hash}`,
          type,
          asset: assetLabel,
          amount,
          amountUsd,
          network: chainLabel(chainId),
          hash,
          timestamp,
          status: "confirmed",
          explorerUrl: `https://testnet.mstscan.com/tx/${hash}`,
        });
      } catch (err) {
        console.error(`Error parsing tx logs for hash ${hash}`, err);
      }
    }
  } catch (err) {
    console.error("General error querying transfer logs for activity", err);
  }

  const sortedActivities = parsedActivities.sort((a, b) => b.timestamp - a.timestamp);
  const activity: PortfolioActivity[] = sortedActivities;

  const positions: PortfolioPosition[] = [];

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
            allocation: largestHolding.allocation,
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

import { formatUnits, parseUnits, type Address } from "viem";
import { publicClient } from "../config/client.js";
import addresses from "../config/addresses.json" with { type: "json" };

const FEE = 0.997; // 0.3% fee approximation per hop

const erc20Abi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }]
  }
] as const;

interface PoolEdge {
  to: string;
  reserveIn: number;
  reserveOut: number;
}

type PoolGraph = Record<string, PoolEdge[]>;

export class Sor {
  private normalizeToken(tokenStr: string): string {
    const normalized = tokenStr.trim().toLowerCase();
    const wmstAddr = (addresses.WMST_ADDRESS as string).toLowerCase();
    const usdcAddr = (addresses.USDC_ADDRESS as string).toLowerCase();

    if (normalized === "mst" || normalized === "tmst" || normalized === "wmst" || normalized === wmstAddr) {
      return "WMST";
    }
    if (normalized === "usdc" || normalized === usdcAddr) {
      return "USDC";
    }
    return tokenStr.toUpperCase();
  }

  private hopOut(amountIn: number, reserveIn: number, reserveOut: number) {
    const amountInWithFee = amountIn * FEE;
    return (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
  }

  async findBestRoute(tokenIn: string, tokenOut: string, amountIn: bigint) {
    const start = this.normalizeToken(tokenIn);
    const goal = this.normalizeToken(tokenOut);

    const wmstAddress = addresses.WMST_ADDRESS as Address;
    const usdcAddress = addresses.USDC_ADDRESS as Address;
    const poolId = addresses.POOL_ADDRESS as Address;
    const quoterAddress = addresses.QUOTER_V2_ADDRESS as Address;

    let wmstBal = 0n;
    let usdcBal = 0n;
    let wDec = 18;
    let uDec = 18;

    try {
      // 1. Fetch dynamic pool reserves and decimals on-chain
      const [wBal, uBal, wDecimals, uDecimals] = await Promise.all([
        publicClient.readContract({
          address: wmstAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [poolId]
        }),
        publicClient.readContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [poolId]
        }),
        publicClient.readContract({
          address: wmstAddress,
          abi: erc20Abi,
          functionName: "decimals"
        }),
        publicClient.readContract({
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "decimals"
        })
      ]);

      wmstBal = wBal;
      usdcBal = uBal;
      wDec = Number(wDecimals);
      uDec = Number(uDecimals);
    } catch (err) {
      console.error("Error reading token details in SOR", err);
    }

    const decimals: Record<string, number> = {
      WMST: wDec,
      USDC: uDec
    };

    const wmstReserve = Number(formatUnits(wmstBal, decimals.WMST));
    const usdcReserve = Number(formatUnits(usdcBal, decimals.USDC));

    const graph: PoolGraph = {
      WMST: [{ to: "USDC", reserveIn: wmstReserve, reserveOut: usdcReserve }],
      USDC: [{ to: "WMST", reserveIn: usdcReserve, reserveOut: wmstReserve }]
    };

    // Calculate approximate output using constant product formula
    const amtFloat = Number(amountIn) / 10 ** (decimals[start] ?? 18);
    const edge = (graph[start] ?? []).find(e => e.to === goal);
    
    let approxOutFloat = 0;
    if (edge && edge.reserveIn > 0 && edge.reserveOut > 0) {
      approxOutFloat = this.hopOut(amtFloat, edge.reserveIn, edge.reserveOut);
    }
    let amountOutBigInt = BigInt(Math.floor(approxOutFloat * 10 ** (decimals[goal] ?? 18)));

    // 2. Perform live simulation call to QuoterV2 for exact dynamic rates
    if (amountIn > 0n && start !== goal) {
      try {
        const tokenInAddress = start === "WMST" ? wmstAddress : usdcAddress;
        const tokenOutAddress = goal === "WMST" ? wmstAddress : usdcAddress;

        const { result } = await publicClient.simulateContract({
          address: quoterAddress,
          abi: [
            {
              type: "function",
              name: "quoteExactInputSingle",
              stateMutability: "nonpayable",
              inputs: [
                {
                  name: "params",
                  type: "tuple",
                  components: [
                    { name: "tokenIn", type: "address" },
                    { name: "tokenOut", type: "address" },
                    { name: "amountIn", type: "uint256" },
                    { name: "fee", type: "uint24" },
                    { name: "sqrtPriceLimitX96", type: "uint160" }
                  ]
                }
              ],
              outputs: [
                { name: "amountOut", type: "uint256" },
                { name: "sqrtPriceX96After", type: "uint160" },
                { name: "initializedTicksCrossed", type: "uint32" },
                { name: "gasEstimate", type: "uint256" }
              ]
            }
          ],
          functionName: "quoteExactInputSingle",
          args: [
            {
              tokenIn: tokenInAddress,
              tokenOut: tokenOutAddress,
              amountIn: amountIn,
              fee: 3000,
              sqrtPriceLimitX96: 0n
            }
          ]
        });

        if (result) {
          amountOutBigInt = result[0];
        }
      } catch (err) {
        console.warn("QuoterV2 simulation failed, falling back to constant-product approx", err);
      }
    }

    const path = [start, goal];

    return {
      tokenIn: start,
      tokenOut: goal,
      amountIn: String(amountIn),
      amountOut: String(amountOutBigInt),
      path,
      hops: 1
    };
  }
}

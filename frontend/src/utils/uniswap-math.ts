// Uniswap V3 Liquidity Math Utilities for exact reserve calculations in the frontend.

export function getSqrtRatioAtTick(tick: number): bigint {
  const ratio = Math.pow(1.0001, tick);
  const sqrtRatio = Math.sqrt(ratio);
  const q96 = 2n ** 96n; // 2^96
  return BigInt(Math.floor(sqrtRatio * Number(q96)));
}

export function getAmountsForLiquidity(
  liquidity: bigint,
  sqrtPriceX96: bigint,
  tickLower: number,
  tickUpper: number
): [bigint, bigint] {
  if (liquidity === 0n || sqrtPriceX96 === 0n) return [0n, 0n];

  const q96 = 2n ** 96n;
  let sqrtPriceLower = getSqrtRatioAtTick(tickLower);
  let sqrtPriceUpper = getSqrtRatioAtTick(tickUpper);

  if (sqrtPriceLower > sqrtPriceUpper) {
    const temp = sqrtPriceLower;
    sqrtPriceLower = sqrtPriceUpper;
    sqrtPriceUpper = temp;
  }

  if (sqrtPriceX96 <= sqrtPriceLower) {
    // Current price is below the range (all token0)
    const amount0 = (liquidity * q96 * (sqrtPriceUpper - sqrtPriceLower)) / (sqrtPriceLower * sqrtPriceUpper);
    return [amount0, 0n];
  } else if (sqrtPriceX96 >= sqrtPriceUpper) {
    // Current price is above the range (all token1)
    const amount1 = (liquidity * (sqrtPriceUpper - sqrtPriceLower)) / q96;
    return [0n, amount1];
  } else {
    // Current price is within range (mixed)
    const amount0 = (liquidity * q96 * (sqrtPriceUpper - sqrtPriceX96)) / (sqrtPriceX96 * sqrtPriceUpper);
    const amount1 = (liquidity * (sqrtPriceX96 - sqrtPriceLower)) / q96;
    return [amount0, amount1];
  }
}

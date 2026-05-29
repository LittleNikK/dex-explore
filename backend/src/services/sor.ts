/**
 * Smart Order Router (SOR)
 * ------------------------
 * Dijkstra-style best-path multi-hop routing across the pool graph.
 *
 * This is a working reference implementation over an in-memory pool graph.
 * In production the graph is hydrated from indexed on-chain pools and each
 * edge's output is computed by calling QuoterV2 rather than the simplified
 * constant-product approximation used here.
 */

const FEE = 0.997; // 0.3% fee approximation per hop

interface PoolEdge {
  to: string;
  reserveIn: number;
  reserveOut: number;
}

type PoolGraph = Record<string, PoolEdge[]>;

const DEFAULT_GRAPH: PoolGraph = {
  WMST: [{ to: "USDC", reserveIn: 1_000_000, reserveOut: 2_000_000 }],
  USDC: [{ to: "WMST", reserveIn: 2_000_000, reserveOut: 1_000_000 }]
};

export class Sor {
  constructor(private readonly graph: PoolGraph = DEFAULT_GRAPH) {}

  private hopOut(amountIn: number, reserveIn: number, reserveOut: number) {
    const amountInWithFee = amountIn * FEE;
    return (amountInWithFee * reserveOut) / (reserveIn + amountInWithFee);
  }

  findBestRoute(tokenIn: string, tokenOut: string, amountIn: bigint) {
    const start = String(tokenIn);
    const goal = String(tokenOut);
    const amt = Number(amountIn);

    const best: Record<string, number> = { [start]: amt };
    const prev: Record<string, string | undefined> = {};
    const visited = new Set<string>();
    const queue = [start];

    while (queue.length) {
      queue.sort((a, b) => (best[b] ?? -Infinity) - (best[a] ?? -Infinity));
      const node = queue.shift();
      if (!node || visited.has(node)) continue;
      visited.add(node);

      for (const edge of this.graph[node] ?? []) {
        const out = this.hopOut(best[node], edge.reserveIn, edge.reserveOut);
        if (out > (best[edge.to] ?? -Infinity)) {
          best[edge.to] = out;
          prev[edge.to] = node;
          if (!visited.has(edge.to)) queue.push(edge.to);
        }
      }
    }

    const path: string[] = [];
    let cur: string | undefined = goal;
    while (cur !== undefined) {
      path.unshift(cur);
      cur = prev[cur];
    }

    return {
      tokenIn: start,
      tokenOut: goal,
      amountIn: String(amountIn),
      amountOut: String(Math.floor(best[goal] ?? 0)),
      path: path[0] === start ? path : [start, goal],
      hops: Math.max(path.length - 1, 1)
    };
  }
}

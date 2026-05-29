import { createPublicClient, webSocket, parseAbiItem } from "viem";
import { redis } from "../cache/redis.js";

/**
 * Viem WebSocket event listener.
 * Subscribes to pool Swap events and republishes them onto a Redis pub/sub
 * channel that the WebSocket server fans out to connected clients.
 */
const SWAP_EVENT = parseAbiItem(
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)"
);

export function startEventListener() {
  const transport = webSocket(process.env.WS_RPC_URL);
  const client = createPublicClient({ transport });

  client.watchEvent({
    event: SWAP_EVENT,
    onLogs: async (logs) => {
      for (const log of logs) {
        await redis.publish("prices", JSON.stringify({ type: "swap", log: String(log.transactionHash) }));
      }
    }
  });

  console.log("Viem event listener started");
}

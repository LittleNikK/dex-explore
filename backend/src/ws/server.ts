import { WebSocketServer } from "ws";
import { Redis } from "ioredis";

/**
 * Real-time price tick WebSocket server.
 * Uses a dedicated Redis subscriber for the "prices" pub/sub channel and fans
 * messages out to every connected client at ws://host/ws/prices.
 */
export function startWsServer(port = 3001) {
  const wss = new WebSocketServer({ port, path: "/ws/prices" });
  const sub = new Redis(process.env.REDIS_URL!);

  sub.subscribe("prices");
  sub.on("message", (_channel: string, message: string) => {
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(message);
      }
    }
  });

  wss.on("connection", (socket: { send: (data: string) => void }) => {
    socket.send(JSON.stringify({ type: "hello", channel: "prices" }));
  });

  console.log(`WebSocket price server on ws://localhost:${port}/ws/prices`);
}

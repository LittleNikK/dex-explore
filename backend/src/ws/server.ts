import { WebSocketServer } from "ws";
import { Redis } from "ioredis";
import type { Server } from "http";

/**
 * Real-time price tick WebSocket server.
 * Uses a dedicated Redis subscriber for the "prices" pub/sub channel and fans
 * messages out to every connected client at ws://host/ws/prices.
 */
export function startWsServer(options: { port?: number; server?: Server } = {}) {
  const wss = new WebSocketServer(
    options.server 
      ? { server: options.server, path: "/ws/prices" } 
      : { port: options.port ?? 3001, path: "/ws/prices" }
  );
  
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const sub = new Redis(redisUrl);

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

  if (options.server) {
    console.log("WebSocket price server attached to the main HTTP server on /ws/prices");
  } else {
    console.log(`WebSocket price server on ws://localhost:${options.port ?? 3001}/ws/prices`);
  }
}

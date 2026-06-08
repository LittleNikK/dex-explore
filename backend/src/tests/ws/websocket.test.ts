import http from "http";
import WebSocket, { WebSocketServer } from "ws";

describe("WebSocket", () => {
  let server: http.Server;
  let wss: WebSocketServer;
  let port: number;

  beforeAll((done) => {
    server = http.createServer();
    wss = new WebSocketServer({ server });
    wss.on("connection", (ws) => {
      ws.send(JSON.stringify({ type: "ping" }));
    });
    server.listen(0, () => {
      port = (server.address() as { port: number }).port;
      console.log(`WebSocket price server attached to the main HTTP server on /ws/prices`);
      done();
    });
  });

  afterAll((done) => {
    // Close all clients then the server
    wss.clients.forEach((client) => client.terminate());
    server.close(done);
  });

  it("connects successfully", (done) => {
    const ws = new WebSocket(`ws://localhost:${port}`);
    ws.on("open", () => {
      expect(true).toBe(true);
      ws.close();
      done();
    });
  }, 10000);
});

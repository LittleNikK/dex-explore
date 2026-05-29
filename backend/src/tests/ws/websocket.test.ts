import WebSocket from "ws";

describe("WebSocket", () => {
  it("connects successfully", (done) => {
    const ws = new WebSocket("ws://localhost:3001/ws/prices");
    ws.on("open", () => {
      expect(true).toBe(true);
      ws.close();
      done();
    });
  });
});

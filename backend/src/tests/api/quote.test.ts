import request from "supertest";
import app from "../../index.js";

describe("Quote API", () => {
  it("returns quote", async () => {
    const response = await request(app)
      .post("/api/quote")
      .send({
        tokenIn: "WMST",
        tokenOut: "USDC",
        amountIn: "1000000000000000000"
      });
    expect(response.status).toBe(200);
  });
});

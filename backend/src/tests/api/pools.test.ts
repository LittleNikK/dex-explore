import request from "supertest";
import app from "../../index.js";

describe("Pools API", () => {
  it("returns pools", async () => {
    const response = await request(app).get("/api/pools");
    expect(response.status).toBe(200);
  });
});

import http from "k6/http";
import { sleep } from "k6";

export const options = {
  vus: 100,
  duration: "30s"
};

export default function () {
  http.post(
    "http://localhost:3001/api/quote",
    JSON.stringify({
      tokenIn: "WMST",
      tokenOut: "USDC",
      amountIn: "1000000000000000000"
    }),
    { headers: { "Content-Type": "application/json" } }
  );
  sleep(1);
}

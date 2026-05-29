export class BatchQuoteService {
  async batchQuotes(requests: any[]) {
    return Promise.all(
      requests.map(async (req) => {
        return {
          tokenIn: req.tokenIn,
          tokenOut: req.tokenOut,
          amountOut: Number(req.amountIn) * 0.997
        };
      })
    );
  }
}

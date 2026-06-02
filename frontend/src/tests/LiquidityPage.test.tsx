import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiConfig } from "wagmi";
import { wagmiConfig } from "../config/wagmi";
import LiquidityPage from "../pages/LiquidityPage";

describe("Liquidity Page", () => {
  it("renders liquidity page", () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <WagmiConfig config={wagmiConfig}>
          <LiquidityPage />
        </WagmiConfig>
      </QueryClientProvider>
    );
    expect(screen.getByText("Checking Pool State")).toBeDefined();
  });
});

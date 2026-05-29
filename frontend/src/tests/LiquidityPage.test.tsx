import { render, screen } from "@testing-library/react";
import LiquidityPage from "../pages/LiquidityPage";

describe("Liquidity Page", () => {
  it("renders liquidity page", () => {
    render(<LiquidityPage />);
    expect(screen.getByText("Liquidity")).toBeInTheDocument();
  });
});

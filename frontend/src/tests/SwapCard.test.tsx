import { render, screen } from "@testing-library/react";
import SwapCard from "../components/swap/SwapCard";

describe("SwapCard", () => {
  it("renders swap title", () => {
    render(<SwapCard />);
    expect(screen.getByText("Swap")).toBeInTheDocument();
  });
});

import { create } from "zustand";

interface SwapState {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageBps: number;
  setTokenIn: (t: string) => void;
  setTokenOut: (t: string) => void;
  switchTokens: () => void;
  setAmountIn: (a: string) => void;
  setSlippage: (bps: number) => void;
}

export const useSwapStore = create<SwapState>((set) => ({
  tokenIn: "WMST",
  tokenOut: "USDC",
  amountIn: "",
  slippageBps: 50,
  setTokenIn: (t) => set({ tokenIn: t }),
  setTokenOut: (t) => set({ tokenOut: t }),
  switchTokens: () => set((state) => ({ tokenIn: state.tokenOut, tokenOut: state.tokenIn })),
  setAmountIn: (a) => set({ amountIn: a }),
  setSlippage: (bps) => set({ slippageBps: bps })
}));

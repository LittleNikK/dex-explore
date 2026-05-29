import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { mstChain } from "./chains";

export const wagmiConfig = createConfig({
  chains: [mstChain],
  connectors: [
    injected({
      target: "metaMask"
    })
  ],
  transports: {
    [mstChain.id]: http(mstChain.rpcUrls.default.http[0])
  }
});

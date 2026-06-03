import { createPublicClient, http } from "viem";
import * as dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: "../.env" });

const rpcUrl = process.env.RPC_URL || "https://testnetrpc.mstblockchain.com";

export const publicClient = createPublicClient({
  transport: http(rpcUrl),
});

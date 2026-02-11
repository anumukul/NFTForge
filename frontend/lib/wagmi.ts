import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from "wagmi";
import { mainnet, sepolia } from "viem/chains";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "YOUR_PROJECT_ID";
const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export const config = getDefaultConfig({
  appName: "NFT Forge",
  projectId,
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(alchemyKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}` : undefined),
    [sepolia.id]: http(alchemyKey ? `https://eth-sepolia.g.alchemy.com/v2/${alchemyKey}` : undefined),
  },
  ssr: true,
});

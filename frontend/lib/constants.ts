import { mainnet, sepolia } from "viem/chains";

export const SUPPORTED_CHAINS = [mainnet, sepolia] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAINS)[number]["id"];

export const DEFAULT_CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID
  ? Number(process.env.NEXT_PUBLIC_CHAIN_ID)
  : sepolia.id;

export const RARITY_COLORS: Record<string, string> = {
  Common: "bg-zinc-500/20 text-zinc-300 border-zinc-500/50",
  Rare: "bg-blue-500/20 text-blue-300 border-blue-500/50",
  Epic: "bg-purple-500/20 text-purple-300 border-purple-500/50",
  Legendary: "bg-amber-500/20 text-amber-300 border-amber-500/50",
};

export const RARITY_ORDER = ["Common", "Rare", "Epic", "Legendary"];

export const EXPLORER_URL: Record<number, string> = {
  1: "https://etherscan.io",
  11155111: "https://sepolia.etherscan.io",
};

import type { Address } from "viem";
import NFTContractAbi from "./abi.json";

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "") as Address;
export const CONTRACT_ABI = NFTContractAbi as readonly unknown[];
export const MAX_SUPPLY = 1000n;
export const MAX_MINT_PER_TX = 10;

export { NFTContractAbi };

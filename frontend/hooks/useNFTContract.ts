"use client";

import {
  useReadContract,
  useReadContracts,
} from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import type { Abi } from "viem";
import type { ContractStats, RarityTier } from "@/types";

export function useCurrentSupply() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "currentSupply",
  });
}

export function useMaxSupply() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "maxSupply",
  });
}

export function useContractPaused() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "paused",
  });
}

export function useEmergencyStop() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "emergencyStop",
  });
}

export function useRevealed() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "revealed",
  });
}

export function useRarityTiers() {
  const { data: count } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRarityTierCount",
  });
  const tierIndices = count !== undefined ? Array.from({ length: Number(count) }, (_, i) => i) : [];
  const contracts = tierIndices.map((i) => ({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI as Abi,
    functionName: "getRarityTier" as const,
    args: [BigInt(i)] as const,
  }));
  const { data: tiersData } = useReadContracts({ contracts });
  const tiers: RarityTier[] = (tiersData ?? [])
    .filter((r) => r.status === "success" && r.result)
    .map((r) => (r as { result: RarityTier }).result);
  return { data: tiers, count: count ?? 0n };
}

export function useGetContractStats() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getContractStats",
  });
}

export function useTokenRarity(tokenId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getTokenRarity",
    args: tokenId !== undefined ? [tokenId] : undefined,
  });
}

export function useTokenURI(tokenId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "tokenURI",
    args: tokenId !== undefined ? [tokenId] : undefined,
  });
}

export function useContractStats(): { data: ContractStats | null; isLoading: boolean } {
  const { data, isLoading } = useGetContractStats();
  if (!data) return { data: null, isLoading };
  const [totalSupply, remainingSupply, totalRarityTiers, isRevealed, isStakingEnabled, isWhitelistPhaseActive, isAuctionActive] = data as [bigint, bigint, bigint, boolean, boolean, boolean, boolean];
  return {
    data: {
      totalSupply,
      remainingSupply,
      totalRarityTiers,
      isRevealed,
      isStakingEnabled,
      isWhitelistPhaseActive,
      isAuctionActive,
    },
    isLoading,
  };
}

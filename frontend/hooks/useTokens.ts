"use client";

import { useReadContracts } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import type { Abi } from "viem";
import { useAccount } from "wagmi";
import { useMemo } from "react";
import type { RarityTier, TokenMetadata } from "@/types";
import { getIPFSUrl } from "@/lib/utils";

export function useOwnedTokenIds() {
  const { address } = useAccount();
  const currentSupply = useReadContracts({
    contracts: [
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "currentSupply" },
    ],
  });
  const supply = currentSupply.data?.[0]?.status === "success" ? (currentSupply.data[0].result as bigint) : 0n;
  const limit = 300;

  const balanceCalls = useMemo(() => {
    if (!address || supply === 0n) return [];
    const len = Math.min(Number(supply), limit);
    return Array.from({ length: len }, (_, i) => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI as Abi,
      functionName: "ownerOf" as const,
      args: [BigInt(i + 1)] as const,
    }));
  }, [address, supply]);

  const { data: ownershipData } = useReadContracts({
    contracts: balanceCalls,
  });

  const ownedIds = useMemo(() => {
    if (!ownershipData) return [];
    return ownershipData
      .map((r, i) => (r.status === "success" && r.result === address ? i + 1 : null))
      .filter((id): id is number => id !== null);
  }, [ownershipData, address]);

  return { tokenIds: ownedIds, supply: Number(supply), isLoading: currentSupply.isLoading };
}

export function useTokenDetails(tokenId: number | undefined) {
  const tokenIdBig = tokenId !== undefined ? BigInt(tokenId) : undefined;
  const tokenURI = useReadContracts({
    contracts: tokenIdBig !== undefined
      ? [
          { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "tokenURI", args: [tokenIdBig] },
          { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "getTokenRarity", args: [tokenIdBig] },
          { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "isTokenStaked", args: [tokenIdBig] },
          { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "getStakingDuration", args: [tokenIdBig] },
        ]
      : [],
  });

  const results = tokenURI.data;
  const uri = results?.[0]?.status === "success" ? (results[0].result as string) : undefined;
  const rarity = results?.[1]?.status === "success" ? (results[1].result as RarityTier) : undefined;
  const isStaked = results?.[2]?.status === "success" ? (results[2].result as boolean) : false;
  const stakingDuration = results?.[3]?.status === "success" ? Number(results[3].result as bigint) : 0;

  return {
    tokenURI: uri,
    rarity,
    isStaked,
    stakingDuration,
    isLoading: tokenURI.isLoading,
  };
}

export async function fetchTokenMetadata(uri: string): Promise<TokenMetadata | null> {
  try {
    const url = getIPFSUrl(uri);
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as TokenMetadata;
  } catch {
    return null;
  }
}

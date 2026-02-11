"use client";

import { useEffect } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI, MAX_MINT_PER_TX } from "@/lib/contract";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useWhitelistStatus() {
  const { address } = useAccount();
  const isWhitelisted = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isWhitelisted",
    args: address ? [address] : undefined,
  });
  const remaining = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getRemainingWhiteListMints",
    args: address ? [address] : undefined,
  });
  const phaseActive = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "whitelistPhaseActive",
  });
  return {
    isWhitelisted: isWhitelisted.data ?? false,
    remainingMints: remaining.data ?? 0n,
    phaseActive: phaseActive.data ?? false,
    isLoading: isWhitelisted.isLoading || remaining.isLoading || phaseActive.isLoading,
  };
}

export function useWhitelistMint() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const whitelistMint = (quantity: number) => {
    if (quantity < 1 || quantity > Number(MAX_MINT_PER_TX)) {
      toast.error(`Quantity must be 1-${MAX_MINT_PER_TX}`);
      return;
    }
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "whitelistMint",
        args: [BigInt(quantity)],
      },
      {
        onError: (e) => toast.error(e.message ?? "Whitelist mint failed"),
        onSuccess: () => toast.loading("Confirming mint...", { id: "wlMint" }),
      }
    );
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Whitelist mint successful!", { id: "wlMint" });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, queryClient, reset]);

  return {
    whitelistMint,
    isLoading: isPending || isConfirming,
    isSuccess,
    hash,
  };
}

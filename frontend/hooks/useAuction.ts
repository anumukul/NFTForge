"use client";

import { useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI, MAX_MINT_PER_TX } from "@/lib/contract";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useAuctionPrice() {
  const { data: price, refetch } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getCurrentAuctionPrice",
  });
  useEffect(() => {
    const interval = setInterval(() => refetch(), 2000);
    return () => clearInterval(interval);
  }, [refetch]);
  return price;
}

export function useAuctionStatus() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAuctionStatus",
  });
}

export function useAuctionMint() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const auctionMint = (quantity: number, value: bigint) => {
    if (quantity < 1 || quantity > Number(MAX_MINT_PER_TX)) {
      toast.error(`Quantity must be 1-${MAX_MINT_PER_TX}`);
      return;
    }
    writeContract(
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "auctionMint", args: [BigInt(quantity)], value } as never,
      {
        onError: (e) => toast.error(e.message ?? "Auction mint failed"),
        onSuccess: () => toast.loading("Confirming mint...", { id: "auctionMint" }),
      }
    );
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Auction mint successful!", { id: "auctionMint" });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, queryClient, reset]);

  return {
    auctionMint,
    isLoading: isPending || isConfirming,
    isSuccess,
    hash,
  };
}

export function useNextPriceDropTime() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getNextPriceDropTime",
  });
}

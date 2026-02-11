"use client";

import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI, MAX_MINT_PER_TX } from "@/lib/contract";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function usePublicMint() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Mint successful!", { id: "mint" });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, queryClient, reset]);

  const mint = () => {
    if (!address) {
      toast.error("Connect your wallet");
      return;
    }
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "mint",
        args: [address],
      },
      {
        onError: (e) => toast.error(e.message ?? "Mint failed"),
        onSuccess: () => toast.loading("Confirming mint...", { id: "mint" }),
      }
    );
  };

  return {
    mint,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useBatchMint() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { writeContract, data: hash, error, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const batchMint = (quantity: number) => {
    if (!address) {
      toast.error("Connect your wallet");
      return;
    }
    if (quantity < 1 || quantity > Number(MAX_MINT_PER_TX)) {
      toast.error(`Quantity must be 1-${MAX_MINT_PER_TX}`);
      return;
    }
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "batchMint",
        args: [address, BigInt(quantity)],
      },
      {
        onError: (e) => toast.error(e.message ?? "Batch mint failed"),
        onSuccess: () => toast.loading("Confirming mint...", { id: "batchMint" }),
      }
    );
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Batch mint successful!", { id: "batchMint" });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, queryClient, reset]);

  return {
    batchMint,
    isLoading: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

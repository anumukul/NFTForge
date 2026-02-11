"use client";

import { useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { useAccount } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useStakingEnabled() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "stakingEnabled",
  });
}

export function useUserStakedTokens() {
  const { address } = useAccount();
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getUserStakedTokens",
    args: address ? [address] : undefined,
  });
}

export function useStake() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const stake = (tokenId: bigint) => {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "stake",
        args: [tokenId],
      },
      {
        onError: (e) => toast.error(e.message ?? "Stake failed"),
        onSuccess: () => toast.loading("Confirming stake...", { id: "stake" }),
      }
    );
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Staked!", { id: "stake" });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, queryClient, reset]);

  return { stake, isLoading: isPending || isConfirming, isSuccess, hash };
}

export function useUnstake() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unstake = (tokenId: bigint) => {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "unstake",
        args: [tokenId],
      },
      {
        onError: (e) => toast.error(e.message ?? "Unstake failed"),
        onSuccess: () => toast.loading("Confirming unstake...", { id: "unstake" }),
      }
    );
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Unstaked!", { id: "unstake" });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, queryClient, reset]);

  return { unstake, isLoading: isPending || isConfirming, isSuccess, hash };
}

export function useBatchStake() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const batchStake = (tokenIds: bigint[]) => {
    if (tokenIds.length === 0 || tokenIds.length > 20) {
      toast.error("Select 1-20 tokens");
      return;
    }
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "batchStake",
        args: [tokenIds],
      },
      {
        onError: (e) => toast.error(e.message ?? "Batch stake failed"),
        onSuccess: () => toast.loading("Confirming...", { id: "batchStake" }),
      }
    );
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Batch staked!", { id: "batchStake" });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, queryClient, reset]);

  return { batchStake, isLoading: isPending || isConfirming, isSuccess, hash };
}

export function useBatchUnstake() {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const batchUnstake = (tokenIds: bigint[]) => {
    if (tokenIds.length === 0 || tokenIds.length > 20) {
      toast.error("Select 1-20 tokens");
      return;
    }
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "batchUnstake",
        args: [tokenIds],
      },
      {
        onError: (e) => toast.error(e.message ?? "Batch unstake failed"),
        onSuccess: () => toast.loading("Confirming...", { id: "batchUnstake" }),
      }
    );
  };

  useEffect(() => {
    if (isSuccess) {
      toast.success("Batch unstaked!", { id: "batchUnstake" });
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, queryClient, reset]);

  return { batchUnstake, isLoading: isPending || isConfirming, isSuccess, hash };
}

export function useStakingDuration(tokenId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getStakingDuration",
    args: tokenId !== undefined ? [tokenId] : undefined,
  });
}

export function useIsTokenStaked(tokenId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "isTokenStaked",
    args: tokenId !== undefined ? [tokenId] : undefined,
  });
}

"use client";

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";

export function useIsOwner() {
  const { address } = useAccount();
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "owner",
  });
  return address && owner && address.toLowerCase() === (owner as string).toLowerCase();
}

export function useHasRole(role: `0x${string}`) {
  const { address } = useAccount();
  const { data: hasRole } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasRole",
    args: address ? [role, address] : undefined,
  });
  return hasRole === true;
}

function useAdminWrite(
  functionName: string,
  successMsg: string,
  getArgs: () => readonly unknown[] | undefined
) {
  const queryClient = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (isSuccess) {
      toast.success(successMsg);
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, successMsg, queryClient, reset]);

  const execute = () => {
    const args = getArgs();
    if (!args) return;
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: functionName as never,
        args: args as never[],
      },
      {
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return { execute, isLoading: isPending || isConfirming };
}

export function useOwnerMint() {
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const queryClient = useQueryClient();
  useEffect(() => {
    if (isSuccess) {
      toast.success("Owner mint done");
      queryClient.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, queryClient, reset]);

  const ownerMint = (to: `0x${string}`, rarityTierIndex: number) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: "ownerMint",
      args: [to, BigInt(rarityTierIndex)],
    }, { onError: (e) => toast.error(e.message) });
  };
  return { ownerMint, isLoading: isPending || isConfirming };
}

export function useReveal() {
  const q = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) {
      toast.success("Collection revealed!");
      q.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, q, reset]);
  const reveal = () => {
    writeContract(
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "reveal" },
      { onError: (e) => toast.error(e.message) }
    );
  };
  return { reveal, isLoading: isPending };
}

export function useSetEmergencyStop() {
  const q = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) {
      toast.success("Emergency stop updated");
      q.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, q, reset]);
  const setEmergencyStop = (stopped: boolean) => {
    writeContract(
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "setEmergencyStop", args: [stopped] },
      { onError: (e) => toast.error(e.message) }
    );
  };
  return { setEmergencyStop, isLoading: isPending };
}

export function useWithdraw() {
  const { writeContract, isPending } = useWriteContract();
  const withdraw = () => {
    writeContract(
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "withdraw" },
      { onError: (e) => toast.error(e.message), onSuccess: () => toast.success("Withdrawn") }
    );
  };
  return { withdraw, isLoading: isPending };
}

export function usePauseContract() {
  const q = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) {
      toast.success("Pause state updated");
      q.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, q, reset]);
  const pause = () => {
    writeContract(
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "pauseContract" },
      { onError: (e) => toast.error(e.message) }
    );
  };
  const unpause = () => {
    writeContract(
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "unpauseContract" },
      { onError: (e) => toast.error(e.message) }
    );
  };
  return { pause, unpause, isLoading: isPending };
}

export function useToggleStaking() {
  const q = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) {
      toast.success("Staking toggled");
      q.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, q, reset]);
  const toggleStaking = () => {
    writeContract(
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "toggleStaking" },
      { onError: (e) => toast.error(e.message) }
    );
  };
  return { toggleStaking, isLoading: isPending };
}

export function useSetWhitelistPhase() {
  const q = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) {
      toast.success("Whitelist phase updated");
      q.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, q, reset]);
  const setWhitelistPhase = (active: boolean) => {
    writeContract(
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "setWhitelistPhase", args: [active] },
      { onError: (e) => toast.error(e.message) }
    );
  };
  return { setWhitelistPhase, isLoading: isPending };
}

export function useStartAuction() {
  const q = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) {
      toast.success("Auction started");
      q.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, q, reset]);
  const startAuction = (startPrice: bigint, endPrice: bigint, duration: number, priceDropInterval: number) => {
    writeContract(
      {
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: "startAuction",
        args: [startPrice, endPrice, BigInt(duration), BigInt(priceDropInterval)],
      },
      { onError: (e) => toast.error(e.message) }
    );
  };
  return { startAuction, isLoading: isPending };
}

export function useEndAuction() {
  const q = useQueryClient();
  const { writeContract, data: hash, isPending, reset } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isSuccess) {
      toast.success("Auction ended");
      q.invalidateQueries({ queryKey: ["contract"] });
      reset();
    }
  }, [isSuccess, q, reset]);
  const endAuction = () => {
    writeContract(
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "endAuction" },
      { onError: (e) => toast.error(e.message) }
    );
  };
  return { endAuction, isLoading: isPending };
}

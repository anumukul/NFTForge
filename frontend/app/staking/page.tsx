"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserStakedTokens, useStakingEnabled, useStake, useUnstake } from "@/hooks/useStaking";
import { useOwnedTokenIds } from "@/hooks/useTokens";
import { useTokenDetails, fetchTokenMetadata } from "@/hooks/useTokens";
import { useQuery } from "@tanstack/react-query";
import { getIPFSUrl } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { RarityBadge } from "@/components/nft/RarityBadge";
import { Lock, Unlock } from "lucide-react";

function StakingCard({
  tokenId,
  isStaked,
  disabled,
}: {
  tokenId: number;
  isStaked: boolean;
  disabled: boolean;
}) {
  const { tokenURI, rarity, stakingDuration } = useTokenDetails(tokenId);
  const { stake, isLoading: stakeLoading } = useStake();
  const { unstake, isLoading: unstakeLoading } = useUnstake();
  const { data: metadata } = useQuery({
    queryKey: ["metadata", tokenURI],
    queryFn: () => (tokenURI ? fetchTokenMetadata(tokenURI) : Promise.resolve(null)),
    enabled: !!tokenURI,
  });
  const imageUrl = metadata?.image ? getIPFSUrl(metadata.image) : null;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square bg-muted">
        {imageUrl ? (
          <Image src={imageUrl} alt={`#${tokenId}`} fill className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl font-bold text-muted-foreground">
            #{tokenId}
          </div>
        )}
        <div className="absolute left-2 top-2">
          <RarityBadge name={rarity?.name ?? "—"} />
        </div>
      </div>
      <CardContent className="p-3">
        <p className="mb-2 text-sm font-medium">#{tokenId}</p>
        {isStaked && (
          <p className="mb-2 text-xs text-muted-foreground">
            Staked: {formatDuration(stakingDuration)}
          </p>
        )}
        {isStaked ? (
          <Button size="sm" variant="outline" className="w-full gap-1" disabled={disabled || unstakeLoading} onClick={() => unstake(BigInt(tokenId))}>
            <Unlock className="h-3 w-3" /> {unstakeLoading ? "..." : "Unstake"}
          </Button>
        ) : (
          <Button size="sm" className="w-full gap-1" disabled={disabled || stakeLoading} onClick={() => stake(BigInt(tokenId))}>
            <Lock className="h-3 w-3" /> {stakeLoading ? "..." : "Stake"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default function StakingPage() {
  const { address, isConnected } = useAccount();
  const { data: stakingEnabled } = useStakingEnabled();
  const { data: stakedIdsData } = useUserStakedTokens();
  const stakedIds = (stakedIdsData ?? []) as bigint[];
  const { tokenIds: ownedIds } = useOwnedTokenIds();
  const unstakedIds = ownedIds.filter((id) => !stakedIds.includes(BigInt(id)));
  const stakedIdsNum = stakedIds.map((id) => Number(id));

  if (!isConnected) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your wallet to view staking.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Staking</h1>
        <p className="text-muted-foreground">
          Stake your NFTs to lock them. Unstake anytime.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant={stakingEnabled ? "default" : "secondary"}>
            Staking: {stakingEnabled ? "Enabled" : "Disabled"}
          </Badge>
          <Badge variant="outline">Staked: {stakedIdsNum.length}</Badge>
          <Badge variant="outline">Available: {unstakedIds.length}</Badge>
        </div>
      </div>

      {!stakingEnabled && (
        <Card className="mb-6 border-amber-500/50">
          <CardContent className="py-4">
            Staking is currently disabled by the contract admin.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Unlock className="h-5 w-5" /> Unstaked ({unstakedIds.length})
            </CardTitle>
            <CardDescription>Click Stake on each card to stake one NFT.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {unstakedIds.slice(0, 50).map((id) => (
                <StakingCard
                  key={id}
                  tokenId={id}
                  isStaked={false}
                  disabled={!stakingEnabled}
                />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Showing up to 50. Use batch select above for multiple.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" /> Staked ({stakedIdsNum.length})
            </CardTitle>
            <CardDescription>Click Unstake on each card to unstake.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {stakedIdsNum.map((id) => (
                <StakingCard
                  key={id}
                  tokenId={id}
                  isStaked
                  disabled={!stakingEnabled}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOwnedTokenIds } from "@/hooks/useTokens";
import { useTokenDetails, fetchTokenMetadata } from "@/hooks/useTokens";
import { useStake, useUnstake, useStakingEnabled } from "@/hooks/useStaking";
import { RarityBadge } from "@/components/nft/RarityBadge";
import { getIPFSUrl } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutGrid, Shield } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

function NFTCard({
  tokenId,
  onSelect,
}: {
  tokenId: number;
  onSelect: () => void;
}) {
  const { tokenURI, rarity, isStaked, isLoading } = useTokenDetails(tokenId);
  const { data: metadata } = useQuery({
    queryKey: ["metadata", tokenURI],
    queryFn: () => (tokenURI ? fetchTokenMetadata(tokenURI) : Promise.resolve(null)),
    enabled: !!tokenURI,
  });
  const imageUrl = metadata?.image ? getIPFSUrl(metadata.image) : null;
  const name = metadata?.name ?? `#${tokenId}`;

  if (isLoading) {
    return (
      <Card>
        <Skeleton className="aspect-square w-full rounded-t-lg" />
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-20" />
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
      onClick={onSelect}
    >
      <div className="relative aspect-square bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
            unoptimized
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl font-bold text-muted-foreground">
            #{tokenId}
          </div>
        )}
        <div className="absolute right-2 top-2 flex gap-1">
          {rarity && <RarityBadge name={rarity.name} />}
          {isStaked && (
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" /> Staked
            </Badge>
          )}
        </div>
      </div>
      <CardHeader className="pb-2">
        <p className="font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">ID: {tokenId}</p>
      </CardHeader>
    </Card>
  );
}

function NFTDetailModal({
  tokenId,
  open,
  onClose,
}: {
  tokenId: number | null;
  open: boolean;
  onClose: () => void;
}) {
  const { tokenURI, rarity, isStaked, stakingDuration } = useTokenDetails(tokenId ?? undefined);
  const { data: metadata } = useQuery({
    queryKey: ["metadata", tokenURI],
    queryFn: () => (tokenURI ? fetchTokenMetadata(tokenURI) : Promise.resolve(null)),
    enabled: !!tokenURI && open,
  });
  const imageUrl = metadata?.image ? getIPFSUrl(metadata.image) : null;
  const { stake, isLoading: stakeLoading } = useStake();
  const { unstake, isLoading: unstakeLoading } = useUnstake();
  const { data: stakingEnabled } = useStakingEnabled();

  if (!tokenId) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>#{tokenId}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={`#${tokenId}`}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl font-bold text-muted-foreground">
                #{tokenId}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {rarity && <RarityBadge name={rarity.name} />}
            {isStaked && (
              <Badge variant="secondary">
                Staked · {formatDuration(stakingDuration)}
              </Badge>
            )}
          </div>
          {metadata?.description && (
            <p className="text-sm text-muted-foreground">{metadata.description}</p>
          )}
          {stakingEnabled ? (
            <div className="flex gap-2">
              {isStaked ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={unstakeLoading}
                  onClick={() => {
                    unstake(BigInt(tokenId));
                    onClose();
                  }}
                >
                  {unstakeLoading ? "..." : "Unstake"}
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  disabled={stakeLoading}
                  onClick={() => {
                    stake(BigInt(tokenId));
                    onClose();
                  }}
                >
                  {stakeLoading ? "..." : "Stake"}
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MyNFTsPage() {
  const { isConnected } = useAccount();
  const { tokenIds, isLoading } = useOwnedTokenIds();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!isConnected) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your wallet to view your NFTs.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My NFTs</h1>
          <p className="text-muted-foreground">
            {tokenIds.length} NFT{tokenIds.length !== 1 ? "s" : ""} owned
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <Skeleton className="aspect-square w-full rounded-t-lg" />
              <CardHeader><Skeleton className="h-5 w-24" /></CardHeader>
            </Card>
          ))}
        </div>
      ) : tokenIds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <LayoutGrid className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No NFTs yet</p>
            <p className="text-sm text-muted-foreground">Mint your first NFT from the Mint page.</p>
            <Button asChild className="mt-4">
              <a href="/mint">Go to Mint</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {tokenIds.map((id) => (
            <NFTCard key={id} tokenId={id} onSelect={() => setSelectedId(id)} />
          ))}
        </div>
      )}

      <NFTDetailModal
        tokenId={selectedId}
        open={selectedId !== null}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

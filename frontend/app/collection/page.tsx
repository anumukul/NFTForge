"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCurrentSupply, useRarityTiers } from "@/hooks/useNFTContract";
import { RarityBadge } from "@/components/nft/RarityBadge";
import { SupplyProgress } from "@/components/nft/SupplyProgress";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import type { Abi } from "viem";
import { useReadContracts } from "wagmi";
import { useMemo } from "react";
import { getIPFSUrl } from "@/lib/utils";
import { fetchTokenMetadata } from "@/hooks/useTokens";
import { useQuery } from "@tanstack/react-query";

const PAGE_SIZE = 24;

export default function CollectionPage() {
  const { data: supply } = useReadContracts({
    contracts: [
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI, functionName: "currentSupply" },
    ],
  });
  const supplyNum = supply?.[0]?.status === "success" ? Number(supply[0].result as bigint) : 0;
  const { data: tiers } = useRarityTiers();
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(supplyNum / PAGE_SIZE));

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Collection</h1>
        <p className="text-muted-foreground">All minted NFTs in this collection.</p>
        <div className="mt-4">
          <SupplyProgress current={supplyNum} max={1000} />
        </div>
      </div>

      {tiers && tiers.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <p className="text-sm font-medium">Rarity distribution</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {tiers.map((t) => (
                <div key={t.name} className="flex items-center gap-2">
                  <RarityBadge name={t.name} />
                  <span className="text-sm text-muted-foreground">
                    {Number(t.currentSupply)} / {Number(t.maxSupply)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {supplyNum === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            No NFTs minted yet.
          </CardContent>
        </Card>
      ) : (
        <>
          <CollectionGrid page={page} pageSize={PAGE_SIZE} totalSupply={supplyNum} />
          <div className="mt-6 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function CollectionGrid({ page, pageSize, totalSupply }: { page: number; pageSize: number; totalSupply: number }) {
  const start = page * pageSize;
  const tokenIds = useMemo(() => {
    return Array.from({ length: pageSize }, (_, i) => start + i + 1).filter((id) => id <= totalSupply);
  }, [page, pageSize, totalSupply, start]);

  const contracts = useMemo(() => {
    return tokenIds.flatMap((id) => [
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as Abi, functionName: "tokenURI" as const, args: [BigInt(id)] as const },
      { address: CONTRACT_ADDRESS, abi: CONTRACT_ABI as Abi, functionName: "getTokenRarity" as const, args: [BigInt(id)] as const },
    ]);
  }, [tokenIds]);

  const { data } = useReadContracts({ contracts });

  const items = useMemo(() => {
    if (!data) return [];
    const out: { id: number; uri: string; rarityName: string }[] = [];
    for (let i = 0; i < tokenIds.length; i++) {
      const uriRes = data[i * 2];
      const rarityRes = data[i * 2 + 1];
      const uri = uriRes?.status === "success" ? (uriRes.result as string) : "";
      const rarity = rarityRes?.status === "success" ? (rarityRes.result as { name: string }) : null;
      out.push({ id: tokenIds[i], uri, rarityName: rarity?.name ?? "—" });
    }
    return out;
  }, [data, tokenIds]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => (
        <CollectionCard key={item.id} tokenId={item.id} tokenURI={item.uri} rarityName={item.rarityName} />
      ))}
    </div>
  );
}

function CollectionCard({ tokenId, tokenURI, rarityName }: { tokenId: number; tokenURI: string; rarityName: string }) {
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
        <div className="absolute right-2 top-2">
          <RarityBadge name={rarityName} />
        </div>
      </div>
      <CardContent className="p-3">
        <p className="font-medium">#{tokenId}</p>
      </CardContent>
    </Card>
  );
}

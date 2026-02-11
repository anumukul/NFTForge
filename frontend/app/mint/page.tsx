"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentSupply, useMaxSupply } from "@/hooks/useNFTContract";
import { usePublicMint, useBatchMint } from "@/hooks/useMint";
import { useWhitelistStatus, useWhitelistMint } from "@/hooks/useWhitelist";
import { useAuctionPrice, useAuctionStatus, useAuctionMint } from "@/hooks/useAuction";
import { QuantitySelector } from "@/components/mint/QuantitySelector";
import { SupplyProgress } from "@/components/nft/SupplyProgress";
import { formatEth } from "@/lib/utils";
import { MAX_MINT_PER_TX } from "@/lib/contract";
import { Flame, Users, Gavel } from "lucide-react";

export default function MintPage() {
  const { isConnected } = useAccount();
  const [quantity, setQuantity] = useState(1);
  const [auctionQuantity, setAuctionQuantity] = useState(1);

  const { data: currentSupply } = useCurrentSupply();
  const { data: maxSupply } = useMaxSupply();
  const supplyNum = currentSupply !== undefined ? Number(currentSupply) : 0;
  const maxNum = maxSupply !== undefined ? Number(maxSupply) : 1000;
  const maxReached = supplyNum >= maxNum;

  const { mint, isLoading: mintLoading } = usePublicMint();
  const { batchMint, isLoading: batchLoading } = useBatchMint();
  const { isWhitelisted, remainingMints, phaseActive } = useWhitelistStatus();
  const { whitelistMint, isLoading: wlMintLoading } = useWhitelistMint();
  const currentPrice = useAuctionPrice();
  const { data: auctionStatus } = useAuctionStatus();
  const { auctionMint, isLoading: auctionMintLoading } = useAuctionMint();

  const auctionActive = auctionStatus && Array.isArray(auctionStatus) && auctionStatus[0] === true;
  const totalAuctionCost = currentPrice != null ? BigInt(currentPrice as bigint) * BigInt(auctionQuantity) : 0n;

  if (!isConnected) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your wallet to mint NFTs.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mint</h1>
        <p className="text-muted-foreground">Choose a mint option below.</p>
        <div className="mt-4">
          <SupplyProgress current={supplyNum} max={maxNum} />
        </div>
      </div>

      <Tabs defaultValue="public" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="public" className="gap-1.5">
            <Flame className="h-4 w-4" /> Public
          </TabsTrigger>
          <TabsTrigger value="whitelist" className="gap-1.5">
            <Users className="h-4 w-4" /> Whitelist
          </TabsTrigger>
          <TabsTrigger value="auction" className="gap-1.5">
            <Gavel className="h-4 w-4" /> Auction
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Public Mint</CardTitle>
              <CardDescription>Mint up to {MAX_MINT_PER_TX} per transaction. Rarity is assigned randomly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Quantity</p>
                <QuantitySelector value={quantity} onChange={setQuantity} max={Number(MAX_MINT_PER_TX)} />
              </div>
              {quantity === 1 ? (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={maxReached || mintLoading}
                  onClick={() => mint()}
                >
                  {mintLoading ? "Minting..." : "Mint 1 NFT"}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  disabled={maxReached || batchLoading || supplyNum + quantity > maxNum}
                  onClick={() => batchMint(quantity)}
                >
                  {batchLoading ? "Minting..." : `Mint ${quantity} NFTs`}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelist" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Whitelist Mint</CardTitle>
              <CardDescription>Mint if you are on the whitelist and the phase is active.</CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge variant={phaseActive ? "default" : "secondary"}>
                  Phase: {phaseActive ? "Active" : "Inactive"}
                </Badge>
                <Badge variant={isWhitelisted ? "default" : "secondary"}>
                  You: {isWhitelisted ? "Whitelisted" : "Not whitelisted"}
                </Badge>
                {isWhitelisted && (
                  <Badge variant="outline">Remaining: {remainingMints.toString()}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Quantity</p>
                <QuantitySelector
                  value={quantity}
                  onChange={setQuantity}
                  max={Math.min(Number(MAX_MINT_PER_TX), Number(remainingMints)) || 1}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                disabled={!phaseActive || !isWhitelisted || Number(remainingMints) === 0 || wlMintLoading || maxReached}
                onClick={() => whitelistMint(quantity)}
              >
                {wlMintLoading ? "Minting..." : `Whitelist Mint ${quantity}`}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auction" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dutch Auction Mint</CardTitle>
              <CardDescription>Pay the current auction price. Price drops over time. Excess ETH is refunded.</CardDescription>
              {auctionActive && currentPrice !== undefined ? (
                <div className="rounded-lg bg-primary/10 p-4">
                  <p className="text-sm text-muted-foreground">Current price per NFT</p>
                  <p className="text-2xl font-bold">{formatEth(currentPrice as bigint)} ETH</p>
                </div>
              ) : null}
              {!auctionActive && (
                <Badge variant="secondary">Auction not active</Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium">Quantity</p>
                <QuantitySelector value={auctionQuantity} onChange={setAuctionQuantity} max={Number(MAX_MINT_PER_TX)} />
              </div>
              {auctionActive && currentPrice ? (
                <p className="text-sm text-muted-foreground">
                  Total: {formatEth(totalAuctionCost)} ETH
                </p>
              ) : null}
              <Button
                className="w-full"
                size="lg"
                disabled={!auctionActive || auctionMintLoading || maxReached}
                onClick={() => currentPrice && auctionMint(auctionQuantity, totalAuctionCost)}
              >
                {auctionMintLoading ? "Minting..." : `Mint ${auctionQuantity} @ ${currentPrice != null ? formatEth(currentPrice as bigint) : "—"} ETH`}
              </Button>
              <p className="text-xs text-muted-foreground">
                Send at least the total cost; excess will be returned to your wallet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

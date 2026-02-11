"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QuantitySelector } from "@/components/mint/QuantitySelector";
import { useAuctionPrice, useAuctionStatus, useAuctionMint, useNextPriceDropTime } from "@/hooks/useAuction";
import { useCurrentSupply, useMaxSupply } from "@/hooks/useNFTContract";
import { formatEth } from "@/lib/utils";
import { MAX_MINT_PER_TX } from "@/lib/contract";

export default function AuctionPage() {
  const { address, isConnected } = useAccount();
  const currentPrice = useAuctionPrice();
  const { data: status } = useAuctionStatus();
  const { data: nextDrop } = useNextPriceDropTime();
  const { auctionMint, isLoading } = useAuctionMint();
  const [quantity, setQuantity] = useState(1);
  const [countdown, setCountdown] = useState<number | null>(null);

  const { data: currentSupply } = useCurrentSupply();
  const { data: maxSupply } = useMaxSupply();
  const supplyNum = currentSupply !== undefined ? Number(currentSupply) : 0;
  const maxNum = maxSupply !== undefined ? Number(maxSupply) : 1000;
  const maxReached = supplyNum >= maxNum;

  const isActive = Boolean(status && Array.isArray(status) && status[0] === true);
  const timeRemaining = status && Array.isArray(status) && status[2] !== undefined ? Number(status[2]) : 0;
  const totalCost = currentPrice != null ? BigInt(currentPrice as bigint) * BigInt(quantity) : 0n;

  useEffect(() => {
    if (nextDrop === undefined || nextDrop === 0n) return;
    const target = Number(nextDrop);
    const tick = () => {
      const left = Math.max(0, target - Math.floor(Date.now() / 1000));
      setCountdown(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [nextDrop]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (!isConnected) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect your wallet to view the auction and mint.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dutch Auction</h1>
        <p className="text-muted-foreground">Price drops over time. Mint at the current price.</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Status
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </CardTitle>
          <CardDescription>
            {isActive
              ? "Auction is live. Current price decreases at fixed intervals."
              : "Auction is not currently active."}
          </CardDescription>
        </CardHeader>
        {isActive && currentPrice !== undefined ? (
          <CardContent className="space-y-4">
            <div className="rounded-xl bg-primary/10 p-6 text-center">
              <p className="text-sm text-muted-foreground">Current price per NFT</p>
              <p className="text-4xl font-bold">{formatEth(currentPrice as bigint)} ETH</p>
            </div>
            {countdown !== null && countdown > 0 && (
              <div className="text-center text-sm text-muted-foreground">
                Next price drop in: {formatTime(countdown)}
              </div>
            )}
            {timeRemaining > 0 && (
              <p className="text-center text-xs text-muted-foreground">
                Auction ends in: {formatTime(timeRemaining)}
              </p>
            )}
          </CardContent>
        ) : null}
      </Card>

      {isActive ? (
        <Card>
          <CardHeader>
            <CardTitle>Mint</CardTitle>
            <CardDescription>Send at least the total cost; excess ETH will be refunded.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Quantity</p>
              <QuantitySelector value={quantity} onChange={setQuantity} max={Number(MAX_MINT_PER_TX)} />
            </div>
            <p className="text-sm">
              Total: <span className="font-semibold">{formatEth(totalCost)} ETH</span>
            </p>
            <Button
              className="w-full"
              size="lg"
              disabled={maxReached || isLoading}
              onClick={() => currentPrice && auctionMint(quantity, totalCost)}
            >
              {isLoading ? "Minting..." : `Mint ${quantity} @ ${currentPrice ? formatEth(currentPrice as bigint) : "—"} ETH`}
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

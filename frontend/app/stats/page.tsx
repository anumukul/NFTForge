"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useContractStats, useRarityTiers } from "@/hooks/useNFTContract";
import { useAuctionPrice, useAuctionStatus } from "@/hooks/useAuction";
import { SupplyProgress } from "@/components/nft/SupplyProgress";
import { formatEth } from "@/lib/utils";
import { BarChart3, Gem, Shield, Gavel } from "lucide-react";

export default function StatsPage() {
  const { data: stats, isLoading } = useContractStats();
  const { data: tiers } = useRarityTiers();
  const currentPrice = useAuctionPrice();
  const { data: auctionStatus } = useAuctionStatus();
  const auctionActive = auctionStatus && Array.isArray(auctionStatus) && auctionStatus[0] === true;

  if (isLoading || !stats) {
    return (
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold">Stats</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const totalSupply = Number(stats.totalSupply);
  const remaining = Number(stats.remainingSupply);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground">Contract and collection stats.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Minted</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalSupply}</p>
            <p className="text-xs text-muted-foreground">of 1,000 max supply</p>
            <SupplyProgress current={totalSupply} max={1000} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{remaining}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Staking</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.isStakingEnabled ? "Enabled" : "Disabled"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Auction</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{auctionActive && currentPrice != null ? formatEth(currentPrice as bigint) : "—"} ETH</p>
            <p className="text-xs text-muted-foreground">
              {auctionActive ? "Current price" : "Not active"}
            </p>
          </CardContent>
        </Card>
      </div>

      {tiers && tiers.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5" /> Rarity distribution
            </CardTitle>
            <CardDescription>Minted per tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tiers.map((t) => {
                const current = Number(t.currentSupply);
                const max = Number(t.maxSupply);
                const pct = max > 0 ? (current / max) * 100 : 0;
                return (
                  <div key={t.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{t.name}</span>
                      <span className="text-muted-foreground">
                        {current} / {max}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Contract state</CardTitle>
          <CardDescription>Flags and phases</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <span className="rounded-md bg-muted px-2 py-1 text-sm">Revealed: {stats.isRevealed ? "Yes" : "No"}</span>
          <span className="rounded-md bg-muted px-2 py-1 text-sm">Whitelist: {stats.isWhitelistPhaseActive ? "Active" : "Inactive"}</span>
          <span className="rounded-md bg-muted px-2 py-1 text-sm">Auction: {stats.isAuctionActive ? "Active" : "Inactive"}</span>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsOwner } from "@/hooks/useAdmin";
import {
  useOwnerMint,
  useReveal,
  useSetEmergencyStop,
  useWithdraw,
  usePauseContract,
  useToggleStaking,
  useSetWhitelistPhase,
  useStartAuction,
  useEndAuction,
} from "@/hooks/useAdmin";
import { useContractStats, useRarityTiers } from "@/hooks/useNFTContract";
import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { parseEther } from "viem";
import { Shield, AlertTriangle } from "lucide-react";

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const isOwner = useIsOwner();

  if (!isConnected) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet</CardTitle>
            <CardDescription>Connect the owner wallet to access admin.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="container mx-auto max-w-lg px-4 py-16 text-center">
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Access Denied
            </CardTitle>
            <CardDescription>Only the contract owner can access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" /> Admin Dashboard
        </h1>
        <p className="text-muted-foreground">Contract owner controls.</p>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="mint">Mint</TabsTrigger>
          <TabsTrigger value="whitelist">Whitelist</TabsTrigger>
          <TabsTrigger value="auction">Auction</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="mt-6">
          <AdminStats />
        </TabsContent>
        <TabsContent value="mint" className="mt-6">
          <AdminMint />
        </TabsContent>
        <TabsContent value="whitelist" className="mt-6">
          <AdminWhitelist />
        </TabsContent>
        <TabsContent value="auction" className="mt-6">
          <AdminAuction />
        </TabsContent>
        <TabsContent value="metadata" className="mt-6">
          <AdminMetadata />
        </TabsContent>
        <TabsContent value="emergency" className="mt-6">
          <AdminEmergency />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminStats() {
  const { data: stats } = useContractStats();
  const { data: tiers } = useRarityTiers();
  if (!stats) return <p>Loading...</p>;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contract stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p>Total supply: {Number(stats.totalSupply)}</p>
        <p>Remaining: {Number(stats.remainingSupply)}</p>
        <p>Revealed: {stats.isRevealed ? "Yes" : "No"}</p>
        <p>Staking: {stats.isStakingEnabled ? "On" : "Off"}</p>
        <p>Whitelist phase: {stats.isWhitelistPhaseActive ? "Active" : "Inactive"}</p>
        <p>Auction: {stats.isAuctionActive ? "Active" : "Inactive"}</p>
        {tiers && (
          <div className="pt-2">
            <p className="font-medium">Tiers</p>
            {tiers.map((t) => (
              <p key={t.name} className="text-sm text-muted-foreground">
                {t.name}: {Number(t.currentSupply)} / {Number(t.maxSupply)}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AdminMint() {
  const [to, setTo] = useState("");
  const [tierIndex, setTierIndex] = useState(0);
  const { ownerMint, isLoading } = useOwnerMint();
  const { data: tiers } = useRarityTiers();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Owner mint</CardTitle>
        <CardDescription>Mint one NFT to an address with a chosen rarity tier.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Recipient address</Label>
          <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="0x..." />
        </div>
        <div>
          <Label>Rarity tier (0–3)</Label>
          <Input type="number" min={0} max={3} value={tierIndex} onChange={(e) => setTierIndex(parseInt(e.target.value, 10) || 0)} />
          {tiers && <p className="text-xs text-muted-foreground">{tiers[tierIndex]?.name ?? "—"}</p>}
        </div>
        <Button disabled={!to || isLoading} onClick={() => ownerMint(to as `0x${string}`, tierIndex)}>
          {isLoading ? "Minting..." : "Mint"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminWhitelist() {
  const { setWhitelistPhase, isLoading } = useSetWhitelistPhase();
  const { data: stats } = useContractStats();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Whitelist phase</CardTitle>
        <CardDescription>Turn whitelist minting on or off.</CardDescription>
      </CardHeader>
      <CardContent className="flex gap-2">
        <Button disabled={isLoading} onClick={() => setWhitelistPhase(true)}>
          Activate
        </Button>
        <Button variant="outline" disabled={isLoading} onClick={() => setWhitelistPhase(false)}>
          Deactivate
        </Button>
        <span className="text-sm text-muted-foreground">
          Current: {stats?.isWhitelistPhaseActive ? "Active" : "Inactive"}
        </span>
      </CardContent>
    </Card>
  );
}

function AdminAuction() {
  const [startPrice, setStartPrice] = useState("1");
  const [endPrice, setEndPrice] = useState("0.1");
  const [duration, setDuration] = useState("3600");
  const [interval, setInterval] = useState("300");
  const { startAuction, isLoading: startLoading } = useStartAuction();
  const { endAuction, isLoading: endLoading } = useEndAuction();
  const { data: stats } = useContractStats();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auction</CardTitle>
        <CardDescription>Start or end the Dutch auction.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Start price (ETH)</Label>
            <Input value={startPrice} onChange={(e) => setStartPrice(e.target.value)} />
          </div>
          <div>
            <Label>End price (ETH)</Label>
            <Input value={endPrice} onChange={(e) => setEndPrice(e.target.value)} />
          </div>
          <div>
            <Label>Duration (seconds)</Label>
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>
          <div>
            <Label>Price drop interval (seconds)</Label>
            <Input type="number" value={interval} onChange={(e) => setInterval(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={startLoading || stats?.isAuctionActive}
            onClick={() =>
              startAuction(
                parseEther(startPrice),
                parseEther(endPrice),
                parseInt(duration, 10),
                parseInt(interval, 10)
              )
            }
          >
            {startLoading ? "..." : "Start auction"}
          </Button>
          <Button variant="outline" disabled={endLoading || !stats?.isAuctionActive} onClick={() => endAuction()}>
            {endLoading ? "..." : "End auction"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminMetadata() {
  const { reveal, isLoading } = useReveal();
  const { data: revealed } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "revealed",
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reveal</CardTitle>
        <CardDescription>Reveal the collection (one-time, irreversible).</CardDescription>
      </CardHeader>
      <CardContent>
        <Button disabled={isLoading} onClick={() => reveal()}>
          {isLoading ? "..." : "Reveal collection"}
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminEmergency() {
  const { setEmergencyStop, isLoading: stopLoading } = useSetEmergencyStop();
  const { pause, unpause, isLoading: pauseLoading } = usePauseContract();
  const { withdraw, isLoading: withdrawLoading } = useWithdraw();
  const { toggleStaking, isLoading: stakingLoading } = useToggleStaking();
  const { data: emergencyStop } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "emergencyStop",
  });

  return (
    <div className="space-y-4">
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle>Emergency stop</CardTitle>
          <CardDescription>Halt all minting and transfers.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="destructive" disabled={stopLoading} onClick={() => setEmergencyStop(true)}>
            Enable
          </Button>
          <Button variant="outline" disabled={stopLoading} onClick={() => setEmergencyStop(false)}>
            Disable
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pause</CardTitle>
          <CardDescription>Pause mint-related functions.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" disabled={pauseLoading} onClick={() => pause()}>
            Pause
          </Button>
          <Button disabled={pauseLoading} onClick={() => unpause()}>
            Unpause
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Staking</CardTitle>
          <CardDescription>Toggle staking on/off (requires ADMIN_ROLE).</CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled={stakingLoading} onClick={() => toggleStaking()}>
            {stakingLoading ? "..." : "Toggle staking"}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Withdraw</CardTitle>
          <CardDescription>Send contract ETH balance to the configured withdraw address.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled={withdrawLoading} onClick={() => withdraw()}>
            {withdrawLoading ? "..." : "Withdraw"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

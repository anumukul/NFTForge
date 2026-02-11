"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Gem, Shield, Gavel, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useCurrentSupply, useMaxSupply, useRarityTiers } from "@/hooks/useNFTContract";
import { useWatchContractEvent } from "wagmi";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { SupplyProgress } from "@/components/nft/SupplyProgress";
import { RarityBadge } from "@/components/nft/RarityBadge";
import { RARITY_COLORS } from "@/lib/constants";
import { calculateRarityPercentage } from "@/lib/utils";
import { truncateAddress } from "@/lib/utils";
import { useState } from "react";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { data: currentSupply } = useCurrentSupply();
  const { data: maxSupply } = useMaxSupply();
  const { data: tiers } = useRarityTiers();
  const [recentMints, setRecentMints] = useState<{ to: string; tokenId: bigint; rarityName: string }[]>([]);

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: "TokenMinted",
    onLogs(logs) {
      const newMints = logs.map((l) => {
        const args = (l as { args?: { to?: string; tokenId?: bigint; rarityName?: string } }).args;
        return {
          to: args?.to ?? "",
          tokenId: args?.tokenId ?? 0n,
          rarityName: args?.rarityName ?? "Unknown",
        };
      });
      setRecentMints((prev) => [...newMints, ...prev].slice(0, 10));
    },
  });

  const supplyNum = currentSupply !== undefined ? Number(currentSupply) : 0;
  const maxNum = maxSupply !== undefined ? Number(maxSupply) : 1000;

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/10 via-background to-background px-4 py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.15),transparent)]" />
        <div className="container relative mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Gem className="h-4 w-4" />
              NFT Forge
            </div>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Mint, Stake & Collect
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              Premium NFT collection with rarity tiers, Dutch auction, and staking. Connect your wallet to get started.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {isConnected ? (
                <Button asChild size="lg" className="gap-2">
                  <Link href="/mint">
                    Mint Now <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <p className="text-muted-foreground">Connect your wallet to mint</p>
              )}
              <Button asChild variant="outline" size="lg">
                <Link href="/collection">View Collection</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-12 rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
          >
            <p className="mb-2 text-sm font-medium text-muted-foreground">Supply</p>
            <SupplyProgress current={supplyNum} max={maxNum} />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border/40 px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">Features</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Gem, title: "Rarity Tiers", desc: "Common, Rare, Epic & Legendary with weighted random minting.", href: "/mint" },
              { icon: Shield, title: "Staking", desc: "Stake your NFTs and lock them for rewards.", href: "/staking" },
              { icon: Gavel, title: "Dutch Auction", desc: "Mint during auction as price drops over time.", href: "/auction" },
            ].map(({ icon: Icon, title, desc, href }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full border-border/50 bg-card/50 transition-colors hover:border-primary/30">
                  <CardHeader>
                    <div className="mb-2 rounded-lg bg-primary/10 p-2 w-fit">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>{desc}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="ghost" size="sm" className="gap-1">
                      <Link href={href}>Learn more <ArrowRight className="h-3 w-3" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Rarity Tiers */}
      <section className="border-b border-border/40 px-4 py-16">
        <div className="container mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">Rarity Tiers</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {tiers.map((tier, i) => {
              const name = tier.name;
              const colorClass = RARITY_COLORS[name] ?? "border-border";
              const pct = calculateRarityPercentage(tier);
              const current = Number(tier.currentSupply);
              const max = Number(tier.maxSupply);
              return (
                <motion.div
                  key={name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className={`h-full border-2 ${colorClass} bg-card/50`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{name}</span>
                        <RarityBadge name={name} />
                      </CardTitle>
                      <CardDescription>
                        {pct}% chance · {current} / {max} minted
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SupplyProgress current={current} max={max} />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recent Mints */}
      <section className="border-b border-border/40 px-4 py-16">
        <div className="container mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-2xl font-bold">Recent Mints</h2>
          {recentMints.length === 0 ? (
            <p className="text-center text-muted-foreground">No recent mints. Be the first!</p>
          ) : (
            <ul className="space-y-2">
              {recentMints.map((m, i) => (
                <motion.li
                  key={`${m.tokenId}-${i}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card/30 px-4 py-3"
                >
                  <span className="font-mono text-sm">#{m.tokenId.toString()}</span>
                  <RarityBadge name={m.rarityName} />
                  <span className="text-muted-foreground text-sm">{truncateAddress(m.to)}</span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16">
        <div className="container mx-auto max-w-2xl">
          <h2 className="mb-6 text-center text-2xl font-bold">FAQ</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="mint">
              <AccordionTrigger>How do I mint?</AccordionTrigger>
              <AccordionContent>
                Connect your wallet, go to the Mint page, and choose Public Mint, Whitelist Mint (if you are whitelisted), or Auction Mint when the auction is active.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="rarity">
              <AccordionTrigger>How does rarity work?</AccordionTrigger>
              <AccordionContent>
                Each mint randomly assigns a tier: Common (60%), Rare (25%), Epic (12%), or Legendary (3%). Each tier has a maximum supply; if one is full, the next available tier is used.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="staking">
              <AccordionTrigger>What is staking?</AccordionTrigger>
              <AccordionContent>
                Staking locks your NFT in the contract so it cannot be transferred. You can unstake at any time. Staking must be enabled by the contract admin.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="auction">
              <AccordionTrigger>What is the Dutch auction?</AccordionTrigger>
              <AccordionContent>
                The Dutch auction starts at a higher price and decreases at fixed intervals until it reaches the end price. You pay the current price at the time of your mint. Excess ETH sent is refunded.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </div>
  );
}

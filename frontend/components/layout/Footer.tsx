"use client";

import Link from "next/link";
import { Gem } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-card/50 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold text-muted-foreground hover:text-foreground">
            <Gem className="h-5 w-5" />
            NFT Forge
          </Link>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/mint" className="hover:text-foreground">Mint</Link>
            <Link href="/my-nfts" className="hover:text-foreground">My NFTs</Link>
            <Link href="/staking" className="hover:text-foreground">Staking</Link>
            <Link href="/collection" className="hover:text-foreground">Collection</Link>
            <Link href="/stats" className="hover:text-foreground">Stats</Link>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} NFT Forge. Connect your wallet to mint and interact.
        </p>
      </div>
    </footer>
  );
}

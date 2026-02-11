"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Gem,
  Flame,
  LayoutGrid,
  Gavel,
  BarChart3,
  Shield,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useAccount } from "wagmi";

const navLinks = [
  { href: "/", label: "Home", icon: Gem },
  { href: "/mint", label: "Mint", icon: Flame },
  { href: "/my-nfts", label: "My NFTs", icon: LayoutGrid },
  { href: "/staking", label: "Staking", icon: Shield },
  { href: "/collection", label: "Collection", icon: LayoutGrid },
  { href: "/auction", label: "Auction", icon: Gavel },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: Shield },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { address } = useAccount();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="rounded-lg bg-primary p-1.5 text-primary-foreground">
            <Gem className="h-5 w-5" />
          </span>
          NFT Forge
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5",
                  pathname === href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
          />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-border/40 bg-background/95 backdrop-blur-xl md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-3">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
                  pathname === href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { RARITY_COLORS } from "@/lib/constants";

interface RarityBadgeProps {
  name: string;
  className?: string;
}

export function RarityBadge({ name, className }: RarityBadgeProps) {
  const colorClass = RARITY_COLORS[name] ?? "bg-muted text-muted-foreground border-border";
  return (
    <Badge variant="outline" className={cn("font-medium", colorClass, className)}>
      {name}
    </Badge>
  );
}

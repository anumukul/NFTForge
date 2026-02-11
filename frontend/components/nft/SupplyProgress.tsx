"use client";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SupplyProgressProps {
  current: number | bigint;
  max: number | bigint;
  className?: string;
}

export function SupplyProgress({ current, max, className }: SupplyProgressProps) {
  const c = Number(current);
  const m = Number(max);
  const pct = m > 0 ? Math.min(100, (c / m) * 100) : 0;
  return (
    <div className={cn("space-y-1", className)}>
      <Progress value={pct} className="h-2" />
      <p className="text-xs text-muted-foreground text-right">
        {c.toLocaleString()} / {m.toLocaleString()}
      </p>
    </div>
  );
}

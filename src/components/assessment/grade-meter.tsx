import { cn } from "@/lib/utils";

interface GradeMeterProps {
  value: number | null;
  max: number;
  passing: number;
  recovery: number;
}

/** Barra de 0 até a nota máxima, com marca na média mínima. Decorativa: o valor aparece em texto ao lado. */
export function GradeMeter({ value, max, passing, recovery }: GradeMeterProps) {
  if (value === null || max <= 0) return null;
  const color = value >= passing ? "bg-emerald-600" : value >= recovery ? "bg-amber-500" : "bg-red-600";
  return (
    <div aria-hidden="true" className="relative h-1.5 w-full min-w-16 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
      <span className="absolute inset-y-0 w-px bg-foreground/50" style={{ left: `${(passing / max) * 100}%` }} />
    </div>
  );
}

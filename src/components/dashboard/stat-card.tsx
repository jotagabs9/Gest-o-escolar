import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger";

const TONE: Record<Tone, string> = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  danger: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: Tone;
}

export function StatCard({ label, value, hint, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <Card className="rounded-xl border-border/80 bg-card shadow-[0_1px_2px_rgba(24,48,38,0.035)] transition-shadow duration-200 hover:shadow-[0_5px_18px_rgba(24,48,38,0.055)]">
      <CardContent className="flex items-start justify-between gap-3 p-5 sm:p-5">
        <div className="min-w-0 space-y-2">
          <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
          <p className="text-[30px] font-semibold leading-none tracking-[-0.045em] tabular-nums text-foreground">{value}</p>
          {hint && <p className="pt-1 text-[11px] text-muted-foreground">{hint}</p>}
        </div>
        <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONE[tone])}>
          <Icon className="size-[17px]" strokeWidth={1.8} />
        </span>
      </CardContent>
    </Card>
  );
}

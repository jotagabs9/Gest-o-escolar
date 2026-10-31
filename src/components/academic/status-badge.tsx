import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComponentType, CurriculumStatus, YearStatus } from "@/lib/mock/academic";

type Tone = "success" | "warning" | "info" | "neutral" | "danger";

const TONE: Record<Tone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  warning: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  info: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
  neutral: "border-border bg-muted text-muted-foreground",
  danger: "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

export function StatusBadge({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-medium", TONE[tone], className)}>
      {children}
    </Badge>
  );
}

const YEAR_TONE: Record<YearStatus, Tone> = { ACTIVE: "success", PLANNED: "info", CLOSED: "neutral" };
const YEAR_LABEL: Record<YearStatus, string> = { ACTIVE: "Em andamento", PLANNED: "Planejado", CLOSED: "Encerrado" };
export function YearStatusBadge({ status }: { status: YearStatus }) {
  return <StatusBadge tone={YEAR_TONE[status]}>{YEAR_LABEL[status]}</StatusBadge>;
}

const CURRICULUM_TONE: Record<CurriculumStatus, Tone> = { ACTIVE: "success", DRAFT: "warning", ARCHIVED: "neutral" };
const CURRICULUM_LABEL: Record<CurriculumStatus, string> = { ACTIVE: "Ativa", DRAFT: "Rascunho", ARCHIVED: "Arquivada" };
export function CurriculumStatusBadge({ status }: { status: CurriculumStatus }) {
  return <StatusBadge tone={CURRICULUM_TONE[status]}>{CURRICULUM_LABEL[status]}</StatusBadge>;
}

const COMPONENT_TONE: Record<ComponentType, Tone> = {
  GENERAL: "neutral",
  ITINERARY: "info",
  LIFE_PROJECT: "success",
  TECHNICAL: "warning",
  ELECTIVE: "info",
  OTHER: "neutral",
};
export function ComponentTypeBadge({ type, label }: { type: ComponentType; label: string }) {
  return <StatusBadge tone={COMPONENT_TONE[type]}>{label}</StatusBadge>;
}

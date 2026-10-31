import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

import { StatusBadge } from "@/components/academic/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { EVALUATION_TYPE_LABEL, type EvaluationType } from "@/lib/assessment";

export interface AssignmentCardData {
  id: string;
  componentName: string;
  classLabel: string;
  stageLabel: string;
  curriculumCode: string;
  evaluationType: EvaluationType | null;
  students: number;
  progress: { label: string; value: number; hint: string };
  ruleSummary: string | null;
}

interface AssignmentCardsProps {
  items: AssignmentCardData[];
  /** Define o destino e o texto do botão. */
  mode: "notas" | "frequencia";
}

export function AssignmentCards({ items, mode }: AssignmentCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((a) => (
        <Card key={a.id}>
          <CardHeader className="space-y-1 pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-base leading-snug">{a.componentName}</CardTitle>
              <Badge variant="secondary" className="shrink-0">
                {a.classLabel}
              </Badge>
            </div>
            <CardDescription>
              {a.stageLabel} · {a.curriculumCode}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" /> {a.students} {a.students === 1 ? "aluno" : "alunos"}
              </span>
              {a.evaluationType ? (
                <StatusBadge tone="neutral">{EVALUATION_TYPE_LABEL[a.evaluationType]}</StatusBadge>
              ) : (
                <StatusBadge tone="warning">Sem regra de avaliação</StatusBadge>
              )}
            </div>
            {a.ruleSummary && <p className="text-xs text-muted-foreground">{a.ruleSummary}</p>}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span>{a.progress.label}</span>
                <span className="tabular-nums text-muted-foreground">{a.progress.hint}</span>
              </div>
              <Progress value={a.progress.value} aria-label={a.progress.label} />
            </div>

            <Button asChild className="w-full">
              <Link href={`/professor/${mode}/${a.id}`}>
                {mode === "notas" ? "Lançar notas" : "Registrar frequência"}
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, School } from "lucide-react";

import { ALL, ClassGroupFilters } from "@/components/academic/class-group-filters";
import { EmptyState } from "@/components/academic/empty-state";
import { RowActions } from "@/components/academic/row-actions";
import { SavedNotice } from "@/components/academic/saved-notice";
import { StatusBadge } from "@/components/academic/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  SHIFT_OPTIONS,
  byId,
  listAcademicYears,
  listClassGroups,
  listCurricula,
  listStages,
  optionLabel,
  stageLabel,
} from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Turmas | Gestão Escolar" };

export default async function ClassGroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; serie?: string; status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const sp = await searchParams;
  const [years, stages, curricula] = await Promise.all([listAcademicYears(), listStages(), listCurricula()]);

  const activeYear = years.find((y) => y.status === "ACTIVE") ?? years[0];
  const year = sp.ano ?? activeYear?.id ?? ALL;
  const stage = sp.serie ?? ALL;

  const groups = await listClassGroups({
    academicYearId: year === ALL ? undefined : year,
    stageId: stage === ALL ? undefined : stage,
  });

  const yearById = byId(years);
  const curriculumById = byId(curricula);

  return (
    <>
      <PageHeader title="Turmas" description="Turmas por ano letivo, série ou etapa.">
        <Button asChild>
          <Link href="/admin/estrutura/turmas/nova">
            <Plus className="mr-2 size-4" /> Nova turma
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={sp.status} />

      <ClassGroupFilters
        year={year}
        stage={stage}
        defaultYear={activeYear?.id ?? ALL}
        yearOptions={years.map((y) => ({ value: y.id, label: y.name }))}
        stageOptions={stages.map((s) => ({ value: s.id, label: stageLabel(s.id) }))}
      />

      <Card>
        <CardContent className="px-0 py-2">
          {groups.length === 0 ? (
            <EmptyState
              icon={School}
              title="Nenhuma turma encontrada"
              description="Não há turmas para esses filtros. Ajuste os filtros ou crie uma nova turma."
              action={
                <Button asChild>
                  <Link href="/admin/estrutura/turmas/nova">Nova turma</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Turma</TableHead>
                  <TableHead className="hidden lg:table-cell">Série / etapa</TableHead>
                  <TableHead className="hidden sm:table-cell">Turno</TableHead>
                  <TableHead className="hidden md:table-cell">Ano</TableHead>
                  <TableHead className="hidden xl:table-cell">Matriz</TableHead>
                  <TableHead className="w-44">Ocupação</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => {
                  const pct = Math.min(100, (g.enrolled / g.capacity) * 100);
                  const full = g.enrolled >= g.capacity;
                  const curriculum = g.curriculumId ? curriculumById.get(g.curriculumId) : null;
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="pl-6">
                        <p className="font-medium">{g.name}</p>
                        <p className="text-xs text-muted-foreground lg:hidden">{stageLabel(g.stageId, false)}</p>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{stageLabel(g.stageId)}</TableCell>
                      <TableCell className="hidden sm:table-cell">{optionLabel(SHIFT_OPTIONS, g.shift)}</TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">{yearById.get(g.academicYearId)?.name}</TableCell>
                      <TableCell className="hidden xl:table-cell">
                        {curriculum ? (
                          <Link
                            href={`/admin/estrutura/matrizes/${curriculum.id}`}
                            className="text-sm underline-offset-4 hover:underline"
                          >
                            {curriculum.code}
                          </Link>
                        ) : (
                          <StatusBadge tone="warning">Sem matriz</StatusBadge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs tabular-nums">
                            <span>
                              {g.enrolled}/{g.capacity}
                            </span>
                            {full && <Badge variant="secondary">Lotada</Badge>}
                          </div>
                          <Progress value={pct} aria-label={`Ocupação da turma ${g.name}`} />
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          label={`Turma ${g.name}`}
                          editHref={`/admin/estrutura/turmas/${g.id}/editar`}
                          listHref="/admin/estrutura/turmas"
                          blockedReason={
                            g.enrolled > 0
                              ? `A turma ${g.name} tem ${g.enrolled} alunos matriculados. Transfira ou cancele as matrículas antes de excluir.`
                              : undefined
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

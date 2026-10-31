import type { Metadata } from "next";
import Link from "next/link";
import { Library, Plus } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { RowActions } from "@/components/academic/row-actions";
import { SavedNotice } from "@/components/academic/saved-notice";
import { CurriculumStatusBadge } from "@/components/academic/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  byId,
  listAcademicYears,
  listAllComponents,
  listClassGroups,
  listCourses,
  listCurricula,
  stageLabel,
} from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Matrizes curriculares | Gestão Escolar" };

export default async function CurriculaPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { status } = await searchParams;
  const [curricula, components, groups, years, courses] = await Promise.all([
    listCurricula(),
    listAllComponents(),
    listClassGroups(),
    listAcademicYears(),
    listCourses(),
  ]);
  const yearById = byId(years);
  const courseById = byId(courses);

  return (
    <>
      <PageHeader
        title="Matrizes curriculares"
        description="Componentes e cargas horárias de cada série ou etapa. Nada de matéria fica fixo no sistema."
      >
        <Button asChild>
          <Link href="/admin/estrutura/matrizes/nova">
            <Plus className="mr-2 size-4" /> Nova matriz
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={status} />

      <Card>
        <CardContent className="px-0 py-2">
          {curricula.length === 0 ? (
            <EmptyState
              icon={Library}
              title="Nenhuma matriz curricular cadastrada"
              description="Crie uma matriz e adicione os componentes que cada série ou etapa cursa."
              action={
                <Button asChild>
                  <Link href="/admin/estrutura/matrizes/nova">Nova matriz</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Matriz</TableHead>
                  <TableHead className="hidden lg:table-cell">Série / etapa</TableHead>
                  <TableHead className="hidden md:table-cell">Ano</TableHead>
                  <TableHead className="hidden sm:table-cell">Componentes</TableHead>
                  <TableHead className="hidden sm:table-cell">Carga horária</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {curricula.map((c) => {
                  const own = components.filter((k) => k.curriculumId === c.id);
                  const hours = own.reduce((sum, k) => sum + k.workloadHours, 0);
                  const classCount = groups.filter((g) => g.curriculumId === c.id).length;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6">
                        <Link
                          href={`/admin/estrutura/matrizes/${c.id}`}
                          className="font-medium underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          {c.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {c.code}
                          {c.courseId && ` · ${courseById.get(c.courseId)?.name}`}
                        </p>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{stageLabel(c.stageId)}</TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">{yearById.get(c.academicYearId)?.name}</TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{own.length}</TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{hours}h</TableCell>
                      <TableCell>
                        <CurriculumStatusBadge status={c.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          label={c.name}
                          viewHref={`/admin/estrutura/matrizes/${c.id}`}
                          editHref={`/admin/estrutura/matrizes/${c.id}/editar`}
                          listHref="/admin/estrutura/matrizes"
                          blockedReason={
                            classCount > 0
                              ? `Esta matriz está vinculada a ${classCount} turma${classCount > 1 ? "s" : ""}. Desvincule-as antes de excluir. Para encerrar o uso, arquive a matriz.`
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

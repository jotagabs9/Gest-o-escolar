import type { Metadata } from "next";
import Link from "next/link";
import { BarChart3 } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { StatusBadge } from "@/components/academic/status-badge";
import { AttendanceValue } from "@/components/assessment/result-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ALL, FilterBar } from "@/components/people/filter-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { byId, classGroups, curricula, curriculumComponents, stageLabel } from "@/lib/mock/academic";
import { assignmentStats, getRule } from "@/lib/mock/assessment";
import { teacherAssignments, teacherProfiles } from "@/lib/mock/people";
import { matchesQuery } from "@/lib/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Notas e frequência | Gestão Escolar" };

export default async function AdminAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; turma?: string; professor?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const sp = await searchParams;
  const q = sp.q ?? "";
  const turma = sp.turma ?? ALL;
  const professor = sp.professor ?? ALL;

  const componentById = byId(curriculumComponents);
  const classById = byId(classGroups);
  const curriculumById = byId(curricula);
  const teacherById = byId(teacherProfiles);

  const classOptions = [...new Set(teacherAssignments.map((a) => a.classGroupId))].map((id) => {
    const c = classById.get(id);
    return { value: id, label: c ? `${c.name} · ${stageLabel(c.stageId, false)}` : id };
  });
  const teacherOptions = [...new Set(teacherAssignments.map((a) => a.teacherId))].map((id) => ({
    value: id,
    label: teacherById.get(id)?.name ?? id,
  }));

  const rows = teacherAssignments
    .filter((a) => (turma === ALL || a.classGroupId === turma) && (professor === ALL || a.teacherId === professor))
    .filter((a) => matchesQuery(q, componentById.get(a.componentId)?.name))
    .map((a) => ({ a, stats: assignmentStats(a.id) }));

  return (
    <>
      <PageHeader title="Notas e frequência" description="Acompanhamento por turma e componente. Somente leitura: o lançamento é feito pelo professor alocado." />

      <FilterBar
        search={{ key: "q", label: "Componente", placeholder: "Nome do componente" }}
        values={{ turma, professor }}
        defaults={{ turma: ALL, professor: ALL }}
        fields={[
          { key: "turma", label: "Turma", allLabel: "Todas as turmas", options: classOptions, className: "space-y-1.5 lg:w-60" },
          { key: "professor", label: "Professor", allLabel: "Todos", options: teacherOptions, className: "space-y-1.5 lg:w-52" },
        ]}
      />

      <Card>
        <CardContent className="px-0 py-2">
          {rows.length === 0 ? (
            <EmptyState icon={BarChart3} title="Nada encontrado" description="Ajuste a busca ou os filtros." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Componente</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="hidden md:table-cell">Professor</TableHead>
                  <TableHead className="hidden sm:table-cell">Notas do período</TableHead>
                  <TableHead className="text-right">Freq. média</TableHead>
                  <TableHead className="hidden lg:table-cell">Em risco</TableHead>
                  <TableHead className="w-20 pr-6">
                    <span className="sr-only">Abrir</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ a, stats }) => {
                  const component = componentById.get(a.componentId);
                  const cls = classById.get(a.classGroupId);
                  const rule = getRule(a.componentId);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="pl-6">
                        <p className="font-medium">{component?.name}</p>
                        <p className="text-xs text-muted-foreground">{component ? curriculumById.get(component.curriculumId)?.code : ""}</p>
                      </TableCell>
                      <TableCell>{cls?.name}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{teacherById.get(a.teacherId)?.name}</TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">
                        {stats.graded}/{stats.students}
                        {stats.period && <span className="ml-1 text-xs text-muted-foreground">({stats.period.name})</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <AttendanceValue pct={stats.avgAttendance} min={rule?.minAttendancePct ?? null} />
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {stats.atRisk > 0 ? <StatusBadge tone="danger">{stats.atRisk} por frequência</StatusBadge> : <span className="text-sm text-muted-foreground">Nenhum</span>}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/avaliacao/${a.id}`} aria-label={`Abrir ${component?.name} da turma ${cls?.name}`}>
                            Abrir
                          </Link>
                        </Button>
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

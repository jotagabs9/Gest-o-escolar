import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { SavedNotice } from "@/components/academic/saved-notice";
import { StatusBadge } from "@/components/academic/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ALL, FilterBar } from "@/components/people/filter-bar";
import { PersonCell } from "@/components/people/person-cell";
import { EnrollmentStatusBadge, RoleBadge } from "@/components/people/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { byId, classGroups, listAcademicYears, stageLabel } from "@/lib/mock/academic";
import {
  ENROLLMENT_STATUS_OPTIONS,
  listClassGroupOptions,
  listEnrollmentCurricula,
  listEnrollments,
  listStudents,
} from "@/lib/mock/people";
import { matchesQuery } from "@/lib/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Matrículas | Gestão Escolar" };

export default async function EnrollmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ano?: string; turma?: string; situacao?: string; status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const sp = await searchParams;

  const [years, students, allLinks] = await Promise.all([listAcademicYears(), listStudents(), listEnrollmentCurricula()]);
  const activeYear = years.find((y) => y.status === "ACTIVE") ?? years[0];
  const ano = sp.ano ?? activeYear.id;
  const classOptions = await listClassGroupOptions(ano === ALL ? undefined : ano);
  const turma = sp.turma && (sp.turma === ALL || classOptions.some((o) => o.value === sp.turma)) ? sp.turma : ALL;
  const situacao = sp.situacao ?? ALL;
  const q = sp.q ?? "";

  const enrollments = await listEnrollments({
    academicYearId: ano === ALL ? undefined : ano,
    classGroupId: turma === ALL ? undefined : turma,
    status: situacao === ALL ? undefined : situacao,
  });

  const studentById = byId(students);
  const classById = byId(classGroups);
  const yearById = byId(years);

  const rows = enrollments.filter((e) => {
    const s = studentById.get(e.studentId);
    return matchesQuery(q, s?.name, s?.registrationNumber, e.number);
  });

  return (
    <>
      <PageHeader title="Matrículas" description="Uma matrícula por aluno em cada ano letivo. A rematrícula cria uma nova matrícula.">
        <Button asChild>
          <Link href="/admin/matriculas/nova">
            <Plus className="mr-2 size-4" /> Nova matrícula
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={sp.status} />

      <FilterBar
        search={{ key: "q", label: "Buscar", placeholder: "Aluno ou nº da matrícula" }}
        values={{ ano, turma, situacao }}
        defaults={{ ano: activeYear.id, turma: ALL, situacao: ALL }}
        fields={[
          { key: "ano", label: "Ano letivo", allLabel: "Todos os anos", options: years.map((y) => ({ value: y.id, label: y.name })), className: "space-y-1.5 lg:w-40" },
          { key: "turma", label: "Turma", allLabel: "Todas as turmas", options: classOptions, className: "space-y-1.5 lg:w-60" },
          { key: "situacao", label: "Status", allLabel: "Todos", options: ENROLLMENT_STATUS_OPTIONS, className: "space-y-1.5 lg:w-44" },
        ]}
      />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rows.length} {rows.length === 1 ? "matrícula" : "matrículas"}
      </p>

      <Card>
        <CardContent className="px-0 py-2">
          {rows.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhuma matrícula encontrada"
              description="Ajuste a busca ou os filtros, ou crie uma nova matrícula."
              action={
                <Button asChild>
                  <Link href="/admin/matriculas/nova">Nova matrícula</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Aluno</TableHead>
                  <TableHead className="hidden md:table-cell">Nº</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead className="hidden lg:table-cell">Matrizes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20 pr-6">
                    <span className="sr-only">Abrir</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((e) => {
                  const student = studentById.get(e.studentId);
                  const cls = classById.get(e.classGroupId);
                  const own = allLinks.filter((l) => l.enrollmentId === e.id);
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="pl-6">
                        <PersonCell name={student?.name ?? "—"} subtitle={`Matriculado em ${formatDate(e.enrolledAt)}`} href={`/admin/matriculas/${e.id}`} />
                      </TableCell>
                      <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">{e.number}</TableCell>
                      <TableCell>
                        <p className="font-medium">{cls?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {cls ? stageLabel(cls.stageId, false) : ""} · {yearById.get(e.academicYearId)?.name}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {own.length === 0 ? (
                          <StatusBadge tone="warning">Sem matriz</StatusBadge>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {own.map((l) => (
                              <RoleBadge key={l.id} role={l.role} />
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <EnrollmentStatusBadge status={e.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/matriculas/${e.id}`} aria-label={`Abrir matrícula ${e.number}`}>
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

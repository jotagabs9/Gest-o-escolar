import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Plus } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { RowActions } from "@/components/academic/row-actions";
import { SavedNotice } from "@/components/academic/saved-notice";
import { StatusBadge } from "@/components/academic/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ALL, FilterBar } from "@/components/people/filter-bar";
import { PersonCell } from "@/components/people/person-cell";
import { EnrollmentStatusBadge } from "@/components/people/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { byId, classGroups, listAcademicYears, stageLabel } from "@/lib/mock/academic";
import {
  ENROLLMENT_STATUS_OPTIONS,
  listClassGroupOptions,
  listEnrollments,
  listGuardianLinks,
  listGuardians,
  listStudents,
} from "@/lib/mock/people";
import { matchesQuery } from "@/lib/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Alunos | Gestão Escolar" };

const NO_ENROLLMENT = "sem-matricula";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ano?: string; turma?: string; situacao?: string; status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const sp = await searchParams;

  const [years, students, enrollments, links, guardians] = await Promise.all([
    listAcademicYears(),
    listStudents(),
    listEnrollments(),
    listGuardianLinks(),
    listGuardians(),
  ]);

  const activeYear = years.find((y) => y.status === "ACTIVE") ?? years[0];
  const ano = sp.ano ?? activeYear.id;
  const classOptions = await listClassGroupOptions(ano === ALL ? undefined : ano);
  const turma = sp.turma && (sp.turma === ALL || classOptions.some((o) => o.value === sp.turma)) ? sp.turma : ALL;
  const situacao = sp.situacao ?? ALL;
  const q = sp.q ?? "";

  const guardianById = byId(guardians);
  const classById = byId(classGroups);
  const yearById = byId(years);

  const rows = students
    .map((s) => {
      const own = enrollments.filter((e) => e.studentId === s.id).sort((a, b) => b.academicYearId.localeCompare(a.academicYearId));
      const enrollment = ano === ALL ? own[0] : own.find((e) => e.academicYearId === ano);
      const primary = links.find((l) => l.studentId === s.id && l.isPrimary);
      return { student: s, enrollment, enrollmentCount: own.length, guardian: primary ? guardianById.get(primary.guardianId) : undefined };
    })
    .filter(({ student, enrollment }) => {
      if (!matchesQuery(q, student.name, student.registrationNumber)) return false;
      if (turma !== ALL && enrollment?.classGroupId !== turma) return false;
      if (situacao === NO_ENROLLMENT) return !enrollment;
      if (situacao !== ALL && enrollment?.status !== situacao) return false;
      return true;
    });

  return (
    <>
      <PageHeader title="Alunos" description="Cadastro de alunos e situação de matrícula no ano letivo.">
        <Button asChild>
          <Link href="/admin/alunos/novo">
            <Plus className="mr-2 size-4" /> Novo aluno
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={sp.status} />

      <FilterBar
        search={{ key: "q", label: "Buscar", placeholder: "Nome ou nº de matrícula" }}
        values={{ ano, turma, situacao }}
        defaults={{ ano: activeYear.id, turma: ALL, situacao: ALL }}
        fields={[
          { key: "ano", label: "Ano letivo", allLabel: "Todos os anos", options: years.map((y) => ({ value: y.id, label: y.name })), className: "space-y-1.5 lg:w-40" },
          { key: "turma", label: "Turma", allLabel: "Todas as turmas", options: classOptions, className: "space-y-1.5 lg:w-60" },
          {
            key: "situacao",
            label: "Situação da matrícula",
            allLabel: "Todas",
            options: [...ENROLLMENT_STATUS_OPTIONS, { value: NO_ENROLLMENT, label: "Sem matrícula" }],
            className: "space-y-1.5 lg:w-52",
          },
        ]}
      />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rows.length} {rows.length === 1 ? "aluno" : "alunos"}
      </p>

      <Card>
        <CardContent className="px-0 py-2">
          {rows.length === 0 ? (
            <EmptyState
              icon={GraduationCap}
              title="Nenhum aluno encontrado"
              description="Ajuste a busca ou os filtros, ou cadastre um novo aluno."
              action={
                <Button asChild>
                  <Link href="/admin/alunos/novo">Novo aluno</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Aluno</TableHead>
                  <TableHead className="hidden sm:table-cell">Turma</TableHead>
                  <TableHead className="hidden lg:table-cell">Responsável principal</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ student, enrollment, enrollmentCount, guardian }) => {
                  const cls = enrollment ? classById.get(enrollment.classGroupId) : undefined;
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="pl-6">
                        <PersonCell name={student.name} subtitle={`Nº ${student.registrationNumber}`} href={`/admin/alunos/${student.id}`} />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {cls ? (
                          <>
                            <p className="font-medium">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {stageLabel(cls.stageId, false)}
                              {ano === ALL && enrollment ? ` · ${yearById.get(enrollment.academicYearId)?.name}` : ""}
                            </p>
                          </>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">{guardian?.name ?? "—"}</TableCell>
                      <TableCell>
                        {enrollment ? (
                          <EnrollmentStatusBadge status={enrollment.status} />
                        ) : (
                          <div className="flex items-center gap-2">
                            <StatusBadge tone="warning">Sem matrícula</StatusBadge>
                            {student.status === "ACTIVE" && (
                              <Button asChild variant="link" size="sm" className="h-auto p-0">
                                <Link href={`/admin/matriculas/nova?aluno=${student.id}`}>Matricular</Link>
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          label={student.name}
                          viewHref={`/admin/alunos/${student.id}`}
                          editHref={`/admin/alunos/${student.id}/editar`}
                          listHref="/admin/alunos"
                          blockedReason={
                            enrollmentCount > 0
                              ? `${student.name} tem ${enrollmentCount} matrícula${enrollmentCount > 1 ? "s" : ""} no histórico. O histórico escolar precisa ser preservado: em vez de excluir, marque o aluno como inativo.`
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

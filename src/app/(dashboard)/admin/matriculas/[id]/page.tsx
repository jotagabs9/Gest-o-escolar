import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Info } from "lucide-react";

import { BackLink } from "@/components/academic/back-link";
import { EmptyState } from "@/components/academic/empty-state";
import { SavedNotice } from "@/components/academic/saved-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList } from "@/components/people/detail-list";
import { EnrollmentStatusBadge, LinkStatusBadge, RoleBadge } from "@/components/people/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import {
  SHIFT_OPTIONS,
  byId,
  getClassGroup,
  listAcademicYears,
  listAllComponents,
  listCurricula,
  optionLabel,
  stageLabel,
} from "@/lib/mock/academic";
import {
  curriculaOfEnrollment,
  enrollmentsOfStudent,
  getEnrollment,
  getStudent,
  linksOfStudent,
  listGuardians,
} from "@/lib/mock/people";
import { ageFromBirthDate } from "@/lib/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Matrícula | Gestão Escolar" };

export default async function EnrollmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const { status } = await searchParams;

  const enrollment = await getEnrollment(id);
  if (!enrollment) notFound();

  const [student, cls, years, links, curricula, components, history] = await Promise.all([
    getStudent(enrollment.studentId),
    getClassGroup(enrollment.classGroupId),
    listAcademicYears(),
    curriculaOfEnrollment(id),
    listCurricula(),
    listAllComponents(),
    enrollmentsOfStudent(enrollment.studentId),
  ]);
  if (!student) notFound();

  const [guardianLinks, guardians] = await Promise.all([linksOfStudent(student.id), listGuardians()]);
  const primary = guardianLinks.find((l) => l.isPrimary);
  const primaryGuardian = primary ? guardians.find((g) => g.id === primary.guardianId) : undefined;

  const year = years.find((y) => y.id === enrollment.academicYearId);
  const curriculumById = byId(curricula);
  const yearById = byId(years);
  const otherEnrollments = history.filter((e) => e.id !== id);

  return (
    <>
      <BackLink href="/admin/matriculas">Matrículas</BackLink>

      <PageHeader title={`Matrícula ${enrollment.number}`} description={`${student.name} · ${year?.name ?? ""}`}>
        <Button asChild variant="outline">
          <Link href={`/admin/alunos/${student.id}`}>Ver aluno</Link>
        </Button>
      </PageHeader>

      <SavedNotice status={status} />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aluno</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                {
                  label: "Nome",
                  value: (
                    <Link href={`/admin/alunos/${student.id}`} className="underline-offset-4 hover:underline">
                      {student.name}
                    </Link>
                  ),
                },
                { label: "Nº escolar", value: student.registrationNumber },
                { label: "Idade", value: `${ageFromBirthDate(student.birthDate)} anos` },
                { label: "Responsável", value: primaryGuardian ? `${primaryGuardian.name} (${primary?.relationship})` : undefined },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Turma e ano letivo</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: "Ano letivo", value: year?.name },
                { label: "Turma", value: cls?.name },
                { label: "Série / etapa", value: cls ? stageLabel(cls.stageId) : undefined },
                { label: "Turno", value: cls ? optionLabel(SHIFT_OPTIONS, cls.shift) : undefined },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Situação da matrícula</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <EnrollmentStatusBadge status={enrollment.status} />
            <DetailList
              items={[
                { label: "Matriculado em", value: formatDate(enrollment.enrolledAt) },
                { label: "Nº", value: enrollment.number },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vínculos com matrizes (EnrollmentCurriculum)</CardTitle>
          <CardDescription>
            Cada vínculo tem papel e status próprios, independentes do status da matrícula. O aluno pode seguir matriculado mesmo
            desistindo de uma matriz.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {links.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Nenhuma matriz vinculada"
              description={
                enrollment.status === "COMPLETED"
                  ? "Matrícula de um ano anterior, sem vínculos registrados no histórico migrado."
                  : "Sem matriz, o aluno não aparece nas listas de notas e frequência. Vincule uma matriz para completar a matrícula."
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Matriz</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="hidden sm:table-cell">Componentes</TableHead>
                  <TableHead className="hidden sm:table-cell">Carga horária</TableHead>
                  <TableHead className="pr-6">Status do vínculo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {links.map((l) => {
                  const curriculum = curriculumById.get(l.curriculumId);
                  const own = components.filter((c) => c.curriculumId === l.curriculumId);
                  return (
                    <TableRow key={l.id}>
                      <TableCell className="pl-6">
                        {curriculum ? (
                          <Link href={`/admin/estrutura/matrizes/${curriculum.id}`} className="font-medium underline-offset-4 hover:underline">
                            {curriculum.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                        {curriculum && <p className="text-xs text-muted-foreground">{curriculum.code}</p>}
                      </TableCell>
                      <TableCell>
                        <RoleBadge role={l.role} />
                      </TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{own.length}</TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{own.reduce((s, c) => s + c.workloadHours, 0)}h</TableCell>
                      <TableCell className="pr-6">
                        <LinkStatusBadge status={l.status} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {otherEnrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Outras matrículas do aluno</CardTitle>
            <CardDescription>Histórico por ano letivo (rematrículas).</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {otherEnrollments.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium tabular-nums">{yearById.get(e.academicYearId)?.name}</span>
                    <span className="text-muted-foreground">Matrícula {e.number}</span>
                    <EnrollmentStatusBadge status={e.status} />
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/admin/matriculas/${e.id}`}>Abrir</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        Alterar o status da matrícula e dos vínculos (cancelar, transferir, concluir) ainda não está nesta versão.
      </p>
    </>
  );
}

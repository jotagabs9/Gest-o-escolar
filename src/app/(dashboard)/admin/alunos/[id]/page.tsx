import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Pencil, Phone, Plus } from "lucide-react";

import { BackLink } from "@/components/academic/back-link";
import { EmptyState } from "@/components/academic/empty-state";
import { SavedNotice } from "@/components/academic/saved-notice";
import { StatusBadge } from "@/components/academic/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { DetailList } from "@/components/people/detail-list";
import { EnrollmentStatusBadge, PersonStatusBadge, RoleBadge } from "@/components/people/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { byId, classGroups, listAcademicYears, stageLabel } from "@/lib/mock/academic";
import {
  enrollmentsOfStudent,
  getStudent,
  linksOfStudent,
  listEnrollmentCurricula,
  listGuardians,
} from "@/lib/mock/people";
import { ageFromBirthDate } from "@/lib/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Aluno | Gestão Escolar" };

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const { status } = await searchParams;

  const student = await getStudent(id);
  if (!student) notFound();

  const [links, guardians, enrollments, allLinks, years] = await Promise.all([
    linksOfStudent(id),
    listGuardians(),
    enrollmentsOfStudent(id),
    listEnrollmentCurricula(),
    listAcademicYears(),
  ]);
  const guardianById = byId(guardians);
  const classById = byId(classGroups);
  const yearById = byId(years);
  const age = ageFromBirthDate(student.birthDate);

  return (
    <>
      <BackLink href="/admin/alunos">Alunos</BackLink>

      <PageHeader title={student.name} description={`Nº ${student.registrationNumber} · ${age} anos`}>
        <Button asChild variant="outline">
          <Link href={`/admin/alunos/${id}/editar`}>
            <Pencil className="mr-2 size-4" /> Editar
          </Link>
        </Button>
        {student.status === "ACTIVE" && (
          <Button asChild>
            <Link href={`/admin/matriculas/nova?aluno=${id}`}>
              <Plus className="mr-2 size-4" /> Nova matrícula
            </Link>
          </Button>
        )}
      </PageHeader>

      <SavedNotice status={status} />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Matrículas</CardTitle>
            <CardDescription>Uma matrícula por ano letivo. A rematrícula cria uma nova matrícula.</CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {enrollments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Este aluno ainda não foi matriculado"
                description="Crie a matrícula para vincular o aluno a uma turma e às matrizes curriculares."
                action={
                  student.status === "ACTIVE" ? (
                    <Button asChild>
                      <Link href={`/admin/matriculas/nova?aluno=${id}`}>Nova matrícula</Link>
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Ano</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead className="hidden md:table-cell">Matrizes</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="w-12 pr-6">
                      <span className="sr-only">Abrir</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((e) => {
                    const cls = classById.get(e.classGroupId);
                    const own = allLinks.filter((l) => l.enrollmentId === e.id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell className="pl-6 tabular-nums">{yearById.get(e.academicYearId)?.name}</TableCell>
                        <TableCell>
                          <p className="font-medium">{cls?.name}</p>
                          <p className="text-xs text-muted-foreground">{cls ? stageLabel(cls.stageId, false) : ""}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Dados pessoais</CardTitle>
                <PersonStatusBadge status={student.status} />
              </div>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: "Nascimento", value: `${formatDate(student.birthDate)} (${age} anos)` },
                  { label: "E-mail", value: student.email },
                  { label: "Telefone", value: student.phone },
                  { label: "CPF", value: student.documentMasked },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Responsáveis</CardTitle>
            </CardHeader>
            <CardContent>
              {links.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {age < 18 ? "Aluno menor de idade sem responsável vinculado. Edite o cadastro para adicionar." : "Nenhum responsável vinculado."}
                </p>
              ) : (
                <ul className="divide-y">
                  {links.map((l) => {
                    const g = guardianById.get(l.guardianId);
                    if (!g) return null;
                    return (
                      <li key={l.guardianId} className="space-y-1 py-3 first:pt-0 last:pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <Link
                            href={`/admin/responsaveis/${g.id}/editar`}
                            className="text-sm font-medium underline-offset-4 hover:underline"
                          >
                            {g.name}
                          </Link>
                          {l.isPrimary && <Badge variant="secondary">Principal</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">{l.relationship}</p>
                        {g.phone && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="size-3" /> {g.phone}
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Clock, Pencil, School } from "lucide-react";

import { BackLink } from "@/components/academic/back-link";
import { EmptyState } from "@/components/academic/empty-state";
import { SavedNotice } from "@/components/academic/saved-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { DetailList } from "@/components/people/detail-list";
import { PersonStatusBadge } from "@/components/people/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  byId,
  classGroups,
  curricula,
  curriculumComponents,
  listAcademicYears,
  stageLabel,
} from "@/lib/mock/academic";
import { assignmentsOfTeacher, getTeacherProfile } from "@/lib/mock/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Professor | Gestão Escolar" };

export default async function TeacherDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const { status } = await searchParams;

  const teacher = await getTeacherProfile(id);
  if (!teacher) notFound();

  const [assignments, years] = await Promise.all([assignmentsOfTeacher(id), listAcademicYears()]);
  const componentById = byId(curriculumComponents);
  const classById = byId(classGroups);
  const curriculumById = byId(curricula);
  const yearById = byId(years);

  const rows = assignments.flatMap((a) => {
    const component = componentById.get(a.componentId);
    const cls = classById.get(a.classGroupId);
    if (!component || !cls) return [];
    return [{ a, component, cls, curriculum: curriculumById.get(component.curriculumId) }];
  });

  const classCount = new Set(rows.map((r) => r.cls.id)).size;
  const hours = rows.reduce((s, r) => s + r.component.workloadHours, 0);

  return (
    <>
      <BackLink href="/admin/professores">Professores</BackLink>

      <PageHeader title={teacher.name} description={teacher.specialty ? `${teacher.specialty} · ${teacher.email}` : teacher.email}>
        <Button asChild variant="outline">
          <Link href={`/admin/professores/${id}/editar`}>
            <Pencil className="mr-2 size-4" /> Editar
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={status} />

      <section aria-label="Resumo das alocações" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Componentes alocados" value={rows.length} icon={BookOpen} />
        <StatCard label="Turmas" value={classCount} icon={School} />
        <StatCard label="Carga horária alocada" value={`${hours}h`} hint="soma dos componentes" icon={Clock} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Alocações (TeacherAssignment)</CardTitle>
            <CardDescription>
              Somente leitura. O professor só lança notas e frequência nos componentes e turmas listados aqui.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 pb-2">
            {rows.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="Sem alocações"
                description="Este professor ainda não está alocado em nenhum componente. Sem alocação, ele não consegue lançar notas nem frequência."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Componente</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead className="hidden md:table-cell">Matriz</TableHead>
                    <TableHead className="hidden sm:table-cell">Ano</TableHead>
                    <TableHead className="pr-6 text-right">Carga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map(({ a, component, cls, curriculum }) => (
                    <TableRow key={a.id}>
                      <TableCell className="pl-6 font-medium">{component.name}</TableCell>
                      <TableCell>
                        <p>{cls.name}</p>
                        <p className="text-xs text-muted-foreground">{stageLabel(cls.stageId, false)}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {curriculum ? (
                          <Link href={`/admin/estrutura/matrizes/${curriculum.id}`} className="text-sm underline-offset-4 hover:underline">
                            {curriculum.code}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{yearById.get(cls.academicYearId)?.name}</TableCell>
                      <TableCell className="pr-6 text-right tabular-nums">{component.workloadHours}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">Cadastro</CardTitle>
              <PersonStatusBadge status={teacher.status} />
            </div>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: "E-mail", value: teacher.email },
                { label: "Telefone", value: teacher.phone },
                { label: "Área de formação", value: teacher.specialty },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

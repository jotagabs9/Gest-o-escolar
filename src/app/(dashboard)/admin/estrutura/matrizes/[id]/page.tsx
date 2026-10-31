import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen, Clock, Layers, Pencil, Plus, UserX } from "lucide-react";

import { BackLink } from "@/components/academic/back-link";
import { EmptyState } from "@/components/academic/empty-state";
import { RowActions } from "@/components/academic/row-actions";
import { SavedNotice } from "@/components/academic/saved-notice";
import { ComponentTypeBadge, CurriculumStatusBadge, StatusBadge } from "@/components/academic/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  COMPONENT_TYPE_OPTIONS,
  KNOWLEDGE_AREA_OPTIONS,
  byId,
  getCurriculum,
  listAcademicYears,
  listClassGroups,
  listComponents,
  listCourses,
  listTeachers,
  optionLabel,
  stageLabel,
} from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Matriz curricular | Gestão Escolar" };

export default async function CurriculumDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { id } = await params;
  const { status } = await searchParams;

  const curriculum = await getCurriculum(id);
  if (!curriculum) notFound();

  const [components, teachers, years, courses, groups] = await Promise.all([
    listComponents(id),
    listTeachers(),
    listAcademicYears(),
    listCourses(),
    listClassGroups(),
  ]);
  const teacherById = byId(teachers);
  const year = years.find((y) => y.id === curriculum.academicYearId);
  const course = courses.find((c) => c.id === curriculum.courseId);
  const linkedClasses = groups.filter((g) => g.curriculumId === id);

  const totalHours = components.reduce((s, c) => s + c.workloadHours, 0);
  const withoutTeacher = components.filter((c) => !c.teacherId).length;
  const areas = new Set(components.map((c) => c.knowledgeArea)).size;

  const base = `/admin/estrutura/matrizes/${id}`;

  return (
    <>
      <BackLink href="/admin/estrutura/matrizes">Matrizes curriculares</BackLink>

      <PageHeader
        title={curriculum.name}
        description={`${curriculum.code} · ${stageLabel(curriculum.stageId)} · ${year?.name ?? ""}${course ? ` · ${course.name}` : ""}`}
      >
        <Button asChild variant="outline">
          <Link href={`${base}/editar`}>
            <Pencil className="mr-2 size-4" /> Editar matriz
          </Link>
        </Button>
        <Button asChild>
          <Link href={`${base}/componentes/novo`}>
            <Plus className="mr-2 size-4" /> Novo componente
          </Link>
        </Button>
      </PageHeader>

      <div className="flex flex-wrap items-center gap-2">
        <CurriculumStatusBadge status={curriculum.status} />
        <span className="text-sm text-muted-foreground">
          {linkedClasses.length > 0
            ? `Usada em ${linkedClasses.length} turma${linkedClasses.length > 1 ? "s" : ""}: ${linkedClasses.map((g) => g.name).join(", ")}`
            : "Ainda não vinculada a nenhuma turma"}
        </span>
      </div>

      {curriculum.description && <p className="max-w-2xl text-sm text-muted-foreground">{curriculum.description}</p>}

      <SavedNotice status={status} />

      <section aria-label="Resumo da matriz" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Componentes" value={components.length} icon={BookOpen} />
        <StatCard label="Carga horária total" value={`${totalHours}h`} icon={Clock} />
        <StatCard label="Áreas de conhecimento" value={areas} icon={Layers} />
        <StatCard
          label="Sem professor alocado"
          value={withoutTeacher}
          hint={withoutTeacher > 0 ? "ninguém lança notas nesses componentes" : "todos com professor"}
          icon={UserX}
          tone={withoutTeacher > 0 ? "warning" : "success"}
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Componentes curriculares</CardTitle>
          <CardDescription>Cada componente tem uma carga horária e, opcionalmente, um professor alocado.</CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          {components.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Esta matriz ainda não tem componentes"
              description="Adicione os componentes que os alunos vão cursar, com carga horária e área de conhecimento."
              action={
                <Button asChild>
                  <Link href={`${base}/componentes/novo`}>Novo componente</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Componente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Área de conhecimento</TableHead>
                  <TableHead className="hidden sm:table-cell">Carga horária</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((c) => {
                  const teacher = c.teacherId ? teacherById.get(c.teacherId) : null;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="pl-6 font-medium">{c.name}</TableCell>
                      <TableCell>
                        <ComponentTypeBadge type={c.type} label={optionLabel(COMPONENT_TYPE_OPTIONS, c.type)} />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {optionLabel(KNOWLEDGE_AREA_OPTIONS, c.knowledgeArea)}
                      </TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{c.workloadHours}h</TableCell>
                      <TableCell>
                        {teacher ? teacher.name : <StatusBadge tone="warning">Sem professor</StatusBadge>}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          label={c.name}
                          editHref={`${base}/componentes/${c.id}/editar`}
                          listHref={base}
                          blockedReason={
                            linkedClasses.some((g) => g.enrolled > 0) && curriculum.status === "ACTIVE"
                              ? "Esta matriz está em uso por alunos matriculados. Para não alterar o histórico, o componente não pode ser excluído."
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

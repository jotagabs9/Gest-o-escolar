import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, ClipboardCheck, School } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { DemoTeacherSwitcher } from "@/components/assessment/demo-teacher-switcher";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { byId, classGroups, curriculumComponents, stageLabel } from "@/lib/mock/academic";
import { assignmentStats, assignmentsOfTeacher } from "@/lib/mock/assessment";
import { teacherProfiles } from "@/lib/mock/people";
import { requireTeacher } from "@/lib/teacher-context";

export const metadata: Metadata = { title: "Minhas turmas | Gestão Escolar" };

export default async function TeacherClassesPage() {
  const { teacherId, teacher } = await requireTeacher();
  const assignments = assignmentsOfTeacher(teacherId);
  const componentById = byId(curriculumComponents);

  // Agrupa as alocações por turma.
  const byClass = new Map<string, typeof assignments>();
  for (const a of assignments) byClass.set(a.classGroupId, [...(byClass.get(a.classGroupId) ?? []), a]);

  const demoOptions = teacherProfiles.map((t) => ({ value: t.id, label: t.name }));

  return (
    <>
      <PageHeader title="Minhas turmas" description="Turmas e componentes em que você está alocado.">
        {process.env.NODE_ENV !== "production" && <DemoTeacherSwitcher current={teacherId} options={demoOptions} />}
      </PageHeader>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-2">
            <EmptyState
              icon={School}
              title="Você ainda não tem alocações"
              description={`${teacher.name} não está alocado em nenhum componente. Peça à secretaria para registrar a alocação.`}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[...byClass.entries()].map(([classId, items]) => {
            const cls = classGroups.find((c) => c.id === classId);
            if (!cls) return null;
            return (
              <Card key={classId}>
                <CardHeader>
                  <CardTitle className="text-base">Turma {cls.name}</CardTitle>
                  <CardDescription>{stageLabel(cls.stageId)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y">
                    {items.map((a) => {
                      const stats = assignmentStats(a.id);
                      return (
                        <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{componentById.get(a.componentId)?.name}</p>
                            <p className="text-xs text-muted-foreground">{stats.students} alunos</p>
                          </div>
                          <div className="flex gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/professor/notas/${a.id}`}>
                                <BookOpenCheck className="mr-1.5 size-4" /> Notas
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link href={`/professor/frequencia/${a.id}`}>
                                <ClipboardCheck className="mr-1.5 size-4" /> Frequência
                              </Link>
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

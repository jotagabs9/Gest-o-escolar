import type { Metadata } from "next";
import { BookOpenCheck } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { AssignmentCards } from "@/components/assessment/assignment-cards";
import { DemoTeacherSwitcher } from "@/components/assessment/demo-teacher-switcher";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buildAssignmentCards } from "@/lib/assignment-cards";
import { teacherProfiles } from "@/lib/mock/people";
import { requireTeacher } from "@/lib/teacher-context";

export const metadata: Metadata = { title: "Lançamento de notas | Gestão Escolar" };

export default async function TeacherGradesPage() {
  const { teacherId, teacher } = await requireTeacher();
  const items = buildAssignmentCards(teacherId, "notas");

  return (
    <>
      <PageHeader title="Lançamento de notas" description="Você só vê e lança notas nos componentes em que está alocado.">
        {process.env.NODE_ENV !== "production" && (
          <DemoTeacherSwitcher current={teacherId} options={teacherProfiles.map((t) => ({ value: t.id, label: t.name }))} />
        )}
      </PageHeader>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-2">
            <EmptyState
              icon={BookOpenCheck}
              title="Nenhuma alocação encontrada"
              description={`${teacher.name} não está alocado em nenhum componente, então não há notas para lançar.`}
            />
          </CardContent>
        </Card>
      ) : (
        <AssignmentCards items={items} mode="notas" />
      )}
    </>
  );
}

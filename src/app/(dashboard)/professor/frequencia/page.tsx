import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { AssignmentCards } from "@/components/assessment/assignment-cards";
import { DemoTeacherSwitcher } from "@/components/assessment/demo-teacher-switcher";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { buildAssignmentCards } from "@/lib/assignment-cards";
import { teacherProfiles } from "@/lib/mock/people";
import { requireTeacher } from "@/lib/teacher-context";

export const metadata: Metadata = { title: "Frequência | Gestão Escolar" };

export default async function TeacherAttendancePage() {
  const { teacherId, teacher } = await requireTeacher();
  const items = buildAssignmentCards(teacherId, "frequencia");

  return (
    <>
      <PageHeader title="Lançamento de frequência" description="Chamada por aula, só nos componentes em que você está alocado.">
        {process.env.NODE_ENV !== "production" && (
          <DemoTeacherSwitcher current={teacherId} options={teacherProfiles.map((t) => ({ value: t.id, label: t.name }))} />
        )}
      </PageHeader>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-2">
            <EmptyState
              icon={ClipboardCheck}
              title="Nenhuma alocação encontrada"
              description={`${teacher.name} não está alocado em nenhum componente, então não há chamadas para registrar.`}
            />
          </CardContent>
        </Card>
      ) : (
        <AssignmentCards items={items} mode="frequencia" />
      )}
    </>
  );
}

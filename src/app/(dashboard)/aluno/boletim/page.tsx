import type { Metadata } from "next";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { ReportCardView } from "@/components/assessment/report-card-view";
import { SegmentedLinks } from "@/components/assessment/segmented-links";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { listAcademicYears } from "@/lib/mock/academic";
import { mockGuardianIdForUser } from "@/lib/mock/assessment";
import { enrollmentsOfStudent, linksOfGuardian, listStudents } from "@/lib/mock/people";
import { buildReportCard } from "@/lib/mock/report-card";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Boletim | Gestão Escolar" };

export default async function StudentReportCardPage({
  searchParams,
}: {
  searchParams: Promise<{ aluno?: string; matricula?: string }>;
}) {
  const user = await requireRole("STUDENT_GUARDIAN");
  const sp = await searchParams;

  // Só os alunos vinculados a este responsável. Qualquer outro `?aluno=` é ignorado.
  const guardianId = mockGuardianIdForUser(user.email);
  const [links, allStudents, years] = await Promise.all([
    guardianId ? linksOfGuardian(guardianId) : Promise.resolve([]),
    listStudents(),
    listAcademicYears(),
  ]);
  const myStudents = links
    .map((l) => allStudents.find((s) => s.id === l.studentId))
    .filter((s): s is NonNullable<typeof s> => !!s);

  if (myStudents.length === 0) {
    return (
      <>
        <PageHeader title="Boletim" />
        <Card>
          <CardContent className="py-2">
            <EmptyState
              icon={FileText}
              title="Nenhum aluno vinculado"
              description="Sua conta ainda não está vinculada a nenhum aluno. Procure a secretaria da escola."
            />
          </CardContent>
        </Card>
      </>
    );
  }

  const student = myStudents.find((s) => s.id === sp.aluno) ?? myStudents[0];
  const enrollments = await enrollmentsOfStudent(student.id);
  const activeYearId = years.find((y) => y.status === "ACTIVE")?.id;
  const enrollment =
    enrollments.find((e) => e.id === sp.matricula) ??
    enrollments.find((e) => e.academicYearId === activeYearId) ??
    enrollments[0];
  const card = enrollment ? buildReportCard(enrollment.id) : null;
  const yearName = (id: string) => years.find((y) => y.id === id)?.name ?? id;

  return (
    <>
      <PageHeader title="Boletim" description="Notas por período, média, frequência e situação em cada componente." />

      {myStudents.length > 1 && (
        <SegmentedLinks
          label="Escolher aluno"
          items={myStudents.map((s) => ({ href: `/aluno/boletim?aluno=${s.id}`, label: s.name, active: s.id === student.id }))}
        />
      )}

      {enrollments.length > 1 && (
        <SegmentedLinks
          label="Escolher ano letivo"
          items={enrollments.map((e) => ({
            href: `/aluno/boletim?aluno=${student.id}&matricula=${e.id}`,
            label: yearName(e.academicYearId),
            active: e.id === enrollment?.id,
          }))}
        />
      )}

      {card ? (
        <ReportCardView card={card} />
      ) : (
        <Card>
          <CardContent className="py-2">
            <EmptyState
              icon={FileText}
              title={`${student.name} ainda não tem matrícula`}
              description="O boletim aparece depois que a escola registrar a matrícula do aluno em um ano letivo."
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}

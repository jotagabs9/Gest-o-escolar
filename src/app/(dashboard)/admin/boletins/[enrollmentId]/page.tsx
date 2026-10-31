import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/academic/back-link";
import { ReportCardView } from "@/components/assessment/report-card-view";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { buildReportCard } from "@/lib/mock/report-card";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Boletim | Gestão Escolar" };

export default async function AdminReportCardPage({ params }: { params: Promise<{ enrollmentId: string }> }) {
  await requireRole("SCHOOL_ADMIN");
  const { enrollmentId } = await params;
  const card = buildReportCard(enrollmentId);
  if (!card) notFound();

  return (
    <>
      <BackLink href="/admin/boletins">Boletins</BackLink>
      <PageHeader title="Boletim" description={`${card.student.name} · ${card.yearName}`}>
        <Button asChild variant="outline">
          <Link href={`/admin/matriculas/${enrollmentId}`}>Ver matrícula</Link>
        </Button>
      </PageHeader>
      <ReportCardView card={card} />
    </>
  );
}

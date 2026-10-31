import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { StatusBadge } from "@/components/academic/status-badge";
import { AttendanceValue } from "@/components/assessment/result-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { ALL, FilterBar } from "@/components/people/filter-bar";
import { PersonCell } from "@/components/people/person-cell";
import { RoleBadge } from "@/components/people/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatGrade } from "@/lib/format";
import { listAcademicYears } from "@/lib/mock/academic";
import { listClassGroupOptions, listEnrollments } from "@/lib/mock/people";
import { buildReportCard } from "@/lib/mock/report-card";
import { matchesQuery } from "@/lib/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Boletins | Gestão Escolar" };

export default async function AdminReportCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; ano?: string; turma?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const sp = await searchParams;

  const years = await listAcademicYears();
  const activeYear = years.find((y) => y.status === "ACTIVE") ?? years[0];
  const ano = sp.ano ?? activeYear.id;
  const classOptions = await listClassGroupOptions(ano === ALL ? undefined : ano);
  const turma = sp.turma && (sp.turma === ALL || classOptions.some((o) => o.value === sp.turma)) ? sp.turma : ALL;
  const q = sp.q ?? "";

  const enrollments = await listEnrollments({
    academicYearId: ano === ALL ? undefined : ano,
    classGroupId: turma === ALL ? undefined : turma,
  });

  const rows = enrollments
    .map((e) => ({ enrollment: e, card: buildReportCard(e.id) }))
    .filter((r): r is { enrollment: typeof r.enrollment; card: NonNullable<typeof r.card> } => !!r.card)
    .filter((r) => matchesQuery(q, r.card.student.name, r.card.student.registrationNumber));

  return (
    <>
      <PageHeader title="Boletins" description="Boletim de cada matrícula, com notas por período, frequência e situação." />

      <FilterBar
        search={{ key: "q", label: "Buscar", placeholder: "Aluno ou nº escolar" }}
        values={{ ano, turma }}
        defaults={{ ano: activeYear.id, turma: ALL }}
        fields={[
          { key: "ano", label: "Ano letivo", allLabel: "Todos os anos", options: years.map((y) => ({ value: y.id, label: y.name })), className: "space-y-1.5 lg:w-40" },
          { key: "turma", label: "Turma", allLabel: "Todas as turmas", options: classOptions, className: "space-y-1.5 lg:w-60" },
        ]}
      />

      <Card>
        <CardContent className="px-0 py-2">
          {rows.length === 0 ? (
            <EmptyState icon={ScrollText} title="Nenhum boletim encontrado" description="Ajuste a busca ou os filtros." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Aluno</TableHead>
                  <TableHead className="hidden sm:table-cell">Turma</TableHead>
                  <TableHead className="hidden lg:table-cell">Seções</TableHead>
                  <TableHead className="text-center">Média</TableHead>
                  <TableHead className="text-right">Freq.</TableHead>
                  <TableHead>Alertas</TableHead>
                  <TableHead className="w-20 pr-6">
                    <span className="sr-only">Abrir</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ enrollment, card }) => (
                  <TableRow key={enrollment.id}>
                    <TableCell className="pl-6">
                      <PersonCell name={card.student.name} subtitle={`Matrícula ${enrollment.number}`} href={`/admin/boletins/${enrollment.id}`} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {card.classGroupName} <span className="text-muted-foreground">· {card.yearName}</span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {card.links.length === 0 ? (
                        <StatusBadge tone="warning">Sem matriz</StatusBadge>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {card.links.map((l) => (
                            <RoleBadge key={l.id} role={l.role} />
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{formatGrade(card.summary.overallAverage)}</TableCell>
                    <TableCell className="text-right">
                      <AttendanceValue pct={card.summary.overallAttendance} min={null} />
                    </TableCell>
                    <TableCell>
                      {card.summary.alerts > 0 ? (
                        <StatusBadge tone="warning">
                          {card.summary.alerts} componente{card.summary.alerts > 1 ? "s" : ""}
                        </StatusBadge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Nenhum</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/boletins/${enrollment.id}`} aria-label={`Abrir boletim de ${card.student.name}`}>
                          Abrir
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

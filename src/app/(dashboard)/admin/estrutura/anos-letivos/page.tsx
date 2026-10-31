import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { RowActions } from "@/components/academic/row-actions";
import { SavedNotice } from "@/components/academic/saved-notice";
import { YearStatusBadge } from "@/components/academic/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { listAcademicYears, listClassGroups } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Anos letivos | Gestão Escolar" };

export default async function AcademicYearsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { status } = await searchParams;
  const [years, groups] = await Promise.all([listAcademicYears(), listClassGroups()]);

  return (
    <>
      <PageHeader title="Anos letivos" description="Períodos em que turmas, matrículas e lançamentos acontecem.">
        <Button asChild>
          <Link href="/admin/estrutura/anos-letivos/novo">
            <Plus className="mr-2 size-4" /> Novo ano letivo
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={status} />

      <Card>
        <CardContent className="px-0 py-2">
          {years.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Nenhum ano letivo cadastrado"
              description="Crie o primeiro ano letivo para começar a montar turmas e matrículas."
              action={
                <Button asChild>
                  <Link href="/admin/estrutura/anos-letivos/novo">Novo ano letivo</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Ano</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="hidden sm:table-cell">Turmas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {years.map((y) => {
                  const count = groups.filter((g) => g.academicYearId === y.id).length;
                  return (
                    <TableRow key={y.id}>
                      <TableCell className="pl-6 font-medium">{y.name}</TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatDate(y.startsAt)} a {formatDate(y.endsAt)}
                      </TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{count}</TableCell>
                      <TableCell>
                        <YearStatusBadge status={y.status} />
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          label={`Ano letivo ${y.name}`}
                          editHref={`/admin/estrutura/anos-letivos/${y.id}/editar`}
                          listHref="/admin/estrutura/anos-letivos"
                          blockedReason={
                            count > 0
                              ? `O ano letivo ${y.name} tem ${count} turma${count > 1 ? "s" : ""}. Remova ou mova as turmas antes de excluir.`
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

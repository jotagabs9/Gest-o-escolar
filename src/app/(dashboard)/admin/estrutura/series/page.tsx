import type { Metadata } from "next";
import Link from "next/link";
import { ListOrdered, Plus } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { RowActions } from "@/components/academic/row-actions";
import { SavedNotice } from "@/components/academic/saved-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { byId, listClassGroups, listCurricula, listModalities, listStages } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Séries e etapas | Gestão Escolar" };

export default async function StagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { status } = await searchParams;
  const [stages, modalities, groups, curricula] = await Promise.all([
    listStages(),
    listModalities(),
    listClassGroups(),
    listCurricula(),
  ]);
  const modalityById = byId(modalities);

  return (
    <>
      <PageHeader title="Séries e etapas" description="Sequência de cada modalidade, na ordem em que o aluno avança.">
        <Button asChild>
          <Link href="/admin/estrutura/series/nova">
            <Plus className="mr-2 size-4" /> Nova série / etapa
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={status} />

      <Card>
        <CardContent className="px-0 py-2">
          {stages.length === 0 ? (
            <EmptyState
              icon={ListOrdered}
              title="Nenhuma série ou etapa cadastrada"
              description="Cadastre as séries e etapas de cada modalidade para poder criar turmas e matrizes."
              action={
                <Button asChild>
                  <Link href="/admin/estrutura/series/nova">Nova série / etapa</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20 pl-6">Ordem</TableHead>
                  <TableHead>Série / etapa</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead className="hidden md:table-cell">Turmas</TableHead>
                  <TableHead className="hidden md:table-cell">Matrizes</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stages.map((s) => {
                  const classCount = groups.filter((g) => g.stageId === s.id).length;
                  const curriculumCount = curricula.filter((c) => c.stageId === s.id).length;
                  const used = classCount + curriculumCount;
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="pl-6 tabular-nums text-muted-foreground">{s.order}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-muted-foreground">{modalityById.get(s.modalityId)?.name ?? "—"}</TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">{classCount}</TableCell>
                      <TableCell className="hidden tabular-nums md:table-cell">{curriculumCount}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          label={`${s.name} (${modalityById.get(s.modalityId)?.name ?? ""})`}
                          editHref={`/admin/estrutura/series/${s.id}/editar`}
                          listHref="/admin/estrutura/series"
                          blockedReason={
                            used > 0
                              ? `Esta série/etapa tem ${classCount} turma(s) e ${curriculumCount} matriz(es) vinculadas. Desvincule-as antes de excluir.`
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

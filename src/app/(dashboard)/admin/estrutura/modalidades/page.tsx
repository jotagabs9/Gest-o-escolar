import type { Metadata } from "next";
import Link from "next/link";
import { Layers, Plus } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { RowActions } from "@/components/academic/row-actions";
import { SavedNotice } from "@/components/academic/saved-notice";
import { StatusBadge } from "@/components/academic/status-badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MODALITY_TYPE_OPTIONS, listModalities, listStages, optionLabel } from "@/lib/mock/academic";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Modalidades | Gestão Escolar" };

export default async function ModalitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const { status } = await searchParams;
  const [modalities, stages] = await Promise.all([listModalities(), listStages()]);

  return (
    <>
      <PageHeader title="Modalidades de ensino" description="Formas de oferta que agrupam séries e etapas.">
        <Button asChild>
          <Link href="/admin/estrutura/modalidades/nova">
            <Plus className="mr-2 size-4" /> Nova modalidade
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={status} />

      <Card>
        <CardContent className="px-0 py-2">
          {modalities.length === 0 ? (
            <EmptyState
              icon={Layers}
              title="Nenhuma modalidade cadastrada"
              description="Cadastre as modalidades que a escola oferece, como Regular, Integrado ou EJA."
              action={
                <Button asChild>
                  <Link href="/admin/estrutura/modalidades/nova">Nova modalidade</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Modalidade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden sm:table-cell">Séries / etapas</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modalities.map((m) => {
                  const count = stages.filter((s) => s.modalityId === m.id).length;
                  return (
                    <TableRow key={m.id}>
                      <TableCell className="pl-6">
                        <p className="font-medium">{m.name}</p>
                        {m.description && <p className="max-w-md truncate text-xs text-muted-foreground">{m.description}</p>}
                      </TableCell>
                      <TableCell>
                        <StatusBadge tone="neutral">{optionLabel(MODALITY_TYPE_OPTIONS, m.type)}</StatusBadge>
                      </TableCell>
                      <TableCell className="hidden tabular-nums sm:table-cell">{count}</TableCell>
                      <TableCell className="pr-6 text-right">
                        <RowActions
                          label={m.name}
                          editHref={`/admin/estrutura/modalidades/${m.id}/editar`}
                          listHref="/admin/estrutura/modalidades"
                          blockedReason={
                            count > 0
                              ? `Esta modalidade tem ${count} série${count > 1 ? "s" : ""}/etapa${count > 1 ? "s" : ""}. Remova-as antes de excluir.`
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

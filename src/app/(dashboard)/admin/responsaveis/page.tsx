import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { RowActions } from "@/components/academic/row-actions";
import { SavedNotice } from "@/components/academic/saved-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { FilterBar } from "@/components/people/filter-bar";
import { PersonCell } from "@/components/people/person-cell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { byId } from "@/lib/mock/academic";
import { listGuardianLinks, listGuardians, listStudents } from "@/lib/mock/people";
import { matchesQuery } from "@/lib/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Responsáveis | Gestão Escolar" };

export default async function GuardiansPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const sp = await searchParams;
  const q = sp.q ?? "";

  const [guardians, links, students] = await Promise.all([listGuardians(), listGuardianLinks(), listStudents()]);
  const studentById = byId(students);

  const rows = guardians
    .filter((g) => matchesQuery(q, g.name, g.email, g.phone))
    .map((g) => ({ guardian: g, own: links.filter((l) => l.guardianId === g.id) }));

  return (
    <>
      <PageHeader title="Responsáveis" description="Um responsável pode acompanhar vários alunos.">
        <Button asChild>
          <Link href="/admin/responsaveis/novo">
            <Plus className="mr-2 size-4" /> Novo responsável
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={sp.status} />

      <FilterBar
        search={{ key: "q", label: "Buscar", placeholder: "Nome, e-mail ou telefone" }}
        values={{}}
        defaults={{}}
        fields={[]}
      />

      <Card>
        <CardContent className="px-0 py-2">
          {rows.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="Nenhum responsável encontrado"
              description="Ajuste a busca ou cadastre um novo responsável."
              action={
                <Button asChild>
                  <Link href="/admin/responsaveis/novo">Novo responsável</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Responsável</TableHead>
                  <TableHead className="hidden md:table-cell">Telefone</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ guardian, own }) => (
                  <TableRow key={guardian.id}>
                    <TableCell className="pl-6">
                      <PersonCell name={guardian.name} subtitle={guardian.email} href={`/admin/responsaveis/${guardian.id}/editar`} />
                    </TableCell>
                    <TableCell className="hidden tabular-nums text-muted-foreground md:table-cell">{guardian.phone ?? "—"}</TableCell>
                    <TableCell>
                      {own.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Nenhum aluno</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {own.map((l) => (
                            <Badge key={l.studentId} variant="outline" className="font-normal">
                              <Link href={`/admin/alunos/${l.studentId}`} className="hover:underline">
                                {studentById.get(l.studentId)?.name}
                              </Link>
                              <span className="ml-1 text-muted-foreground">· {l.relationship}</span>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <RowActions
                        label={guardian.name}
                        editHref={`/admin/responsaveis/${guardian.id}/editar`}
                        listHref="/admin/responsaveis"
                        blockedReason={
                          own.length > 0
                            ? `${guardian.name} está vinculado a ${own.length} aluno${own.length > 1 ? "s" : ""}. Remova os vínculos antes de excluir.`
                            : undefined
                        }
                      />
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

import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UserCog } from "lucide-react";

import { EmptyState } from "@/components/academic/empty-state";
import { RowActions } from "@/components/academic/row-actions";
import { SavedNotice } from "@/components/academic/saved-notice";
import { PageHeader } from "@/components/dashboard/page-header";
import { ALL, FilterBar } from "@/components/people/filter-bar";
import { PersonCell } from "@/components/people/person-cell";
import { PersonStatusBadge } from "@/components/people/status-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PERSON_STATUS_OPTIONS, listAssignments, listTeacherProfiles } from "@/lib/mock/people";
import { matchesQuery } from "@/lib/people";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Professores | Gestão Escolar" };

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; situacao?: string; status?: string }>;
}) {
  await requireRole("SCHOOL_ADMIN");
  const sp = await searchParams;
  const q = sp.q ?? "";
  const situacao = sp.situacao ?? ALL;

  const [teachers, assignments] = await Promise.all([listTeacherProfiles(), listAssignments()]);

  const rows = teachers
    .filter((t) => matchesQuery(q, t.name, t.email, t.specialty))
    .filter((t) => situacao === ALL || t.status === situacao)
    .map((t) => {
      const own = assignments.filter((a) => a.teacherId === t.id);
      return { teacher: t, count: own.length, classes: new Set(own.map((a) => a.classGroupId)).size };
    });

  return (
    <>
      <PageHeader title="Professores" description="Cadastro de professores e suas alocações por turma e componente.">
        <Button asChild>
          <Link href="/admin/professores/novo">
            <Plus className="mr-2 size-4" /> Novo professor
          </Link>
        </Button>
      </PageHeader>

      <SavedNotice status={sp.status} />

      <FilterBar
        search={{ key: "q", label: "Buscar", placeholder: "Nome, e-mail ou área" }}
        values={{ situacao }}
        defaults={{ situacao: ALL }}
        fields={[{ key: "situacao", label: "Status", allLabel: "Todos", options: PERSON_STATUS_OPTIONS, className: "space-y-1.5 lg:w-40" }]}
      />

      <Card>
        <CardContent className="px-0 py-2">
          {rows.length === 0 ? (
            <EmptyState
              icon={UserCog}
              title="Nenhum professor encontrado"
              description="Ajuste a busca ou cadastre um novo professor."
              action={
                <Button asChild>
                  <Link href="/admin/professores/novo">Novo professor</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Professor</TableHead>
                  <TableHead className="hidden md:table-cell">Área de formação</TableHead>
                  <TableHead>Alocações</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="w-12 pr-6">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ teacher, count, classes }) => (
                  <TableRow key={teacher.id}>
                    <TableCell className="pl-6">
                      <PersonCell name={teacher.name} subtitle={teacher.email} href={`/admin/professores/${teacher.id}`} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{teacher.specialty ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      {count === 0 ? (
                        <span className="text-muted-foreground">Sem alocação</span>
                      ) : (
                        <span className="tabular-nums">
                          {count} {count === 1 ? "componente" : "componentes"} em {classes} {classes === 1 ? "turma" : "turmas"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <PersonStatusBadge status={teacher.status} />
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <RowActions
                        label={teacher.name}
                        viewHref={`/admin/professores/${teacher.id}`}
                        editHref={`/admin/professores/${teacher.id}/editar`}
                        listHref="/admin/professores"
                        blockedReason={
                          count > 0
                            ? `${teacher.name} tem ${count} alocação${count > 1 ? "ões" : ""} (notas e frequência já podem ter sido lançadas). Em vez de excluir, marque o professor como inativo.`
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

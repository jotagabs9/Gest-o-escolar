import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  GraduationCap,
  Library,
  Plus,
  School,
  UserCog,
  UserPlus,
} from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatNumber } from "@/lib/format";
import { adminDashboard as data } from "@/lib/mock/admin";
import { requireRole } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard | Gestão Escolar" };

const quickActions = [
  { label: "Nova matrícula", href: "/admin/matriculas/nova", icon: FileText },
  { label: "Cadastrar aluno", href: "/admin/alunos/novo", icon: UserPlus },
  { label: "Nova turma", href: "/admin/estrutura/turmas/nova", icon: School },
  { label: "Matrizes curriculares", href: "/admin/estrutura/matrizes", icon: Library },
];

export default async function AdminDashboardPage() {
  const user = await requireRole("SCHOOL_ADMIN");
  const { academicYear: year, stats } = data;
  const maxLinks = Math.max(...data.enrollmentsByCurriculum.map((c) => c.students));

  return (
    <>
      <PageHeader
        title={`Olá, ${user.name.split(" ")[0]}`}
        description={`Ano letivo ${year.name} · ${year.currentTerm}`}
      >
        <Button asChild>
          <Link href="/admin/matriculas/nova">
            <Plus className="mr-2 size-4" /> Nova matrícula
          </Link>
        </Button>
      </PageHeader>

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Alunos ativos"
          value={formatNumber(stats.activeStudents)}
          hint={stats.studentsDelta}
          icon={GraduationCap}
        />
        <StatCard
          label="Professores"
          value={stats.teachers}
          hint={`${stats.teachersWithoutAssignment} sem alocação`}
          icon={UserCog}
          tone={stats.teachersWithoutAssignment > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Turmas"
          value={stats.classGroups}
          hint={`em ${stats.stages} séries/etapas`}
          icon={School}
        />
        <StatCard
          label="Matrículas no ano"
          value={formatNumber(stats.enrollments)}
          hint={`${stats.pendingEnrollments} pendentes`}
          icon={FileText}
          tone={stats.pendingEnrollments > 0 ? "warning" : "default"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vínculos por matriz curricular</CardTitle>
              <CardDescription>
                Um aluno pode estar em mais de uma matriz, por isso a soma passa do total de alunos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.enrollmentsByCurriculum.map((c) => (
                <div key={c.curriculum} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{c.curriculum}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatNumber(c.students)} alunos
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${c.curriculum}: ${c.students} alunos`}
                  >
                    <div
                      className="h-full rounded-full bg-[#1d3f38]"
                      style={{ width: `${(c.students / maxLinks) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Matrículas recentes</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/matriculas">Ver todas</Link>
              </Button>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Aluno</TableHead>
                    <TableHead>Turma</TableHead>
                    <TableHead className="hidden md:table-cell">Matrizes</TableHead>
                    <TableHead className="hidden sm:table-cell">Data</TableHead>
                    <TableHead className="pr-6 text-right">Situação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentEnrollments.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="pl-6 font-medium">{e.student}</TableCell>
                      <TableCell>{e.classGroup}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {e.curricula.map((c) => (
                            <Badge key={c} variant="outline" className="font-normal">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden tabular-nums text-muted-foreground sm:table-cell">
                        {e.date}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            e.status === "ACTIVE"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                              : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
                          )}
                        >
                          {e.status === "ACTIVE" ? "Ativa" : "Pendente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Ano letivo {year.name}</CardTitle>
              </div>
              <CardDescription>
                {year.startsAt} a {year.endsAt}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium">{year.currentTerm}</span>
                <span className="tabular-nums text-muted-foreground">{year.progressPct}% concluído</span>
              </div>
              <Progress value={year.progressPct} aria-label="Progresso do ano letivo" />
              <Badge variant="secondary">{year.status}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">O que precisa de atenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.alerts.map((a) => (
                <Link
                  key={a.id}
                  href={a.href}
                  className="flex gap-3 rounded-md border p-3 transition-colors hover:bg-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
                >
                  <AlertTriangle
                    className={cn(
                      "mt-0.5 size-4 shrink-0",
                      a.severity === "danger" ? "text-red-600" : "text-amber-600",
                    )}
                  />
                  <span className="space-y-0.5">
                    <span className="block text-sm font-medium">{a.title}</span>
                    <span className="block text-xs text-muted-foreground">{a.description}</span>
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atalhos</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickActions.map(({ label, href, icon: Icon }) => (
                <Button key={href} asChild variant="outline" className="h-auto flex-col gap-2 py-4">
                  <Link href={href}>
                    <Icon className="size-5" />
                    <span className="text-center text-xs font-medium">{label}</span>
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

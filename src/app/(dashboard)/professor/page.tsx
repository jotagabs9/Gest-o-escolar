import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenCheck, CalendarClock, CheckCircle2, ClipboardCheck, Clock, Users } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { daysUntil, formatDate } from "@/lib/format";
import { teacherDashboard as data } from "@/lib/mock/professor";
import { requireRole } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard | Gestão Escolar" };

export default async function TeacherDashboardPage() {
  const user = await requireRole("TEACHER");
  const { assignments, today, term } = data;

  const totalStudents = assignments.reduce((s, a) => s + a.students, 0);
  const pendingGrades = assignments.reduce((s, a) => s + (a.students - a.gradesEntered), 0);
  const attendancePending = today.filter((t) => !t.attendanceDone).length;
  const daysLeft = daysUntil(term.closesAt);

  return (
    <>
      <PageHeader
        title={`Olá, ${user.name.split(" ")[0]}`}
        description={`${term.name} · fecha em ${formatDate(term.closesAt)}${daysLeft >= 0 ? ` (${daysLeft} dias)` : ""}`}
      >
        <Button asChild variant="outline">
          <Link href="/professor/frequencia">
            <ClipboardCheck className="mr-2 size-4" /> Registrar frequência
          </Link>
        </Button>
        <Button asChild>
          <Link href="/professor/notas">
            <BookOpenCheck className="mr-2 size-4" /> Lançar notas
          </Link>
        </Button>
      </PageHeader>

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Componentes alocados" value={assignments.length} hint="em turmas diferentes" icon={Users} />
        <StatCard label="Alunos" value={totalStudents} icon={Users} />
        <StatCard
          label="Notas por lançar"
          value={pendingGrades}
          hint={pendingGrades > 0 ? `no ${term.name}` : "tudo em dia"}
          icon={BookOpenCheck}
          tone={pendingGrades > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Chamadas de hoje"
          value={attendancePending}
          hint={attendancePending > 0 ? "ainda sem registro" : "todas registradas"}
          icon={ClipboardCheck}
          tone={attendancePending > 0 ? "warning" : "success"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Minhas alocações</h2>
            <p className="text-sm text-muted-foreground">
              Você só lança notas e frequência nos componentes em que está alocado.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {assignments.map((a) => {
              const gradesPct = (a.gradesEntered / a.students) * 100;
              const lessonsPct = (a.lessonsRecorded / a.lessonsPlanned) * 100;
              const gradesDone = a.gradesEntered === a.students;
              return (
                <Card key={a.id}>
                  <CardHeader className="space-y-1 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{a.component}</CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {a.classGroup}
                      </Badge>
                    </div>
                    <CardDescription>
                      {a.curriculum} · {a.students} alunos · {a.weeklyLessons} aulas/semana
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>Notas</span>
                        <span
                          className={cn(
                            "flex items-center gap-1 tabular-nums",
                            gradesDone ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground",
                          )}
                        >
                          {gradesDone && <CheckCircle2 className="size-3.5" />}
                          {a.gradesEntered}/{a.students} alunos
                        </span>
                      </div>
                      <Progress value={gradesPct} aria-label={`Notas lançadas em ${a.component}`} />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span>Aulas registradas</span>
                        <span className="tabular-nums text-muted-foreground">
                          {a.lessonsRecorded}/{a.lessonsPlanned}
                        </span>
                      </div>
                      <Progress value={lessonsPct} aria-label={`Aulas registradas em ${a.component}`} />
                    </div>
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/professor/notas?alocacao=${a.id}`}>Lançar notas</Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link href={`/professor/frequencia?alocacao=${a.id}`}>Frequência</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Aulas de hoje</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {today.map((t) => (
                  <li key={`${t.time}-${t.classGroup}`} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex items-center gap-1 pt-0.5 text-sm font-medium tabular-nums">
                      <Clock className="size-3.5 text-muted-foreground" />
                      {t.time}
                    </span>
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block truncate text-sm font-medium">{t.component}</span>
                      <span className="block text-xs text-muted-foreground">
                        {t.classGroup} · {t.room}
                      </span>
                    </span>
                    {t.attendanceDone ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                      >
                        Chamada feita
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                      >
                        Pendente
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

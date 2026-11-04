"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Clock3, Search, UserX, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveTeacherAttendance } from "@/server/attendance/teacher-attendance-actions";

export interface TeacherAttendanceItem {
  teacherId: string; name: string; email: string; specialty: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "PENDING"; time: string; note: string;
}
const STATUS = {
  PRESENT: { label: "Presente" }, ABSENT: { label: "Falta" },
  LATE: { label: "Atrasado" }, PENDING: { label: "Pendente" },
} as const;

export function TeacherAttendancePanel({ initialTeachers, date }: { initialTeachers: TeacherAttendanceItem[]; date: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [drafts, setDrafts] = useState<Record<string, { status: "PRESENT" | "ABSENT" | "LATE"; time: string; note: string }>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();
  const rows = useMemo(() => initialTeachers.filter(t =>
    (filter === "ALL" || t.status === filter) &&
    (t.name.toLowerCase().includes(query.toLowerCase()) || t.email.toLowerCase().includes(query.toLowerCase()))
  ), [initialTeachers, filter, query]);
  const count = (status: TeacherAttendanceItem["status"]) => initialTeachers.filter(t => t.status === status).length;
  const registered = initialTeachers.length - count("PENDING");
  function draftFor(t: TeacherAttendanceItem) {
    return drafts[t.teacherId] ?? { status: t.status === "PENDING" ? "PRESENT" : t.status, time: t.time, note: t.note };
  }
  function save(t: TeacherAttendanceItem) {
    const draft = draftFor(t);
    setFeedback(old => ({ ...old, [t.teacherId]: "" }));
    startTransition(async () => {
      const result = await saveTeacherAttendance({ teacherId: t.teacherId, date, ...draft });
      if (!result.ok) { setFeedback(old => ({ ...old, [t.teacherId]: result.error })); return; }
      router.refresh();
    });
  }
  return <div className="space-y-6">
    <PageHeader title="Frequência dos professores" description="Registre presença, faltas e atrasos. Os lançamentos ficam salvos no banco de dados." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Professores ativos" value={initialTeachers.length} icon={Users} />
      <StatCard label="Presentes" value={count("PRESENT")} icon={Check} tone="success" />
      <StatCard label="Faltas" value={count("ABSENT")} icon={UserX} tone="danger" />
      <StatCard label="Aguardando registro" value={count("PENDING")} icon={Clock3} tone="warning" />
    </div>
    <Card><CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1.5"><label htmlFor="attendance-date" className="text-sm font-medium">Data da chamada</label>
        <div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="attendance-date" type="date" value={date} onChange={e => router.push("/admin/frequencia-professores?data=" + e.target.value)} className="pl-9 md:w-52" /></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:flex">
        <div className="space-y-1.5"><label htmlFor="attendance-search" className="text-sm font-medium">Buscar professor</label>
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="attendance-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome ou e-mail" className="pl-9 md:w-56" /></div>
        </div>
        <div className="space-y-1.5"><label htmlFor="attendance-filter" className="text-sm font-medium">Situação</label>
          <select id="attendance-filter" value={filter} onChange={e => setFilter(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-48">
            <option value="ALL">Todas as situações</option><option value="PRESENT">Presentes</option><option value="ABSENT">Faltas</option><option value="LATE">Atrasados</option><option value="PENDING">Não registrados</option>
          </select>
        </div>
      </div>
    </CardContent></Card>
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-base font-semibold">Registros do dia</h2>
      <p className="text-sm text-muted-foreground">{new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { dateStyle: "full" })}</p></div>
      <Badge variant="outline">{registered} de {initialTeachers.length} registros</Badge></div>
    <Card><CardContent className="p-0">{rows.length === 0 ? <p className="px-6 py-10 text-center text-sm text-muted-foreground">Nenhum professor encontrado com esses filtros.</p> :
      <div className="divide-y">{rows.map(t => { const draft = draftFor(t); return <div key={t.teacherId} className="space-y-3 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="font-medium">{t.name}</p><p className="text-sm text-muted-foreground">{t.email}</p>
          <p className="mt-1 text-xs text-muted-foreground">Status salvo: {STATUS[t.status].label}</p></div>
          <div className="flex flex-wrap gap-2">{(["PRESENT", "ABSENT", "LATE"] as const).map(status => <Button key={status} type="button" size="sm" variant={draft.status === status ? "default" : "outline"} onClick={() => setDrafts(old => ({ ...old, [t.teacherId]: { ...draft, status } }))}>{STATUS[status].label}</Button>)}</div>
        </div>
        <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
          <div className="space-y-1"><label className="text-xs font-medium" htmlFor={"time-" + t.teacherId}>Horário de entrada</label><Input id={"time-" + t.teacherId} type="time" value={draft.time} onChange={e => setDrafts(old => ({ ...old, [t.teacherId]: { ...draft, time: e.target.value } }))} /></div>
          <div className="space-y-1"><label className="text-xs font-medium" htmlFor={"note-" + t.teacherId}>Observação</label><Input id={"note-" + t.teacherId} value={draft.note} maxLength={500} placeholder="Opcional" onChange={e => setDrafts(old => ({ ...old, [t.teacherId]: { ...draft, note: e.target.value } }))} /></div>
          <Button type="button" disabled={pending} onClick={() => save(t)}>Salvar registro</Button>
        </div>
        {feedback[t.teacherId] && <p role="alert" className="text-sm text-destructive">{feedback[t.teacherId]}</p>}
      </div>; })}</div>}</CardContent></Card>
    <p className="text-xs text-muted-foreground">Um registro por professor e por dia. A secretaria pode corrigir um lançamento salvando novamente.</p>
  </div>;
}

"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, Search, UserX, Users } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TeacherProfile } from "@/lib/mock/people";

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "PENDING";

interface TeacherAttendanceRow {
  teacherId: string;
  status: AttendanceStatus;
  time?: string;
  note?: string;
}

const DEMO_ATTENDANCE: TeacherAttendanceRow[] = [
  { teacherId: "t1", status: "PRESENT", time: "06:52" },
  { teacherId: "t2", status: "PRESENT", time: "06:58" },
  { teacherId: "t3", status: "LATE", time: "07:18", note: "Atraso registrado na entrada" },
  { teacherId: "t4", status: "PRESENT", time: "06:49" },
  { teacherId: "t5", status: "ABSENT", note: "Sem justificativa registrada" },
  { teacherId: "t6", status: "PRESENT", time: "07:02" },
  { teacherId: "t7", status: "PENDING", note: "Aguardando registro" },
  { teacherId: "t8", status: "PRESENT", time: "06:55" },
];

const STATUS: Record<AttendanceStatus, { label: string; className: string }> = {
  PRESENT: { label: "Presente", className: "border-emerald-200 bg-emerald-50 text-emerald-800" },
  ABSENT: { label: "Falta", className: "border-red-200 bg-red-50 text-red-800" },
  LATE: { label: "Atrasado", className: "border-amber-200 bg-amber-50 text-amber-800" },
  PENDING: { label: "Não registrado", className: "border-slate-200 bg-slate-100 text-slate-700" },
};

const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });

export function TeacherAttendancePanel({ teachers }: { teachers: TeacherProfile[] }) {
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<"ALL" | AttendanceStatus>("ALL");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const attendance = new Map(DEMO_ATTENDANCE.map((item) => [item.teacherId, item]));
    return teachers
      .filter((teacher) => teacher.status === "ACTIVE")
      .map((teacher) => ({
        teacher,
        attendance: attendance.get(teacher.id) ?? { teacherId: teacher.id, status: "PENDING" as const },
      }))
      .filter(({ teacher, attendance }) =>
        (filter === "ALL" || attendance.status === filter) &&
        (teacher.name.toLowerCase().includes(query.toLowerCase()) ||
          (teacher.specialty ?? "").toLowerCase().includes(query.toLowerCase())),
      );
  }, [teachers, filter, query]);

  const count = (status: AttendanceStatus) =>
    teachers.filter((teacher) => teacher.status === "ACTIVE" &&
      (DEMO_ATTENDANCE.find((item) => item.teacherId === teacher.id)?.status ?? "PENDING") === status).length;
  const registered = count("PRESENT") + count("ABSENT") + count("LATE");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Frequência dos professores"
        description="Acompanhe os registros de entrada, presença e faltas dos professores."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Professores ativos" value={teachers.filter((t) => t.status === "ACTIVE").length} icon={Users} />
        <StatCard label="Presentes" value={count("PRESENT")} icon={CheckCircle2} tone="success" />
        <StatCard label="Faltas" value={count("ABSENT")} icon={UserX} tone="danger" />
        <StatCard label="Aguardando registro" value={count("PENDING")} icon={Clock3} tone="warning" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1.5">
            <label htmlFor="attendance-date" className="text-sm font-medium">Data da consulta</label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="attendance-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="pl-9 md:w-52" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 md:flex">
            <div className="space-y-1.5">
              <label htmlFor="attendance-search" className="text-sm font-medium">Buscar professor</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="attendance-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome ou disciplina" className="pl-9 md:w-56" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="attendance-filter" className="text-sm font-medium">Situação</label>
              <select id="attendance-filter" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm md:w-48">
                <option value="ALL">Todas as situações</option>
                <option value="PRESENT">Presentes</option>
                <option value="ABSENT">Faltas</option>
                <option value="LATE">Atrasados</option>
                <option value="PENDING">Não registrados</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Registros do dia</h2>
          <p className="text-sm text-muted-foreground">{new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { dateStyle: "full" })}</p>
        </div>
        <Badge variant="outline">{registered} de {teachers.filter((t) => t.status === "ACTIVE").length} registros</Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">Nenhum professor encontrado com esses filtros.</p>
          ) : (
            <div className="divide-y">
              {rows.map(({ teacher, attendance }) => (
                <div key={teacher.id} className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="min-w-0">
                    <p className="font-medium">{teacher.name}</p>
                    <p className="text-sm text-muted-foreground">{teacher.specialty ?? "Área não informada"}</p>
                    {attendance.note && <p className="mt-1 text-xs text-muted-foreground">{attendance.note}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="min-w-16 text-right text-sm tabular-nums text-muted-foreground">{attendance.time ?? "—"}</span>
                    <Badge className={STATUS[attendance.status].className}>{STATUS[attendance.status].label}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">Protótipo demonstrativo: os registros exibidos são fictícios e ainda não são gravados no banco de dados. A consulta por data já está preparada visualmente; a integração com o registro real será uma próxima etapa.</p>
    </div>
  );
}

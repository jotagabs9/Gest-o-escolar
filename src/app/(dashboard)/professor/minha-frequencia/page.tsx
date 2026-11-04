import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/session";
import { withSession } from "@/server/db/tenant";

export const metadata: Metadata = { title: "Minha frequência | Gestão Escolar" };

interface RecordRow {
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  time: string | null;
  note: string | null;
}

const labels = { PRESENT: "Presente", ABSENT: "Falta", LATE: "Atraso" } as const;

export default async function MyTeacherAttendancePage() {
  await requireRole("TEACHER");
  const records = await withSession(async (tx, session) => tx.$queryRaw<RecordRow[]>\`
    SELECT
      to_char(a.attendance_date, 'YYYY-MM-DD') AS date,
      a.status,
      CASE WHEN a.check_in_time IS NULL THEN NULL ELSE to_char(a.check_in_time, 'HH24:MI') END AS time,
      a.note
    FROM public.teacher_attendance_records a
    JOIN public.teachers t ON t.id = a.teacher_id
    WHERE t.user_id = ${session.id}
      AND t.school_id = ${session.schoolId}
      AND t.is_active = true
    ORDER BY a.attendance_date DESC
    LIMIT 90
  \`);

  return (
    <div className="space-y-6">
      <PageHeader title="Minha frequência" description="Consulte seus registros de presença, faltas e atrasos." />
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><ClipboardCheck className="size-4" /> Histórico recente</CardTitle></CardHeader>
        <CardContent className="p-0">
          {records.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">Ainda não há registros de frequência associados à sua conta.</p>
          ) : (
            <div className="divide-y">
              {records.map((record) => (
                <div key={record.date} className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{new Date(record.date + "T12:00:00").toLocaleDateString("pt-BR", { dateStyle: "full" })}</p>
                    {record.note && <p className="text-sm text-muted-foreground">{record.note}</p>}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {record.time && <span className="tabular-nums text-muted-foreground">{record.time}</span>}
                    <span className={record.status === "PRESENT" ? "font-medium text-emerald-700" : record.status === "ABSENT" ? "font-medium text-red-700" : "font-medium text-amber-700"}>{labels[record.status]}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Bell, FileText } from "lucide-react";

import { PageHeader } from "@/components/dashboard/page-header";
import { StudentOverview } from "@/components/dashboard/student-overview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { studentDashboard as data } from "@/lib/mock/aluno";
import { requireRole } from "@/lib/session";

export const metadata: Metadata = { title: "Início | Gestão Escolar" };

export default async function StudentDashboardPage() {
  const user = await requireRole("STUDENT_GUARDIAN");

  return (
    <>
      <PageHeader
        title={`Olá, ${user.name.split(" ")[0]}`}
        description="Acompanhe notas e frequência."
      >
        <Button asChild>
          <Link href="/aluno/boletim">
            <FileText className="mr-2 size-4" /> Ver boletim
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[1fr_20rem]">
        <StudentOverview
          students={data.students}
          rules={data.rules}
          currentTerm={data.currentTerm}
        />

        <aside>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Avisos da escola</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {data.notices.map((n) => (
                  <li key={n.id} className="space-y-0.5 py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.date}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

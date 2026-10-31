import { StatusBadge } from "@/components/academic/status-badge";
import { AttendanceValue } from "@/components/assessment/result-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AttendanceTotals } from "@/lib/assessment";
import { cn } from "@/lib/utils";

export interface AttendanceSummaryRow {
  enrollmentId: string;
  studentName: string;
  editable: boolean;
  lockReason?: string;
  totals: AttendanceTotals | null;
}

interface AttendanceSummaryProps {
  rows: AttendanceSummaryRow[];
  /** Frequência mínima vinda da regra do componente. */
  minPct: number;
}

export function AttendanceSummary({ rows, minPct }: AttendanceSummaryProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="pl-6">Aluno</TableHead>
          <TableHead className="hidden text-right sm:table-cell">Presenças</TableHead>
          <TableHead className="text-right">Faltas</TableHead>
          <TableHead className="hidden text-right md:table-cell">Justificadas</TableHead>
          <TableHead className="hidden text-right md:table-cell">Atrasos</TableHead>
          <TableHead className="text-right">Frequência</TableHead>
          <TableHead className="pr-6">Situação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => {
          const t = r.totals;
          const low = t?.pct != null && t.pct < minPct;
          return (
            <TableRow key={r.enrollmentId} className={cn(!r.editable && "opacity-70")}>
              <TableCell className="pl-6">
                <p className="font-medium">{r.studentName}</p>
                {r.lockReason && <p className="text-xs text-muted-foreground">{r.lockReason}</p>}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">{t?.present ?? "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{t?.absent ?? "—"}</TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">{t?.justified ?? "—"}</TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">{t?.late ?? "—"}</TableCell>
              <TableCell className="text-right">
                <AttendanceValue pct={t?.pct ?? null} min={minPct} />
              </TableCell>
              <TableCell className="pr-6">
                {t === null ? (
                  <StatusBadge tone="neutral">Sem chamadas</StatusBadge>
                ) : low ? (
                  <StatusBadge tone="danger">Abaixo do mínimo</StatusBadge>
                ) : (
                  <StatusBadge tone="success">Regular</StatusBadge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

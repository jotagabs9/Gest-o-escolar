"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";

import { FormCard, FormFooter, SelectField } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { Button } from "@/components/ui/button";
import type { Option } from "@/lib/mock/academic";

const LIST_HREF = "/admin/matriculas";

interface ClassGroupOption {
  id: string;
  label: string;
  academicYearId: string;
  curriculumId: string | null;
  enrolled: number;
  capacity: number;
}

interface CurriculumOption {
  id: string;
  label: string;
  academicYearId: string;
}

interface ExistingEnrollment {
  id: string;
  number: string;
  studentId: string;
  academicYearId: string;
  status: string;
}

interface EnrollmentFormProps {
  studentOptions: Option[];
  yearOptions: Option[];
  classGroups: ClassGroupOption[];
  curricula: CurriculumOption[];
  suggestedRoles: Record<string, string>;
  roleOptions: Option[];
  statusOptions: Option[];
  existing: ExistingEnrollment[];
  defaultStudentId?: string;
  defaultYearId?: string;
}

interface Row {
  key: string;
  curriculumId: string;
  role: string;
}

const newKey = () => Math.random().toString(36).slice(2, 9);

export function EnrollmentForm({
  studentOptions,
  yearOptions,
  classGroups,
  curricula,
  suggestedRoles,
  roleOptions,
  statusOptions,
  existing,
  defaultStudentId = "",
  defaultYearId = "",
}: EnrollmentFormProps) {
  const { pending, submit } = useMockSubmit(LIST_HREF);
  const [studentId, setStudentId] = useState(defaultStudentId);
  const [yearId, setYearId] = useState(defaultYearId);
  const [classId, setClassId] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const yearClasses = classGroups.filter((g) => g.academicYearId === yearId);
  const yearCurricula = curricula.filter((c) => c.academicYearId === yearId);
  const selectedClass = classGroups.find((g) => g.id === classId);

  // Rematrícula = nova matrícula em outro ano. Só pode haver uma matrícula não cancelada por aluno/ano.
  const conflict =
    studentId && yearId
      ? existing.find((e) => e.studentId === studentId && e.academicYearId === yearId && e.status !== "CANCELLED")
      : undefined;
  const isFull = !!selectedClass && selectedClass.enrolled >= selectedClass.capacity;

  function onYearChange(v: string) {
    setYearId(v);
    setClassId("");
    setRows([]);
  }

  function onClassChange(v: string) {
    setClassId(v);
    const cls = classGroups.find((g) => g.id === v);
    const blank = rows.every((r) => !r.curriculumId);
    if (cls?.curriculumId && blank) {
      setRows([{ key: newKey(), curriculumId: cls.curriculumId, role: suggestedRoles[cls.curriculumId] ?? "" }]);
    }
  }

  function updateRow(key: string, patch: Partial<Row>) {
    setRows(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function onCurriculumChange(key: string, curriculumId: string) {
    updateRow(key, { curriculumId, role: suggestedRoles[curriculumId] ?? "" });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!studentId) next.student = "Escolha o aluno.";
    if (!yearId) next.year = "Escolha o ano letivo.";
    if (!classId) next.class = "Escolha a turma.";
    if (conflict) next.student = `Este aluno já tem matrícula em ${yearOptions.find((y) => y.value === yearId)?.label}.`;
    if (isFull) next.class = "A turma está lotada. Escolha outra turma.";

    if (rows.length === 0) next.rows = "Vincule pelo menos uma matriz curricular.";
    const seenCurricula = new Set<string>();
    const seenRoles = new Set<string>();
    for (const r of rows) {
      if (!r.curriculumId) next[`${r.key}:curriculum`] = "Escolha a matriz.";
      else if (seenCurricula.has(r.curriculumId)) next[`${r.key}:curriculum`] = "Esta matriz já foi adicionada.";
      else seenCurricula.add(r.curriculumId);

      if (!r.role) next[`${r.key}:role`] = "Escolha o papel.";
      else if (seenRoles.has(r.role)) next[`${r.key}:role`] = "Já existe um vínculo com este papel nesta matrícula.";
      else seenRoles.add(r.role);
    }

    setErrors(next);
    if (Object.keys(next).length === 0) submit("created");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormCard title="Aluno e turma" description="Cada matrícula vale para um ano letivo. Para rematricular, crie uma nova matrícula no ano seguinte.">
        <SelectField id="student" label="Aluno" required value={studentId} onChange={setStudentId} options={studentOptions} error={errors.student} disabled={pending} />

        {conflict && (
          <div role="alert" className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>
              Já existe a matrícula {conflict.number} deste aluno neste ano letivo.{" "}
              <Link href={`${LIST_HREF}/${conflict.id}`} className="font-medium underline underline-offset-4">
                Abrir matrícula existente
              </Link>
            </p>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField id="year" label="Ano letivo" required value={yearId} onChange={onYearChange} options={yearOptions} error={errors.year} disabled={pending} />
          <SelectField
            id="class"
            label="Turma"
            required
            value={classId}
            onChange={onClassChange}
            options={yearClasses.map((g) => ({ value: g.id, label: `${g.label} (${g.enrolled}/${g.capacity})` }))}
            placeholder={yearId ? "Selecione" : "Escolha o ano letivo primeiro"}
            error={errors.class}
            hint={isFull ? undefined : "Só aparecem turmas do ano letivo escolhido."}
            disabled={pending || !yearId}
          />
        </div>

        <SelectField id="status" label="Situação inicial" value={status} onChange={setStatus} options={statusOptions} hint="Pendente aguarda documentos ou confirmação da secretaria." disabled={pending} />
      </FormCard>

      <FormCard title="Matrizes curriculares" description="Cada vínculo tem um papel (Formação Geral, Técnica etc.) e um status próprio. Só pode haver um vínculo por papel.">
        {!yearId && <p className="text-sm text-muted-foreground">Escolha o ano letivo para ver as matrizes disponíveis.</p>}

        {yearId && rows.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma matriz vinculada ainda.</p>}

        {rows.map((r, i) => (
          <div key={r.key} className="space-y-3 rounded-md border p-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
              <SelectField
                id={`row-${r.key}-curriculum`}
                label={`Matriz ${rows.length > 1 ? i + 1 : ""}`.trim()}
                value={r.curriculumId}
                onChange={(v) => onCurriculumChange(r.key, v)}
                options={yearCurricula.map((c) => ({ value: c.id, label: c.label }))}
                error={errors[`${r.key}:curriculum`]}
                disabled={pending}
              />
              <SelectField
                id={`row-${r.key}-role`}
                label="Papel"
                value={r.role}
                onChange={(v) => updateRow(r.key, { role: v })}
                options={roleOptions}
                error={errors[`${r.key}:role`]}
                disabled={pending}
              />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="ghost" size="sm" onClick={() => setRows(rows.filter((x) => x.key !== r.key))} disabled={pending} aria-label={`Remover matriz ${i + 1}`}>
                <Trash2 className="mr-2 size-4" /> Remover
              </Button>
            </div>
          </div>
        ))}

        {errors.rows && (
          <p role="alert" className="text-sm text-destructive">
            {errors.rows}
          </p>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || !yearId}
          onClick={() => setRows([...rows, { key: newKey(), curriculumId: "", role: "" }])}
        >
          <Plus className="mr-2 size-4" /> Adicionar matriz
        </Button>

        <FormFooter cancelHref={LIST_HREF} pending={pending} submitLabel="Criar matrícula" />
      </FormCard>
    </form>
  );
}

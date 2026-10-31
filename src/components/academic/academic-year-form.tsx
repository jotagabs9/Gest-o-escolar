"use client";

import { useState } from "react";

import { FormCard, FormField, FormFooter, SelectField } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { Input } from "@/components/ui/input";
import { YEAR_STATUS_OPTIONS, type AcademicYear } from "@/lib/mock/academic";

const LIST_HREF = "/admin/estrutura/anos-letivos";

export function AcademicYearForm({ initial }: { initial?: AcademicYear }) {
  const isEdit = !!initial;
  const { pending, submit } = useMockSubmit(LIST_HREF);
  const [name, setName] = useState(initial?.name ?? "");
  const [startsAt, setStartsAt] = useState(initial?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "PLANNED");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Informe o nome do ano letivo.";
    if (!startsAt) next.startsAt = "Informe a data de início.";
    if (!endsAt) next.endsAt = "Informe a data de término.";
    if (startsAt && endsAt && endsAt <= startsAt) next.endsAt = "O término deve ser depois do início.";
    if (!status) next.status = "Escolha o status.";
    setErrors(next);
    if (Object.keys(next).length === 0) submit(isEdit ? "saved" : "created");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormCard title="Dados do ano letivo" description="Define o período em que turmas, matrículas e lançamentos acontecem.">
        <FormField id="name" label="Nome" required error={errors.name}>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: 2027" aria-invalid={!!errors.name} disabled={pending} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="startsAt" label="Início" required error={errors.startsAt}>
            <Input id="startsAt" type="date" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} aria-invalid={!!errors.startsAt} disabled={pending} />
          </FormField>
          <FormField id="endsAt" label="Término" required error={errors.endsAt}>
            <Input id="endsAt" type="date" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} aria-invalid={!!errors.endsAt} disabled={pending} />
          </FormField>
        </div>

        <SelectField
          id="status"
          label="Status"
          required
          value={status}
          onChange={setStatus}
          options={YEAR_STATUS_OPTIONS}
          error={errors.status}
          hint="Só um ano letivo deve estar em andamento por vez."
          disabled={pending}
        />

        <FormFooter cancelHref={LIST_HREF} pending={pending} submitLabel={isEdit ? "Salvar alterações" : "Criar ano letivo"} />
      </FormCard>
    </form>
  );
}

"use client";

import { useState } from "react";

import { FormCard, FormField, FormFooter, SelectField } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { Input } from "@/components/ui/input";
import { SHIFT_OPTIONS, type ClassGroup, type Option } from "@/lib/mock/academic";

const LIST_HREF = "/admin/estrutura/turmas";

interface ClassGroupFormProps {
  initial?: ClassGroup;
  yearOptions: Option[];
  stageOptions: Option[];
  curriculumOptions: Option[];
}

export function ClassGroupForm({ initial, yearOptions, stageOptions, curriculumOptions }: ClassGroupFormProps) {
  const isEdit = !!initial;
  const { pending, submit } = useMockSubmit(LIST_HREF);
  const [name, setName] = useState(initial?.name ?? "");
  const [shift, setShift] = useState<string>(initial?.shift ?? "");
  const [stageId, setStageId] = useState(initial?.stageId ?? "");
  const [academicYearId, setAcademicYearId] = useState(initial?.academicYearId ?? "");
  const [curriculumId, setCurriculumId] = useState(initial?.curriculumId ?? "");
  const [capacity, setCapacity] = useState(initial ? String(initial.capacity) : "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const cap = Number(capacity);
    if (!name.trim()) next.name = "Informe o nome da turma.";
    if (!academicYearId) next.academicYearId = "Escolha o ano letivo.";
    if (!stageId) next.stageId = "Escolha a série ou etapa.";
    if (!shift) next.shift = "Escolha o turno.";
    if (!capacity || !Number.isInteger(cap) || cap < 1) next.capacity = "Informe uma capacidade a partir de 1.";
    else if (initial && cap < initial.enrolled) next.capacity = `Já há ${initial.enrolled} alunos matriculados. A capacidade não pode ser menor.`;
    setErrors(next);
    if (Object.keys(next).length === 0) submit(isEdit ? "saved" : "created");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormCard title="Dados da turma">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="name" label="Nome" required error={errors.name}>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: 3º A" aria-invalid={!!errors.name} disabled={pending} />
          </FormField>
          <SelectField id="academicYearId" label="Ano letivo" required value={academicYearId} onChange={setAcademicYearId} options={yearOptions} error={errors.academicYearId} disabled={pending} />
        </div>

        <SelectField id="stageId" label="Série / etapa" required value={stageId} onChange={setStageId} options={stageOptions} error={errors.stageId} disabled={pending} />

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField id="shift" label="Turno" required value={shift} onChange={setShift} options={SHIFT_OPTIONS} error={errors.shift} disabled={pending} />
          <FormField id="capacity" label="Capacidade" required error={errors.capacity} hint="Número máximo de alunos.">
            <Input id="capacity" type="number" inputMode="numeric" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} aria-invalid={!!errors.capacity} disabled={pending} />
          </FormField>
        </div>

        <SelectField
          id="curriculumId"
          label="Matriz curricular"
          value={curriculumId}
          onChange={setCurriculumId}
          options={curriculumOptions}
          noneLabel="Definir depois"
          hint="A matrícula só é liberada para turmas com matriz."
          disabled={pending}
        />

        <FormFooter cancelHref={LIST_HREF} pending={pending} submitLabel={isEdit ? "Salvar alterações" : "Criar turma"} />
      </FormCard>
    </form>
  );
}

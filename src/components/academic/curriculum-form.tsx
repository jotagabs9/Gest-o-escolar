"use client";

import { useState } from "react";

import { FormCard, FormField, FormFooter, SelectField } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CURRICULUM_STATUS_OPTIONS, type Curriculum, type Option } from "@/lib/mock/academic";

interface CurriculumFormProps {
  initial?: Curriculum;
  yearOptions: Option[];
  stageOptions: Option[];
  courseOptions: Option[];
}

export function CurriculumForm({ initial, yearOptions, stageOptions, courseOptions }: CurriculumFormProps) {
  const isEdit = !!initial;
  const listHref = "/admin/estrutura/matrizes";
  const { pending, submit } = useMockSubmit(isEdit ? `${listHref}/${initial?.id}` : listHref);
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [academicYearId, setAcademicYearId] = useState(initial?.academicYearId ?? "");
  const [stageId, setStageId] = useState(initial?.stageId ?? "");
  const [courseId, setCourseId] = useState(initial?.courseId ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "DRAFT");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Informe o nome da matriz.";
    if (!code.trim()) next.code = "Informe um código.";
    if (!academicYearId) next.academicYearId = "Escolha o ano letivo.";
    if (!stageId) next.stageId = "Escolha a série ou etapa.";
    setErrors(next);
    if (Object.keys(next).length === 0) submit(isEdit ? "saved" : "created");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormCard title="Dados da matriz curricular" description="Os componentes são cadastrados depois, dentro da matriz.">
        <div className="grid gap-5 sm:grid-cols-[1fr_10rem]">
          <FormField id="name" label="Nome" required error={errors.name}>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Formação Geral Básica: 1ª série" aria-invalid={!!errors.name} disabled={pending} />
          </FormField>
          <FormField id="code" label="Código" required error={errors.code}>
            <Input id="code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="FGB-EM-1" aria-invalid={!!errors.code} disabled={pending} />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField id="academicYearId" label="Ano letivo" required value={academicYearId} onChange={setAcademicYearId} options={yearOptions} error={errors.academicYearId} disabled={pending} />
          <SelectField id="status" label="Status" required value={status} onChange={setStatus} options={CURRICULUM_STATUS_OPTIONS} disabled={pending} />
        </div>

        <SelectField id="stageId" label="Série / etapa" required value={stageId} onChange={setStageId} options={stageOptions} error={errors.stageId} disabled={pending} />

        <SelectField
          id="courseId"
          label="Curso"
          value={courseId}
          onChange={setCourseId}
          options={courseOptions}
          noneLabel="Nenhum (formação geral, itinerário)"
          hint="Use para matrizes de curso técnico."
          disabled={pending}
        />

        <FormField id="description" label="Descrição" hint="Opcional.">
          <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={pending} />
        </FormField>

        <FormFooter cancelHref={isEdit ? `${listHref}/${initial?.id}` : listHref} pending={pending} submitLabel={isEdit ? "Salvar alterações" : "Criar matriz"} />
      </FormCard>
    </form>
  );
}

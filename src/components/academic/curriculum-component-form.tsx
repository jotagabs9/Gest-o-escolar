"use client";

import { useState } from "react";

import { FormCard, FormField, FormFooter, SelectField } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { Input } from "@/components/ui/input";
import {
  COMPONENT_TYPE_OPTIONS,
  KNOWLEDGE_AREA_OPTIONS,
  type CurriculumComponent,
  type Option,
} from "@/lib/mock/academic";

interface CurriculumComponentFormProps {
  curriculumId: string;
  initial?: CurriculumComponent;
  teacherOptions: Option[];
}

export function CurriculumComponentForm({ curriculumId, initial, teacherOptions }: CurriculumComponentFormProps) {
  const isEdit = !!initial;
  const backHref = `/admin/estrutura/matrizes/${curriculumId}`;
  const { pending, submit } = useMockSubmit(backHref);
  const [name, setName] = useState(initial?.name ?? "");
  const [workload, setWorkload] = useState(initial ? String(initial.workloadHours) : "");
  const [type, setType] = useState<string>(initial?.type ?? "");
  const [area, setArea] = useState(initial?.knowledgeArea ?? "");
  const [teacherId, setTeacherId] = useState(initial?.teacherId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const hours = Number(workload);
    if (!name.trim()) next.name = "Informe o nome do componente.";
    if (!workload || !Number.isInteger(hours) || hours < 1) next.workload = "Informe a carga horária em horas, a partir de 1.";
    if (!type) next.type = "Escolha o tipo.";
    if (!area) next.area = "Escolha a área de conhecimento.";
    setErrors(next);
    if (Object.keys(next).length === 0) submit(isEdit ? "saved" : "created");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormCard title="Dados do componente curricular">
        <FormField id="name" label="Nome" required error={errors.name}>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Banco de Dados" aria-invalid={!!errors.name} disabled={pending} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField id="type" label="Tipo" required value={type} onChange={setType} options={COMPONENT_TYPE_OPTIONS} error={errors.type} disabled={pending} />
          <FormField id="workload" label="Carga horária (horas)" required error={errors.workload}>
            <Input id="workload" type="number" inputMode="numeric" min={1} value={workload} onChange={(e) => setWorkload(e.target.value)} aria-invalid={!!errors.workload} disabled={pending} />
          </FormField>
        </div>

        <SelectField id="area" label="Área de conhecimento" required value={area} onChange={setArea} options={KNOWLEDGE_AREA_OPTIONS} error={errors.area} disabled={pending} />

        <SelectField
          id="teacherId"
          label="Professor alocado"
          value={teacherId}
          onChange={setTeacherId}
          options={teacherOptions}
          noneLabel="Sem professor"
          hint="Opcional. Só quem está alocado consegue lançar notas e frequência neste componente."
          disabled={pending}
        />

        <FormFooter cancelHref={backHref} pending={pending} submitLabel={isEdit ? "Salvar alterações" : "Adicionar componente"} />
      </FormCard>
    </form>
  );
}

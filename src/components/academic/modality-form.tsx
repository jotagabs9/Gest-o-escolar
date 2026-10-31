"use client";

import { useState } from "react";

import { FormCard, FormField, FormFooter, SelectField } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MODALITY_TYPE_OPTIONS, type Modality } from "@/lib/mock/academic";

const LIST_HREF = "/admin/estrutura/modalidades";

export function ModalityForm({ initial }: { initial?: Modality }) {
  const isEdit = !!initial;
  const { pending, submit } = useMockSubmit(LIST_HREF);
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<string>(initial?.type ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Informe o nome da modalidade.";
    if (!type) next.type = "Escolha o tipo.";
    setErrors(next);
    if (Object.keys(next).length === 0) submit(isEdit ? "saved" : "created");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormCard title="Dados da modalidade" description="Agrupa as séries e etapas que seguem a mesma forma de oferta.">
        <FormField id="name" label="Nome" required error={errors.name}>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Ensino Médio Integrado" aria-invalid={!!errors.name} disabled={pending} />
        </FormField>

        <SelectField id="type" label="Tipo" required value={type} onChange={setType} options={MODALITY_TYPE_OPTIONS} error={errors.type} disabled={pending} />

        <FormField id="description" label="Descrição" hint="Opcional.">
          <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} disabled={pending} />
        </FormField>

        <FormFooter cancelHref={LIST_HREF} pending={pending} submitLabel={isEdit ? "Salvar alterações" : "Criar modalidade"} />
      </FormCard>
    </form>
  );
}

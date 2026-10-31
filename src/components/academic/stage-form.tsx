"use client";

import { useState } from "react";

import { FormCard, FormField, FormFooter, SelectField } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { Input } from "@/components/ui/input";
import type { Option, Stage } from "@/lib/mock/academic";

const LIST_HREF = "/admin/estrutura/series";

interface StageFormProps {
  initial?: Stage;
  modalityOptions: Option[];
}

export function StageForm({ initial, modalityOptions }: StageFormProps) {
  const isEdit = !!initial;
  const { pending, submit } = useMockSubmit(LIST_HREF);
  const [name, setName] = useState(initial?.name ?? "");
  const [order, setOrder] = useState(initial ? String(initial.order) : "");
  const [modalityId, setModalityId] = useState(initial?.modalityId ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    const n = Number(order);
    if (!name.trim()) next.name = "Informe o nome da série ou etapa.";
    if (!order || !Number.isInteger(n) || n < 1) next.order = "Use um número inteiro a partir de 1.";
    if (!modalityId) next.modalityId = "Escolha a modalidade.";
    setErrors(next);
    if (Object.keys(next).length === 0) submit(isEdit ? "saved" : "created");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormCard title="Dados da série / etapa" description="A ordem define a sequência dentro da modalidade.">
        <SelectField id="modalityId" label="Modalidade" required value={modalityId} onChange={setModalityId} options={modalityOptions} error={errors.modalityId} disabled={pending} />

        <div className="grid gap-5 sm:grid-cols-[1fr_8rem]">
          <FormField id="name" label="Nome" required error={errors.name}>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: 1ª série" aria-invalid={!!errors.name} disabled={pending} />
          </FormField>
          <FormField id="order" label="Ordem" required error={errors.order}>
            <Input id="order" type="number" inputMode="numeric" min={1} value={order} onChange={(e) => setOrder(e.target.value)} aria-invalid={!!errors.order} disabled={pending} />
          </FormField>
        </div>

        <FormFooter cancelHref={LIST_HREF} pending={pending} submitLabel={isEdit ? "Salvar alterações" : "Criar série / etapa"} />
      </FormCard>
    </form>
  );
}

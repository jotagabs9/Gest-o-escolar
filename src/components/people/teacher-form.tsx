"use client";

import { useState } from "react";

import { FormCard, FormField, FormFooter, SelectField } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { Input } from "@/components/ui/input";
import { PERSON_STATUS_OPTIONS, type TeacherProfile } from "@/lib/mock/people";

export function TeacherForm({ initial }: { initial?: TeacherProfile }) {
  const isEdit = !!initial;
  const listHref = "/admin/professores";
  const { pending, submit } = useMockSubmit(isEdit ? `${listHref}/${initial?.id}` : listHref);

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [status, setStatus] = useState<string>(initial?.status ?? "ACTIVE");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Informe o nome completo.";
    if (!email.trim()) next.email = "Informe o e-mail.";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Digite um e-mail válido.";
    setErrors(next);
    if (Object.keys(next).length === 0) submit(isEdit ? "saved" : "created");
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormCard
        title="Dados do professor"
        description="As turmas e componentes em que o professor atua são definidas por alocação, não neste cadastro."
      >
        <FormField id="name" label="Nome completo" required error={errors.name}>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} disabled={pending} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="email" label="E-mail" required error={errors.email} hint="Usado para o login.">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} disabled={pending} />
          </FormField>
          <FormField id="phone" label="Telefone" hint="Opcional.">
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(62) 99999-9999" disabled={pending} />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="specialty" label="Área de formação" hint="Opcional. Só para consulta.">
            <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} disabled={pending} />
          </FormField>
          <SelectField id="status" label="Status" required value={status} onChange={setStatus} options={PERSON_STATUS_OPTIONS} disabled={pending} />
        </div>

        <FormFooter cancelHref={isEdit ? `${listHref}/${initial?.id}` : listHref} pending={pending} submitLabel={isEdit ? "Salvar alterações" : "Cadastrar professor"} />
      </FormCard>
    </form>
  );
}

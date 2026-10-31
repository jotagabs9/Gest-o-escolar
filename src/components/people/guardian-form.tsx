"use client";

import { useState } from "react";

import { FormCard, FormField, FormFooter } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { GuardianLinks, validateLinkRows, type LinkRow } from "@/components/people/guardian-links";
import { Input } from "@/components/ui/input";
import type { Option } from "@/lib/mock/academic";
import type { Guardian } from "@/lib/mock/people";

const LIST_HREF = "/admin/responsaveis";

interface GuardianFormProps {
  initial?: Guardian;
  initialLinks?: { studentId: string; relationship: string; isPrimary: boolean }[];
  studentOptions: Option[];
}

export function GuardianForm({ initial, initialLinks = [], studentOptions }: GuardianFormProps) {
  const isEdit = !!initial;
  const { pending, submit } = useMockSubmit(LIST_HREF);

  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [rows, setRows] = useState<LinkRow[]>(
    initialLinks.map((l) => ({ key: l.studentId, targetId: l.studentId, relationship: l.relationship, isPrimary: l.isPrimary })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Informe o nome completo.";
    if (!email.trim() && !phone.trim()) next.phone = "Informe pelo menos um contato: telefone ou e-mail.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) next.email = "Digite um e-mail válido.";

    const linkErrors = validateLinkRows(rows, "aluno");
    setErrors(next);
    setRowErrors(linkErrors);
    if (Object.keys(next).length === 0 && Object.keys(linkErrors).length === 0) submit(isEdit ? "saved" : "created");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormCard title="Dados do responsável">
        <FormField id="name" label="Nome completo" required error={errors.name}>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} disabled={pending} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="phone" label="Telefone" error={errors.phone}>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(62) 99999-9999" aria-invalid={!!errors.phone} disabled={pending} />
          </FormField>
          <FormField id="email" label="E-mail" error={errors.email} hint="Usado para o acesso ao boletim, se o responsável tiver conta.">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} disabled={pending} />
          </FormField>
        </div>

        {initial?.documentMasked && (
          <FormField id="document" label="CPF" hint="Exibido mascarado.">
            <Input id="document" value={initial.documentMasked} disabled readOnly />
          </FormField>
        )}
      </FormCard>

      <FormCard title="Alunos vinculados" description="Um responsável pode acompanhar vários alunos.">
        <span id="students-title" className="sr-only">
          Alunos vinculados
        </span>
        <GuardianLinks
          id="students"
          targetLabel="Aluno"
          targetOptions={studentOptions}
          rows={rows}
          onChange={setRows}
          rowErrors={rowErrors}
          addLabel="Vincular aluno"
          emptyHint="Nenhum aluno vinculado ainda."
          disabled={pending}
        />
        <FormFooter cancelHref={LIST_HREF} pending={pending} submitLabel={isEdit ? "Salvar alterações" : "Cadastrar responsável"} />
      </FormCard>
    </form>
  );
}

"use client";

import { useState } from "react";

import { FormCard, FormField, FormFooter } from "@/components/academic/form-parts";
import { useMockSubmit } from "@/components/academic/use-mock-submit";
import { GuardianLinks, validateLinkRows, type LinkRow } from "@/components/people/guardian-links";
import { Input } from "@/components/ui/input";
import type { Option } from "@/lib/mock/academic";
import type { Student } from "@/lib/mock/people";
import { ageFromBirthDate } from "@/lib/people";

interface StudentFormProps {
  initial?: Student;
  initialLinks?: { guardianId: string; relationship: string; isPrimary: boolean }[];
  guardianOptions: Option[];
}

export function StudentForm({ initial, initialLinks = [], guardianOptions }: StudentFormProps) {
  const isEdit = !!initial;
  const listHref = "/admin/alunos";
  const { pending, submit } = useMockSubmit(isEdit ? `${listHref}/${initial?.id}` : listHref);

  const [name, setName] = useState(initial?.name ?? "");
  const [birthDate, setBirthDate] = useState(initial?.birthDate ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [rows, setRows] = useState<LinkRow[]>(
    initialLinks.map((l) => ({ key: l.guardianId, targetId: l.guardianId, relationship: l.relationship, isPrimary: l.isPrimary })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});

  const age = birthDate ? ageFromBirthDate(birthDate) : null;
  const isMinor = age !== null && age < 18;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = "Informe o nome completo.";
    if (!birthDate) next.birthDate = "Informe a data de nascimento.";
    else if (new Date(birthDate) > new Date()) next.birthDate = "A data de nascimento não pode ser no futuro.";
    if (email && !/^\S+@\S+\.\S+$/.test(email)) next.email = "Digite um e-mail válido.";
    if (isMinor && rows.length === 0) next.guardians = "Aluno menor de 18 anos precisa de pelo menos um responsável.";

    const linkErrors = validateLinkRows(rows, "responsável");
    setErrors(next);
    setRowErrors(linkErrors);
    if (Object.keys(next).length === 0 && Object.keys(linkErrors).length === 0) submit(isEdit ? "saved" : "created");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormCard title="Dados pessoais">
        <FormField id="name" label="Nome completo" required error={errors.name}>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} disabled={pending} />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="birthDate"
            label="Data de nascimento"
            required
            error={errors.birthDate}
            hint={age !== null && age >= 0 ? `${age} anos` : undefined}
          >
            <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} aria-invalid={!!errors.birthDate} disabled={pending} />
          </FormField>
          <FormField id="registration" label="Número de matrícula escolar" hint="Gerado automaticamente ao salvar.">
            <Input id="registration" value={initial?.registrationNumber ?? ""} placeholder="Automático" disabled readOnly />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="email" label="E-mail" error={errors.email} hint="Opcional.">
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} disabled={pending} />
          </FormField>
          <FormField id="phone" label="Telefone" hint="Opcional.">
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(62) 99999-9999" disabled={pending} />
          </FormField>
        </div>

        {initial?.documentMasked && (
          <FormField id="document" label="CPF" hint="Exibido mascarado. A edição do documento exige permissão específica.">
            <Input id="document" value={initial.documentMasked} disabled readOnly />
          </FormField>
        )}
      </FormCard>

      <FormCard
        title="Responsáveis"
        description={
          isMinor
            ? "Obrigatório para menores de 18 anos."
            : "Opcional para maiores de idade. Um responsável pode acompanhar vários alunos."
        }
      >
        <span id="guardians-title" className="sr-only">
          Responsáveis do aluno
        </span>
        <GuardianLinks
          id="guardians"
          targetLabel="Responsável"
          targetOptions={guardianOptions}
          rows={rows}
          onChange={setRows}
          rowErrors={rowErrors}
          groupError={errors.guardians}
          addLabel="Adicionar responsável"
          emptyHint="Nenhum responsável vinculado."
          disabled={pending}
        />
        <p className="text-xs text-muted-foreground">
          O responsável precisa estar cadastrado antes. Cadastre em <span className="font-medium">Pessoas → Responsáveis</span>.
        </p>

        <FormFooter cancelHref={isEdit ? `${listHref}/${initial?.id}` : listHref} pending={pending} submitLabel={isEdit ? "Salvar alterações" : "Cadastrar aluno"} />
      </FormCard>
    </form>
  );
}

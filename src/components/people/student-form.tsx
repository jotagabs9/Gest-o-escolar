"use client";

import { useState, useTransition } from "react";

import { FormCard, FormField, SelectField } from "@/components/academic/form-parts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Option } from "@/lib/mock/academic";
import { createStudentWithEnrollment } from "@/server/people/student-actions";

interface StudentFormProps {
  classOptions: Option[];
}

export function StudentForm({ classOptions }: StudentFormProps) {
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [classGroupId, setClassGroupId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim() || !birthDate || !classGroupId) {
      setError("Preencha o nome, a data de nascimento e selecione uma turma.");
      return;
    }

    startTransition(async () => {
      const result = await createStudentWithEnrollment({ name, birthDate, classGroupId });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(true);
      setName("");
      setBirthDate("");
      setClassGroupId("");
    });
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormCard title="Dados pessoais" description="Informe os dados básicos do aluno.">
        <FormField id="name" label="Nome completo" required>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" disabled={pending} required />
        </FormField>
        <FormField id="birthDate" label="Data de nascimento" required>
          <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} disabled={pending} required />
        </FormField>
      </FormCard>

      <FormCard title="Matrícula e turma" description="O aluno será matriculado no ano letivo da turma selecionada.">
        {classOptions.length > 0 ? (
          <SelectField
            id="classGroupId"
            label="Turma"
            value={classGroupId}
            onChange={setClassGroupId}
            options={classOptions}
            placeholder="Selecione a turma"
            required
            disabled={pending}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Não há turmas ativas com matriz curricular ativa no ano letivo atual. Cadastre ou ative uma turma antes de matricular alunos.
          </p>
        )}
      </FormCard>

      {error && <p role="alert" className="max-w-2xl rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
      {success && <p role="status" className="max-w-2xl rounded-md border border-emerald-600/30 bg-emerald-600/5 px-3 py-2 text-sm">Aluno cadastrado e matriculado na turma com sucesso.</p>}

      <div className="flex max-w-2xl flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => window.history.back()} disabled={pending}>Voltar</Button>
        <Button type="submit" disabled={pending || classOptions.length === 0}>
          {pending ? "Salvando..." : "Cadastrar aluno e matricular"}
        </Button>
      </div>
    </form>
  );
}

-- Cadastro de aluno com matrícula e vínculo curricular na turma escolhida.
-- Idempotente: pode ser executada novamente sem duplicar os papéis ou políticas.
BEGIN;

INSERT INTO public.enrollment_curriculum_roles (code, name, description, is_active)
VALUES
  ('GENERAL_EDUCATION', 'Formação Geral', 'Vínculo curricular de formação geral.', true),
  ('TECHNICAL_EDUCATION', 'Formação Técnica', 'Vínculo curricular de formação técnica.', true)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = true;

ALTER TABLE public.enrollment_curricula ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enrollment_curricula_school_insert ON public.enrollment_curricula;
CREATE POLICY enrollment_curricula_school_insert
ON public.enrollment_curricula
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.class_groups cg
      ON cg.id = e.class_group_id
     AND cg.school_id = e.school_id
    WHERE e.id = enrollment_curricula.enrollment_id
      AND e.school_id = cg.school_id
      AND cg.curriculum_id = enrollment_curricula.curriculum_id
      AND is_school_member(e.school_id)
  )
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_runtime') THEN
    EXECUTE $policy$
      CREATE POLICY enrollment_curricula_runtime_insert
      ON public.enrollment_curricula
      FOR INSERT
      TO school_saas_runtime
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.enrollments e
          JOIN public.class_groups cg
            ON cg.id = e.class_group_id
           AND cg.school_id = e.school_id
          WHERE e.id = enrollment_curricula.enrollment_id
            AND e.school_id = cg.school_id
            AND cg.curriculum_id = enrollment_curricula.curriculum_id
            AND is_school_member(e.school_id)
        )
      )
    $policy$;
    GRANT SELECT, INSERT ON public.enrollment_curricula TO school_saas_runtime;
    GRANT SELECT ON public.enrollment_curriculum_roles TO school_saas_runtime;
  END IF;
END
$$;

GRANT SELECT, INSERT ON public.enrollment_curricula TO authenticated;
GRANT SELECT ON public.enrollment_curriculum_roles TO authenticated;

COMMIT;

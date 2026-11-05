-- Cadastro de aluno com matrícula e vínculo curricular na turma escolhida.
-- Idempotente: pode ser executada novamente sem duplicar papéis ou políticas.
BEGIN;

INSERT INTO public.enrollment_curriculum_roles (code, name, description, is_active)
SELECT v.code, v.name, v.description, true
FROM (VALUES
  ('GENERAL_EDUCATION', 'Formação Geral', 'Vínculo curricular de formação geral.'),
  ('TECHNICAL_EDUCATION', 'Formação Técnica', 'Vínculo curricular de formação técnica.')
) AS v(code, name, description)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.enrollment_curriculum_roles existing
  WHERE existing.code = v.code
);

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
    EXECUTE 'DROP POLICY IF EXISTS enrollment_curricula_runtime_insert ON public.enrollment_curricula';
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

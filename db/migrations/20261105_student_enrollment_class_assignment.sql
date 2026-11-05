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
  SELECT 1 FROM public.enrollment_curriculum_roles existing WHERE existing.code = v.code
);

ALTER TABLE public.enrollment_curricula ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS enrollment_curricula_school_insert ON public.enrollment_curricula;
CREATE POLICY enrollment_curricula_school_insert
ON public.enrollment_curricula
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.enrollments e
    JOIN public.class_groups cg ON cg.id = e.class_group_id AND cg.school_id = e.school_id
    WHERE e.id = enrollment_curricula.enrollment_id
      AND cg.curriculum_id = enrollment_curricula.curriculum_id
      AND is_school_member(e.school_id)
  )
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'school_saas_runtime') THEN
    -- O servidor usa uma role sem BYPASSRLS. Concedemos apenas o necessário e
    -- repetimos as verificações de tenant para essa role.
    EXECUTE 'DROP POLICY IF EXISTS enrollment_curricula_runtime_insert ON public.enrollment_curricula';
    EXECUTE $policy$
      CREATE POLICY enrollment_curricula_runtime_insert
      ON public.enrollment_curricula
      FOR INSERT TO school_saas_runtime
      WITH CHECK (
        EXISTS (
          SELECT 1
          FROM public.enrollments e
          JOIN public.class_groups cg ON cg.id = e.class_group_id AND cg.school_id = e.school_id
          WHERE e.id = enrollment_curricula.enrollment_id
            AND cg.curriculum_id = enrollment_curricula.curriculum_id
            AND is_school_member(e.school_id)
        )
      )
    $policy$;

    EXECUTE 'DROP POLICY IF EXISTS student_create_runtime ON public.students';
    EXECUTE 'CREATE POLICY student_create_runtime ON public.students FOR INSERT TO school_saas_runtime WITH CHECK (is_school_member(school_id))';
    EXECUTE 'DROP POLICY IF EXISTS student_read_runtime ON public.students';
    EXECUTE 'CREATE POLICY student_read_runtime ON public.students FOR SELECT TO school_saas_runtime USING (is_school_member(school_id))';

    EXECUTE 'DROP POLICY IF EXISTS enrollment_create_runtime ON public.enrollments';
    EXECUTE 'CREATE POLICY enrollment_create_runtime ON public.enrollments FOR INSERT TO school_saas_runtime WITH CHECK (is_school_member(school_id))';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_read_runtime ON public.enrollments';
    EXECUTE 'CREATE POLICY enrollment_read_runtime ON public.enrollments FOR SELECT TO school_saas_runtime USING (is_school_member(school_id))';

    EXECUTE 'DROP POLICY IF EXISTS class_groups_read_runtime ON public.class_groups';
    EXECUTE 'CREATE POLICY class_groups_read_runtime ON public.class_groups FOR SELECT TO school_saas_runtime USING (is_school_member(school_id))';
    EXECUTE 'DROP POLICY IF EXISTS academic_years_read_runtime ON public.academic_years';
    EXECUTE 'CREATE POLICY academic_years_read_runtime ON public.academic_years FOR SELECT TO school_saas_runtime USING (is_school_member(school_id))';
    EXECUTE 'DROP POLICY IF EXISTS curricula_read_runtime ON public.curricula';
    EXECUTE 'CREATE POLICY curricula_read_runtime ON public.curricula FOR SELECT TO school_saas_runtime USING (is_school_member(school_id))';
    EXECUTE 'DROP POLICY IF EXISTS courses_read_runtime ON public.courses';
    EXECUTE 'CREATE POLICY courses_read_runtime ON public.courses FOR SELECT TO school_saas_runtime USING (is_school_member(school_id))';
    EXECUTE 'DROP POLICY IF EXISTS enrollment_curricula_read_runtime ON public.enrollment_curricula';
    EXECUTE $policy$
      CREATE POLICY enrollment_curricula_read_runtime
      ON public.enrollment_curricula
      FOR SELECT TO school_saas_runtime
      USING (
        EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.id = enrollment_curricula.enrollment_id
            AND is_school_member(e.school_id)
        )
      )
    $policy$;
    EXECUTE 'DROP POLICY IF EXISTS enrollment_roles_read_runtime ON public.enrollment_curriculum_roles';
    EXECUTE 'CREATE POLICY enrollment_roles_read_runtime ON public.enrollment_curriculum_roles FOR SELECT TO school_saas_runtime USING (current_app_user_id() IS NOT NULL)';

    GRANT SELECT, INSERT ON public.students TO school_saas_runtime;
    GRANT SELECT, INSERT ON public.enrollments TO school_saas_runtime;
    GRANT SELECT ON public.class_groups, public.academic_years, public.curricula, public.courses TO school_saas_runtime;
    GRANT SELECT, INSERT ON public.enrollment_curricula TO school_saas_runtime;
    GRANT SELECT ON public.enrollment_curriculum_roles TO school_saas_runtime;
  END IF;
END
$$;

GRANT SELECT, INSERT ON public.enrollment_curricula TO authenticated;
GRANT SELECT ON public.enrollment_curriculum_roles TO authenticated;

COMMIT;

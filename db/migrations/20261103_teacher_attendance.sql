-- Frequência diária de professores. Idempotente: pode ser executada novamente.
BEGIN;

CREATE TABLE IF NOT EXISTS public.teacher_attendance_records (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  school_id text NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  teacher_id text NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'LATE')),
  check_in_time time,
  note text,
  recorded_by_user_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teacher_attendance_one_per_day UNIQUE (school_id, teacher_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS teacher_attendance_school_date_idx
  ON public.teacher_attendance_records (school_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS teacher_attendance_teacher_date_idx
  ON public.teacher_attendance_records (teacher_id, attendance_date DESC);

ALTER TABLE public.teacher_attendance_records ENABLE ROW LEVEL SECURITY;

-- Usa diretamente as configurações de tenant definidas por withSession.
-- Isso evita depender da implementação de current_school_ids() no banco hospedado.
DROP POLICY IF EXISTS teacher_attendance_read ON public.teacher_attendance_records;
CREATE POLICY teacher_attendance_read ON public.teacher_attendance_records
FOR SELECT USING (
  school_id = ANY (
    COALESCE(
      string_to_array(NULLIF(current_setting('app.current_school_ids', true), ''), ','),
      ARRAY[]::text[]
    )
  )
  AND (
    EXISTS (
      SELECT 1 FROM public.teachers t
      WHERE t.id = teacher_attendance_records.teacher_id
        AND t.user_id::text = NULLIF(current_setting('app.current_user_id', true), '')
        AND t.school_id = teacher_attendance_records.school_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.schools s
      JOIN public.user_role_assignments a ON a.user_id::text = NULLIF(current_setting('app.current_user_id', true), '')
      JOIN public.roles r ON r.id = a.role_id
      WHERE s.id = teacher_attendance_records.school_id
        AND (
          (a.scope_type::text = 'SCHOOL' AND a.scope_id = s.id)
          OR (a.scope_type::text = 'ORGANIZATION' AND a.scope_id = s.organization_id)
        )
        AND upper(r.name) IN ('ADMIN_ESCOLA', 'ADMIN_DA_ESCOLA', 'SCHOOL_ADMIN')
    )
  )
);

DROP POLICY IF EXISTS teacher_attendance_admin_insert ON public.teacher_attendance_records;
CREATE POLICY teacher_attendance_admin_insert ON public.teacher_attendance_records
FOR INSERT WITH CHECK (
  school_id = ANY (
    COALESCE(
      string_to_array(NULLIF(current_setting('app.current_school_ids', true), ''), ','),
      ARRAY[]::text[]
    )
  )
  AND recorded_by_user_id = NULLIF(current_setting('app.current_user_id', true), '')
  AND EXISTS (
    SELECT 1
    FROM public.schools s
    JOIN public.user_role_assignments a ON a.user_id::text = NULLIF(current_setting('app.current_user_id', true), '')
    JOIN public.roles r ON r.id = a.role_id
    WHERE s.id = teacher_attendance_records.school_id
      AND (
        (a.scope_type::text = 'SCHOOL' AND a.scope_id = s.id)
        OR (a.scope_type::text = 'ORGANIZATION' AND a.scope_id = s.organization_id)
      )
      AND upper(r.name) IN ('ADMIN_ESCOLA', 'ADMIN_DA_ESCOLA', 'SCHOOL_ADMIN')
  )
);

DROP POLICY IF EXISTS teacher_attendance_admin_update ON public.teacher_attendance_records;
CREATE POLICY teacher_attendance_admin_update ON public.teacher_attendance_records
FOR UPDATE USING (
  school_id = ANY (
    COALESCE(
      string_to_array(NULLIF(current_setting('app.current_school_ids', true), ''), ','),
      ARRAY[]::text[]
    )
  )
  AND EXISTS (
    SELECT 1
    FROM public.schools s
    JOIN public.user_role_assignments a ON a.user_id::text = NULLIF(current_setting('app.current_user_id', true), '')
    JOIN public.roles r ON r.id = a.role_id
    WHERE s.id = teacher_attendance_records.school_id
      AND (
        (a.scope_type::text = 'SCHOOL' AND a.scope_id = s.id)
        OR (a.scope_type::text = 'ORGANIZATION' AND a.scope_id = s.organization_id)
      )
      AND upper(r.name) IN ('ADMIN_ESCOLA', 'ADMIN_DA_ESCOLA', 'SCHOOL_ADMIN')
  )
) WITH CHECK (
  school_id = ANY (
    COALESCE(
      string_to_array(NULLIF(current_setting('app.current_school_ids', true), ''), ','),
      ARRAY[]::text[]
    )
  )
  AND recorded_by_user_id = NULLIF(current_setting('app.current_user_id', true), '')
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_runtime') THEN
    GRANT SELECT, INSERT, UPDATE ON public.teacher_attendance_records TO app_runtime;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    GRANT SELECT, INSERT, UPDATE ON public.teacher_attendance_records TO authenticated;
  END IF;
END $$;

COMMIT;

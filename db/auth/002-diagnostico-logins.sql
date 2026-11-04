-- Diagnóstico somente leitura dos acessos de demonstração.
-- Pode ser executado no Supabase Dashboard > SQL Editor.
-- Não retorna senha nem hash; apenas informa se existe um hash preenchido.

WITH demo_emails(email) AS (
  VALUES
    ('admin@escola.com'),
    ('professor@escola.com'),
    ('aluno@escola.com'),
    ('responsavel@escola.com')
)
SELECT
  d.email,
  (u.id IS NOT NULL) AS usuario_existe,
  COALESCE(u.is_active, false) AS usuario_ativo,
  (u.password_hash IS NOT NULL AND length(trim(u.password_hash)) > 0) AS possui_hash_senha,
  length(trim(u.password_hash)) AS tamanho_hash,
  COALESCE(o.is_active, false) AS organizacao_ativa,
  s.name AS escola,
  COALESCE(s.is_active, false) AS escola_ativa,
  COALESCE(m.is_active, false) AS vinculo_escolar_ativo,
  COALESCE(
    array_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL),
    ARRAY[]::text[]
  ) AS papeis
FROM demo_emails d
LEFT JOIN public.users u ON lower(u.email) = lower(d.email)
LEFT JOIN public.organizations o ON o.id = u.organization_id
LEFT JOIN public.school_memberships m ON m.user_id = u.id AND m.is_active
LEFT JOIN public.schools s ON s.id = m.school_id AND s.organization_id = u.organization_id
LEFT JOIN public.user_role_assignments a ON a.user_id = u.id
  AND (
    (a.scope_type::text = 'SCHOOL' AND a.scope_id = s.id)
    OR (a.scope_type::text = 'ORGANIZATION' AND a.scope_id = u.organization_id)
  )
LEFT JOIN public.roles r ON r.id = a.role_id
  AND (r.organization_id IS NULL OR r.organization_id = u.organization_id)
GROUP BY d.email, u.id, u.is_active, u.password_hash, o.is_active, s.name, s.is_active, m.is_active
ORDER BY d.email, s.name;

-- Corrige a identidade usada pelo RLS quando o app autentica via Auth.js Credentials.
-- O app não usa Supabase Auth no login: withTenant define app.current_user_id
-- com o ID interno de public.users dentro da transação.
-- Mantemos auth.uid() como fallback para compatibilidade com sessões Supabase Auth.
BEGIN;

CREATE OR REPLACE FUNCTION public.current_app_user_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_user_id', true), ''),
    (
      SELECT u.id::text
      FROM public.users u
      WHERE u.auth_user_id = auth.uid()
        AND u.is_active = true
      LIMIT 1
    )
  );
$function$;

COMMENT ON FUNCTION public.current_app_user_id() IS
  'Retorna o usuário interno da requisição (app.current_user_id, definido por withTenant); usa auth.uid() como fallback para sessões Supabase Auth.';

COMMIT;

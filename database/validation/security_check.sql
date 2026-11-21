-- LET'S TALK - Security / RLS / SQL grant verification
-- Run in Supabase SQL Editor with a role permitted to inspect catalog metadata.
-- This script is read-only and does not change policies or privileges.

-- 1. One row per approved table: RLS must be enabled.
SELECT
    c.relname AS table_name,
    c.relrowsecurity AS rls_enabled,
    c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'topics', 'gameplay_modes', 'content_groups',
    'content_group_allowed_types', 'content_items'
  )
ORDER BY c.relname;

-- 2. Policy definitions: expected one SELECT policy to anon per table.
SELECT
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'topics', 'gameplay_modes', 'content_groups',
    'content_group_allowed_types', 'content_items'
  )
ORDER BY tablename, policyname;

-- 3. Runtime SQL privileges: anon SELECT=true, all write privileges=false.
SELECT
    table_name,
    has_table_privilege('anon', 'public.' || table_name, 'SELECT') AS anon_can_select,
    has_table_privilege('anon', 'public.' || table_name, 'INSERT') AS anon_can_insert,
    has_table_privilege('anon', 'public.' || table_name, 'UPDATE') AS anon_can_update,
    has_table_privilege('anon', 'public.' || table_name, 'DELETE') AS anon_can_delete
FROM (VALUES
    ('topics'),
    ('gameplay_modes'),
    ('content_groups'),
    ('content_group_allowed_types'),
    ('content_items')
) AS approved_tables(table_name)
ORDER BY table_name;

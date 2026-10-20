begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(4);
select extensions.ok((select relrowsecurity from pg_class where oid='public.events'::regclass),'events enforces RLS');
select extensions.is(has_table_privilege('anon','public.events','INSERT'),false,'anonymous cannot create events');
select extensions.is(has_function_privilege('anon','public.save_event(jsonb,uuid[])','EXECUTE'),false,'anonymous cannot save events');
select extensions.is(has_function_privilege('anon','public.delete_event(uuid)','EXECUTE'),false,'anonymous cannot delete events');
select * from extensions.finish();
rollback;

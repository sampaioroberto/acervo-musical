begin;
create extension if not exists pgtap with schema extensions;
select extensions.plan(4);
select extensions.ok((select relrowsecurity from pg_class where oid='public.songs'::regclass),'songs enforces RLS');
select extensions.is(has_table_privilege('anon','public.songs','INSERT'),false,'anonymous cannot insert');
select extensions.is(has_function_privilege('anon','public.save_song(jsonb,jsonb)','EXECUTE'),false,'anonymous cannot call save RPC');
select extensions.is(has_table_privilege('anon','public.song_originals','SELECT'),false,'anonymous cannot read originals');
select * from extensions.finish();
rollback;


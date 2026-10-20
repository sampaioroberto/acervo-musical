create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.app_admin (
 singleton boolean primary key default true check (singleton),
 user_id uuid not null unique references auth.users(id) on delete cascade
);
revoke all on private.app_admin from public, anon, authenticated;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists(select 1 from private.app_admin where user_id = (select auth.uid())); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create table public.songs (
 id uuid primary key,
 title text not null check (length(btrim(title)) > 0),
 artist text not null default '',
 kind text not null check (kind in ('lyrics','chords')),
 content text not null check (length(btrim(content)) > 0),
 status text not null default 'draft' check (status in ('draft','published')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index songs_catalog on public.songs(status,kind,title,id);
create table public.song_originals (
 id uuid primary key,
 song_id uuid unique references public.songs(id) on delete set null,
 path text not null unique check (path = id::text || '/original.pdf' or path = id::text || '/original.docx'),
 name text not null,
 mime text not null check (mime in ('application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document')),
 size bigint not null check (size > 0 and size <= 10485760),
 pending_cleanup boolean not null default false,
 check ((song_id is null) = pending_cleanup)
);
create or replace function public.prepare_song_update() returns trigger
language plpgsql set search_path = '' as $$ begin new.created_at=old.created_at; new.updated_at=now(); return new; end; $$;
create trigger songs_updated before update on public.songs for each row execute function public.prepare_song_update();
create or replace function public.mark_original_cleanup() returns trigger
language plpgsql set search_path = '' as $$ begin new.pending_cleanup=(new.song_id is null); return new; end; $$;
create trigger originals_cleanup before update on public.song_originals for each row execute function public.mark_original_cleanup();

alter table public.songs enable row level security;
alter table public.song_originals enable row level security;
revoke all on public.songs, public.song_originals from public, anon, authenticated;
grant select on public.songs to anon;
grant select,insert,update,delete on public.songs,public.song_originals to authenticated;
create policy songs_public_read on public.songs for select to anon,authenticated using (status='published');
create policy songs_admin on public.songs for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy originals_admin on public.song_originals for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('originals','originals',false,10485760,array['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy originals_storage_admin on storage.objects for all to authenticated
 using (bucket_id='originals' and (select public.is_admin()))
 with check (bucket_id='originals' and (select public.is_admin()));

create or replace function public.save_song(p_song jsonb, p_original jsonb default null) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare saved public.songs; original jsonb;
begin
 if not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 insert into public.songs(id,title,artist,kind,content,status)
 values ((p_song->>'id')::uuid,btrim(p_song->>'title'),coalesce(p_song->>'artist',''),p_song->>'kind',p_song->>'content',p_song->>'status')
 on conflict(id) do update set title=excluded.title,artist=excluded.artist,kind=excluded.kind,content=excluded.content,status=excluded.status
 returning * into saved;
 if p_original is not null and p_original <> 'null'::jsonb then
  if (p_original->>'id')::uuid <> saved.id then raise exception 'Original ID must match song ID'; end if;
  insert into public.song_originals(id,song_id,path,name,mime,size,pending_cleanup)
  values(saved.id,saved.id,p_original->>'path',p_original->>'name',p_original->>'mime',(p_original->>'size')::bigint,false)
  on conflict(id) do update set song_id=excluded.song_id,path=excluded.path,name=excluded.name,mime=excluded.mime,size=excluded.size,pending_cleanup=false;
 end if;
 select jsonb_build_object('id',id,'path',path,'name',name,'mime',mime,'size',size) into original from public.song_originals where song_id=saved.id;
 return to_jsonb(saved)||jsonb_build_object('original',original);
end; $$;
create or replace function public.delete_song(p_id uuid) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare original jsonb;
begin
 if not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 select jsonb_build_object('id',id,'path',path,'name',name,'mime',mime,'size',size) into original from public.song_originals where song_id=p_id;
 delete from public.songs where id=p_id;
 return original;
end; $$;
revoke all on function public.save_song(jsonb,jsonb),public.delete_song(uuid),public.prepare_song_update(),public.mark_original_cleanup() from public,anon;
grant execute on function public.save_song(jsonb,jsonb),public.delete_song(uuid) to authenticated;


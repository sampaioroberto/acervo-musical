create table public.events (
 id uuid primary key,
 title text not null check (length(btrim(title)) between 1 and 180),
 event_date date not null check (event_date between date '1000-01-01' and date '9999-12-31'),
 status text not null default 'draft' check (status in ('draft','published')),
 songs jsonb not null default '[]'::jsonb check (jsonb_typeof(songs)='array'),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (status <> 'published' or jsonb_array_length(songs)>0)
);
create index events_public_order on public.events(status,event_date desc,created_at desc,id desc);
alter table public.events enable row level security;
revoke all on public.events from public,anon,authenticated;
grant select on public.events to anon;
grant select,insert,update,delete on public.events to authenticated;
create policy events_public_read on public.events for select to anon,authenticated using(status='published');
create policy events_admin on public.events for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

create or replace function public.save_event(p_event jsonb,p_song_ids uuid[]) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare previous_songs jsonb; copies jsonb := '[]'::jsonb; copied jsonb; source_id uuid; saved public.events;
begin
 if not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_song_ids is null then raise exception 'Song IDs required'; end if;
 if cardinality(p_song_ids)<>(select count(distinct value) from unnest(p_song_ids) value) then raise exception 'Duplicate song IDs'; end if;
 select songs into previous_songs from public.events where id=(p_event->>'id')::uuid for update;
 foreach source_id in array p_song_ids loop
  copied := null;
  select value into copied from jsonb_array_elements(coalesce(previous_songs,'[]'::jsonb)) where value->>'id'=source_id::text;
  if copied is null then
   select jsonb_build_object('id',id,'title',title,'artist',artist,'kind',kind,'content',content) into copied
   from public.songs where id=source_id and status='published';
  end if;
  if copied is null then raise exception 'Song must be published'; end if;
  copies := copies || jsonb_build_array(copied);
 end loop;
 insert into public.events(id,title,event_date,status,songs)
 values((p_event->>'id')::uuid,btrim(p_event->>'title'),(p_event->>'date')::date,p_event->>'status',copies)
 on conflict(id) do update set title=excluded.title,event_date=excluded.event_date,status=excluded.status,songs=excluded.songs,updated_at=now()
 returning * into saved;
 return to_jsonb(saved);
end; $$;
create or replace function public.delete_event(p_id uuid) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Forbidden' using errcode='42501'; end if;
 delete from public.events where id=p_id;
 return jsonb_build_object('id',p_id);
end; $$;
revoke all on function public.save_event(jsonb,uuid[]),public.delete_event(uuid) from public,anon;
grant execute on function public.save_event(jsonb,uuid[]),public.delete_event(uuid) to authenticated;

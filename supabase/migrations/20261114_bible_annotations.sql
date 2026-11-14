-- Run in the SQL Editor of project nbgneowrbdwcqdrofwuw.
-- Safe to rerun. Each authenticated user can access only their own records.
create table if not exists public.bible_annotations (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('note', 'highlight')),
  item_id text not null check (length(item_id) between 1 and 100),
  verse_id text not null check (length(verse_id) between 1 and 80),
  body text,
  color text check (color is null or color in ('amber', 'green', 'blue', 'pink')),
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted boolean not null default false,
  primary key (user_id, kind, item_id),
  constraint bible_annotations_content check (
    deleted or
    (kind = 'note' and body is not null and length(body) between 1 and 20000) or
    (kind = 'highlight' and color is not null)
  )
);
create index if not exists bible_annotations_user_changed_idx
  on public.bible_annotations (user_id, updated_at);

alter table public.bible_annotations enable row level security;

drop policy if exists "Read own Bible annotations" on public.bible_annotations;
create policy "Read own Bible annotations" on public.bible_annotations
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Insert own Bible annotations" on public.bible_annotations;
create policy "Insert own Bible annotations" on public.bible_annotations
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Update own Bible annotations" on public.bible_annotations;
create policy "Update own Bible annotations" on public.bible_annotations
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.bible_annotations from public, anon;
grant select, insert, update on public.bible_annotations to authenticated;

-- Server-side last-update-wins protects newer versions from stale offline devices.
-- A deletion is a retained tombstone, NOT a physical delete.
create or replace function public.merge_bible_annotations(changes jsonb)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  entry jsonb;
  changed integer := 0;
  owner uuid := (select auth.uid());
begin
  if owner is null then
    raise exception 'Authentication required';
  end if;
  if jsonb_typeof(changes) <> 'array' or jsonb_array_length(changes) > 500 then
    raise exception 'Invalid change batch';
  end if;
  for entry in select value from jsonb_array_elements(changes)
  loop
    if (entry->>'kind') not in ('note', 'highlight')
       or length(entry->>'item_id') not between 1 and 100
       or length(entry->>'verse_id') not between 1 and 80
       or (entry->>'verse_id') !~ '^[A-Za-z0-9]+[.][0-9]+[.][0-9]+
       or (entry->>'color' is not null and
           entry->>'color' not in ('amber','green','blue','pink'))
       or length(coalesce(entry->>'body', '')) > 20000
    then
      raise exception 'Invalid annotation';
    end if;

    insert into public.bible_annotations
      (user_id, kind, item_id, verse_id, body, color, created_at, updated_at, deleted)
    values
      (owner,
       entry->>'kind',
       entry->>'item_id',
       entry->>'verse_id',
       entry->>'body',
       entry->>'color',
       (entry->>'created_at')::timestamptz,
       (entry->>'updated_at')::timestamptz,
       coalesce((entry->>'deleted')::boolean, false))
    on conflict (user_id, kind, item_id) do update set
      verse_id = excluded.verse_id,
      body = excluded.body,
      color = excluded.color,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted = excluded.deleted
    where public.bible_annotations.updated_at < excluded.updated_at;
    changed := changed + 1;
  end loop;
  return changed;
end;
$$;

revoke all on function public.merge_bible_annotations(jsonb) from public, anon;
grant execute on function public.merge_bible_annotations(jsonb) to authenticated;

       or (entry->>'color' is not null and
           entry->>'color' not in ('amber','green','blue','pink'))
       or length(coalesce(entry->>'body', '')) > 20000
    then
      raise exception 'Invalid annotation';
    end if;

    insert into public.bible_annotations
      (user_id, kind, item_id, verse_id, body, color, created_at, updated_at, deleted)
    values
      (owner,
       entry->>'kind',
       entry->>'item_id',
       entry->>'verse_id',
       entry->>'body',
       entry->>'color',
       (entry->>'created_at')::timestamptz,
       (entry->>'updated_at')::timestamptz,
       coalesce((entry->>'deleted')::boolean, false))
    on conflict (user_id, kind, item_id) do update set
      verse_id = excluded.verse_id,
      body = excluded.body,
      color = excluded.color,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at,
      deleted = excluded.deleted
    where public.bible_annotations.updated_at < excluded.updated_at;
    changed := changed + 1;
  end loop;
  return changed;
end;
$$;

revoke all on function public.merge_bible_annotations(jsonb) from public, anon;
grant execute on function public.merge_bible_annotations(jsonb) to authenticated;

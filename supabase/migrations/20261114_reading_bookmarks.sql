-- Bookmark upgrade: run once in the same Supabase project, without deleting notes.
-- One bookmark record per user and colour, keyed by ('bookmark', colour).
alter table public.bible_annotations
  drop constraint if exists bible_annotations_kind_check;
alter table public.bible_annotations
  add constraint bible_annotations_kind_check
  check (kind in ('note','highlight','bookmark'));

alter table public.bible_annotations
  drop constraint if exists bible_annotations_content;
alter table public.bible_annotations
  add constraint bible_annotations_content
  check (deleted or
    (kind = 'note' and body is not null and length(body) between 1 and 20000) or
    (kind = 'highlight' and color is not null) or
    (kind = 'bookmark' and color in ('amber','green','blue','pink')
      and item_id = color and body is null)
  );

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
    if (entry->>'kind') not in ('note', 'highlight', 'bookmark')
       or length(entry->>'item_id') not between 1 and 100
       or length(entry->>'verse_id') not between 1 and 80
       or (entry->>'verse_id') !~ '^[A-Za-z0-9]+[.][0-9]+[.][0-9]+$'
       or (entry->>'color' is not null and
           entry->>'color' not in ('amber','green','blue','pink'))
       or (entry->>'kind' = 'bookmark' and (
             entry->>'item_id' not in ('amber','green','blue','pink')
             or entry->>'color' is distinct from entry->>'item_id'))
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

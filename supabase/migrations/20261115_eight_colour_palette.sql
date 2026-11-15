-- Run once in Supabase SQL Editor BEFORE deploying the eight-colour PWA.
-- Non-destructive: retain all notes, highlights, bookmarks and label records.
-- The original column colour constraint must be extended as well as the
-- table content constraint and the merge RPC.
begin;
alter table public.bible_annotations
  drop constraint if exists bible_annotations_color_check;
alter table public.bible_annotations
  add constraint bible_annotations_color_check
  check (color is null or color in ('amber','green','blue','pink','purple','teal','red','yellow'));

alter table public.bible_annotations
  add column if not exists category text,
  add column if not exists title text;

alter table public.bible_annotations
  drop constraint if exists bible_annotations_kind_check;
alter table public.bible_annotations
  add constraint bible_annotations_kind_check
  check (kind in ('note', 'highlight', 'bookmark', 'label'));

alter table public.bible_annotations
  drop constraint if exists bible_annotations_content;
alter table public.bible_annotations
  add constraint bible_annotations_content check (
    deleted or
    (kind = 'note' and body is not null and length(body) between 1 and 20000
      and length(coalesce(category, '')) <= 80
      and length(coalesce(title, '')) <= 120) or
    (kind = 'highlight' and color is not null) or
    (kind = 'bookmark' and color in ('amber','green','blue','pink','purple','teal','red','yellow')
      and item_id = color and body is null) or
    (kind = 'label' and item_id ~ '^(bookmark|highlight):(amber|green|blue|pink|purple|teal|red|yellow)$'
      and color is null and body is not null and length(body) between 1 and 60)
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
    if (entry->>'kind') not in ('note', 'highlight', 'bookmark', 'label')
       or length(entry->>'item_id') not between 1 and 100
       or length(entry->>'verse_id') not between 1 and 80
       or (entry->>'verse_id') !~ '^[A-Za-z0-9]+[.][0-9]+[.][0-9]+$'
       or (entry->>'color' is not null and
           entry->>'color' not in ('amber','green','blue','pink','purple','teal','red','yellow'))
       or (entry->>'kind' = 'bookmark' and (
             entry->>'item_id' not in ('amber','green','blue','pink','purple','teal','red','yellow')
             or entry->>'color' is distinct from entry->>'item_id'))
       or (entry->>'kind' = 'label' and (
             entry->>'item_id' !~ '^(bookmark|highlight):(amber|green|blue|pink|purple|teal|red|yellow)$'
             or entry->>'color' is not null))
       or length(coalesce(entry->>'body', '')) > 20000
       or length(coalesce(entry->>'category', '')) > 80
       or length(coalesce(entry->>'title', '')) > 120
    then
      raise exception 'Invalid annotation';
    end if;

    insert into public.bible_annotations
      (user_id, kind, item_id, verse_id, body, color, category, title,
       created_at, updated_at, deleted)
    values
      (owner,
       entry->>'kind',
       entry->>'item_id',
       entry->>'verse_id',
       entry->>'body',
       entry->>'color',
       entry->>'category',
       entry->>'title',
       (entry->>'created_at')::timestamptz,
       (entry->>'updated_at')::timestamptz,
       coalesce((entry->>'deleted')::boolean, false))
    on conflict (user_id, kind, item_id) do update set
      verse_id = excluded.verse_id,
      body = excluded.body,
      color = excluded.color,
      category = excluded.category,
      title = excluded.title,
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

commit;

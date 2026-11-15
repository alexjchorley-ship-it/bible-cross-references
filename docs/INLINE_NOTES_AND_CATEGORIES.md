# Inline notes, categories, and colour meanings (November 2026)

## What changed

- Verse details show highlight and bookmark **colour dots immediately**, without another button.
- Tapping an active highlight dot again removes its highlight; tapping a bookmark dot moves that colour's single reading position here (or removes it if already here).
- The new-note composer is immediately visible, with an optional title and category. Categories include Bible study, Sermon, Prayer, Questions and Personal reflection; you can type your own.
- Existing notes are directly editable. When several notes are attached to a verse, only the latest appears initially; expand to see them all.
- My Notebook now has category filtering, recent/Bible-order sorting, editable notes, and separate editable meanings for **highlight** and **bookmark** colours.
- Theological study opens and closes with the same styled section band as the cross-references and original-language word reviews.

## Important migration (run **before** merging/deploying)

Open [the Supabase SQL Editor for Bible Study](https://supabase.com/dashboard/project/nbgneowrbdwcqdrofwuw/sql/new).
Copy and run [`supabase/migrations/20261115_inline_notes_and_labels.sql`](../supabase/migrations/20261115_inline_notes_and_labels.sql).

This is a **non-destructive** migration. It adds optional `title` and `category` columns to the existing `bible_annotations` table, allows `label` records under the existing per-user Row Level Security rules, and extends the safe merge function. It does **not** delete notes, bookmarks or highlights.

**Until this SQL runs, do not deploy the new frontend:** it requests the new columns, and cloud synchronisation will fail against the old database.

## Personal notes and backup compatibility

The local IndexedDB store upgrades from v3 to v4, preserving the earlier data stores.
The exported JSON schema becomes v3, adding named colour meanings and optional note metadata.
Importing v1/v2 backups remains supported, so earlier exports are still useful.

An example naming scheme (fully editable) is:

| Colour | Highlight meaning | Bookmark meaning |
|---|---|---|
| Amber | Miracles | Bible study |
| Green | Prayer | Personal reading |
| Blue | Promises | Topical study |
| Pink | Love | Reflection |

You can rename any of these under **My Notebook → Customise colours**. The colour itself is still the visual selector; its editable meaning is shown to assistive technology and as a tooltip.

## Acceptance checks

1. Confirm a highlighted verse's dot selection appears on the phone.
2. Add a titled note in the **Prayer** category without opening a dropdown or separate section.
3. Open My Notebook, filter to Prayer, edit the note and change category.
4. Rename green highlighting to "Pray about this" and green bookmark to "Morning study", preserving their independent meanings.
5. Confirm all changes, including metadata, appear on the other device after **Sync now**.
6. Export and reimport a JSON backup to verify label and category retention.
7. Expand **Theological study** and verify it matches the other section bands.

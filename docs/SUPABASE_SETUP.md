# Supabase setup for Bible Study cloud sync

This project uses **Supabase project `nbgneowrbdwcqdrofwuw`**. The browser
uses only the Supabase **publishable** API key. It never needs the database
password, a secret key or a service-role key.

## One-time owner steps

1. Open the project's [Supabase SQL Editor](https://supabase.com/dashboard/project/nbgneowrbdwcqdrofwuw/sql/new).
   Copy and run the **entire** file
   [`supabase/migrations/20261114_bible_annotations.sql`](../supabase/migrations/20261114_bible_annotations.sql).
   A successful execution creates `public.bible_annotations`, enables
   row-level security (RLS), and creates the timestamp-safe merge function.
2. Open **Authentication → URL Configuration** in Supabase. Set **Site URL**
   to `https://alexjchorley-ship-it.github.io/bible-cross-references/`.
   Add the same address to **Redirect URLs**. Supabase email confirmation
   will then redirect to the correct hosted app.
3. Under **Authentication → Providers → Email**, ensure email/password
   sign-in is enabled. Keep email confirmation enabled if you prefer.
4. In GitHub **Settings → Pages**, choose **GitHub Actions** as the build
   source. Confirm the **Publish Bible Study PWA** workflow succeeds.
5. Export a JSON notes backup from the old local Windows reader. Import it
   into the hosted PWA on Windows **before or after** signing in.
6. In **My Notebook → Sync across devices**, create a single account and
   sign in. If email confirmation is required, follow the email first.
   Verify the app reports that the local notes were synchronised.
7. On Android, open the hosted URL, install it through Chrome, then sign in
   using **the same email and password**. Verify the same highlights and
   notebook notes appear.

## Security and data retention

The site and source code are public, but **notes are not public**. Supabase
RLS allows each authenticated user to select or modify only their own rows.
The publishable browser key alone cannot bypass that policy.

All updates first commit to local IndexedDB. A retained tombstone represents
each deletion so an offline device cannot restore deleted notes on reconnect.
The server merge function accepts only records newer than its stored
version. Conflicts are resolved by each record's `updated_at` timestamp.
This assumes the two devices' clocks are reasonably accurate.

A sign-out leaves local records on the device. Do not use multiple unrelated
accounts in the same browser profile. Browser storage loss or a reset can
still erase unuploaded offline edits. Keep exporting JSON backups.

## Troubleshooting

- **Could not find the table or function:** Apply the SQL migration in the
  correct project and check the table and function names.
- **Permission denied:** Confirm the SQL grants and RLS policies.
- **Invalid login:** Confirm your email or reset the password in Supabase.
- **Cloud unreachable:** Local changes remain in IndexedDB. Retry **Sync
  now** when connected.
- **Old notes absent:** Import the JSON backup from the original
  `127.0.0.1:4173` app into the hosted PWA.
- **Public GitHub Pages URL 404:** Enable GitHub Pages using GitHub Actions
  and verify the publishing workflow succeeded.

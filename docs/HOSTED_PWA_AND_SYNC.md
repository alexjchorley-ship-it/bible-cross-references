# Hosted Bible Study — deployment and cross-device sync

## Deployment

The GitHub Pages workflow builds the app at
<https://alexjchorley-ship-it.github.io/bible-cross-references/>.

**One-time owner action:** Open GitHub repository **Settings → Pages** and
select **GitHub Actions** as the build and deployment source. After the Pages
workflow has merged to `main`, open the **Actions** tab and confirm it has
succeeded. Open the app on Windows and Android, then choose the browser's
**Install app** or **Add to Home screen** command.

## Migrating existing local notes

The Windows-only app at `127.0.0.1:4173` and the hosted app use different
browser storage. **Export your existing notes from My Notebook on Windows
before switching to the hosted app.** Import the JSON backup into the hosted
app and retain the downloaded backup until synchronisation is verified.

## Cloud synchronisation

GitHub Pages is static hosting, not a data store. Cross-device sync requires
a Supabase database, authentication and the migration documented in
[`SUPABASE_SETUP.md`](SUPABASE_SETUP.md). No service-role or secret key
belongs in a browser, public repository or GitHub Actions configuration.
The publishable key may appear in client code, but all database access must
be protected with Row Level Security.

Do not assume notes are synced until the app shows a successful connection.
Continue exporting JSON backups during initial setup.

## Device acceptance

- Load the hosted address in Chrome on Android and Chrome/Edge on Windows.
- Select a book and chapter, then open verses and theological study.
- Install it alongside the original upstream PWA.
- Save highlights and notes, reload, and confirm they persist.
- Test offline reading after the first complete online load.
- Verify remote editing and deleting from both devices before relying on sync.

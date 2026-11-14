# Run Bible Study privately on your own computer

The app is a personal, local-only Bible reader. It **does not need a hosted
website, user account or deployment**. The browser runs its interface from a
small server bound to `127.0.0.1` (your own computer).

## One-time setup on Windows

1. Install **Node.js 24 or newer** from https://nodejs.org/ and restart your
   terminal if it was already open.
2. Open the project repository on GitHub, choose **Code → Download ZIP** and
   extract it to a permanent folder. Use the latest code from `main` after
   the development pull requests have been merged, not the old upstream fork.
3. Double-click **`start-bible-study.cmd`** in that extracted folder.
4. The launcher installs dependencies, downloads licensed/open Bible study
   resources on the first run, builds the app, then opens
   http://127.0.0.1:4173/ in your browser.

Keep the command window open while reading. Close it or press **Ctrl+C** to
stop the server. Next time, double-click the same file. On first setup the
downloads may be substantial, so use a reliable connection.

If Windows blocks a downloaded script, right-click the file, open
**Properties**, and check whether **Unblock** is offered. Inspect the file
before allowing it to run. The launcher is plain text and is versioned in Git.

## Everyday use

The default scripture translation is **Berean Standard Bible (BSB)**.

- Use the selector to pick a **Bible book**, then its **chapter**.
- Select a verse in Arcs or Threads to show the shared details panel.
- Use **Highlight** for amber/green/blue/pink marks and **Notes** to write
  personal verse annotations.
- Open **My Notebook** to search saved annotations, filter by highlight colour,
  jump back to a verse, and export/import a JSON backup.
- Expand **Theological study** to see sourced Tyndale commentary; some verses
  have a separate, explicitly attributed comparison of interpretations.

Your notes and highlights are stored in your browser's **IndexedDB** against
the `http://127.0.0.1:4173` origin. They are **not uploaded to GitHub**. Keep
using the same browser profile and URL. `localhost` and `127.0.0.1` are
**different origins**, so do not change the hostname without first exporting
and importing your backup.

**Export a backup from My Notebook regularly**, and always before reinstalling
the OS, clearing browser site data, changing computers, or deleting a browser
profile. Neither GitHub nor this app can recover your notes after browser
storage is erased without a JSON backup.

## Updates and troubleshooting

To rebuild after updating the source, run:

```bat
start-bible-study.cmd rebuild
```

That removes generated site files, **not personal notes in the browser**.
If dependencies changed, you can delete the `node_modules` folder and run the
launcher again. Never delete the JSON backups you've exported.

The initial compilation needs internet for pinned Bible and commentary
sources. Once a built site is present, running the local server does not
require internet. The browser's service worker caches the core app for
offline reading; large commentary books can need one successful online view
before becoming available offline.

If port `4173` is already occupied, close the other Bible Study server
window. Do **not** switch to another port for normal use: browser notes are
scoped to the origin, including the port.

## Developer alternatives

Run manually from the project directory:

```powershell
$env:BASE_PATH = "/"
$env:SITE_ORIGIN = "http://127.0.0.1:4173"
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

The app remains available only on loopback. For development with hot reload,
run `npm run dev` separately, but its default origin is different and it has
**different local note storage**. Do not treat development data as a backup.

## What is not included

AMP, NIV and NET are not imported. BSB is the primary English text; the
original fork also includes its existing public-domain/multilingual texts.
Scholarly citations are labelled and distinct from personal notes and the
Bible text. The local launcher never installs a cloud service or creates an
internet-accessible app.

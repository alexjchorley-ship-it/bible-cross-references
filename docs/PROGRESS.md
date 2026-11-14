# Bible Study — personal release progress

**Updated:** 14 November 2026  
**Repository:** `alexjchorley-ship-it/bible-cross-references`  
**Release branch:** `main`, merged via pull requests [#2](https://github.com/alexjchorley-ship-it/bible-cross-references/pull/2) and [#1](https://github.com/alexjchorley-ship-it/bible-cross-references/pull/1).

## Verified release candidate

GitHub Actions run [43612823802](https://github.com/alexjchorley-ship-it/bible-cross-references/actions/runs/43612823802), commit `39830631c2eb217e93c853c034e647b3b3e9a574`:

- **Build:** passed, including pinned BSB Bible datasets, original-language resources and licensed Tyndale notes.
- **Code quality:** TypeScript, type coverage, ESLint and Prettier passed; type coverage **99.9868%**.
- **Unit tests:** **1,400 passed**, 31 previously skipped.
- **Unit coverage:** statements **98.39%**, lines **98.41%**, functions **98.08%**, branches **91.53%**. All existing coverage requirements satisfied.
- **Desktop and phone:** all **five out of five** Playwright end-to-end shards passed.
- **Offline:** dedicated service-worker/cache tests passed.
- **GitHub Pages:** deployment intentionally skipped. The workflow was subsequently made _non-deploying_ in `main`.

The tested feature tree was `1783217a1ad94f0908e7cc731ca5e4d9afc0f93d` and the subsequent PR merges preserved this exact tree before the final documentation/CI safety update.

## Features delivered

- Book-then-chapter navigator; original Arcs and Threads views preserved.
- Berean Standard Bible (BSB) remains the default; original Hebrew/Greek exploration and cross-references preserved.
- Four highlight colours, personal notes and editable note storage keyed by canonical verse reference.
- Searchable My Notebook, verse jump links, JSON export/import, storage failure messages.
- Study panel with licensed **Tyndale Open Study Notes** across 66 Bible books, attribution and offline-aware loading.
- Additional scholarly interpretation comparison is an **editorial pilot on Genesis 1:1**, not comprehensive for every verse.
- Private Windows launcher `start-bible-study.cmd` with loopback-only server; see [RUN_LOCALLY.md](RUN_LOCALLY.md).

## Scope and privacy

The app is for **personal use only**. No additional copyrighted translation was imported. AMP, NIV and NET are intentionally deferred. The original external Bible.com links and languages remain.

No public hosting, cloud database, sign-in, analytics account, or GitHub Pages deployment is required. Personal highlights and notes live in the browser's IndexedDB on `http://127.0.0.1:4173/`. **Export JSON backups** before clearing browser data or moving computers.

## First use and limitations

On Windows install Node.js **24+**, download the source ZIP from the repo's `main` branch, extract to a permanent folder, and double-click `start-bible-study.cmd`. A first build requires internet access to retrieve the pinned, openly licensed datasets. Subsequent runs serve the built app locally.

The Windows launcher has **not been run on the reader's own PC** during cloud CI: a brief first-use smoke test on that computer remains the only device-specific release check. A person will also need to confirm the visual design and personal workflows feel right.

## Project origin

This fork preserves the original Bible visualizations and source attribution to Oleksii Trekhleb. See `AGENTS.md`, [DEVELOPMENT_SPEC.md](DEVELOPMENT_SPEC.md), [DATA_SOURCES.md](DATA_SOURCES.md) and [BASELINE_AUDIT.md](BASELINE_AUDIT.md).

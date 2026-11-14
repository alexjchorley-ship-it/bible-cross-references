# Baseline audit — Study & Notes fork

**Updated:** 2026-11-14  
**State:** **Phase 0 incomplete; architecture reviewed; runnable build and tests NOT executed**.  
**Canonical requirements:** [DEVELOPMENT_SPEC.md](DEVELOPMENT_SPEC.md). This audit reports evidence, not implementation claims.

## Provenance and fork

| Property                          | Evidence                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Owner fork                        | [alexjchorley-ship-it/bible-cross-references](https://github.com/alexjchorley-ship-it/bible-cross-references) |
| Upstream                          | [trekhleb/bible-cross-references](https://github.com/trekhleb/bible-cross-references)                         |
| Fork main HEAD at first audit     | `23bf0908858c949e519abe7a4ce7f4492f5fb3ba`                                                                    |
| Upstream main HEAD at first audit | `23bf0908858c949e519abe7a4ce7f4492f5fb3ba`                                                                    |
| Upstream last commit date         | 2026-11-01T22:52:55Z                                                                                          |
| Default branch                    | `main`                                                                                                        |
| Node requirement                  | `.nvmrc`: 24, `package.json`: >=24                                                                            |
| Technology                        | React, TypeScript, Vite, Three.js; Vitest and Playwright                                                      |
| Baseline source licences          | Code MIT; biblical datasets carry their own licences in `data/sources.json`                                   |

**Verified through GitHub:** fork exists under the intended **personal** account, connector permissions include push, and main matches the pinned upstream commit. This document is part of a documentation-only branch; there are no app feature changes or claimed test passes.

## Code integration map (verified by reading source)

| Area                          | Entry point                                                                                         | Engineering constraint                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared passage and navigation | `src/app/Explorer.tsx`                                                                              | Root owns selected passage, URL, locale, translation and both mounted visualisations. Shared annotations state belongs here or in a provider.  |
| URL contract                  | `src/app/explorer-location.ts`                                                                      | Preserve existing `?ref=Gen.1.1` and language/filter deep-link semantics.                                                                      |
| Canonical verse identity      | `src/core/bible/verse-ref.ts`; `src/core/bible/passage.ts`                                          | Persist OSIS identifiers such as `Gen.1.1`, not translation text or transient zero-based indices.                                              |
| Shared verse details          | `src/visualizations/shared/components/PassagePanel.tsx`                                             | Both Arcs and Threads use this; ideal entry for Study, Highlight and Notes actions without rebuilding readers.                                 |
| Threads reading rows          | `src/visualizations/threads/ThreadsStage.tsx`                                                       | Keep `data-selected` and row click behaviour; put colour/markers in the DOM without intercepting canvas navigation.                            |
| Mobile/desktop details        | `src/visualizations/shared/components/VizPage.tsx`, `src/visualizations/shared/use-bottom-sheet.ts` | Respect draggable sheet and editable text interactions.                                                                                        |
| Original-language study       | `src/visualizations/shared/components/OriginalWordsSection.tsx`                                     | Reuse existing lazy-loaded Hebrew/Greek lexicon; don't duplicate it.                                                                           |
| Storage                       | `src/shared/lib/preferences.ts`                                                                     | Existing localStorage is for small preferences, **not** a robust store for personal notes; introduce versioned IndexedDB with explicit errors. |
| Offline                       | `sw/service-worker.ts`, `src/app/register-offline-cache.ts`                                         | Dataset caches and app shell work independently of user notes; never delete IndexedDB in a cache upgrade.                                      |
| Deployment                    | `vite/site.ts`, `.github/workflows/ci.yml`                                                          | Upstream hard-codes its own site URL and deploy configuration. **Do not deploy the fork until URLs/manifest/Pages target have been changed.**  |
| i18n                          | `src/i18n/messages/*`                                                                               | Existing translation completeness checks and language routes must continue to pass.                                                            |

The current `.github/workflows/ci.yml` declares unit/type/lint/format checks, dataset build, five E2E shards, offline tests and a Pages deployment **on main**. Avoid merging a change to `main` before updating fork-specific deployment URLs and settings. A PR should exercise checks if GitHub Actions has been enabled for this fork.

## Reproducible baseline steps — not yet run

The execution container exposed to this assistant has Node v22.16.0 and has no DNS access to `github.com`; cloning fails. The GitHub connector supports reading/writing source and reviewing CI but is not a local Node 24 runner. Accordingly **`npm ci`, data fetch/build, `npm run check`, `npm run test:built`, `npm run build`, `npm run test:e2e` are all unverified**.

On GitHub Actions or a networked development machine with Node 24:

```bash
git clone https://github.com/alexjchorley-ship-it/bible-cross-references.git
cd bible-cross-references
git remote add upstream https://github.com/trekhleb/bible-cross-references.git
node --version
npm ci
npm run data:fetch
npm run data:build
REQUIRE_BUILT_DATASETS=1 npm run test:built
npm run check
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Record dated logs and any failed checks, warnings, sample screenshots (phone and desktop) and pinned commit in this file before marking `F-002` done. Do **not** relax the upstream coverage gate (98% lines/statements/functions; 88% branches).

## Phase 0 acceptance

| Ticket                            | Status          | Remaining evidence                                                                                  |
| --------------------------------- | --------------- | --------------------------------------------------------------------------------------------------- |
| **F-001 Fork & pin upstream**     | **PARTIAL**     | Fork confirmed and SHA pinned; `upstream` remote on a local clone is pending.                       |
| **F-002 Baseline build & tests**  | **BLOCKED**     | Needs Node 24 and reachable GitHub/runner; inspect fork PR's Actions results.                       |
| **F-003 Architecture / UX audit** | **IN PROGRESS** | Source map complete; need live mobile/desktop screenshots and gesture behaviour verified.           |
| **F-004 Data/rights ledger**      | **IN PROGRESS** | Manifest inventory drafted; independent licence review and publisher-source inspection outstanding. |

**Release gate:** Before public launch, verify all third-party terms, fork-specific site origin/base/manifest/social links, service worker scope, and privacy/data export. No user notes or private data should go into repository code or CI artifacts.

# Bible Cross-References — Study & Notes Fork

**Product requirements, technical design, delivery plan, and agent execution contract**  
**Version:** 1.0 · **Prepared:** 14 November 2026 · **Status:** Approved direction / implementation not started  
**Canonical file:** `docs/DEVELOPMENT_SPEC.md` (this Markdown document after it is copied into the fork)  
**Project name:** Working title only; final brand/name is deliberately undecided.

> **The mission:** Fork [trekhleb/bible-cross-references](https://github.com/trekhleb/bible-cross-references), preserve its existing visualisation and original-language experience, and add (1) serious, source-attributed theological study attached to Scripture and (2) dependable verse highlighting, personal notes, and a personal notebook. Do **not** rebuild the Bible engine or add speculative AI features as prerequisites.

## 0. How the development agent must use this document

This document is the **source of truth for scope, requirements, acceptance tests, and implementation order**. It is not proof that a feature already exists. The actual fork's code is the source of truth for its current implementation, and source licences are the source of truth for permissible uses.

**Priority of authority:** legal/security requirements and actual licence conditions → this document's explicit product decisions and acceptance criteria → current repository constraints and tests → implementation discretion. If a conflict arises, write a short Architecture Decision Record (ADR), explain it, and seek owner approval for scope-changing decisions. Never silently delete an upstream capability to make a new feature easier.

**Agent operating rules**

1. At the start of every development session, read this specification, `README.md`, `CONTRIBUTING.md`, `data/raw/README.md` and relevant tests. Inspect the actual code before naming or altering implementation files.
2. Implement one ticket or a closely related group at a time on a feature branch; keep changes reviewable. For each completed ticket: code, focused tests, accessibility checks, docs and a short implementation note.
3. Maintain the checklist in §14 with statuses `NOT STARTED / IN PROGRESS / BLOCKED / DONE`. A ticket is `DONE` only after its acceptance criteria are observed, not when code has merely been written.
4. Run the upstream checks (`npm run check`, build, and applicable `npm run test:e2e` / visual tests); do not relax existing coverage thresholds as a shortcut.
5. Preserve the canonical 66-book / 31,102-verse address scheme and all existing shareable URLs, Arcs, Threads, word data, translations, search, offline installation and language support.
6. Treat verse text, source commentary and personal notes as three **separate content classes** with separate storage, licence and trust boundaries.
7. Any factual theological synthesis must have traceable sources. Never fabricate quotations, author positions, consensus figures, or citations. When no adequate source exists, show an honest gap state.
8. Do not commit secrets, API keys, personal journal entries or generated private backups. Do not send notes to analytics or external LLMs by default.
9. At the end of each ticket, report: changed files, what works, tests run and results, limitations, screenshots/recording when UI changes, and the next unblocked ticket.
10. Obtain explicit approval before: adding mandatory accounts, paid services, external AI, substantial dependencies, collecting personal data remotely, publishing third-party material beyond its licence, or replacing major upstream visualisations.

### Meaning of requirement labels

- **MUST / P0:** necessary for the first usable release or to protect trust/data.
- **SHOULD / P1:** desired for the first polished public release, after the MVP works.
- **LATER / P2:** deliberately outside first release unless explicitly approved.
- **SPIKE:** inspect/prototype/research before a final engineering decision.

---

## 1. Product vision and target experience

### 1.1 User problem

Existing Bible apps commonly separate Scripture reading, linguistic tools, cross-references, commentaries and private notes. Readers must switch apps and search manually to assess an interpretation. The upstream project connects passages beautifully but does not yet provide a complete personal study workflow in this proposed fork.

### 1.2 Product promise

**Read a verse → highlight or annotate it → open its source-backed theological study → inspect the underlying scholars and differing interpretations → resume reading without losing place.**

### 1.3 Primary user journeys

| ID | Reader journey | Required result |
|---|---|---|
| J1 | Open a chapter in Threads; select Genesis 1:1; tap **Study** | A readable summary appears with citations and linked interpretations, without losing the passage. |
| J2 | Tap a verse; apply amber/green/blue/pink highlight; close/reopen | The verse remains highlighted, including after offline reload or switching translation. |
| J3 | Add a note to a verse; reopen and edit it | Text persists, preserves line breaks, and remains tied to the canonical verse reference. |
| J4 | Open **My Notebook**; search/filter; select an entry | It opens the correct passage and annotation, with an obvious way to return. |
| J5 | Open a verse with no individual study note | Show the nearest clearly labelled passage/chapter context where available, or “No sourced study note available”; never manufacture one. |
| J6 | Review an interpretation; open an author/source | Exact source metadata and permitted excerpt/original source link are accessible. |
| J7 | Export notes; import them on another browser/device | Versioned backup restores annotations without needing an account, with preview and conflict-safe handling. |
| J8 | Use the app in airplane mode after install | Scripture, cross-references, notes, highlights and downloaded studies continue to function. |

### 1.4 Experience principles

- **Reading first, exploration a tap away.** Keep Arcs and Threads recognisably upstream.
- **Two additions, not a platform rewrite.** Build separate feature modules and reuse existing selection/URL flows.
- **No forced account.** The first release is local-first and functional offline.
- **Evidence over certainty.** Definitions, linguistic observations, interpretations and doctrinal claims are distinct.
- **Attributions are visible.** Every scholarly view shows who argued for it and where it can be read.
- **Fast on a phone, comfortable on desktop.** Reachable tap targets, bottom sheets on mobile, side panels when space permits.
- **Own your annotations.** Data export, import, deletion and user consent are first-class features.

---

## 2. Verified upstream baseline — preserve rather than reimplement

**Verified from upstream README/package metadata on 14 November 2026; audit source files after forking.**

- **Repository:** https://github.com/trekhleb/bible-cross-references ; MIT-licensed application code. Datasets have **separate licences**.
- **Core UX:** Arcs (full-Bible cross-reference visualisation), Threads (chapter reading with cross-reference threads), passage details, selection, search, original Hebrew/Greek lemma definitions and same-word occurrences, translation switching, links and sharing.
- **Corpus:** 66 books / 31,102 verses in the project's canonical KJV-style versification; 344,799 known cross-references, with fewer shown by default according to vote filters. Do **not** treat link count as a theological fact.
- **Translations:** Berean Standard Bible (BSB) default, KJV and other existing open-licence texts. External ESV/NASB/NLT links are links, not redistribution permission.
- **Stack:** React 19, TypeScript, Vite, Three.js; Node.js **24+** required; Vitest/happy-dom, Playwright and visual browser tests.
- **Data pipeline:** `data/raw/`, `data/sources.json` with SHA-256 pins, `scripts/data/`, generated `public/data/`; `src/core/`, `src/translations/`, `src/words/`, `src/cross-references/`, `src/app/`, `src/visualizations/`, `sw/`.
- **Static hosting:** GitHub Pages-style static deployment and offline service worker. The fork must use its **own** origin/base path, titles and manifest; never publish under the author's site.
- **Upstream quality gate:** `npm run check` (type checks, type coverage, lint, format, unit/coverage); `npm run test:e2e` (desktop, phone, offline). Upstream README describes high existing coverage thresholds; read actual `vite.config.ts` before updating thresholds.

**Non-regression list:** Arcs panning/zooming, Threads navigation, reference search, existing mobile bottom sheet, original-word lookup, all translation selections, source attributions, language paths, query parameters, verse share cards, offline installs, and original data validation. Preserve existing deep links including `?ref=John.3.16` and legacy language/query forms. Add new URL parameters only through the existing URL contract tests.

**Upstream fork procedure**

```bash
# Use the GitHub Fork action on the user's account, then clone THEIR fork.
git clone https://github.com/<OWNER>/<FORK_REPO>.git
cd <FORK_REPO>
git remote add upstream https://github.com/trekhleb/bible-cross-references.git
nvm use   # install/use Node >=24 from .nvmrc
npm ci
npm run data:fetch     # fetch/check any non-committed pinned data sources
npm run build
npm run check
npm run test:e2e
```

`npm run data:fetch` may require internet; if sources fail or hashes differ, **stop and report** rather than substituting unpinned content. First capture the actual upstream commit SHA, baseline output and tests in `docs/BASELINE_AUDIT.md`.

---

## 3. Scope and release boundaries

| Area | MVP / P0 | Polished release / P1 | Later / P2 |
|---|---|---|---|
| Existing features | Preserve all upstream features | Compatibility polish | New visualisation modes |
| Highlights | Four named colours, single-verse highlighting, remove | Passage/multi-verse operations, colour legend | Text-range highlights inside verses |
| Personal notes | Multiple notes per verse, create/edit/delete, autosave, timestamps | Notebook search/filter/sort, optional tags | Attachments, collaborative notes |
| Persistence | IndexedDB, schema migrations, no sign-in | Backup export/import, restore preview, reset controls | Account sync/optional encryption |
| Theological content | Imported licensed notes, accurate verse/passage matching, provenance | Curated interpretation comparisons for a pilot set, source library, quality reviews | Wide-scale multi-perspective editorial expansion |
| Reading UX | Study and annotation actions in Threads/details; mobile and desktop | Reader polish and easier navigation | Dedicated reading mode if needed |
| Original-language | Preserve current dictionary/occurrence feature | Link linguistic discussion to existing lexicon | Full morphology/transliteration redesign |
| AI | None | None required | Optional citation-checked Q&A behind explicit consent |

**Important coverage distinction:** The first release **MUST** provide a Study action on every verse, but it **MUST NOT** promise a unique scholarly analysis or multiple scholarly interpretations for all 31,102 verses. It shows directly matched material when available, inherited broader passage notes clearly labelled as such, and a transparent absence state otherwise.

**Explicit non-goals:** replacing Arcs with a normal Bible reader; purchasing Logos resources; copying copyrighted modern commentaries/ESV/NIV text; generative study content at runtime; social feeds; streaks/gamification; a theological “truth score”; denominationally coercive recommendations; mandatory cloud storage.

---

## 4. Feature A — theological study for every verse

### 4.1 Study entry and layout

- **ST-01 [MUST]:** Each selected verse has a clearly labelled **Study** action in Threads and the Arcs passage detail view. It opens a panel without disrupting Scripture navigation.
- **ST-02 [MUST]:** The panel heading always shows the selected reference, active Bible translation, and the provenance/coverage status.
- **ST-03 [MUST]:** Display a **Short explanation** only when a licensed/reviewed explanatory source supports it; otherwise label the nearest passage-level note or unavailable state.
- **ST-04 [MUST]:** Show **Source commentary** entries sorted by direct verse match, closest passage overlap and broader chapter/book context. Mark inherited context explicitly (e.g. “Commentary on Genesis 1:1–3”).
- **ST-05 [MUST]:** Every commentary item includes source title, author/editor when known, publisher, edition/date when known, licence or permitted-link mode, reference span, stable source URL/identifier, and a distinction between verbatim extract and editorial paraphrase.
- **ST-06 [MUST]:** Do not merge author quotations with AI-written text. Source text must be accurately quoted under allowed licence. Do not label an internal summary as a scholar's exact words.
- **ST-07 [MUST]:** Provide a **Sources** area with publication metadata, original URL, licence/attribution and any edits/translation applied to the text.
- **ST-08 [MUST]:** Distinguish direct citation / translation / linguistic observation / theological interpretation / application. Do not claim a particular denomination or “scholarly consensus” without evidence.
- **ST-09 [SHOULD]:** Add an **Interpretations** tab for passages where reliable, distinct views exist; each view has a thesis, evidence, limitations, named proponents, and a reviewed source.
- **ST-10 [SHOULD]:** Link to existing **Hebrew/Greek word explorer** and cross-references instead of duplicating its data ingestion.
- **ST-11 [SHOULD]:** Allow selecting another verse in the same chapter and update Study seamlessly while preserving open tab/scroll intent.
- **ST-12 [MUST]:** Support keyboard, screen readers, reduced motion, mobile bottom sheet and desktop side panel; study text must not obscure selected Scripture irretrievably.

### 4.2 Study tabs and content order

Proposed tabs: **Overview | Interpretations | Hebrew/Greek | Sources**. The Overview includes the most direct existing source-backed explanation. The Interpretations tab is *only populated when substantive documented disagreement is available*. Hebrew/Greek should deep-link to existing word data; avoid reimplementing its lexicon. Sources always remains available. An empty panel needs a useful “No sourced study note for this verse yet” and links to wider context/word study.

**Example coverage logic for Genesis 1:1:** if a study source covers Gen 1:1, label it “Direct note”; if it covers Gen 1:1–3, label it “Covers vv. 1–3”; if it describes Genesis 1 generally, label it “Chapter context”. Do not output a custom generated “Genesis 1:1 interpretation by X” unless X actually wrote the attributable point being shown.

### 4.3 Source and editorial policy (trust-critical)

- Only ingest datasets with verified redistribution terms or explicit written permission. Public website visibility is **not** content redistribution permission.
- Store each commentary record's source ID, source version, copyright/licence, location pointer, original reference, date retrieved, content hash, transformation log and attribution string.
- Keep *verbatim source content* separate from *editorial/AI synthesis*. Use tags such as `original_excerpt`, `licensed_adaptation`, `editorial_summary`, `linked_only`.
- Make source material browseable without the app inventing theological claims; no unsupported “most scholars believe” or numeric confidence score.
- Clearly identify a Christian study note as Christian, and label Orthodox, Catholic, Protestant, Jewish and critical-academic positions only when the attributed writer/organisation genuinely holds them. Do not fabricate balance or make a source representative of a tradition without evidence.
- Do not assert a word's etymology determines its meaning in context. For original-language claims, list lemma, grammatical role if available, usage and textual context; flag disputed analysis.
- Create a `docs/CONTENT_POLICY.md` editorial guide and a source-review checklist. Any authored cross-source summary requires reviewer sign-off before publication.
- Do not automatically import AI-generated STEPBible concept glosses as scholarly consensus; that dataset explicitly notes some descriptions were AI-created.

### 4.4 Content packages to evaluate

| Source | Role | Current evidence | Required action |
|---|---|---|---|
| **Tyndale Open Study Notes** | Primary accessible modern study notes; book introductions, themes and contextual material | Publisher offers download and CC BY-SA 4.0 | Download; inventory actual file structure; validate licence notice inside archive; inspect coverage and reference notation; build deterministic importer; assess ShareAlike obligations. |
| **Tyndale Open Bible Dictionary** | Definitions for people, places, concepts | Publisher download, CC BY-SA 4.0 | Optional P1 contextual links after matching IDs and licence review. |
| **STEPBible data** | Existing lemma/morphology backbone | Upstream uses tagged Hebrew/Greek and lexicons under CC BY 4.0 | Reuse existing modules; no new duplicate scrape; preserve credit. |
| **OpenBible.info cross-references** | Existing cross-reference index | Upstream uses CC BY 4.0 | Preserve and attribute; avoid treating ranked links as doctrinal truth. |
| **Historical public-domain commentaries** | Additional named author perspectives | Can be useful, but edition/country-specific rights vary | Per-edition, jurisdiction and transcription audit *before* import; do not treat all digitised versions as automatically free. |
| **Current copyrighted scholarly books** | Depth and modern breadth | Typically require permission | Link to original publications, use very short permitted quotes if lawful and reviewed; do not mirror books. |

**Legal architecture rule:** Do **not** assume that the MIT code licence also applies to imported study notes. Track licences per dataset, preserve mandatory notices, keep raw licensed resources separated from app code, and review whether adaptations must be distributed under CC BY-SA 4.0. Make the complete source/attribution page visible in-app and as a file in the repo. Avoid restricting access to licence-required attribution or derivative materials. Legal review is an explicit release gate, not a footnote.

### 4.5 Commentary import pipeline

Create independent `scripts/commentary/` commands following upstream's reproducible data conventions:

1. **Inventory:** manually inspect provider archive and source metadata, export a coverage report; do not presume the ZIP is already JSON or all notes are verse-specific.
2. **Pin:** record source URL, human-readable version/date, SHA-256 checksum, licence and any redistribution conditions.
3. **Parse:** produce staging records with original source reference strings and text/metadata; reject malformed or empty rows with a report.
4. **Canonicalise:** convert each source passage into one or more canonical verse ranges, retaining the original range and translation/versification scheme. Maintain explicit exception mapping where needed; never silently shift an annotation to a neighbouring verse.
5. **Validate:** assert source IDs unique, valid Bible book IDs, range start ≤ end, proper canonical limits, no HTML script content, required provenance, no unlicensed records. Distinguish book introductions from verse-level notes.
6. **Build:** generate static, split-by-book or chapter compressed JSON assets plus a small coverage index, with deterministic byte-for-byte output from pinned inputs. Deduplicate without losing provenance.
7. **Runtime load:** lazily fetch commentary for the current book/chapter; gracefully handle offline missing assets and avoid downloading the whole commentary corpus for a single verse.
8. **Review:** manually verify pilot passages and any disputed mappings using a reproducible QA report; store exceptions as fixtures.
9. **Release:** provide attribution index and import log; verify online/offline loading and licence compliance.

**Passage matching:** primary match uses explicit verse range; broader note matching may include covering passages, chapter and book, in that order. Sort by specificity; never relabel a chapter intro as a verse explanation. Separate `sourceCoverage` from `editorialInterpretations` so the absence of curated debate does not block basic sources.

### 4.6 Pilot editorial set for differing interpretations

Before scaling to the whole Bible, manually curate **10–15 representative passages** to test the data model and UI, including Genesis 1:1, Genesis 3:1–15, Isaiah 53, Psalm 22, John 1:1, Romans 9, James 2:14–26, 1 Corinthians 11, Revelation 20 and a relatively uncontroversial narrative verse. Include different genres and both Testaments. For each: minimum two *genuinely distinct, documented* readings **where they exist**, sources with page/link locators, explicit treatment of uncertainty, editorial date and reviewer status. Do not force multiple views for passages with no meaningful dispute.

**Genesis 1:1 editorial test:** distinguish (a) independent first act, (b) summary/heading and (c) dependent temporal clause only when supported by accurately checked primary commentary/linguistic sources. “Bara always means creation from nothing” must fail review as overstated. Author attribution must be traceable to the specific position, not inferred from a source title.

---

## 5. Feature B — highlighting and personal notes

### 5.1 Highlight requirements

- **AN-01 [MUST]:** Select any single verse in Threads or passage details and choose one of four visible named colours: amber, green, blue, pink; allow **remove highlight**. Colours are display preferences, not implied spiritual categories.
- **AN-02 [MUST]:** Highlights are tied to a canonical verse ID, **not raw translated text**, so switching BSB/KJV does not lose them.
- **AN-03 [MUST]:** Render subtly on the verse background without making text unreadable; show an accessible semantic indication (“Highlighted amber”) in addition to colour.
- **AN-04 [MUST]:** Highlight survives refresh, installed-PWA launch, offline mode and application upgrades.
- **AN-05 [MUST]:** Selection, verse navigation, share buttons, word clicks, pinch-zoom, and existing bottom-sheet gestures continue working; don't hijack long-press gestures used by Arcs.
- **AN-06 [SHOULD]:** Multi-verse selection and batch highlighting after single-verse behaviour is proven robust. Do not start with text-range highlighting.

### 5.2 Note requirements

- **AN-07 [MUST]:** Add, edit and delete plain-text notes against a canonical verse reference. Allow multiple separate notes for the same verse, with clear timestamps.
- **AN-08 [MUST]:** Autosave locally with a brief debounce and a visible `Saved / Saving / Error` state. On navigation or closure, flush pending changes; don't silently lose text.
- **AN-09 [MUST]:** Preserve paragraphs, Unicode, Hebrew/Greek text and line breaks; never render note content as raw HTML.
- **AN-10 [MUST]:** Require confirmation for deletion or provide a reliable undo. Empty drafts should not fill the notebook.
- **AN-11 [MUST]:** Visible note marker on annotated verses; marker opens the correct note(s) even if the reader changes Bible translation.
- **AN-12 [SHOULD]:** **My Notebook** lists all highlights/notes and supports full-text note search, Bible book/reference filter, highlight colour filter and sort by Bible order/recent activity.
- **AN-13 [SHOULD]:** Export notes+highlights to a human-readable, versioned JSON file; import a validated backup with dry-run preview, duplicate/conflict strategy and non-destructive default.
- **AN-14 [MUST]:** Explain local-only storage and its risk (“Data on this device can be lost if you clear site data or change browser/device”). Make backup discoverable, even if cloud sync is not yet offered.
- **AN-15 [LATER]:** Account sign-in, multi-device sync, optional encryption and cross-device conflict resolution. These are **not** prerequisites for the local PWA.

### 5.3 Interaction details

- Verse tap selects it; toolbar actions **Highlight / Note / Study** appear without obstructing reading.
- On mobile, use the existing bottom-sheet pattern; on desktop, reuse or extend the side detail panel. Respect browser Back and deep-link behaviour.
- Long-press interaction must be tested carefully against Arcs touch preview; do not replace upstream gesture logic with text selection.
- One highlight colour per canonical verse in MVP; reselecting another colour updates it. Multiple notes per verse are independent records.
- A note on a verse is **private**; “share verse” must never accidentally include the user's note, and no analytics payload may contain notes or query text typed in personal notes.
- If storage is denied/full, show a durable error and allow text copying/export rather than falsely reporting success.
- The same canonical verse may display in multiple translations; annotations apply to the verse reference, not language-specific characters. Text selections within a verse are not supported until P2.

### 5.4 Personal data integrity

Local storage should be **IndexedDB**, not `localStorage`, to support transactions, migrations and future growth. Implement a small tested storage adapter; library choice is an implementation decision after inspecting existing dependencies. Write schema migrations from version 1 onward. Personal data **must never be pre-cached/overwritten by the service worker** or bundled into deployed public assets. Updates to offline caches must not erase IndexedDB. On startup, test storage availability and tell the reader if the app is in temporary/non-persistent mode.

**Backup format:** include `format: "bible-study-annotations"`, `schemaVersion`, `exportedAt`, `appVersion`, `annotations`, `highlights` and optional user-facing preferences. Canonical references, timestamps and stable IDs are required. Imports must validate bounds/IDs, reject unexpected files, show counts, and default to **merge with explicit conflict preview**. Round-trip test exported data from one browser into a fresh browser. Never silently overwrite newer notes; implement idempotent repeated import. Test `storage full`, malformed JSON and unsupported future schema.

---

## 6. Proposed information architecture and UX states

**Keep the upstream header and views.** Add lightweight actions to the selected-verse control area and a discoverable **Notebook** entry in the existing navigation. No new home/dashboard is required.

```text
Arcs view -------------------------- Threads view
    |                                    |
    +---- selected passage/verse --------+
                       |
                 Verse actions
             [Highlight] [Note] [Study]
                  |        |      |
              Colour     Editor   Study panel
              picker      |       Overview / Interpretations
                          |       Hebrew-Greek / Sources
                          +---- My Notebook
```

**Responsive design:** mobile bottom sheet supports half/full height and swiping, but note editing must not close from incidental gestures while keyboard is open or content is unsaved. Desktop sidebar should leave Scripture visible. Study and Note panels must close to the exact prior reading location. Show clear loading, no-content, offline-missing-content, error and saved states. Provide font scaling and high-contrast legibility through existing typography conventions.

**Accessibility requirements:** WCAG 2.2 AA target for the newly introduced UI; keyboard traversal, visible focus, dialog focus trapping/restoration, labels for colours, ≥44px touch target where practical, non-colour markers, accessible status messages, reduced-motion compliance, Hebrew `lang="he"`/`dir="rtl"`, Greek `lang="el"`, and safe rendering of any imported markup.

**Internationalisation:** upstream has translated menus. New string keys belong in `src/i18n/` according to the existing TypeScript message scheme. English is source of truth; obtain reviewed translations or explicitly gate new features behind English while ensuring fallback does not break language completeness tests. Commentary languages and interface languages are distinct; label English-language commentary clearly rather than suggesting it is translated.

---

## 7. Proposed architecture and data contracts

These are **proposed modules**, not claims that these exact files already exist. Validate them during the initial repository audit. Keep existing framework-free domain logic and existing app view separation intact.

```text
src/
  features/
    annotations/         # types, IndexedDB repository, hooks, verse toolbar, editor
    notebook/            # note/highlight list, search, filters, import/export UI
    study/               # panel, loading, source citation UI, interpretation presentation
  commentary/            # runtime loader, range resolver, schema validation
scripts/
  commentary/            # pinned fetch/inventory/parse/map/build/audit
public/data/commentary/ # generated versioned content shards (not private user data)
docs/
  DEVELOPMENT_SPEC.md    # this canonical document
  BASELINE_AUDIT.md      # upstream baseline and commit SHA
  CONTENT_POLICY.md     # scholarship / licence / editing rules
  DATA_SOURCES.md       # source registry, legal audit, checksums
  ADR/                  # architecture decisions
```

### 7.1 Stable Bible verse identity

The upstream canonical reference model is authoritative; reuse its existing parser/IDs. Example *illustrative* external representation: `Gen.1.1`. Do not invent an incompatible numbering system. Maintain mapping between any commentary source's reference syntax and upstream canonical identifiers. Store note/highlight references independently of selected translation and selected UI language.

### 7.2 Suggested TypeScript contracts (adapt to upstream conventions)

```ts
// Illustration only. Prefer upstream verse reference types when they exist.
type CanonicalVerseId = string; // e.g. "Gen.1.1"
type HighlightColor = 'amber' | 'green' | 'blue' | 'pink';

type Highlight = {
  verseId: CanonicalVerseId;
  color: HighlightColor;
  updatedAt: string; // ISO 8601
};

type PersonalNote = {
  id: string; // generated stable UUID
  verseId: CanonicalVerseId;
  body: string; // plain UTF-8 text; never HTML
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // optional tombstone for future sync/merge
};

type CommentarySource = {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  edition?: string;
  date?: string;
  originalUrl?: string;
  licenseId: string;
  attribution: string;
  sourceVersion: string;
  sha256: string;
};

type CommentaryEntry = {
  id: string;
  sourceId: string;
  originalReference: string;
  startVerseId: CanonicalVerseId;
  endVerseId: CanonicalVerseId;
  granularity: 'verse' | 'passage' | 'chapter' | 'book';
  contentKind: 'original_excerpt' | 'licensed_adaptation' | 'editorial_summary' | 'linked_only';
  text?: string; // omit for linked-only material
  sourceLocator?: string; // page, section, anchor, provider ID
  editorialStatus: 'imported' | 'reviewed';
};

type Interpretation = {
  id: string;
  title: string;
  thesis: string;
  supportingEntryIds: string[];
  counterpoints?: string[];
  reviewer?: string;
  reviewedAt?: string;
  status: 'draft' | 'reviewed' | 'published';
};
```

**Model constraints:** do not put a user's personal note inside a static commentary asset; do not place licensed commentary inside an annotation export. Scripture text displayed in an exported note should be a reference, not a bundled copyrighted translation. A verse with multiple applicable commentary ranges must return all relevant matches with labelled granularity. Edited commentary and source originals must remain distinguishable.

### 7.3 Storage and integrity decisions

- **Static app + commentary data:** distributed as normal versioned, cacheable site assets; deterministic build from approved, pinned data sources.
- **Private annotations:** IndexedDB on reader's device; repository functions `getByVerse`, `upsertHighlight`, `listNotes`, `saveNote`, `deleteNote`, `export`, `import`, migration; avoid ad hoc database access in UI components.
- **Sourced interpretation summaries:** static reviewed content manifest, not AI text generated at runtime.
- **No backend in MVP:** do not introduce server credentials, database accounts or sync endpoints until P2 is approved.
- **Versioning:** app release version, content pack version and annotation-backup schema version must be independently tracked.
- **Performance:** avoid including all commentary in initial JS. Load chapter/book shards only as needed and cache them offline within storage quotas; ensure no artificial hard dependency on networking once the currently needed pack is downloaded.

---

## 8. Quality attributes and acceptance targets

| Category | Release gate / objective |
|---|---|
| Data reliability | 100% of imported entries have valid canonical references and source IDs; zero silently discarded/unmapped records in production output; exceptions reported. |
| Notes durability | Create → refresh → offline → reopen preserves text/colours; schema migration tests pass; backup round-trip matches content. |
| Provenance | Every published commentary/synthesis item has auditable attribution and correct `contentKind`; zero fabricated author quotations. |
| Non-regression | Original Arcs, Threads, word lookup, search, URL contracts, translation changes, install/offline workflows still pass upstream tests. |
| Accessibility | New workflows keyboard/screen-reader usable; no reliance on highlight colour alone; tests include RTL word displays and mobile keyboard. |
| Performance | No significant regression against baseline on representative mobile; document initial-load/network/bundle deltas rather than inventing fixed benchmarks before audit. |
| Offline | Previously visited chapter and downloaded commentary usable offline; notes always editable offline; missing content produces a clear unavailable message. |
| Security | No script injection via imported content; no user notes in analytics/logging/network; no public annotation backups; restrictive content trust boundaries. |
| Portability | Works at deployment root or configured `BASE_PATH`; no hard-coded upstream URLs except credits/links. |
| Browsers | Chromium desktop and Android-sized phone in automation; manually check Firefox and Safari / iOS PWA if available. |

**Testing layers:** pure unit tests for matching/normalisation, annotation repository and backup validation; React component tests for selection/dialogs; Playwright desktop/mobile/offline for J1–J8; manual/automated accessibility; visual regression against fork baseline; source-provenance/content audit fixtures; service-worker update and rollback checks. Respect upstream's test naming and coverage conventions.

---

## 9. Privacy, security and accessibility requirements

**Threats:** accidental note loss, accidental note disclosure, malicious imported HTML, cross-site scripting, licence violations, unsanitised URLs, and service-worker migrations deleting user data.

**Controls:**

- Notes are personal device data by default. No implicit tracking, remote sync, telemetry content capture or model processing. Do not copy to clipboard without a user action.
- HTML from source files must be sanitized/converted by a trusted deterministic pipeline. Permit only a minimal formatting subset; reject scripts, event handlers and unsafe links. Never render notes with `dangerouslySetInnerHTML`.
- Use a Content Security Policy appropriate to static hosting; review new remote resource requests.
- Store only necessary preferences and data; supply separate **Export**, **Import**, and **Delete local annotations** controls with destructive-operation confirmation.
- Make it clear that browser site-data deletion may erase local data and an exported backup is recommended before device migration.
- Where possible request persistent browser storage after explaining the benefit; never suggest permanence is guaranteed.
- For future optional sync, write a new security/privacy ADR covering authentication, encryption, conflict resolution, deletion and costs before any implementation.

---

## 10. Release phases and quality gates

**Do not begin the next phase while the preceding phase's exit gate is failed without documenting the exception.** No calendar promises are implied by phases.

### Phase 0 — Fork, inventory and baseline

**Deliverables:** user-owned GitHub fork; upstream remote; exact commit SHA; Node 24 environment; `npm ci`, data fetch/build, check/e2e baseline logs; architecture map of selection, details, Threads, PWA, URL state, i18n and sources; visual screenshots; docs in fork.

**Exit gate:** identical upstream experience runs locally; failing baseline tests (if any) documented with reproducible steps; all source dependencies/licences listed. **No feature development until this gate.**

### Phase 1 — Foundation for annotations and study

**Deliverables:** reuse upstream verse identity contract; shared selected-verse actions; feature module boundaries; IndexedDB adapter and migrations; commentary runtime interfaces, loading/no-data states; integration with existing selection and routing.

**Exit gate:** selecting a verse routes to stub Study/Note/Highlight panels on desktop/mobile without breaking Arcs/Threads, navigation or gesture behaviour; adapter unit tests pass.

### Phase 2 — Highlights and notes (first usable slice)

**Deliverables:** colour picker/remove, verse-level rendering, multiple notes, autosave/error handling, markers, delete confirmation, migration tests.

**Exit gate:** J2/J3 pass on desktop/mobile, refreshing/offline, with translation switch and non-regression tests. No false “saved” state.

### Phase 3 — Notebook and backups

**Deliverables:** notebooks list/search/filters/sort; open source verse; export and safe import/merge; data-loss guidance; backup validation/security tests.

**Exit gate:** J4/J7 pass, including malicious/invalid JSON rejection, repeated import idempotency and offline restore.

### Phase 4 — Licensed study-note ingestion

**Deliverables:** audited Tyndale source licence/files; parser, mapping tests, deterministic data build, content shards and attribution page; detailed coverage report; study panel displaying direct/context/empty states.

**Exit gate:** J1/J5/J6 pass for representative books with verifiable note-to-source mapping and online/offline fallback. No material published without licence checks.

### Phase 5 — Interpretations and source transparency

**Deliverables:** reviewable interpretation model, 10–15 pilot passages, source metadata/links, written editorial guidelines, scholarly review workflow, Hebrew/Greek deep links.

**Exit gate:** Genesis 1:1 showcase and the rest of the pilot set have source-linked, reviewed claims; no invented consensus; pages distinguish direct quotes and summaries; no requirement to populate debate tab for every verse.

### Phase 6 — UX, localisation and accessibility polish

**Deliverables:** refined responsive bottom sheets/sidebars, annotation indicators, keyboard flow, content empty/error states, mobile editing, translation/localisation coverage, screen-reader audit.

**Exit gate:** J1–J8 flow without surprising exits; WCAG target checked; 320px+ layouts usable; original screenshot visual regression reviewed.

### Phase 7 — Release readiness and deployment

**Deliverables:** production settings and own domain/path, branding, notices, privacy statement, source/licence ledger, CI, smoke testing, manual user acceptance, backup drill, release notes and rollback procedure.

**Exit gate:** every MUST ticket complete, test suites green, author/source/licence audit signed off, no catastrophic note-loss issue, offline install works, and user explicitly approves public launch.

### Phase 8 — Optional post-MVP backlog (not auto-authorised)

Account sync; optional E2EE; AI Q&A with source grounding; additional licensed datasets and traditions; further translations; native packaging; advanced text-range highlights; rich notes/attachments; collaborative Bible study. Each needs its own new specification/ADR before implementation.

---

## 11. Detailed backlog and dependencies

Update status in place in the fork. Ticket IDs must be retained so progress is traceable across agents.

| Ticket | Priority | Phase | Dependency | Definition of done (summary) |
|---|---|---:|---|---|
| F-001 Fork & pin upstream | P0 | 0 | — | User-owned fork, upstream remote and immutable commit SHA recorded. |
| F-002 Baseline build & tests | P0 | 0 | F-001 | `npm ci`, data, build/check/e2e results recorded. |
| F-003 Architecture/UX audit | P0 | 0 | F-002 | Real code path and mobile gestures mapped; screenshots. |
| F-004 Data and licence ledger | P0 | 0 | F-001 | Source/licence/redistribution matrix, unresolved risks flagged. |
| X-001 Canonical verse adapter | P0 | 1 | F-003 | Shared ID across views/translations; exhaustive reference tests. |
| X-002 Verse action UI | P0 | 1 | X-001 | Study/Note/Highlight reachable; gestures/deep links preserved. |
| X-003 Local data storage & migrations | P0 | 1 | F-003 | IndexedDB repository, versioned schema and failure states. |
| A-001 Highlight model & controls | P0 | 2 | X-001, X-003 | Four colours/remove; persistence and accessible states. |
| A-002 Highlight verse rendering | P0 | 2 | A-001, X-002 | Survives translation changes and reload; no gesture regression. |
| A-003 Note CRUD & autosave | P0 | 2 | X-003, X-002 | Multiple notes, timestamps, error states, safe delete. |
| A-004 Verse annotation markers | P0 | 2 | A-002, A-003 | Marker matches saved state and opens proper verse/note. |
| N-001 My Notebook view | P1 | 3 | A-003, A-002 | Browse/find/filter/sort and jump back to Scripture. |
| N-002 JSON backup/export/import | P1 | 3 | X-003, N-001 | Schema validation, merge preview, idempotency, roundtrip. |
| C-001 Source archive audit | P0 | 4 | F-004 | Actual source contents, licence and coverage verified. |
| C-002 Commentary schema/import | P0 | 4 | C-001, X-001 | Deterministic parser, references, report, validation. |
| C-003 Study content resolver | P0 | 4 | C-002 | Direct/context/empty matching ordered and labelled. |
| C-004 Study panel and sources | P0 | 4 | C-003, X-002 | Accurate explanation/excerpts, provenance and links. |
| C-005 Source/attribution UI | P0 | 4 | C-002 | License and attribution accessible for every item. |
| T-001 Editorial content policy | P0 | 5 | F-004 | Source policy, distinction labels, review checklist. |
| T-002 Interpretations schema/pilot | P1 | 5 | T-001, C-004 | 10–15 reviewed pilot passages; differing claims evidenced. |
| T-003 Original-language links | P1 | 5 | C-004 | Integrates with upstream word panels, no redundant importer. |
| Q-001 Browser/mobile/offline E2E | P0 | 6 | A-004, C-004 | J1–J8 tests with data persistence/service-worker cases. |
| Q-002 Accessibility/visual review | P0 | 6 | Q-001 | WCAG AA audit and visual changes approved. |
| Q-003 Localisation/UX polish | P1 | 6 | C-004 | All added UI strings compliant with upstream locale gate. |
| R-001 Release legal/privacy gate | P0 | 7 | F-004, C-005, T-001 | Written source inventory, notices, no unlawful copied text. |
| R-002 Deploy/backup/rollback drill | P0 | 7 | Q-001, Q-002, R-001 | Production release smoke test, backup restore, rollback. |
| R-003 Product-owner UAT | P0 | 7 | R-002 | User approves example Genesis 1:1 and personal note workflows. |

**Definition of Done applies to all tickets:** acceptance assertions demonstrated, unit/integration/e2e tests as relevant, upstream regression checks pass, source/credit updated if data affected, screenshots for visible change, no data-loss regression, and short ticket-level implementation notes. The P1 notebook+backup features should be promoted to release blockers if the owner considers personal data portability essential for public release.

---

## 12. Test matrix — failure cases that must not be overlooked

| ID | Scenario | Expected behaviour |
|---|---|---|
| QA-01 | Highlight Gen 1:1, change BSB → KJV → BSB | Same canonical verse remains highlighted. |
| QA-02 | Create two notes on John 3:16, reload offline | Both notes and timestamps remain; no duplicate creation. |
| QA-03 | Write note, rapidly navigate/close/reopen | Pending edits flushed or explicit unsaved failure shown. |
| QA-04 | Private/incognito/restricted browser storage | App explains temporary storage; never pretends permanence. |
| QA-05 | Delete note then undo/cancel | User action precisely determines deletion. |
| QA-06 | Import identical export twice | No duplicate records; deterministic conflict logic. |
| QA-07 | Import tampered backup with invalid verse/HTML/scripts | Rejected or safely treated as text, with no code execution. |
| QA-08 | Selected verse lacks direct commentary | Proper broader-context label or honest absent state. |
| QA-09 | Commentary source spans book/chapter/verse boundaries | Correct matches and provenance; no cross-verse misattachment. |
| QA-10 | Study source unlicensed or missing attribution | Excluded from publishable bundle; flagged in report. |
| QA-11 | Source file changes upstream unnoticed | Hash/pin validation fails build until consciously updated. |
| QA-12 | Airplane mode with downloaded study and local notes | Both remain available, with no failed-save toast. |
| QA-13 | Service worker updates app | Notes remain intact; old assets replaced safely. |
| QA-14 | Browser Back, share link, URL with `?ref=...` | Previous URL and selected verse preserved; no breaking legacy links. |
| QA-15 | Android touchscreen select verse + edit with keyboard open | No accidental sheet dismiss/scroll loss; controls reachable. |
| QA-16 | Screen reader, keyboard and non-colour vision | Verse marker, highlight state, source tabs and save status clear. |
| QA-17 | User shares verse | Never exposes their private note/highlight text in shared card/link. |
| QA-18 | Hebrew/Greek content inside commentary | Correct direction, text isolation, readable line wrapping. |
| QA-19 | Export/apply at a different deployment `BASE_PATH` | Links and assets resolve without upstream host dependency. |
| QA-20 | Arcs dense rendering and pinch/hold after new toolbar | Original interactions and performance remain acceptable. |

---

## 13. Data/source governance and release review

### 13.1 Source registry (maintained in `docs/DATA_SOURCES.md`)

For each source record: provider, canonical URL, content category, authors/editors, edition, permission/licence URL, copyright jurisdiction/notes, archive SHA-256, download date, original ref system, transformed output, attribution required, ShareAlike conditions, source availability, review status and responsible reviewer.

### 13.2 Release content checklist

- Every text shown under a scholar's name maps to a verifiable source section/page/reference.
- Verbatim vs paraphrase vs editorial summary clearly separated.
- Material with unresolved permission excluded or displayed only as a link.
- Direct verse matches distinguish passage-wide sources.
- No unreviewed machine-generated theological statements published as a named scholar's views.
- Sources and licences accessible offline where included in downloadable content.
- Translation/versification exception tests green; source data and generated package hash report published.
- No note/backup included in deployment or test fixture drawn from real private content.

### 13.3 Editorial/reviewer process

Use a two-step workflow for authored comparison pages: **draft → source check → published**. The reviewer validates whether the cited source genuinely makes the attributed claim, whether alternative views are represented fairly, and whether the summary overstates certainty. When a viewpoint is not yet verified, retain the raw source link without an authored interpretation. This review requirement is **not** an automated theological truth judgement.

---

## 14. Live progress ledger (initial state)

| Phase | Status | Exit gate |
|---|---|---|
| 0 Fork & baseline | NOT STARTED | Baseline reproducible and documented |
| 1 Architecture foundation | NOT STARTED | Panels and data types hooked up without regressions |
| 2 Highlights & notes | NOT STARTED | Durable local personal annotations |
| 3 Notebook & backup | NOT STARTED | Searchable notebook and safe data portability |
| 4 Study note ingestion | NOT STARTED | Sourced notes on real verses with provenance |
| 5 Interpretation pilot | NOT STARTED | Reviewed differences and word-study links |
| 6 UX, accessibility & QA | NOT STARTED | Automated and manual acceptance gates |
| 7 Legal review & release | NOT STARTED | Approved launch; safe recovery/rollback |
| 8 Enhancements | DEFERRED | Requires separate approval |

**Agent status update template** (append entries to `docs/PROGRESS.md`, not to a personal note):

```text
Date / commit / branch:
Ticket(s):
Implemented and changed files:
Acceptance criteria checked:
Tests run and results:
Legal/data/UX questions:
Blockers:
Next recommended ticket:
```

---

## 15. Risks, unresolved choices and decision log

| Risk/choice | Current decision | Trigger / mitigation |
|---|---|---|
| Commentary not actually per verse | Study is *accessible* per verse; inherited notes/absence honest | Phase 4 coverage audit and labels. |
| Tyndale licence & ShareAlike interaction | Treat data as separately licensed; don't claim MIT applies | Phase 0/4 legal inventory, release review. |
| Editorial effort for 31,102 verses | Do not auto-write or force 31,102 handcrafted analyses | Pilot 10–15, expand only with verified sources. |
| Data lost to browser cleanup | IndexedDB + backup; local-only warning | Autosave and roundtrip backup QA. |
| Notes across devices | No automatic sync in MVP | Later opt-in cloud design after privacy ADR. |
| Scope creep into AI | No AI dependency in first release | Separate post-MVP authorisation and risk review. |
| Invasive UI changes break Arcs | Extend current selected-verse panels, not rebuild | Browser gesture tests and baseline snapshots. |
| Canonical versification mismatch | Reuse upstream scheme and explicit source maps | Data validation and exceptions ledger. |
| Localisation expense | Keep existing locales stable; no unreviewed untranslated launches | Review upstream i18n gate in Phase 0. |
| UK/other territorial Bible-text rights | Preserve upstream notices and check each new text | No unlicensed translation ingestion. |
| Third-party source availability | Pin/download authorised archives; deterministic build | Fail closed and document replacement. |
| Fork becomes hard to merge | Isolate features; retain upstream remote | Periodic reviewed upstream rebases/merges, never blind merge. |

**Owner decisions currently locked by this brief:** fork existing app; preserve Arcs/Threads, original words and cross-references; add source-backed theological study plus highlights/notes; mobile-first; source transparency; no accounts or AI as blockers.

**Owner choices deliberately open:** product name/branding, final hosting domain, whether notebook/search + export/import are needed at first private preview or before public release, preferred theological editorial reviewers, whether to offer an explicit denominational filter later, and whether to pursue sync after MVP. These choices **do not block Phase 0–2**.

---

## 16. Agent's first concrete instructions (copy into a development task)

> **Mission:** Implement the Bible Study & Notes fork described in `docs/DEVELOPMENT_SPEC.md`. Start with **Phase 0 only**. Do not write features until the fork is reproducibly built and the actual upstream file structure has been inspected. Record the upstream commit, baseline tests, source licence inventory, the location of selected-verse UI in Arcs and Threads, URL state, PWA service worker behaviour, original-word panel and localisation conventions. Create `docs/BASELINE_AUDIT.md`, `docs/DATA_SOURCES.md` and a proposed short Phase 1 file map. Run all baseline gates you can and report anything that fails before modifying source. Do not replace the original design, lower the quality bar or import commentary data yet. After baseline review, proceed ticket by ticket using this spec's acceptance criteria.

### First-session completion checklist

- [ ] Fork created in the user's GitHub account; `upstream` remote recorded.
- [ ] Exact upstream commit SHA and Node/npm versions recorded.
- [ ] `npm ci`, data fetch/build, `npm run check`, `npm run build`, browser tests attempted; outputs logged.
- [ ] Screenshot existing desktop, Pixel-sized phone, Arcs, Threads, detail panel, word explorer, PWA install/offline.
- [ ] Locate real source files for verse selection, details, word display, URL contracts, i18n and service worker.
- [ ] Review all current source notices, licences and raw data manifest; flag anything unclear.
- [ ] Identify how new per-verse toolbar can be shared across both views without breaking gesture handlers.
- [ ] Create branch for Phase 1 only after Phase 0 is documented and accepted.

---

## 17. Sources and verification links

The following links were checked for this v1 specification; **they are research/requirements sources, not a substitute for inspecting the fork or the licence texts when implementation begins**.

1. Upstream README and project architecture: https://github.com/trekhleb/bible-cross-references
2. Upstream scripts, dependencies, Node requirement: https://github.com/trekhleb/bible-cross-references/blob/main/package.json
3. Upstream contribution guidance: https://github.com/trekhleb/bible-cross-references/blob/main/CONTRIBUTING.md
4. Tyndale Open Resources and CC BY-SA 4.0 notice/download: https://tyndaleopenresources.com/
5. STEPBible Data (CC BY 4.0, attribution, data description): https://github.com/STEPBible/STEPBible-Data
6. OpenBible.info cross-reference project: https://www.openbible.info/labs/cross-references/
7. Creative Commons BY-SA 4.0 legal summary: https://creativecommons.org/licenses/by-sa/4.0/
8. Creative Commons BY 4.0 legal summary: https://creativecommons.org/licenses/by/4.0/
9. Live upstream application: https://trekhleb.dev/bible-cross-references/

**Research limitations:** I verified the published README/package information and the publisher's licensing/download page, but **did not clone or run the repository** in this document-writing session. I also **did not inspect the contents of Tyndale's downloadable ZIP** (the download is available, but an archive audit must be done by the agent). Exact integration file paths, true commentary coverage and the final legal packaging model must therefore be confirmed in Phase 0/4 before implementation and release. This is a plan, not a claim that the app has already been forked or built.

---

## 18. Final release acceptance statement

**Launch is ready only when** the application still behaves like the original Bible Cross-References explorer; a reader can highlight and annotate verses reliably, retain those annotations offline and port them through backup; every verse provides access to an accurately labelled source-based study experience or an honest gap state; selected passages have reviewed, attributable differing interpretations; all source licences and privacy requirements have been verified; and all required checks and owner acceptance tests pass. **The two core features must be genuinely useful before adding anything else.**
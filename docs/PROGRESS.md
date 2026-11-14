# Development progress

**As of:** 2026-11-14, after CI run `43597034824` and scope review.
**Source of truth:** [DEVELOPMENT_SPEC.md](DEVELOPMENT_SPEC.md); [BASELINE_AUDIT.md](BASELINE_AUDIT.md) retains the initial baseline.
**Owner:** `alexjchorley-ship-it/bible-cross-references` (personal fork).

## Status at the last complete CI run (SHA `82aa5dac88c8564cdd4cf999e9fee2c343b423d5`)

- ✅ Site build with datasets and Tyndale commentary: **passed**.
- ✅ TypeScript, type coverage (99.9866%), ESLint and Prettier: **passed**.
- ✅ Offline cache test suite: **passed**.
- ✅ E2E browser shards 1/5, 2/5, 3/5: **passed**.
- ❌ Unit suite: **1,380 passed, 2 failed**, 31 skipped. Remaining failures: stale Tyndale locale exemption and external-link count changed by AMP prototype.
- ❌ E2E shards 4/5 and 5/5: one brittle browser test on desktop and mobile expected no role=group on a Portuguese verse, but the newly added annotations UI legitimately has a group.
- ✅ Those three test causes are identified and corrected in the next feature-branch commit. **Not yet verified by a succeeding CI run.**
- 🚫 Deployment skipped because PR remains a draft; **the user has no released/published app yet**.

## Delivered in draft PR #2 — not released

- A book-then-chapter navigator, replacing typed search, with localized names.
- Four-colour verse highlights, personal notes, versioned IndexedDB storage, searchable notebook, safe JSON backup/restore.
- Visible markers in Threads; shared details actions in Arcs and Threads.
- A source-attributed theological study panel with a Genesis 1:1 multiple-reading editorial pilot and licensed Tyndale commentary loaded by book.
- Tested source importer and immutable source hashes for the open commentary dataset.
- Original BSB Bible text retained as default.

## Scope decision

**Only BSB is needed for personal reading.** All extra translation work, AMP permissions, AMP API, NET and NIV imports are **deferred**. The prototype AMP external link was removed from this feature branch. The upstream app's pre-existing links to Bible.com translations are unchanged. No full-text copyrighted translations were imported.

## Next gates

1. Run the feature PR's CI for this cleanup commit, record exact outcomes. If unit coverage thresholds or phone/browser tests fail, fix and rerun.
2. Test annotation persistence across reload, save failure, multiple notes, backup re-import and no-data-loss behaviour; verify touch navigation, bottom sheet gestures, cross-reference navigation and accessible labels.
3. Verify Tyndale range mapping, textual integrity, source attribution and offline/cache rules; make sure one failing network fetch does not hide existing notes.
4. Keep deployment private/personal: no GitHub Pages publish until user explicitly wants a hosted instance. Prefer local server/PWA and document exact setup steps for a Node 24 machine.
5. When tests pass: merge setup PR #1, then feature PR #2, without accidentally enabling inherited public deployment. Validate merged branch once more before calling the app ready.

**Rule:** Keep all test/coverage gates. No external credentials or personal notes should ever enter GitHub.

# Development progress

**As of:** 2026-11-14  
**Requirements:** [DEVELOPMENT_SPEC.md](DEVELOPMENT_SPEC.md). Keep statuses evidence-based.

## Phase 0 — Initial GitHub handoff

- **Owner fork:** `alexjchorley-ship-it/bible-cross-references`; personal connection has write permission.
- **Fork baseline:** exact upstream commit `23bf0908858c949e519abe7a4ce7f4492f5fb3ba` (verified before documentation commit).
- **Working branch:** `docs/project-handoff-and-baseline`.
- **Changes:** repository-level `AGENTS.md`; canonical `docs/DEVELOPMENT_SPEC.md`; `docs/BASELINE_AUDIT.md`, `docs/DATA_SOURCES.md`, this log.
- **Feature code changed:** none. **Tests executed locally:** none (Node 22; no GitHub DNS in this execution environment). CI checks from PR will need inspection; don't mark green until observed.
- **F-001:** Partial — fork and SHA verified, local upstream remote pending.
- **F-002:** Blocked — Node 24/networked runner baseline checks pending.
- **F-003:** In progress — detailed source integration map complete; live UX audit pending.
- **F-004:** In progress — upstream licence inventory complete, provider licence verification pending.

## Next unblocked steps

1. Open documentation-only PR and inspect whether fork GitHub Actions runs automatically.
2. If Actions is disabled, enable it in GitHub's repository Actions settings and rerun checks. Do not merge and trigger the upstream deploy workflow before fixing fork-specific deployment targets.
3. Capture passing/failing build, type, unit, dataset, desktop/mobile/offline E2E results.
4. Finish mobile gesture screenshots and external commentary source rights/coverage audit.
5. Only then open `feat/annotations-foundation` per the spec; focus on OSIS identity and IndexedDB before verse controls.

**Reporting rule:** Update this log after each verified ticket, with commit/PR links and test outcomes. Keep feature scope to (1) theological study, (2) annotations and notes.

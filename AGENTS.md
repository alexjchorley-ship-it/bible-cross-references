# Agent instructions — Bible Study & Notes Fork

Read `docs/DEVELOPMENT_SPEC.md` in full before starting. It is the canonical product/engineering specification. Follow its priority, phase gates, editorial/source rules, requirements and acceptance criteria; don't treat this file as an alternative specification.

**Start with Phase 0 only:** fork or inspect the owner's fork of `trekhleb/bible-cross-references`, record the upstream SHA, run baseline checks, audit existing architecture/dependencies/licences, then write `docs/BASELINE_AUDIT.md` and `docs/DATA_SOURCES.md`. Don't implement features until this baseline is reported.

**Critical protections:** Preserve Arcs, Threads, word study, all translations, mobile interactions, offline support, citations and deep links. Store reader notes/highlights locally and privately. Do not invent commentary or scholarly consensus. Preserve all dataset licences and attribution. Do not lower upstream test thresholds.

After each ticket, report changed files, evidence for acceptance criteria, tests run, remaining problems and the next ticket. Log work in `docs/PROGRESS.md`. Ask the owner for approval before paid/cloud/AI services, new remote data collection or major scope changes.

# Data source / licensing inventory

**Updated:** 2026-11-14 · **Status:** Preliminary, source claims recorded, not independently legally approved.  
**Canonical product policy:** [DEVELOPMENT_SPEC.md](DEVELOPMENT_SPEC.md), §4.

The existing application code is described as MIT in `package.json`. **Do not assume the data inherit MIT.** The entries below reproduce the fork's checked-in `data/sources.json`, including per-source claimed licences. Check original provider files, copyright notices, redistribution conditions and attribution before adding/remixing content.

| Data ID | Source contents | Licence as declared upstream | Publisher homepage |
|---|---|---|---|
| `bsb` | Berean Standard Bible, plain text (one verse per line) | Public domain | [Source](https://berean.bible/) |
| `kjv` | King James Version, eBible.org edition, verse-per-line text in a ZIP archive | Public domain (United Kingdom: Crown copyright) | [Source](https://ebible.org/Scriptures/details.php?id=eng-kjv2006) |
| `blivre` | Bíblia Livre (Textus Receptus edition), verse-per-line text in a ZIP archive | CC BY 3.0 BR | [Source](https://sites.google.com/site/biblialivre/) |
| `luther1912` | Lutherbibel 1912, eBible.org edition, verse-per-line text in a ZIP archive | Public domain | [Source](https://ebible.org/Scriptures/details.php?id=deu1912) |
| `riveduta1927` | Riveduta 1927, eBible.org edition, verse-per-line text in a ZIP archive | Public domain | [Source](https://ebible.org/Scriptures/details.php?id=ita1927) |
| `vbl` | Versión Biblia Libre, eBible.org edition, verse-per-line text in a ZIP archive | CC BY-SA 4.0 | [Source](https://ebible.org/Scriptures/details.php?id=spavbl) |
| `openbible` | OpenBible.info cross-references (TSV in a ZIP archive) | CC BY 4.0 | [Source](https://www.openbible.info/labs/cross-references/) |
| `stepbible-tagnt-mat-jhn` | Translators Amalgamated Greek NT (Matthew-John), word-per-line with Strongs | CC BY 4.0 | [Source](https://github.com/STEPBible/STEPBible-Data) |
| `stepbible-tagnt-act-rev` | Translators Amalgamated Greek NT (Acts-Revelation), word-per-line with Strongs | CC BY 4.0 | [Source](https://github.com/STEPBible/STEPBible-Data) |
| `stepbible-tahot-gen-deu` | Translators Amalgamated Hebrew OT (Genesis-Deuteronomy), word-per-line with Strongs | CC BY 4.0 | [Source](https://github.com/STEPBible/STEPBible-Data) |
| `stepbible-tahot-jos-est` | Translators Amalgamated Hebrew OT (Joshua-Esther), word-per-line with Strongs | CC BY 4.0 | [Source](https://github.com/STEPBible/STEPBible-Data) |
| `stepbible-tahot-job-sng` | Translators Amalgamated Hebrew OT (Job-Song of Songs), word-per-line with Strongs | CC BY 4.0 | [Source](https://github.com/STEPBible/STEPBible-Data) |
| `stepbible-tahot-isa-mal` | Translators Amalgamated Hebrew OT (Isaiah-Malachi), word-per-line with Strongs | CC BY 4.0 | [Source](https://github.com/STEPBible/STEPBible-Data) |
| `stepbible-tbesg` | Translators Brief lexicon of Extended Strongs for Greek (dictionary forms and glosses) | CC BY 4.0 | [Source](https://github.com/STEPBible/STEPBible-Data) |
| `stepbible-tbesh` | Translators Brief lexicon of Extended Strongs for Hebrew (dictionary forms and glosses) | CC BY 4.0 | [Source](https://github.com/STEPBible/STEPBible-Data) |

## New study/commentary datasets: not imported yet

- **Tyndale Open Study Notes:** proposed primary modern commentary. Before adding: fetch exact archive and bundled licensing terms, record version/date/SHA-256, inspect file structure and coverage, confirm CC BY-SA terms, design original-source/derived-content separation and attributions.
- **Other historical commentaries:** verify each specific source edition and jurisdiction individually; public-domain author does not automatically mean every edited/translated digitisation is free.
- **Modern published scholarship:** cite and link to underlying publications without mirroring copyrighted chapters; rights approval required for reused quotations/material.
- **Interpretation cards:** editorially reviewed, tied to concrete sources and exact Scripture ranges. The app must not fabricate scholarly consensus or manufacture positions to fill every verse.

## Import restrictions

Keep third-party datasets separate from private reader annotations. Build with pinned checksums and provenance; preserve verse-range granularity and map canonical OSIS IDs deterministically. Do not publish copyrighted ESV/NASB/NLT full text, do not scrape content without an explicit licence, and do not represent an AI-generated explanation as a named scholar's quotation. Resolve all rights questions before publishing a commentary bundle.

## Next review action

Assess the actual Tyndale study notes archive and license text; produce source QA fixtures for Genesis 1:1, Psalm 22, Isaiah 53, John 1:1 and a passage without commentary. Update this ledger with URLs, checksums, licence notices, match rates, and editorial sign-off.

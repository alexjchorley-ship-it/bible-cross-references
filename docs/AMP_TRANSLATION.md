# AMP 2015 translation — rights and implementation gate

**Status:** External passage linking added in feature PR #2. Full in-app/offline AMP text **NOT permitted or implemented yet**; written licence or an expressly licensed API integration is required.

## Reader requirement

The reader prefers the **Amplified Bible, 2015 edition (AMP)** with its bracketed amplifications. The translation picker should eventually offer AMP as a normal in-app text, retaining those additions, rather than displaying only a link. That remains a separately blocked delivery ticket, not a released feature.

## Interim behaviour: available now in feature branch

`src/translations/external-translations.ts` includes a `bible.com` **external-link** option for AMP, aligned to the selected passage. Tested sample: John 3:16 https://www.bible.com/bible/1588/JHN.3.16.AMP ; chapter example: https://www.bible.com/bible/1588/GEN.1.AMP . No AMP Scripture text, PDFs, screenshots, datasets, or secrets are copied into this repository. The user must follow the link to YouVersion to read AMP.

## Copyright and publisher permission

- The publisher and copyright holder is **The Lockman Foundation**. AMP 2015 is © 2015 by The Lockman Foundation.
- Official published permissions: https://www.lockman.org/permission-to-quote-copyright-trademark-information/ . The general quote permission is limited to **1,000 verses** and is subject to additional work-wide and storage constraints: **no whole biblical book**, quoted AMP text must not exceed **50%** of the work, and no more than **1,000 verses may be stored in an electronic retrieval system**. This is **not permission to bundle all 31,102 verses** in a public or private app.
- Express written permission request form: https://www.lockman.org/permission-to-quote-request-form/ . The applicant must describe audience, app format, whether distributed and whether free, desired edition and how much of the translation they intend to include.
- Possible alternative: API.Bible offers AMP in its catalogue: https://docs.api.bible/ . **Its API and per-Bible licence must be checked independently**, particularly caching, offline storage, free/commercial terms and verse limits: https://care.api.bible/article/369-understanding-api-bible-licensing .
- AMP branding is a trademark as well as copyrighted content: use publisher-required wording; avoid suggesting official endorsement. Check specific mark rights before publishing new logos or marketing copy.

## Implementation contract after rights

1. Obtain owner-approved licence covering **AMP 2015**, full text or approved API access, public vs personal use, nonprofit vs monetized app, permitted storage/offline downloads, attribution, number of users, expiry/renewal and any technical obligations.
2. Prefer a **licensed first-party source**. Build a separate provider adapter where API usage is allowed; credentials on backend, **never in Vite client code**. If licensed text cannot be cached, mark AMP as **online-only** and keep other translations offline.
3. Support the full AMP typographic and semantic features: bracketed clarifications, alternate reading markers, parenthetical explanations and any licensed footnotes. Do not strip these out in the existing plain-text pipeline.
4. Build canonical OSIS reference mapping, handling missing verses and numbering differences explicitly. Independently verify Psalm 23, Genesis 1, John 3:16, problematic omitted verses and 3 John / Philippians cases.
5. Display the complete required notice with a clickable publisher link on every appropriate translation surface: **“Scripture quotations taken from the Amplified® Bible (AMP), Copyright © 2015 by The Lockman Foundation. Used by permission. www.Lockman.org”**.
6. Add provider and browser regression tests for URL handling, selected translation, licensing states, online/offline behaviour, note/highlight identity independent of translation.
7. **Release gate:** do not publish or distribute full AMP text until the actual licence is documented and approved. Do not scrape YouVersion/BibleGateway, copy a third-party API key or treat another repository's AMP dump as proof of permission.

## Current owner action (only if pursuing in-app AMP)

The owner must request a full-text app licence from Lockman or accept API.Bible's specific AMP licence for this project. Neither an app operator nor an assistant can infer a grant from public verse-display websites. Once rights are granted, store licence terms outside the public source repository if confidential and record the authorization scope and audit status here.

**Source-of-truth relationship:** `docs/DEVELOPMENT_SPEC.md` remains canonical for reader features. This file is the specific AMP rights/design gate.

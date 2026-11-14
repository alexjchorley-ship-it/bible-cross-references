# Amplified Bible (AMP 2015) integration

## Current behaviour

The Bible Study reader shows an `AMP ↗` link next to the active English verse or chapter. It takes the reader to the same passage in the **Amplified Bible (2015)** on YouVersion/bible.com, using published version ID **1588**. This is an external link, not an embedded AMP text. No AMP verses are scraped, copied or cached by our application.

The default offline text is **Berean Standard Bible (BSB)**, with other bundled open/public-domain translations. The external AMP link is not yet an option in the built-in translation switcher; that would misleadingly imply the text was displayed in the app.

## Why we cannot bundle AMP like BSB

AMP 2015 is copyright © 2015 **The Lockman Foundation**, all rights reserved. Lockman's standard permission to quote up to 1,000 verses (with additional restrictions) is **not a licence to distribute the entire AMP Bible as JSON or a local file**. Even for a personal/non-commercial app, full-text in-app display should use an authorised service or explicit written permission.

- Lockman terms: https://www.lockman.org/permission-to-quote-copyright-trademark-information/
- Permissions request: https://www.lockman.org/permission-to-quote-request-form/

## Best native-in-app route: API.Bible

API.Bible (American Bible Society) explicitly lists **Amplified Bible (AMP)** from the Lockman Foundation as a **Standard License** translation: https://api.bible/bibles

As of **14 November 2026**, API.Bible lists a **$0/month Starter** plan for non-commercial apps, with up to **three eligible copyrighted Bible translations** and **5,000 monthly API calls**. Actual AMP licence availability must be confirmed within the registered app and account. A commercial app requires Pro/commercial licensing (starting at $29/month, potentially plus publisher-specific fees). See https://care.api.bible/article/378-comparing-api-bible-plans .

API.Bible imposes requirements that shape the architecture:

- Publisher credits whenever AMP is shown, plus its full legally required copyright details in the app.
- **FUMS** usage reporting for web apps showing licensed text.
- Refresh cached content within **30 days**; never distribute a permanent/offline AMP corpus.
- Preserve the original text's parentheses, square brackets, verse numbers and footnotes; do not alter translation content.
- **Do not send API.Bible copyrighted text to an LLM**. The app's future AI study tools must use permitted public-domain/appropriately licensed source material or user input instead.
- Avoid copying the entire AMP translation into source control, the CDN or a data export.

Sources: https://care.api.bible/article/396-licensing-policies-quick-reference and https://care.api.bible/article/405-express-licensing-faqs

## Implementation plan (after licence credentials exist)

1. Register this non-commercial Bible Study app with API.Bible; enable **AMP (2015)** on the account and record the actual API `bibleId`, version terms and key. Do not invent an ID.
2. Add a serverless proxy, e.g. a Cloudflare Worker or Vercel Function. The app is otherwise a **static GitHub Pages** site; it cannot securely hold an API key. Proxy requests for a strictly validated book/chapter/verse and put the secret in backend environment settings, never Git or frontend code.
3. Add an `amp-online` translation kind to the reader. Unlike bundled translations, it loads chapter text from the licensed API, shows its legal citation and usage notice, and honours FUMS tracking. Do not cache longer than the contract allows.
4. Maintain the existing passage URL, original-language lookup and cross-reference links. Clearly distinguish AMP's **interpretive expansions** from Hebrew/Greek lexicon meanings and competing theological interpretations.
5. On lost connection or missing licence, show an explicit availability message and the exact-match **AMP ↗** external reader link. Do not mislabel BSB/KJV as AMP.
6. Test license errors, cache expiry, FUMS, API quota, missing credentials, verse alignment, security, mobile display, typography, offline fallback and source attribution without committing AMP passages.

### Not done yet

Native AMP text inside the app is **blocked by obtaining an API.Bible account/key/AMP licence and choosing a secure serverless host**. The existing clickable AMP link is the immediately useful, legally safe version.

_This document is an implementation plan, not legal advice. Check actual current contract terms before launch._

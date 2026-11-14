/** Manually sourced pilot, not a claim that the whole Bible has been reviewed. */

export interface StudySource {
  readonly id: string;
  readonly author: string;
  readonly title: string;
  readonly location: string;
  readonly url: string;
}

export interface StudyPosition {
  readonly title: string;
  readonly summary: string;
  readonly sourceIds: readonly string[];
}

export interface VerseStudy {
  readonly verseId: string;
  readonly overview: string;
  readonly originalLanguage: string;
  readonly originalLanguageNote: string;
  readonly interpretations: readonly StudyPosition[];
  readonly sources: readonly StudySource[];
}

export const PILOT_STUDIES: Readonly<Record<string, VerseStudy>> = {
  'Gen.1.1': {
    verseId: 'Gen.1.1',
    overview:
      'Genesis opens by identifying God as creator of the heavens and earth. Scholars broadly recognise this theological assertion, but dispute how the Hebrew opening is connected grammatically to verses 2 and 3. A translation decision here affects whether verse 1 presents a first act, an introductory summary, or a dependent clause.',
    originalLanguage: 'בְּרֵאשִׁית בָּרָא אֱלֹהִים אֵת הַשָּׁמַיִם וְאֵת הָאָרֶץ',
    originalLanguageNote:
      'The opening expression bərēʾšît (“in [the] beginning”) and the syntax of the surrounding clauses are disputed. The verb bārāʾ means “create” here; its lexical meaning alone does not establish creation from nothing. Compare the grammar and context before treating either English rendering as beyond debate.',
    interpretations: [
      {
        title: 'An independent opening statement',
        summary:
          '“In the beginning God created…” reads verse 1 as a complete clause. Within that reading, commentators differ on whether the verse reports a first creative act before verse 2 or summarises the acts described afterward.',
        sourceIds: ['nivac', 'ubs'],
      },
      {
        title: 'A dependent opening: “When God began to create…”',
        summary:
          'This approach reads verse 1 as introducing circumstances that lead into verse 2 or verse 3, rather than asserting a separate, chronologically prior act. It is represented in several modern Jewish and Christian translations and discussed in grammatical scholarship.',
        sourceIds: ['nivac', 'holmstedt', 'jps'],
      },
      {
        title: 'Theological implication versus lexical proof',
        summary:
          'Christian teaching about creation from nothing draws on wider biblical and theological reasoning. Neither the English words “in the beginning” nor the Hebrew verb “create” by themselves decide that question; the choice between grammatical readings of Genesis 1:1 is separate from a denomination’s complete doctrine of creation.',
        sourceIds: ['ubs', 'nivac'],
      },
    ],
    sources: [
      {
        id: 'nivac',
        author: 'John H. Walton',
        title: 'NIV Application Commentary: Genesis — sample on Genesis 1:1',
        location: 'Discussion of three translation arrangements in Genesis 1:1–3',
        url: 'https://www.biblegateway.com/resources/nivac-sample/Gen.1.1',
      },
      {
        id: 'ubs',
        author: 'United Bible Societies, translation commentary',
        title: 'Translation commentary on Genesis 1:1',
        location: 'Translation Insights & Perspectives, Genesis 1:1',
        url: 'https://tips.translation.bible/story/translation-commentary-on-genesis-11/',
      },
      {
        id: 'holmstedt',
        author: 'Robert D. Holmstedt',
        title: 'The Restrictive Syntax of Genesis i 1',
        location: 'Vetus Testamentum 58 (2008), pp. 56–67',
        url: 'https://theroadtoconcord.com/wp-content/uploads/2024/09/Holmstedt_GenesisRelative_VT2008.pdf',
      },
      {
        id: 'jps',
        author: 'Jewish Publication Society',
        title: 'Genesis 1:1 — Revised JPS translation and notes',
        location: 'Sefaria (2023 edition; external text, not reproduced)',
        url: 'https://www.sefaria.org/Genesis.1.1?with=Translations',
      },
    ],
  },
};

export function studyForVerse(verseId: string): VerseStudy | null {
  return PILOT_STUDIES[verseId] ?? null;
}

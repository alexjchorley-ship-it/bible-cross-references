import { getBook } from '../../core/bible/books.ts';
import { parseOsisId, type VerseRef } from '../../core/bible/verse-ref.ts';

export interface TyndaleReference {
  readonly book: string;
  readonly startChapter: number;
  readonly startVerse: number;
  readonly endChapter: number;
  readonly endVerse: number;
}

export type TyndaleNode =
  | string
  | {
      readonly t: string;
      readonly v?: string;
      readonly r?: string;
      readonly c?: readonly TyndaleNode[];
    };

export interface TyndaleStudyNote {
  readonly id: string;
  readonly type: string;
  readonly refs: readonly TyndaleReference[];
  readonly content: readonly TyndaleNode[];
  readonly title: string;
  readonly sourceOrder: number;
}

export interface StudyNotesForVerse {
  readonly verse: readonly TyndaleStudyNote[];
  readonly context: readonly TyndaleStudyNote[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validRef(value: unknown): value is TyndaleReference {
  return (
    isRecord(value) &&
    typeof value['book'] === 'string' &&
    typeof value['startChapter'] === 'number' &&
    typeof value['startVerse'] === 'number' &&
    typeof value['endChapter'] === 'number' &&
    typeof value['endVerse'] === 'number'
  );
}

function isNode(value: unknown): value is TyndaleNode {
  return (
    typeof value === 'string' ||
    (isRecord(value) &&
      typeof value['t'] === 'string' &&
      (value['v'] === undefined || typeof value['v'] === 'string') &&
      (value['r'] === undefined || typeof value['r'] === 'string') &&
      (value['c'] === undefined || (Array.isArray(value['c']) && value['c'].every(isNode))))
  );
}

function isStudyNote(value: unknown): value is TyndaleStudyNote {
  return (
    isRecord(value) &&
    value['type'] === 'StudyNote' &&
    typeof value['id'] === 'string' &&
    typeof value['title'] === 'string' &&
    typeof value['sourceOrder'] === 'number' &&
    Array.isArray(value['refs']) &&
    value['refs'].every(validRef) &&
    Array.isArray(value['content']) &&
    value['content'].every(isNode)
  );
}

/** Tyndale uses English-language book slugs; the app persists OSIS IDs. */
export function tyndaleSlug(verse: VerseRef): string {
  return getBook(verse.book)
    .name.toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

export function coveringReference(ref: TyndaleReference, verse: VerseRef): boolean {
  const slug = tyndaleSlug(verse);
  if (ref.book !== slug) {
    return false;
  }
  const index = verse.chapter * 1000 + verse.verse;
  return (
    index >= ref.startChapter * 1000 + ref.startVerse &&
    index <= ref.endChapter * 1000 + ref.endVerse
  );
}

export function notesForVerse(
  records: readonly TyndaleStudyNote[],
  verse: VerseRef,
): StudyNotesForVerse {
  const matching = records.filter(
    (entry) =>
      entry.type === 'StudyNote' && entry.refs.some((ref) => coveringReference(ref, verse)),
  );
  const verseSpecific = matching.filter((entry) =>
    entry.refs.some(
      (ref) =>
        coveringReference(ref, verse) &&
        ref.startChapter === verse.chapter &&
        ref.endChapter === verse.chapter &&
        ref.startVerse === verse.verse &&
        ref.endVerse === verse.verse,
    ),
  );
  const direct = new Set(verseSpecific.map((entry) => entry.id));
  const context = matching
    .filter((entry) => !direct.has(entry.id))
    .toSorted((a, b) => a.sourceOrder - b.sourceOrder);
  return { verse: verseSpecific.toSorted((a, b) => a.sourceOrder - b.sourceOrder), context };
}

const pending = new Map<string, Promise<readonly TyndaleStudyNote[]>>();

export async function loadTyndaleBook(slug: string): Promise<readonly TyndaleStudyNote[]> {
  const saved = pending.get(slug);
  if (saved) {
    return saved;
  }
  const promise = (async () => {
    if (!/^[a-z0-9]+$/.test(slug)) {
      throw new Error('Invalid Bible book.');
    }
    const response = await fetch(`${import.meta.env.BASE_URL}data/commentary/${slug}.json`);
    if (!response.ok) {
      throw new Error(
        'The study notes are not available offline yet. Connect once and reopen this book.',
      );
    }
    const parsed: unknown = JSON.parse(await response.text());
    if (!Array.isArray(parsed)) {
      throw new Error('The study notes dataset is damaged.');
    }
    // Book intros and topical profiles are intentionally not presented as verse commentaries.
    return parsed.filter(isStudyNote);
  })();
  pending.set(slug, promise);
  try {
    return await promise;
  } catch (error) {
    pending.delete(slug);
    throw error;
  }
}

/** Invalid references have no commentary, rather than linking a different verse by accident. */
export function parseStudyVerse(id: string): VerseRef | null {
  return parseOsisId(id) ?? null;
}

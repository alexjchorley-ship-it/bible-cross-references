import { parseOsisId } from '../../core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';

export const HIGHLIGHT_COLORS = ['amber', 'green', 'blue', 'pink'] as const;
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export interface VerseHighlight {
  readonly verseId: string;
  readonly color: HighlightColor;
  readonly updatedAt: string;
}

/** One moving reading position per colour, independent of saved highlights. */
export interface ReadingBookmark {
  readonly color: HighlightColor;
  readonly verseId: string;
  readonly updatedAt: string;
}

export function isReadingBookmark(value: unknown): value is ReadingBookmark {
  return (
    object(value) &&
    isHighlightColor(value['color']) &&
    isCanonicalVerseId(value['verseId']) &&
    isDate(value['updatedAt'])
  );
}

export interface PersonalNote {
  readonly id: string;
  readonly verseId: string;
  readonly body: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface AnnotationsBackup {
  readonly format: 'bible-study-annotations';
  readonly schemaVersion: 1 | 2;
  readonly bookmarks?: readonly ReadingBookmark[];
  readonly exportedAt: string;
  readonly appVersion: string;
  readonly highlights: readonly VerseHighlight[];
  readonly annotations: readonly PersonalNote[];
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** IDs use the app's existing canonical 66-book versification, not translated text. */
export function isCanonicalVerseId(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  const ref = parseOsisId(value);
  return ref !== undefined && CANONICAL_VERSIFICATION.indexOf(ref) !== undefined;
}

export function isHighlightColor(value: unknown): value is HighlightColor {
  return HIGHLIGHT_COLORS.some((color) => color === value);
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function isVerseHighlight(value: unknown): value is VerseHighlight {
  return (
    object(value) &&
    isCanonicalVerseId(value['verseId']) &&
    isHighlightColor(value['color']) &&
    isDate(value['updatedAt'])
  );
}

export function isPersonalNote(value: unknown): value is PersonalNote {
  return (
    object(value) &&
    typeof value['id'] === 'string' &&
    value['id'].length > 0 &&
    isCanonicalVerseId(value['verseId']) &&
    typeof value['body'] === 'string' &&
    value['body'].length > 0 &&
    isDate(value['createdAt']) &&
    isDate(value['updatedAt'])
  );
}

/** Strictly validate a reader-supplied file before touching their IndexedDB. */
export function parseAnnotationsBackup(json: string): AnnotationsBackup {
  const value: unknown = JSON.parse(json);
  if (
    !object(value) ||
    value['format'] !== 'bible-study-annotations' ||
    (value['schemaVersion'] !== 1 && value['schemaVersion'] !== 2) ||
    typeof value['appVersion'] !== 'string' ||
    !isDate(value['exportedAt']) ||
    !Array.isArray(value['annotations']) ||
    !value['annotations'].every(isPersonalNote) ||
    !Array.isArray(value['highlights']) ||
    !value['highlights'].every(isVerseHighlight) ||
    (value['schemaVersion'] === 2 &&
      (!Array.isArray(value['bookmarks']) || !value['bookmarks'].every(isReadingBookmark)))
  ) {
    throw new Error('This file is not a supported Bible Study annotations backup.');
  }
  const ids = new Set(value['annotations'].map((note: PersonalNote) => note.id));
  const verses = new Set(value['highlights'].map((highlight: VerseHighlight) => highlight.verseId));
  if (ids.size !== value['annotations'].length || verses.size !== value['highlights'].length) {
    throw new Error('The backup contains duplicate note IDs or highlighted verses.');
  }
  const bookmarks = value['schemaVersion'] === 2 ? (value['bookmarks'] as ReadingBookmark[]) : [];
  if (new Set(bookmarks.map((bookmark) => bookmark.color)).size !== bookmarks.length) {
    throw new Error('The backup contains duplicate bookmark colours.');
  }
  return {
    format: 'bible-study-annotations',
    schemaVersion: value['schemaVersion'],
    exportedAt: value['exportedAt'],
    appVersion: value['appVersion'],
    annotations: value['annotations'],
    highlights: value['highlights'],
    bookmarks,
  };
}

/** Merge without replacing newer local edits; repeated imports are idempotent. */
export function mergeAnnotations(
  existing: readonly PersonalNote[],
  incoming: readonly PersonalNote[],
): PersonalNote[] {
  const notes = new Map(existing.map((note) => [note.id, note]));
  for (const note of incoming) {
    const current = notes.get(note.id);
    if (!current || note.updatedAt > current.updatedAt) {
      notes.set(note.id, note);
    }
  }
  return [...notes.values()];
}

export function mergeHighlights(
  existing: readonly VerseHighlight[],
  incoming: readonly VerseHighlight[],
): VerseHighlight[] {
  const highlights = new Map(existing.map((entry) => [entry.verseId, entry]));
  for (const entry of incoming) {
    const current = highlights.get(entry.verseId);
    if (!current || entry.updatedAt > current.updatedAt) {
      highlights.set(entry.verseId, entry);
    }
  }
  return [...highlights.values()];
}

export function serializeAnnotationsBackup(
  annotations: readonly PersonalNote[],
  highlights: readonly VerseHighlight[],
  bookmarks: readonly ReadingBookmark[] = [],
): string {
  return JSON.stringify(
    {
      format: 'bible-study-annotations',
      schemaVersion: 2,
      bookmarks,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0',
      annotations,
      highlights,
    } satisfies AnnotationsBackup,
    null,
    2,
  );
}

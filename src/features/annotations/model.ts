import { parseOsisId } from '../../core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';

/** The first four colours stay visible for one-tap use; the rest live in the expanded legend. */
export const HIGHLIGHT_COLORS = [
  'amber',
  'green',
  'blue',
  'pink',
  'purple',
  'teal',
  'red',
  'yellow',
] as const;
export const QUICK_HIGHLIGHT_COLORS: readonly HighlightColor[] = HIGHLIGHT_COLORS.slice(0, 4);
export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

export type ColorPurpose = 'highlight' | 'bookmark';
export interface ColorLabel {
  readonly id: string;
  readonly name: string;
  readonly updatedAt: string;
}

export const DEFAULT_COLOR_LABELS: Readonly<
  Record<ColorPurpose, Readonly<Record<HighlightColor, string>>>
> = {
  highlight: {
    amber: 'Miracles',
    green: 'Prayer',
    blue: 'Promises',
    pink: 'Love',
    purple: 'Prophecy',
    teal: 'Wisdom',
    red: 'Warnings',
    yellow: 'Key verses',
  },
  bookmark: {
    amber: 'Bible study',
    green: 'Personal reading',
    blue: 'Topical study',
    pink: 'Reflection',
    purple: 'Study group',
    teal: 'Devotional',
    red: 'Questions',
    yellow: 'Reading plan',
  },
};

export function colorLabel(
  labels: readonly ColorLabel[],
  purpose: ColorPurpose,
  color: HighlightColor,
): string {
  return (
    labels.find((label) => label.id === `${purpose}:${color}`)?.name ??
    DEFAULT_COLOR_LABELS[purpose][color]
  );
}

export function isColorLabel(value: unknown): value is ColorLabel {
  return (
    object(value) &&
    typeof value['id'] === 'string' &&
    /^(highlight|bookmark):(amber|green|blue|pink|purple|teal|red|yellow)$/.test(value['id']) &&
    typeof value['name'] === 'string' &&
    value['name'].trim().length > 0 &&
    value['name'].length <= 60 &&
    isDate(value['updatedAt'])
  );
}

export const SUGGESTED_NOTE_CATEGORIES = [
  'Bible study',
  'Sermon',
  'Prayer',
  'Questions',
  'Personal reflection',
] as const;

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
  readonly category?: string;
  readonly title?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A reader-owned bidirectional relationship, independent of the curated dataset. */
export interface PersonalCrossReference {
  readonly id: string;
  readonly fromVerseId: string;
  readonly toVerseId: string;
  readonly note: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function isPersonalCrossReference(value: unknown): value is PersonalCrossReference {
  return object(value) &&
    typeof value['id'] === 'string' && value['id'].length > 0 && value['id'].length <= 100 &&
    isCanonicalVerseId(value['fromVerseId']) && isCanonicalVerseId(value['toVerseId']) &&
    value['fromVerseId'] !== value['toVerseId'] &&
    typeof value['note'] === 'string' && value['note'].length <= 5000 &&
    isDate(value['createdAt']) && isDate(value['updatedAt']);
}

export interface AnnotationsBackup {
  readonly format: 'bible-study-annotations';
  readonly schemaVersion: 1 | 2 | 3 | 4;
  readonly crossReferences?: readonly PersonalCrossReference[];
  readonly labels?: readonly ColorLabel[];
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
    (value['category'] === undefined ||
      (typeof value['category'] === 'string' && value['category'].length <= 80)) &&
    (value['title'] === undefined ||
      (typeof value['title'] === 'string' && value['title'].length <= 120)) &&
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
    (value['schemaVersion'] !== 1 &&
      value['schemaVersion'] !== 2 &&
      value['schemaVersion'] !== 3 && value['schemaVersion'] !== 4) ||
    typeof value['appVersion'] !== 'string' ||
    !isDate(value['exportedAt']) ||
    !Array.isArray(value['annotations']) ||
    !value['annotations'].every(isPersonalNote) ||
    !Array.isArray(value['highlights']) ||
    !value['highlights'].every(isVerseHighlight) ||
    (value['schemaVersion'] !== 1 &&
      (!Array.isArray(value['bookmarks']) || !value['bookmarks'].every(isReadingBookmark))) ||
    ((value['schemaVersion'] === 3 || value['schemaVersion'] === 4) &&
      (!Array.isArray(value['labels']) || !value['labels'].every(isColorLabel))) ||
    (value['schemaVersion'] === 4 &&
      (!Array.isArray(value['crossReferences']) || !value['crossReferences'].every(isPersonalCrossReference)))
  ) {
    throw new Error('This file is not a supported Bible Study annotations backup.');
  }
  const ids = new Set(value['annotations'].map((note: PersonalNote) => note.id));
  const verses = new Set(value['highlights'].map((highlight: VerseHighlight) => highlight.verseId));
  if (ids.size !== value['annotations'].length || verses.size !== value['highlights'].length) {
    throw new Error('The backup contains duplicate note IDs or highlighted verses.');
  }
  const bookmarks = value['schemaVersion'] !== 1 ? (value['bookmarks'] as ReadingBookmark[]) : [];
  const labels = (value['schemaVersion'] === 3 || value['schemaVersion'] === 4) ? (value['labels'] as ColorLabel[]) : [];
  if (new Set(bookmarks.map((bookmark) => bookmark.color)).size !== bookmarks.length) {
    throw new Error('The backup contains duplicate bookmark colours.');
  }
  if (new Set(labels.map((label) => label.id)).size !== labels.length) {
    throw new Error('The backup contains duplicate colour labels.');
  }
  const crossReferences = value['schemaVersion'] === 4 ? value['crossReferences'] as PersonalCrossReference[] : [];
  if (new Set(crossReferences.map((entry) => entry.id)).size !== crossReferences.length) {
    throw new Error('The backup contains duplicate cross-reference IDs.');
  }
  return {
    format: 'bible-study-annotations',
    crossReferences,
    schemaVersion: value['schemaVersion'],
    labels,
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
  labels: readonly ColorLabel[] = [],
  crossReferences: readonly PersonalCrossReference[] = [],
): string {
  return JSON.stringify(
    {
      format: 'bible-study-annotations',
      schemaVersion: 4,
      crossReferences,
      bookmarks,
      labels,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0',
      annotations,
      highlights,
    } satisfies AnnotationsBackup,
    null,
    2,
  );
}

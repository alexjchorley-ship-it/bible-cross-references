import { describe, expect, it } from 'vitest';
import {
  isCanonicalVerseId,
  isHighlightColor,
  isPersonalNote,
  isVerseHighlight,
  isReadingBookmark,
  mergeAnnotations,
  mergeHighlights,
  parseAnnotationsBackup,
  serializeAnnotationsBackup,
  type PersonalNote,
  type VerseHighlight,
} from './model.ts';

const EARLY = '2026-01-01T12:00:00.000Z';
const LATE = '2026-11-14T12:00:00.000Z';

const note: PersonalNote = {
  id: 'note-1',
  verseId: 'Gen.1.1',
  body: 'A note with\nHebrew: רֵאשִׁית',
  createdAt: EARLY,
  updatedAt: LATE,
};
const highlight: VerseHighlight = {
  verseId: 'Gen.1.1',
  color: 'amber',
  updatedAt: LATE,
};

describe('canonical annotations and backups', () => {
  it('accepts only real Bible verses and named highlight colours', () => {
    expect(isCanonicalVerseId('Gen.1.1')).toBe(true);
    expect(isCanonicalVerseId('Rev.22.21')).toBe(true);
    expect(isCanonicalVerseId('Gen.1.999')).toBe(false);
    expect(isCanonicalVerseId('Invalid.1.1')).toBe(false);
    expect(isCanonicalVerseId(42)).toBe(false);
    expect(isHighlightColor('blue')).toBe(true);
    expect(isHighlightColor('red')).toBe(false);
  });

  it('rejects missing, malformed or empty records before any write', () => {
    expect(isPersonalNote(note)).toBe(true);
    expect(isVerseHighlight(highlight)).toBe(true);
    expect(isPersonalNote(null)).toBe(false);
    expect(isPersonalNote([])).toBe(false);
    expect(isPersonalNote({ ...note, body: '' })).toBe(false);
    expect(isPersonalNote({ ...note, id: '' })).toBe(false);
    expect(isPersonalNote({ ...note, verseId: 'Gen.0.1' })).toBe(false);
    expect(isPersonalNote({ ...note, updatedAt: 'not-a-date' })).toBe(false);
    expect(isVerseHighlight({ ...highlight, color: 'orange' })).toBe(false);
    expect(isVerseHighlight({ ...highlight, updatedAt: false })).toBe(false);
  });

  it('exports Unicode, line breaks and canonical IDs without alteration', () => {
    const content = serializeAnnotationsBackup([note], [highlight]);
    const restored = parseAnnotationsBackup(content);
    expect(restored.format).toBe('bible-study-annotations');
    expect(restored.schemaVersion).toBe(3);
    expect(restored.annotations).toEqual([note]);
    expect(restored.highlights).toEqual([highlight]);
  });

  it('rejects corrupt, incompatible and duplicate backup data', () => {
    expect(() => parseAnnotationsBackup('{')).toThrow();
    expect(() => parseAnnotationsBackup('null')).toThrow();
    expect(() => parseAnnotationsBackup('{}')).toThrow();
    const valid = JSON.parse(serializeAnnotationsBackup([note], [highlight])) as Record<
      string,
      unknown
    >;
    expect(() => parseAnnotationsBackup(JSON.stringify({ ...valid, schemaVersion: 4 }))).toThrow();
    expect(() =>
      parseAnnotationsBackup(JSON.stringify({ ...valid, exportedAt: 'tomorrow' })),
    ).toThrow();
    expect(() => parseAnnotationsBackup(JSON.stringify({ ...valid, format: 'unknown' }))).toThrow();
    expect(() =>
      parseAnnotationsBackup(JSON.stringify({ ...valid, annotations: [note, note] })),
    ).toThrow();
    expect(() =>
      parseAnnotationsBackup(JSON.stringify({ ...valid, highlights: [highlight, highlight] })),
    ).toThrow();
    expect(() =>
      parseAnnotationsBackup(JSON.stringify({ ...valid, annotations: [{ ...note, body: '' }] })),
    ).toThrow();
  });

  it('retains newer local notes and updates only older records', () => {
    const old = { ...note, updatedAt: EARLY };
    const fresh = { ...note, body: 'New content', updatedAt: LATE };
    const another = { ...note, id: 'note-2', verseId: 'John.3.16' };
    expect(mergeAnnotations([fresh], [old, another])).toEqual([fresh, another]);
    expect(mergeAnnotations([old], [fresh])).toEqual([fresh]);
    expect(mergeAnnotations([fresh], [fresh])).toEqual([fresh]);
  });

  it('merges highlights by verse, independently of translation', () => {
    const old = { ...highlight, color: 'pink' as const, updatedAt: EARLY };
    const next = { ...highlight, color: 'green' as const };
    const other = { ...highlight, verseId: 'John.3.16' };
    expect(mergeHighlights([old], [next, other])).toEqual([next, other]);
    expect(mergeHighlights([highlight], [old])).toEqual([highlight]);
    expect(mergeHighlights([highlight], [highlight])).toEqual([highlight]);
  });
  it('validates bookmark colours and canonical Bible verse references', () => {
    const item = { color: 'green', verseId: 'John.3.16', updatedAt: LATE };
    expect(isReadingBookmark(item)).toBe(true);
    expect(isReadingBookmark({ ...item, color: 'orange' })).toBe(false);
    expect(isReadingBookmark({ ...item, verseId: 'John.3.99' })).toBe(false);
    expect(isReadingBookmark({ ...item, updatedAt: 'yesterday' })).toBe(false);
    expect(isReadingBookmark(null)).toBe(false);
  });

  it('round-trips unique bookmark locations in v2 JSON and accepts v1 backups', () => {
    const green = { color: 'green' as const, verseId: 'Gen.1.1', updatedAt: LATE };
    const amber = { color: 'amber' as const, verseId: 'John.3.16', updatedAt: LATE };
    const content = serializeAnnotationsBackup([note], [highlight], [green, amber]);
    expect(parseAnnotationsBackup(content).bookmarks).toEqual([green, amber]);
    const v1 = JSON.stringify({
      format: 'bible-study-annotations',
      schemaVersion: 1,
      exportedAt: LATE,
      appVersion: '1.0',
      annotations: [note],
      highlights: [highlight],
    });
    expect(parseAnnotationsBackup(v1).bookmarks).toEqual([]);
    const duplicate = JSON.parse(content) as Record<string, unknown>;
    duplicate['bookmarks'] = [green, { ...green, verseId: 'John.3.16' }];
    expect(() => parseAnnotationsBackup(JSON.stringify(duplicate))).toThrow('duplicate bookmark');
    duplicate['bookmarks'] = [{ ...green, verseId: 'Gen.999.1' }];
    expect(() => parseAnnotationsBackup(JSON.stringify(duplicate))).toThrow('backup');
  });
});


describe('note categories and separate colour meanings', () => {
  it('supports named colours and keeps old backups valid', () => {
    const noteWithCategory = { ...note, category: 'Prayer', title: 'A reflection' };
    const labels = [
      { id: 'highlight:amber', name: 'Miracles', updatedAt: LATE },
      { id: 'bookmark:amber', name: 'Sunday study', updatedAt: LATE },
    ];
    const data = serializeAnnotationsBackup([noteWithCategory], [highlight], [], labels);
    const restored = parseAnnotationsBackup(data);
    expect(restored.annotations[0]?.category).toBe('Prayer');
    expect(restored.labels).toEqual(labels);
    const old = JSON.stringify({
      format: 'bible-study-annotations', schemaVersion: 2,
      exportedAt: LATE, appVersion: '1.0', bookmarks: [],
      annotations: [note], highlights: [highlight],
    });
    expect(parseAnnotationsBackup(old).labels).toEqual([]);
  });
});

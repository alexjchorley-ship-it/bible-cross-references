import { describe, expect, it } from 'vitest';
import {
  isCanonicalVerseId,
  isHighlightColor,
  isPersonalNote,
  isVerseHighlight,
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
    expect(restored.schemaVersion).toBe(2);
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
    expect(() => parseAnnotationsBackup(JSON.stringify({ ...valid, schemaVersion: 3 }))).toThrow();
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
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  coveringReference,
  loadTyndaleBook,
  notesForVerse,
  parseStudyVerse,
  tyndaleSlug,
  type TyndaleStudyNote,
} from './tyndale.ts';

const direct: TyndaleStudyNote = {
  id: 'StudyNote:Gen.1.1',
  type: 'StudyNote',
  title: 'Gen.1.1',
  sourceOrder: 2,
  refs: [{ book: 'genesis', startChapter: 1, startVerse: 1, endChapter: 1, endVerse: 1 }],
  content: [{ t: 'p', c: ['God created.'] }],
};
const introduction: TyndaleStudyNote = {
  id: 'StudyNote:Gen.1.1-2.3',
  type: 'StudyNote',
  title: 'Gen.1.1-2.3',
  sourceOrder: 1,
  refs: [{ book: 'genesis', startChapter: 1, startVerse: 1, endChapter: 2, endVerse: 3 }],
  content: [{ t: 'p', c: ['God orders creation.'] }],
};
const noReference: TyndaleStudyNote = { ...introduction, id: 'other', refs: [] };

describe('licensed commentary verse lookup', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses exact book slugs across 66-book canon', () => {
    expect(tyndaleSlug({ book: 'Gen', chapter: 1, verse: 1 })).toBe('genesis');
    expect(tyndaleSlug({ book: 'Song', chapter: 1, verse: 1 })).toBe('songofsolomon');
    expect(tyndaleSlug({ book: '3John', chapter: 1, verse: 2 })).toBe('3john');
    expect(parseStudyVerse('John.3.16')).toEqual({ book: 'John', chapter: 3, verse: 16 });
    expect(parseStudyVerse('invalid')).toBeNull();
  });

  it('never presents another book or another chapter as the requested verse', () => {
    const start = direct.refs[0];
    expect(start).toBeDefined();
    if (!start) {
      throw new Error('Fixture missing.');
    }
    const range = introduction.refs[0];
    if (!range) throw new Error('Missing range fixture.');
    expect(coveringReference(start, { book: 'Gen', chapter: 1, verse: 1 })).toBe(true);
    expect(coveringReference(start, { book: 'Gen', chapter: 1, verse: 2 })).toBe(false);
    expect(coveringReference(start, { book: 'Exod', chapter: 1, verse: 1 })).toBe(false);
    expect(coveringReference(range, { book: 'Gen', chapter: 2, verse: 3 })).toBe(true);
    expect(coveringReference(range, { book: 'Gen', chapter: 2, verse: 4 })).toBe(false);
  });

  it('separates original verse-specific notes from passage-wide context', () => {
    const verse = { book: 'Gen', chapter: 1, verse: 1 } as const;
    const rows = notesForVerse([introduction, direct, noReference, { ...direct, id: 'BookIntro', type: 'BookIntro' }], verse);
    expect(rows.verse).toEqual([direct]);
    expect(rows.context).toEqual([introduction]);
    const second = notesForVerse([introduction, direct], { book: 'Gen', chapter: 1, verse: 2 });
    expect(second.verse).toEqual([]);
    expect(second.context).toEqual([introduction]);
    expect(notesForVerse([direct], { book: 'Exod', chapter: 1, verse: 1 })).toEqual({ verse: [], context: [] });
  });

  it('verifies the returned book structure, retains only actual StudyNote records and caches it', async () => {
    const request = vi.fn(async (_url: string) =>
      new Response(JSON.stringify([direct, introduction, { ...direct, type: 'BookIntro' }, { nonsense: true }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', request);
    const notes = await loadTyndaleBook('genesis');
    expect(notes).toEqual([direct, introduction]);
    expect(await loadTyndaleBook('genesis')).toBe(notes);
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[0]).toContain('data/commentary/genesis.json');
  });

  it('rejects malformed filenames without issuing requests', async () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    await expect(loadTyndaleBook('../other')).rejects.toThrow('Invalid Bible book');
    expect(request).not.toHaveBeenCalled();
  });

  it('reports unavailable commentary honestly, and permits a retry', async () => {
    const request = vi.fn(async () => new Response('Not found', { status: 404 }));
    vi.stubGlobal('fetch', request);
    await expect(loadTyndaleBook('zephaniah')).rejects.toThrow('not available offline');
    request.mockImplementation(async () => new Response(JSON.stringify([direct]), { status: 200 }));
    expect(await loadTyndaleBook('zephaniah')).toEqual([direct]);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('rejects a malformed source archive', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"items":[]}', { status: 200 })));
    await expect(loadTyndaleBook('philemon')).rejects.toThrow('damaged');
  });
});

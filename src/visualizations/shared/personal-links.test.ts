import { describe, expect, it } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';
import {
  personalArcInstances,
  personalConnections,
  combineArcInstances,
} from './personal-links.ts';

const v = CANONICAL_VERSIFICATION;
const from = v.indexOf({ book: 'Gen', chapter: 1, verse: 1 });
const to = v.indexOf({ book: 'John', chapter: 1, verse: 1 });
if (from === undefined || to === undefined) throw new Error('Test verses unavailable');
const links = [
  {
    id: 'mine',
    fromVerseId: 'Gen.1.1',
    toVerseId: 'John.1.1',
    note: 'Creation imagery',
    createdAt: '2026-11-21T10:00:00Z',
    updatedAt: '2026-11-21T10:00:00Z',
  },
];

describe('personal cross-reference rendering', () => {
  it('finds both endpoints without changing the public link index', () => {
    const outgoing = personalConnections(links, v, { start: from, end: from });
    const incoming = personalConnections(links, v, { start: to, end: to });
    expect(outgoing).toHaveLength(1);
    expect(outgoing[0]?.direction).toBe('outgoing');
    expect(outgoing[0]?.otherStart).toBe(to);
    expect(incoming).toHaveLength(1);
    expect(incoming[0]?.direction).toBe('incoming');
    expect(incoming[0]?.otherStart).toBe(from);
    expect(incoming[0]?.link.id).toBeLessThan(0);
  });
  it('projects an arc and concatenates it with official arcs', () => {
    const genres = new Uint8Array(v.verseCount);
    const arcs = personalArcInstances(links, v, genres);
    expect(arcs.count).toBe(1);
    expect(Array.from(arcs.endpoints)).toEqual([from + 0.5, to + 0.5]);
    const combined = combineArcInstances(arcs, arcs);
    expect(combined.count).toBe(2);
    expect(combined.endpoints).toHaveLength(4);
  });
});

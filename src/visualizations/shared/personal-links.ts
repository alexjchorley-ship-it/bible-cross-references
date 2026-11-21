import type { PersonalCrossReference } from '../../features/annotations/model.ts';
import { parseOsisId } from '../../core/bible/verse-ref.ts';
import type { Versification, VerseIndexRange } from '../../core/bible/versification.ts';
import type { Connection } from './connections.ts';
/** Shape shared with Arcs without importing a visualization-specific module. */
interface ArcInstances {
  readonly count: number;
  readonly endpoints: Float32Array;
  readonly genres: Float32Array;
  readonly weights: Float32Array;
}
import { elementAt } from '../../core/lib/array.ts';

/** Synthetic negative IDs never collide with the immutable source dataset. */
export function personalConnections(
  links: readonly PersonalCrossReference[],
  versification: Versification,
  range: VerseIndexRange,
): Connection[] {
  const results: Connection[] = [];
  links.forEach((link, ordinal) => {
    const source = parseOsisId(link.fromVerseId);
    const target = parseOsisId(link.toVerseId);
    const from = source && versification.indexOf(source);
    const to = target && versification.indexOf(target);
    if (from === undefined || to === undefined) return;
    const inRange = (verse: number) => verse >= range.start && verse <= range.end;
    if (inRange(from))
      results.push({
        link: { id: -ordinal - 1, from, targetStart: to, targetEnd: to, votes: 100 },
        direction: 'outgoing',
        here: from,
        otherStart: to,
        otherEnd: to,
      });
    if (inRange(to))
      results.push({
        link: { id: -ordinal - 1, from, targetStart: to, targetEnd: to, votes: 100 },
        direction: 'incoming',
        here: to,
        otherStart: from,
        otherEnd: from,
      });
  });
  return results;
}

/** GPU instances for reader-created arcs; no mutation of the public reference dataset. */
export function personalArcInstances(
  links: readonly PersonalCrossReference[],
  versification: Versification,
  genres: Uint8Array,
): ArcInstances {
  const endpoints: number[] = [];
  const colors: number[] = [];
  const weights: number[] = [];
  for (const link of links) {
    const source = parseOsisId(link.fromVerseId);
    const target = parseOsisId(link.toVerseId);
    const from = source && versification.indexOf(source);
    const to = target && versification.indexOf(target);
    if (from === undefined || to === undefined) continue;
    endpoints.push(from + 0.5, to + 0.5);
    colors.push(elementAt(genres, from), elementAt(genres, to));
    weights.push(1);
  }
  return {
    count: weights.length,
    endpoints: Float32Array.from(endpoints),
    genres: Float32Array.from(colors),
    weights: Float32Array.from(weights),
  };
}

export function combineArcInstances(a: ArcInstances, b: ArcInstances): ArcInstances {
  const endpoints = new Float32Array(a.endpoints.length + b.endpoints.length);
  const genres = new Float32Array(a.genres.length + b.genres.length);
  const weights = new Float32Array(a.weights.length + b.weights.length);
  endpoints.set(a.endpoints);
  endpoints.set(b.endpoints, a.endpoints.length);
  genres.set(a.genres);
  genres.set(b.genres, a.genres.length);
  weights.set(a.weights);
  weights.set(b.weights, a.weights.length);
  return { count: a.count + b.count, endpoints, genres, weights };
}

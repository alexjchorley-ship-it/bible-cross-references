import { describe, expect, it } from 'vitest';
import { CHAPTER_REVIEWS, reviewForChapter } from './chapter-reviews.ts';
import { notesForChapter } from './ChapterReview.tsx';
import type { TyndaleStudyNote } from './tyndale.ts';

const note = (
  id: string,
  book: string,
  first: number,
  last: number,
  order: number,
): TyndaleStudyNote => ({
  id, type: 'StudyNote', title: id, sourceOrder: order,
  refs: [{ book, startChapter: first, startVerse: 1, endChapter: last, endVerse: 10 }],
  content: ['Note'],
});

describe('chapter-level scholarly study guides', () => {
  it('covers every chapter of Genesis and John exactly once', () => {
    expect(CHAPTER_REVIEWS).toHaveLength(71);
    for (const [book, count] of [['Gen', 50], ['John', 21]] as const) {
      expect(CHAPTER_REVIEWS.filter((item) => item.book === book)).toHaveLength(count);
      for (let chapter = 1; chapter <= count; chapter += 1) {
        const review = reviewForChapter(book, chapter);
        expect(review?.overview.length).toBeGreaterThan(40);
        expect(review?.interpretiveFocus.length).toBeGreaterThan(40);
        expect(review?.keyVerses.length).toBeGreaterThanOrEqual(3);
      }
    }
    expect(reviewForChapter('Mark', 1)).toBeNull();
    expect(reviewForChapter('Gen', 51)).toBeNull();
  });

  it('includes notes intersecting a chapter and preserves source order', () => {
    const selected = notesForChapter([
      note('late', 'genesis', 2, 2, 8),
      note('early', 'genesis', 1, 3, 1),
      note('other-book', 'john', 2, 2, 0),
      note('unrelated', 'genesis', 4, 4, 0),
    ], 'genesis', 2);
    expect(selected.map((item) => item.id)).toEqual(['early', 'late']);
    expect(notesForChapter([], 'john', 1)).toEqual([]);
  });
});

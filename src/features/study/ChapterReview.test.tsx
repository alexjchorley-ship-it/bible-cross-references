import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CHAPTER_REVIEWS, reviewForChapter } from './chapter-reviews.ts';
import { ChapterReview, notesForChapter } from './ChapterReview.tsx';
import type { TyndaleStudyNote } from './tyndale.ts';

const note = (
  id: string,
  book: string,
  first: number,
  last: number,
  order: number,
): TyndaleStudyNote => ({
  id,
  type: 'StudyNote',
  title: id,
  sourceOrder: order,
  refs: [{ book, startChapter: first, startVerse: 1, endChapter: last, endVerse: 10 }],
  content: ['Note'],
});

describe('chapter-level scholarly study guides', () => {
  beforeEach(() => { vi.unstubAllGlobals(); });
  it('reports missing chapter commentary without pretending it is empty', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('', { status: 404 }))));
    render(<ChapterReview verseId="Gen.50.20" />);
    expect((await screen.findByRole('alert')).textContent).toContain('not available offline');
  });

  it('renders editorial analysis, key passages and every relevant source note', async () => {
    const passage = note('Creation context', 'genesis', 1, 2, 1);
    const direct = note('First verse', 'genesis', 1, 1, 2);
    const multi = {
      ...direct,
      id: 'Detailed',
      title: 'Detailed study',
      content: [{ t: 'p', c: ['Light and ', { t: 'strong', v: 'life' }] }],
    };
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(
      new Response(JSON.stringify([direct, passage, multi]), { status: 200 }),
    )));
    render(<ChapterReview verseId="Gen.1.1" />);
    expect(screen.getByText(/Creation and the ordered world/)).toBeDefined();
    expect(screen.getByText(/How should the opening Hebrew grammar/)).toBeDefined();
    expect(screen.getByText('1:26')).toBeDefined();
    expect(screen.getByRole('status').textContent).toContain('Loading');
    await waitFor(() => {
      expect(screen.getByText(/3 source notes covering this chapter/)).toBeDefined();
    });
    expect(screen.getByText('Detailed study')).toBeDefined();
    expect(screen.getByText(/Light and life/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Tyndale Open Study Notes' })).toBeDefined();
  });

  it('handles a chapter with no publisher notes and unrelated books', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(
      new Response(JSON.stringify([]), { status: 200 }),
    )));
    render(<ChapterReview verseId="John.21.24" />);
    await waitFor(() => {
      expect(screen.getByText(/0 source notes covering this chapter/)).toBeDefined();
    });
    expect(screen.getByText(/No Tyndale notes have been matched/)).toBeDefined();
  });

  it('does not render editorial chapter guides for unsupported books', () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    const { container } = render(<ChapterReview verseId="Exod.1.1" />);
    expect(container.textContent).toBe('');
    expect(request).not.toHaveBeenCalled();
  });

  it('covers every chapter of Genesis and John exactly once', () => {
    expect(CHAPTER_REVIEWS).toHaveLength(71);
    for (const [book, count] of [
      ['Gen', 50],
      ['John', 21],
    ] as const) {
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
    const selected = notesForChapter(
      [
        note('late', 'genesis', 2, 2, 8),
        note('early', 'genesis', 1, 3, 1),
        note('other-book', 'john', 2, 2, 0),
        note('unrelated', 'genesis', 4, 4, 0),
      ],
      'genesis',
      2,
    );
    expect(selected.map((item) => item.id)).toEqual(['early', 'late']);
    expect(notesForChapter([], 'john', 1)).toEqual([]);
  });
});

import { useEffect, useMemo, useState } from 'react';
import { parseOsisId } from '../../core/bible/verse-ref.ts';
import { getBook } from '../../core/bible/books.ts';
import { reviewForChapter } from './chapter-reviews.ts';
import { loadTyndaleBook, tyndaleSlug, type TyndaleStudyNote } from './tyndale.ts';
import styles from './ChapterReview.module.css';

/** An attached note qualifies if its reference interval intersects any part of the chapter. */
export function notesForChapter(
  notes: readonly TyndaleStudyNote[],
  bookSlug: string,
  chapter: number,
): readonly TyndaleStudyNote[] {
  return notes.filter((note) =>
    note.refs.some((ref) =>
      ref.book === bookSlug &&
      ref.startChapter <= chapter &&
      ref.endChapter >= chapter,
    ),
  ).toSorted((a, b) => a.sourceOrder - b.sourceOrder);
}

function notePlainText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (typeof node !== 'object' || node === null) return '';
  const record = node as { readonly v?: string; readonly c?: readonly unknown[] };
  return (record.c?.map(notePlainText).join('') ?? record.v ?? '');
}

function noteReference(note: TyndaleStudyNote): string {
  const first = note.refs[0];
  if (!first) return note.title;
  const start = `${first.startChapter}:${first.startVerse}`;
  const end = `${first.endChapter}:${first.endVerse}`;
  return start === end ? start : `${start}–${end}`;
}

export function ChapterReview({ verseId }: { readonly verseId: string }) {
  const verse = parseOsisId(verseId);
  const review = verse ? reviewForChapter(verse.book, verse.chapter) : null;
  const [loaded, setLoaded] = useState<{
    readonly slug: string;
    readonly notes: readonly TyndaleStudyNote[];
    readonly error: string | null;
  } | null>(null);
  const slug = verse && review ? tyndaleSlug(verse) : null;
  useEffect(() => {
    if (!slug) return undefined;
    let active = true;
    void loadTyndaleBook(slug).then(
      (notes) => { if (active) setLoaded({ slug, notes, error: null }); },
      (error: unknown) => {
        if (active) setLoaded({
          slug, notes: [],
          error: error instanceof Error ? error.message : 'Could not load chapter commentary.',
        });
      },
    );
    return () => { active = false; };
  }, [slug]);

  const chapterNotes = useMemo(() =>
    review && slug && loaded?.slug === slug
      ? notesForChapter(loaded.notes, slug, review.chapter)
      : [],
    [loaded, review, slug],
  );

  if (!review || !verse) return null;

  const book = getBook(review.book).name;
  const title = `${book} ${review.chapter}`;
  const notesStatus = loaded?.slug === slug ? loaded : null;

  return (
    <section className={styles.chapterReview} aria-label={`Chapter review: ${title}`}>
      <header className={styles.header}>
        <span className={styles.kicker}>CHAPTER STUDY GUIDE</span>
        <h3>{title} · {review.title}</h3>
        <p className={styles.disclosure}>Editorial overview and study questions, alongside the original Tyndale Open Study Notes. This is not a peer-reviewed academic paper.</p>
      </header>
      <div className={styles.section}>
        <h4>Chapter overview</h4>
        <p>{review.overview}</p>
      </div>
      <div className={styles.section}>
        <h4>Interpretation and scholarly questions</h4>
        <p>{review.interpretiveFocus}</p>
      </div>
      <div className={styles.section}>
        <h4>Key verses to examine</h4>
        <div className={styles.verseTags}>
          {review.keyVerses.map((number) => (
            <a key={number}
              className={styles.verseTag}
              href={`#${review.book}.${review.chapter}.${number}`}
              title={`Study ${title}:${number}`}>
              {review.chapter}:{number}
            </a>
          ))}
        </div>
      </div>
      <div className={styles.section}>
        <h4>Original chapter commentary</h4>
        <p className={styles.disclosure}>Every Tyndale note whose reference touches this chapter is listed below in source order. Passage-wide notes may also cover adjoining chapters. These notes are independent publisher commentary, not newly verified academic citations.</p>
        {!notesStatus && <p role="status">Loading chapter notes…</p>}
        {notesStatus?.error && <p role="alert">{notesStatus.error}</p>}
        {notesStatus && !notesStatus.error && (
          <details className={styles.noteCollection}>
            <summary>{chapterNotes.length} source notes covering this chapter · View all</summary>
            {chapterNotes.length === 0 && <p>No Tyndale notes have been matched to this chapter.</p>}
            <ol className={styles.noteList}>
              {chapterNotes.map((note) => (
                <li key={note.id} className={styles.noteItem}>
                  <details>
                    <summary><span className={styles.noteRef}>{noteReference(note)}</span> {note.title}</summary>
                    <p>{note.content.map(notePlainText).join(' ').trim()}</p>
                  </details>
                </li>
              ))}
            </ol>
          </details>
        )}
        <p className={styles.credit}>
          Source: <a href="https://tyndaleopenresources.com/" target="_blank" rel="noopener noreferrer">Tyndale Open Study Notes</a>
          {' · '}© 2022 Tyndale House Publishers · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>
          {' · '}adapted through <a href="https://github.com/sbrn3/one-blue-thread" target="_blank" rel="noopener noreferrer">One Blue Thread</a>
        </p>
      </div>
    </section>
  );
}

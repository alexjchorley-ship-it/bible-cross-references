import { useId, useMemo, useState } from 'react';
import { BOOKS, type BookId } from '../../core/bible/books.ts';
import { parseReference } from '../../core/bible/reference-parse.ts';
import { formatVerseRef } from '../../core/bible/reference-format.ts';
import { useLocalization } from '../../i18n/use-locale.tsx';
import type { VizData } from '../../visualizations/shared/viz-data.ts';
import styles from './PersonalCrossReferences.module.css';

export interface TargetVerse {
  readonly book: BookId;
  readonly chapter: number;
  readonly verse: number;
}

export function VerseTargetPicker({
  data,
  value,
  onChange,
  disabled,
}: {
  readonly data: VizData;
  readonly value: TargetVerse | null;
  readonly onChange: (value: TargetVerse | null) => void;
  readonly disabled: boolean;
}) {
  const { books } = useLocalization();
  const [query, setQuery] = useState('');
  const [book, setBook] = useState<BookId | null>(value?.book ?? null);
  const [chapter, setChapter] = useState<number | null>(value?.chapter ?? null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputId = useId();
  const chapterId = useId();
  const verseId = useId();
  const activeBook = value?.book ?? book;
  const activeChapter = value?.chapter ?? chapter;

  const matchingBooks = useMemo(() => {
    const search = query.toLocaleLowerCase().replace(/\s+/g, ' ').trim();
    if (!search) return [];
    return BOOKS.filter((item) => {
      const name = books[item.id].name.toLocaleLowerCase();
      return (
        name.includes(search) ||
        item.id.toLowerCase().startsWith(search) ||
        item.aliases.some((alias) => alias.startsWith(search.replace(/[^a-z0-9]/g, '')))
      );
    }).slice(0, 8);
  }, [query, books]);

  function pickBook(next: BookId) {
    setBook(next);
    setChapter(null);
    onChange(null);
    setQuery(books[next].name);
    setShowSuggestions(false);
  }

  function typeBook(text: string) {
    setQuery(text);
    setShowSuggestions(true);
    const parsed = parseReference(text, data.versification, books);
    if (parsed.ok) {
      const ref = parsed.reference;
      setBook(ref.book);
      setChapter(ref.chapter);
      onChange(
        ref.verse === undefined
          ? null
          : {
              book: ref.book,
              chapter: ref.chapter,
              verse: ref.verse,
            },
      );
      if (ref.verse !== undefined) setShowSuggestions(false);
      return;
    }
    const exact = BOOKS.find(
      (item) =>
        books[item.id].name.toLowerCase() === text.toLowerCase() ||
        item.id.toLowerCase() === text.toLowerCase(),
    );
    setBook(exact?.id ?? null);
    setChapter(null);
    onChange(null);
  }

  const chapterCount = activeBook ? data.versification.chapterCountOf(activeBook) : 0;
  const verseCount =
    activeBook && activeChapter
      ? (data.versification.verseCountOf(activeBook, activeChapter) ?? 0)
      : 0;

  function previewVerse(number: number) {
    if (!activeBook || !activeChapter) return null;
    const index = data.versification.indexOf({
      book: activeBook,
      chapter: activeChapter,
      verse: number,
    });
    if (index === undefined) return null;
    return {
      number,
      text: data.translation.verseText(index),
      reference: formatVerseRef({ book: activeBook, chapter: activeChapter, verse: number }, books),
    };
  }

  const selectedPreview = value ? previewVerse(value.verse) : null;
  const sample =
    !value && activeChapter
      ? Array.from({ length: Math.min(3, verseCount) }, (_, index) =>
          previewVerse(index + 1),
        ).filter((entry) => entry !== null)
      : [];

  return (
    <div className={styles.picker}>
      <label className={styles.field} htmlFor={inputId}>
        <span>Link to another verse</span>
        <input
          id={inputId}
          className={styles.input}
          autoComplete="off"
          disabled={disabled}
          placeholder="Start typing a book, e.g. John"
          value={query || (value ? formatVerseRef(value, books) : '')}
          onChange={(event) => {
            typeBook(event.target.value);
          }}
          onFocus={() => {
            setShowSuggestions(true);
          }}
        />
      </label>
      {showSuggestions && matchingBooks.length > 0 && (
        <div className={styles.suggestions} role="group" aria-label="Suggested Bible books">
          {matchingBooks.map((item) => (
            <button
              className={styles.suggestion}
              type="button"
              key={item.id}
              onClick={() => {
                pickBook(item.id);
              }}
              disabled={disabled}
            >
              {books[item.id].name}
              <span className={styles.hint}>Choose book</span>
            </button>
          ))}
        </div>
      )}
      <div className={styles.selectRow}>
        <label className={styles.field} htmlFor={chapterId}>
          <span>Chapter</span>
          <select
            className={styles.select}
            id={chapterId}
            disabled={disabled || !activeBook}
            value={activeChapter ?? ''}
            onChange={(event) => {
              const next = Number(event.target.value);
              setChapter(next || null);
              onChange(null);
              setShowSuggestions(false);
            }}
          >
            <option value="">Choose chapter</option>
            {Array.from({ length: chapterCount }, (_, i) => i + 1).map((number) => (
              <option value={number} key={number}>
                {number}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field} htmlFor={verseId}>
          <span>Verse</span>
          <select
            className={styles.select}
            id={verseId}
            disabled={disabled || !activeBook || !activeChapter}
            value={value?.verse ?? ''}
            onChange={(event) => {
              const number = Number(event.target.value);
              onChange(
                activeBook && activeChapter && number
                  ? { book: activeBook, chapter: activeChapter, verse: number }
                  : null,
              );
            }}
          >
            <option value="">Choose verse</option>
            {Array.from({ length: verseCount }, (_, i) => i + 1).map((number) => (
              <option value={number} key={number}>
                {number}
              </option>
            ))}
          </select>
        </label>
      </div>
      {(selectedPreview !== null || sample.length > 0) && (
        <div className={styles.preview} aria-live="polite" aria-label="Bible verse preview">
          <div className={styles.previewHeading}>
            {value ? 'Selected verse' : 'Chapter preview — choose a verse above'}
            <span>{data.translation.manifest.abbreviation}</span>
          </div>
          {(selectedPreview ? [selectedPreview] : sample).map((entry) => (
            <p key={entry.number} className={styles.previewText}>
              <span className={styles.verseNumber}>{entry.reference}</span>{' '}
              {entry.text || 'Verse text unavailable in this translation.'}
            </p>
          ))}
        </div>
      )}
      {activeBook && !activeChapter && (
        <p className={styles.hint}>
          Book selected. Choose a chapter to preview its opening verses.
        </p>
      )}
    </div>
  );
}

import { useEffect, useId, useRef, useState } from 'react';
import { BOOKS, type BookId } from '../../../core/bible/books.ts';
import { formatPassage, type Passage } from '../../../core/bible/passage.ts';
import type { Versification } from '../../../core/bible/versification.ts';
import { useLocalization } from '../../../i18n/use-locale.tsx';
import { ExpandIcon, PreviousIcon, ReadingIcon, CloseIcon } from '../../../shared/ui/icons.tsx';
import styles from './ReferenceSearch.module.css';

interface ReferenceSearchProps {
  readonly versification: Versification;
  readonly onSelect: (passage: Passage) => void;
  /** The current selection is shown on the closed picker, but does not restrict navigation. */
  readonly passage?: Passage | null;
}

/**
 * Two-step Bible navigation: choose one of 66 books, then a chapter.
 * This replaces typing a reference, while preserving OSIS URLs and passage selection.
 */
export function ReferenceSearch({ versification, onSelect, passage = null }: ReferenceSearchProps) {
  const { t, books } = useLocalization();
  const [open, setOpen] = useState(false);
  const [book, setBook] = useState<BookId | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const element = dialog.current;
    if (!element) {
      return;
    }
    if (open && !element.open) {
      element.showModal();
    } else if (!open && element.open) {
      element.close();
    }
  }, [open]);

  function chooseBook(next: BookId): void {
    setBook(next);
    if (scroll.current) {
      scroll.current.scrollTop = 0;
    }
  }

  function chooseChapter(chapter: number): void {
    if (book === null) {
      return;
    }
    onSelect({ kind: 'chapter', book, chapter });
    setOpen(false);
  }

  const buttonLabel = passage
    ? formatPassage(passage, versification, books)
    : t('navigation.open');

  return (
    <>
      <div className={styles.container}>
        <button
          className={styles.trigger}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label={t('navigation.open')}
          onClick={() => {
            setBook(null);
            setOpen(true);
          }}
        >
          <ReadingIcon />
          <span className={styles.current}>{buttonLabel}</span>
          <ExpandIcon />
        </button>
      </div>
      <dialog
        ref={dialog}
        aria-labelledby={titleId}
        className={styles.dialog}
        onClose={() => { setOpen(false); }}
      >
        <header className={styles.dialogHeader}>
          {book !== null && (
            <button
              type="button"
              className={styles.iconButton}
              aria-label={t('navigation.back')}
              onClick={() => {
                setBook(null);
                if (scroll.current) {
      scroll.current.scrollTop = 0;
    }
              }}
            >
              <PreviousIcon />
            </button>
          )}
          <h2 id={titleId}>
            {book === null ? t('navigation.chooseBook') : books[book].name}
          </h2>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={t('navigation.close')}
            onClick={() => { setOpen(false); }}
          >
            <CloseIcon />
          </button>
        </header>
        <div ref={scroll} className={styles.dialogBody}>
          {book === null ? (
            <>
              {(['OT', 'NT'] as const).map((testament) => (
                <section key={testament} aria-label={t(`testament.${testament}`)}>
                  <h3 className={styles.groupTitle}>{t(`testament.${testament}`)}</h3>
                  <div className={styles.books}>
                    {BOOKS.filter((item) => item.testament === testament).map((item) => (
                      <button
                        key={item.id}
                        className={styles.book}
                        type="button"
                        onClick={() => { chooseBook(item.id); }}
                      >
                        {books[item.id].name}
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </>
          ) : (
            <section aria-label={t('navigation.chooseChapter')}>
              <h3 className={styles.groupTitle}>{t('navigation.chooseChapter')}</h3>
              <div className={styles.chapters}>
                {Array.from(
                  { length: versification.chapterCountOf(book) },
                  (_unused, index) => index + 1,
                ).map((chapter) => (
                  <button
                    key={chapter}
                    className={styles.chapter}
                    type="button"
                    aria-label={`${books[book].name} ${chapter}`}
                    onClick={() => { chooseChapter(chapter); }}
                  >
                    {chapter}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </dialog>
    </>
  );
}

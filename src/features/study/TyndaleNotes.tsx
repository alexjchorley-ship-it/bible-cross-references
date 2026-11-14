import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocalization } from '../../i18n/use-locale.tsx';
import {
  loadTyndaleBook,
  notesForVerse,
  parseStudyVerse,
  tyndaleSlug,
  type TyndaleNode,
  type TyndaleStudyNote,
} from './tyndale.ts';
import styles from '../annotations/annotations.module.css';

function renderNode(value: TyndaleNode, index: number): ReactNode {
  if (typeof value === 'string') {
    return value;
  }
  const children =
    value.c?.map((child, offset) => <span key={offset}>{renderNode(child, offset)}</span>) ??
    value.v ??
    null;
  if (value.t === 'em') {
    return <em key={index}>{children}</em>;
  }
  if (value.t === 'strong' || value.t === 'b') {
    return <strong key={index}>{children}</strong>;
  }
  if (value.t === 'ref') {
    return (
      <span key={index} title={value.r ?? undefined}>
        {children}
      </span>
    );
  }
  if (value.t === 'p') {
    return <p key={index}>{children}</p>;
  }
  return <span key={index}>{children}</span>;
}

function CommentaryCard({
  note,
  category,
}: {
  readonly note: TyndaleStudyNote;
  readonly category: string;
}) {
  return (
    <section className={styles.studyCard}>
      <h4>
        {category} · {note.title}
      </h4>
      <div>{note.content.map(renderNode)}</div>
    </section>
  );
}

/** Original publisher notes, kept distinct from our editorial interpretation comparisons. */
export function TyndaleNotes({ verseId }: { readonly verseId: string }) {
  const { t } = useLocalization();
  const verse = parseStudyVerse(verseId);
  const slug = verse ? tyndaleSlug(verse) : null;
  const [state, setState] = useState<{
    readonly slug: string;
    readonly notes: readonly TyndaleStudyNote[];
    readonly error: string | null;
  } | null>(null);

  useEffect(() => {
    if (slug === null) {
      return undefined;
    }
    let active = true;
    void loadTyndaleBook(slug).then(
      (notes) => {
        if (active) {
          setState({ slug, notes, error: null });
        }
      },
      (error: unknown) => {
        if (active) {
          setState({
            slug,
            notes: [],
            error: error instanceof Error ? error.message : t('study.offline'),
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [slug, t]);

  const matching = useMemo(
    () => (verse && state?.slug === slug ? notesForVerse(state.notes, verse) : null),
    [verse, state, slug],
  );

  return (
    <section className={styles.studyCard}>
      <h4>{t('study.tyndale')}</h4>
      {!verse && <p>{t('study.notCurated')}</p>}
      {verse && state?.slug !== slug && <p role="status">{t('study.loading')}</p>}
      {state?.slug === slug && state.error && <p role="alert">{state.error}</p>}
      {matching?.verse.length === 0 && matching.context.length === 0 && (
        <p>{t('study.noTyndale')}</p>
      )}
      {matching?.verse.map((note) => (
        <CommentaryCard key={note.id} note={note} category={t('study.direct')} />
      ))}
      {matching?.context.map((note) => (
        <CommentaryCard key={note.id} note={note} category={t('study.context')} />
      ))}
      <p className={styles.warning}>
        <a href="https://tyndaleopenresources.com/" target="_blank" rel="noopener noreferrer">
          {t('study.tyndale')}
        </a>
        {' · '}
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY-SA 4.0
        </a>
        {' · '}
        <a
          href="https://github.com/sbrn3/one-blue-thread/tree/5a9b199abc2d50bd6aabbf6147f311ce02ad81a4/assets/tyndale"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('study.adaptation')}
        </a>
      </p>
      <p className={styles.warning}>{t('study.credit')}</p>
    </section>
  );
}

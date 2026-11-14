import { useEffect, useMemo, useRef, useState } from 'react';
import { parseOsisId } from '../../core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';
import { useLocalization } from '../../i18n/use-locale.tsx';
import { HIGHLIGHT_COLORS, parseAnnotationsBackup, type HighlightColor } from './model.ts';
import {
  deleteAllAnnotations,
  exportAnnotations,
  importAnnotations,
  useAnnotations,
} from './storage.ts';
import styles from './annotations.module.css';

type ColourFilter = HighlightColor | 'all';

export function Notebook({
  open,
  onClose,
  onOpenVerse,
}: {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onOpenVerse: (verseId: string) => void;
}) {
  const { t } = useLocalization();
  const dialog = useRef<HTMLDialogElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const { notes, highlights, status, error: storageError } = useAnnotations();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ColourFilter>('all');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const rows = useMemo(() => {
    const colors = new Map(highlights.map((highlight) => [highlight.verseId, highlight.color]));
    const ids = new Set([...notes.map((note) => note.verseId), ...colors.keys()]);
    const query = search.toLowerCase().trim();
    return [...ids]
      .map((verseId) => ({
        verseId,
        color: colors.get(verseId) ?? null,
        notes: notes.filter((note) => note.verseId === verseId),
      }))
      .filter((row) =>
        (filter === 'all' || row.color === filter) &&
        (query === '' ||
          row.verseId.toLowerCase().includes(query) ||
          row.notes.some((note) => note.body.toLowerCase().includes(query))),
      )
      .toSorted((a, b) => {
        const first = parseOsisId(a.verseId);
        const second = parseOsisId(b.verseId);
        const firstIndex = first ? CANONICAL_VERSIFICATION.indexOf(first) ?? 0 : 0;
        const secondIndex = second ? CANONICAL_VERSIFICATION.indexOf(second) ?? 0 : 0;
        return firstIndex - secondIndex;
      });
  }, [notes, highlights, search, filter]);

  async function downloadBackup(): Promise<void> {
    try {
      const data = await exportAnnotations();
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'bible-study-annotations.json';
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(t('annotations.export'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('annotations.error'));
    }
  }

  async function uploadBackup(file: File): Promise<void> {
    try {
      const json = await file.text();
      const parsed = parseAnnotationsBackup(json);
      const proposed = `${t('annotations.import')}: ${String(parsed.annotations.length)} ${t('annotations.notes')}, ${String(parsed.highlights.length)} ${t('annotations.highlight')}?`;
      if (!window.confirm(proposed)) {
        return;
      }
      await importAnnotations(json);
      setError(null);
      setNotice(t('annotations.saved'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('annotations.error'));
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.notebookDialog}
      aria-label={t('annotations.notebook')}
      onClose={onClose}
      onCancel={onClose}
    >
      <div className={styles.notebookHeader}>
        <h2>{t('annotations.notebook')}</h2>
        <button type="button" className={styles.smallButton} onClick={onClose}>
          {t('annotations.close')}
        </button>
      </div>
      <p className={styles.warning}>{t('annotations.storage')}</p>
      {status === 'unavailable' && <p role="alert">{t('annotations.unavailable')}</p>}
      {storageError && <p role="alert">{storageError}</p>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      <div className={styles.notebookActions}>
        <button
          type="button"
          className={styles.button}
          disabled={status !== 'ready'}
          onClick={() => {
            void downloadBackup();
          }}
        >
          {t('annotations.export')}
        </button>
        <button
          type="button"
          className={styles.button}
          disabled={status !== 'ready'}
          onClick={() => fileInput.current?.click()}
        >
          {t('annotations.import')}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(event) => {
            const file = event.target.files?.item(0);
            if (file) {
              void uploadBackup(file);
            }
            event.target.value = '';
          }}
        />
        <button
          type="button"
          className={styles.smallButton}
          disabled={status !== 'ready'}
          onClick={() => {
            if (window.confirm(t('annotations.clear') + '?')) {
              void deleteAllAnnotations().catch(() => setError(t('annotations.error')));
            }
          }}
        >
          {t('annotations.clear')}
        </button>
      </div>
      <input
        type="search"
        className={styles.search}
        style={{ minBlockSize: '2.5rem' }}
        aria-label={t('annotations.search')}
        placeholder={t('annotations.search')}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <select
        aria-label={t('annotations.highlight')}
        className={styles.button}
        value={filter}
        onChange={(event) => setFilter(event.target.value as ColourFilter)}
      >
        <option value="all">{t('menu.filters.votes.all')}</option>
        {HIGHLIGHT_COLORS.map((color) => (
          <option key={color} value={color}>
            {t(color === 'amber'
              ? 'annotations.amber'
              : color === 'green'
                ? 'annotations.green'
                : color === 'blue'
                  ? 'annotations.blue'
                  : 'annotations.pink')}
          </option>
        ))}
      </select>
      {rows.length === 0 && <p>{t('annotations.empty')}</p>}
      <ol className={styles.notebookList}>
        {rows.map((row) => (
          <li className={styles.notebookItem} key={row.verseId}>
            <div className={styles.notebookHeader}>
              <strong>{row.verseId.replaceAll('.', ' ')}</strong>
              {row.color && <span>{t('annotations.marked')}: {row.color}</span>}
            </div>
            {row.notes.map((note) => <p key={note.id}>{note.body}</p>)}
            <button
              type="button"
              className={styles.button}
              onClick={() => {
                onOpenVerse(row.verseId);
                onClose();
              }}
            >
              {t('annotations.open')}
            </button>
          </li>
        ))}
      </ol>
    </dialog>
  );
}

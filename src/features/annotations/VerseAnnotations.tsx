import { useEffect, useRef, useState } from 'react';
import type { MessageKey } from '../../i18n/messages/types.ts';
import { useLocalization } from '../../i18n/use-locale.tsx';
import { HIGHLIGHT_COLORS, type HighlightColor, type PersonalNote } from './model.ts';
import {
  deletePersonalNote,
  setVerseHighlight,
  upsertPersonalNote,
  useAnnotations,
} from './storage.ts';
import styles from './annotations.module.css';

const COLOR_KEYS = {
  amber: 'annotations.amber',
  green: 'annotations.green',
  blue: 'annotations.blue',
  pink: 'annotations.pink',
} as const satisfies Readonly<Record<HighlightColor, MessageKey>>;

function SavedNote({ note }: { readonly note: PersonalNote }) {
  const { t } = useLocalization();
  const [draft, setDraft] = useState(note.body);
  const [state, setState] = useState<'saved' | 'saving' | 'error'>('saved');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsaved = useRef<string | null>(null);
  const mounted = useRef(true);

  async function persist(text: string): Promise<void> {
    try {
      await upsertPersonalNote({ ...note, body: text, updatedAt: new Date().toISOString() });
      if (unsaved.current === text) {
        unsaved.current = null;
      }
      if (mounted.current && unsaved.current === null) {
        setState('saved');
      }
    } catch {
      if (mounted.current) {
        setState('error');
      }
    }
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
      if (unsaved.current !== null) {
        void persist(unsaved.current);
      }
    };
    // A note owns its text until it unmounts; a late IndexedDB write must not reset the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  function edit(text: string): void {
    setDraft(text);
    unsaved.current = text;
    setState('saving');
    if (timer.current !== null) {
      clearTimeout(timer.current);
    }
    if (text.trim() === '') {
      setState('error');
      return;
    }
    timer.current = setTimeout(() => {
      void persist(text);
    }, 500);
  }

  return (
    <div className={styles.note}>
      <textarea
        aria-label={t('annotations.notes')}
        className={styles.textarea}
        value={draft}
        rows={Math.max(3, draft.split('\n').length)}
        onChange={(event) => edit(event.target.value)}
        onBlur={() => {
          if (timer.current !== null) {
            clearTimeout(timer.current);
          }
          if (unsaved.current !== null && unsaved.current.trim() !== '') {
            void persist(unsaved.current);
          }
        }}
      />
      <div className={styles.noteFooter}>
        <span role="status">
          {state === 'saved'
            ? t('annotations.saved')
            : state === 'saving'
              ? t('annotations.saving')
              : t('annotations.error')}
        </span>
        <button
          type="button"
          className={styles.smallButton}
          onClick={() => {
            if (window.confirm(t('annotations.delete') + '?')) {
              void deletePersonalNote(note.id);
            }
          }}
        >
          {t('annotations.delete')}
        </button>
      </div>
    </div>
  );
}

/** The same verse actions appear under the original details in Arcs and Threads. */
export function VerseAnnotations({ verseId }: { readonly verseId: string }) {
  const { t } = useLocalization();
  const { status, error, highlights, notes } = useAnnotations();
  const [showColors, setShowColors] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [newText, setNewText] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const highlight = highlights.find((entry) => entry.verseId === verseId)?.color ?? null;
  const verseNotes = notes
    .filter((note) => note.verseId === verseId)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  async function createNote(): Promise<void> {
    if (newText.trim() === '' || busy) {
      return;
    }
    setBusy(true);
    setLocalError(null);
    const now = new Date().toISOString();
    try {
      await upsertPersonalNote({
        id: crypto.randomUUID(),
        verseId,
        body: newText,
        createdAt: now,
        updatedAt: now,
      });
      setNewText('');
    } catch {
      setLocalError(t('annotations.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section} aria-label={t('annotations.notes')}>
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.button}
          aria-expanded={showColors}
          onClick={() => setShowColors(!showColors)}
        >
          {t('annotations.highlight')}
          {highlight ? ` · ${t(COLOR_KEYS[highlight])}` : ''}
        </button>
        <button
          type="button"
          className={styles.button}
          aria-expanded={showNotes}
          onClick={() => setShowNotes(!showNotes)}
        >
          {t('annotations.notes')} {verseNotes.length > 0 ? `(${String(verseNotes.length)})` : ''}
        </button>
      </div>
      {status === 'unavailable' && <p role="alert">{t('annotations.unavailable')}</p>}
      {error && <p role="alert">{error}</p>}
      {localError && <p role="alert">{localError}</p>}
      {showColors && (
        <div className={styles.palette} role="group" aria-label={t('annotations.highlight')}>
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              type="button"
              key={color}
              disabled={status !== 'ready'}
              className={styles.swatch}
              data-color={color}
              aria-pressed={highlight === color}
              onClick={() => {
                void setVerseHighlight(verseId, color);
              }}
            >
              {t(COLOR_KEYS[color])}
            </button>
          ))}
          <button
            type="button"
            className={styles.smallButton}
            disabled={!highlight || status !== 'ready'}
            onClick={() => {
              void setVerseHighlight(verseId, null);
            }}
          >
            {t('annotations.remove')}
          </button>
        </div>
      )}
      {showNotes && (
        <div className={styles.notes}>
          {verseNotes.map((note) => (
            <SavedNote key={note.id} note={note} />
          ))}
          <textarea
            className={styles.textarea}
            aria-label={t('annotations.new')}
            placeholder={t('annotations.new')}
            value={newText}
            rows={3}
            onChange={(event) => setNewText(event.target.value)}
          />
          <button
            type="button"
            className={styles.button}
            disabled={newText.trim() === '' || busy || status !== 'ready'}
            onClick={() => {
              void createNote();
            }}
          >
            {busy ? t('annotations.saving') : t('annotations.add')}
          </button>
          <p className={styles.warning}>{t('annotations.storage')}</p>
        </div>
      )}
    </section>
  );
}

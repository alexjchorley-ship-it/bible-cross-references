import { useEffect, useId, useRef, useState } from 'react';
import { useLocalization } from '../../i18n/use-locale.tsx';
import {
  HIGHLIGHT_COLORS,
  QUICK_HIGHLIGHT_COLORS,
  SUGGESTED_NOTE_CATEGORIES,
  colorLabel,
  type ColorPurpose,
  type HighlightColor,
  type PersonalNote,
  type ColorLabel,
} from './model.ts';
import {
  deletePersonalNote,
  setVerseHighlight,
  setReadingBookmark,
  upsertPersonalNote,
  useAnnotations,
} from './storage.ts';
import styles from './annotations.module.css';

function ColourDots({
  purpose,
  labels,
  selected,
  disabled,
  onSelect,
}: {
  readonly purpose: ColorPurpose;
  readonly labels: readonly ColorLabel[];
  readonly selected: readonly HighlightColor[];
  readonly disabled: boolean;
  readonly onSelect: (color: HighlightColor) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const legendId = useId();
  const title = purpose === 'highlight' ? 'Highlight' : 'Bookmark';
  const name = (color: HighlightColor): string =>
    `${color.charAt(0).toUpperCase() + color.slice(1)} · ${colorLabel(labels, purpose, color)}`;

  return (
    <div className={styles.colourPicker}>
      <div
        className={styles.dotPalette}
        role="group"
        aria-label={purpose === 'highlight' ? 'Highlight colours' : 'Reading bookmark colours'}
      >
        {QUICK_HIGHLIGHT_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={styles.colorDot}
            data-color={color}
            aria-label={name(color)}
            title={colorLabel(labels, purpose, color)}
            aria-pressed={selected.includes(color)}
            disabled={disabled}
            onClick={() => {
              onSelect(color);
            }}
          />
        ))}
        <button
          type="button"
          className={styles.colourExpand}
          aria-label={`${expanded ? 'Hide' : 'Show'} ${title.toLowerCase()} colour meanings`}
          aria-expanded={expanded}
          aria-controls={legendId}
          onClick={() => {
            setExpanded(!expanded);
          }}
        >
          <span aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
        </button>
      </div>
      {expanded && (
        <div
          id={legendId}
          className={styles.colourLegend}
          role="group"
          aria-label={`${title} colour meanings and more colours`}
        >
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={styles.colourLegendOption}
              aria-label={name(color)}
              aria-pressed={selected.includes(color)}
              disabled={disabled}
              onClick={() => {
                onSelect(color);
              }}
            >
              <span className={styles.colorDot} data-color={color} aria-hidden="true" />
              <span className={styles.colourLegendTitle}>{colorLabel(labels, purpose, color)}</span>
              {selected.includes(color) && (
                <span className={styles.colourLegendCheck} aria-hidden="true">
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SavedNote({
  note,
  categories,
}: {
  readonly note: PersonalNote;
  readonly categories: readonly string[];
}) {
  const { t } = useLocalization();
  const [draft, setDraft] = useState(note.body);
  const [category, setCategory] = useState(note.category ?? '');
  const [title, setTitle] = useState(note.title ?? '');
  const [state, setState] = useState<'saved' | 'saving' | 'error'>('saved');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsaved = useRef<{ body: string; category: string; title: string } | null>(null);
  const mounted = useRef(true);
  const categoryListId = useId();

  async function persist(value: { body: string; category: string; title: string }): Promise<void> {
    try {
      await upsertPersonalNote({
        ...note,
        body: value.body,
        category: value.category.trim(),
        title: value.title.trim(),
        updatedAt: new Date().toISOString(),
      });
      if (unsaved.current === value) unsaved.current = null;
      if (mounted.current && unsaved.current === null) setState('saved');
    } catch {
      if (mounted.current) setState('error');
    }
  }

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current !== null) clearTimeout(timer.current);
      if (unsaved.current?.body.trim()) void persist(unsaved.current);
    };
    // A note owns its editor until unmount. Never wipe a draft during a cloud refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  function edit(body: string, nextCategory: string, nextTitle: string): void {
    setDraft(body);
    setCategory(nextCategory);
    setTitle(nextTitle);
    const value = { body, category: nextCategory, title: nextTitle };
    unsaved.current = value;
    setState(body.trim() ? 'saving' : 'error');
    if (timer.current !== null) clearTimeout(timer.current);
    if (!body.trim()) return;
    timer.current = setTimeout(() => {
      void persist(value);
    }, 500);
  }

  return (
    <div className={styles.savedNote}>
      <input
        className={styles.noteTitle}
        aria-label="Note title"
        placeholder="Untitled note"
        maxLength={120}
        value={title}
        onChange={(event) => {
          edit(draft, category, event.target.value);
        }}
      />
      <textarea
        aria-label={t('annotations.notes')}
        className={styles.textarea}
        value={draft}
        rows={Math.max(3, draft.split('\n').length)}
        onChange={(event) => {
          edit(event.target.value, category, title);
        }}
        onBlur={() => {
          if (timer.current !== null) clearTimeout(timer.current);
          if (unsaved.current?.body.trim()) void persist(unsaved.current);
        }}
      />
      <label className={styles.fieldLabel}>
        Category
        <input
          className={styles.categoryInput}
          list={categoryListId}
          maxLength={80}
          value={category}
          placeholder="Choose or type a category"
          onChange={(event) => {
            edit(draft, event.target.value, title);
          }}
        />
        <datalist id={categoryListId}>
          {categories.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </label>
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
            if (window.confirm(t('annotations.delete') + '?')) void deletePersonalNote(note.id);
          }}
        >
          {t('annotations.delete')}
        </button>
      </div>
    </div>
  );
}

/** Inline note composer and always-visible YouVersion-inspired colour swatches. */
export function VerseAnnotations({ verseId }: { readonly verseId: string }) {
  const { t } = useLocalization();
  const { status, error, highlights, notes, bookmarks, labels = [] } = useAnnotations();
  const [newText, setNewText] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [busy, setBusy] = useState(false);
  const [allNotes, setAllNotes] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const categoryListId = useId();
  const highlight = highlights.find((entry) => entry.verseId === verseId)?.color ?? null;
  const verseBookmarks = bookmarks
    .filter((bookmark) => bookmark.verseId === verseId)
    .map((entry) => entry.color);
  const verseNotes = notes
    .filter((note) => note.verseId === verseId)
    .toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));
  const categories = [
    ...new Set([
      ...SUGGESTED_NOTE_CATEGORIES,
      ...notes.map((note) => note.category ?? '').filter(Boolean),
    ]),
  ].toSorted();
  const displayedNotes = allNotes ? verseNotes : verseNotes.slice(0, 1);

  async function createNote(): Promise<void> {
    if (!newText.trim() || busy) return;
    setBusy(true);
    setLocalError(null);
    const now = new Date().toISOString();
    try {
      await upsertPersonalNote({
        id: crypto.randomUUID(),
        verseId,
        body: newText.trim(),
        category: newCategory.trim(),
        title: newTitle.trim(),
        createdAt: now,
        updatedAt: now,
      });
      setNewText('');
      setNewTitle('');
    } catch {
      setLocalError(t('annotations.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.annotationComposer} aria-label={t('annotations.notes')}>
      {status === 'unavailable' && <p role="alert">{t('annotations.unavailable')}</p>}
      {error && <p role="alert">{error}</p>}
      {localError && <p role="alert">{localError}</p>}
      <div className={styles.annotationColourRow}>
        <span className={styles.annotationLabel}>{t('annotations.highlight')}</span>
        <ColourDots
          purpose="highlight"
          labels={labels}
          selected={highlight ? [highlight] : []}
          disabled={status !== 'ready'}
          onSelect={(color) => {
            void setVerseHighlight(verseId, highlight === color ? null : color);
          }}
        />
        {highlight && (
          <button
            className={styles.clearDot}
            type="button"
            onClick={() => {
              void setVerseHighlight(verseId, null);
            }}
            aria-label={t('annotations.remove')}
          >
            ×
          </button>
        )}
      </div>
      <div className={styles.annotationColourRow}>
        <span className={styles.annotationLabel}>Bookmark</span>
        <ColourDots
          purpose="bookmark"
          labels={labels}
          selected={verseBookmarks}
          disabled={status !== 'ready'}
          onSelect={(color) => {
            void setReadingBookmark(color, verseBookmarks.includes(color) ? null : verseId);
          }}
        />
      </div>
      <div className={styles.inlineComposer}>
        <h3 className={styles.composerHeading}>
          {t('annotations.notes')} {verseNotes.length > 0 && <span>({verseNotes.length})</span>}
        </h3>
        <input
          aria-label="New note title"
          className={styles.noteTitle}
          placeholder="Title (optional)"
          maxLength={120}
          value={newTitle}
          onChange={(event) => {
            setNewTitle(event.target.value);
          }}
        />
        <textarea
          className={styles.textarea}
          aria-label={t('annotations.new')}
          placeholder={t('annotations.new')}
          value={newText}
          rows={3}
          onChange={(event) => {
            setNewText(event.target.value);
          }}
        />
        <div className={styles.composerFooter}>
          <label className={styles.fieldLabel}>
            Category
            <input
              className={styles.categoryInput}
              list={categoryListId}
              maxLength={80}
              placeholder="Choose or type…"
              value={newCategory}
              onChange={(event) => {
                setNewCategory(event.target.value);
              }}
            />
            <datalist id={categoryListId}>
              {categories.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>
          <button
            type="button"
            className={styles.button}
            disabled={!newText.trim() || busy || status !== 'ready'}
            onClick={() => {
              void createNote();
            }}
          >
            {busy ? t('annotations.saving') : t('annotations.add')}
          </button>
        </div>
        {verseNotes.length > 0 && (
          <div className={styles.savedNotesArea}>
            <h4>Saved notes</h4>
            {displayedNotes.map((note) => (
              <SavedNote key={note.id} note={note} categories={categories} />
            ))}
            {verseNotes.length > 1 && (
              <button
                type="button"
                className={styles.smallButton}
                aria-expanded={allNotes}
                onClick={() => {
                  setAllNotes(!allNotes);
                }}
              >
                {allNotes ? 'Show latest note only' : `Show all ${verseNotes.length} notes`}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

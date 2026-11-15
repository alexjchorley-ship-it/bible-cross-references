import { useEffect, useMemo, useRef, useState } from 'react';
import { parseOsisId } from '../../core/bible/verse-ref.ts';
import { CANONICAL_VERSIFICATION } from '../../core/bible/versification.ts';
import { useLocalization } from '../../i18n/use-locale.tsx';
import {
  HIGHLIGHT_COLORS,
  colorLabel,
  SUGGESTED_NOTE_CATEGORIES,
  parseAnnotationsBackup,
  type ColorPurpose,
  type ColorLabel,
  type PersonalNote,
  type HighlightColor,
} from './model.ts';
import {
  deleteAllAnnotations,
  exportAnnotations,
  importAnnotations,
  setReadingBookmark,
  setColorLabel,
  upsertPersonalNote,
  deletePersonalNote,
  useAnnotations,
} from './storage.ts';
import styles from './annotations.module.css';
import { CloudSyncPanel } from './CloudSyncPanel.tsx';

type ColourFilter = HighlightColor | 'all';

function ColourLabelEditor({
  purpose,
  color,
  labels,
}: {
  readonly purpose: ColorPurpose;
  readonly color: HighlightColor;
  readonly labels: readonly ColorLabel[];
}) {
  const resolved = colorLabel(labels, purpose, color);
  const [value, setValue] = useState(resolved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <form
      className={styles.labelEditor}
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        setBusy(true);
        void setColorLabel(`${purpose}:${color}`, value).then(
          () => {
            setBusy(false);
            setError('');
          },
          () => {
            setBusy(false);
            setError('Could not save label');
          },
        );
      }}
    >
      <span className={styles.colorDot} data-color={color} aria-hidden="true" />
      <label className={styles.fieldLabel}>
        {color.charAt(0).toUpperCase() + color.slice(1)} {purpose}
        <input
          className={styles.categoryInput}
          maxLength={60}
          aria-label={`${color} ${purpose} meaning`}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
          }}
        />
      </label>
      <button
        className={styles.smallButton}
        type="submit"
        disabled={busy || !value.trim() || value === resolved}
      >
        Save
      </button>
      {error && <span role="alert">{error}</span>}
    </form>
  );
}

function NotebookNote({
  note,
  categories,
  onError,
}: {
  readonly note: PersonalNote;
  readonly categories: readonly string[];
  readonly onError: (error: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [title, setTitle] = useState(note.title ?? '');
  const [category, setCategory] = useState(note.category ?? '');
  const [saving, setSaving] = useState(false);
  async function save(): Promise<void> {
    if (!body.trim()) return;
    setSaving(true);
    try {
      await upsertPersonalNote({
        ...note,
        body: body.trim(),
        title: title.trim(),
        category: category.trim(),
        updatedAt: new Date().toISOString(),
      });
      setEditing(false);
    } catch {
      onError('Could not update note. Your edits are still shown.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <article className={styles.notebookNote}>
      {!editing ? (
        <>
          {note.title && <h4>{note.title}</h4>}
          {note.category && <span className={styles.categoryChip}>{note.category}</span>}
          <p>{note.body}</p>
          <div className={styles.noteFooter}>
            <time dateTime={note.updatedAt}>{new Date(note.updatedAt).toLocaleDateString()}</time>
            <button
              className={styles.smallButton}
              type="button"
              onClick={() => {
                setEditing(true);
              }}
            >
              Edit note
            </button>
          </div>
        </>
      ) : (
        <>
          <input
            aria-label="Edit note title"
            className={styles.noteTitle}
            maxLength={120}
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
            }}
          />
          <textarea
            aria-label="Edit note text"
            className={styles.textarea}
            rows={4}
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
            }}
          />
          <label className={styles.fieldLabel}>
            Category
            <input
              className={styles.categoryInput}
              maxLength={80}
              value={category}
              list="notebook-note-categories"
              onChange={(event) => {
                setCategory(event.target.value);
              }}
            />
          </label>
          <datalist id="notebook-note-categories">
            {categories.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          <div className={styles.notebookActions}>
            <button
              className={styles.button}
              type="button"
              disabled={saving || !body.trim()}
              onClick={() => {
                void save();
              }}
            >
              Save changes
            </button>
            <button
              className={styles.smallButton}
              type="button"
              onClick={() => {
                setEditing(false);
              }}
            >
              Cancel
            </button>
            <button
              className={styles.smallButton}
              type="button"
              onClick={() => {
                if (window.confirm('Delete this note?')) {
                  void deletePersonalNote(note.id).catch(() => {
                    onError('Could not delete note.');
                  });
                }
              }}
            >
              Delete note
            </button>
          </div>
        </>
      )}
    </article>
  );
}

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
  const {
    notes,
    highlights,
    bookmarks,
    labels = [],
    status,
    error: storageError,
  } = useAnnotations();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ColourFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sort, setSort] = useState<'bible' | 'recent'>('recent');
  const [configureColors, setConfigureColors] = useState(false);
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

  const categories = [
    ...new Set([
      ...SUGGESTED_NOTE_CATEGORIES,
      ...notes.map((note) => note.category ?? '').filter(Boolean),
    ]),
  ].toSorted();

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
      .filter(
        (row) =>
          (filter === 'all' || row.color === filter) &&
          (categoryFilter === 'all' ||
            row.notes.some((note) => note.category === categoryFilter)) &&
          (query === '' ||
            row.verseId.toLowerCase().includes(query) ||
            row.notes.some((note) => note.body.toLowerCase().includes(query))),
      )
      .toSorted((a, b) => {
        if (sort === 'recent') {
          const aTime = Math.max(0, ...a.notes.map((note) => Date.parse(note.updatedAt)));
          const bTime = Math.max(0, ...b.notes.map((note) => Date.parse(note.updatedAt)));
          if (aTime !== bTime) return bTime - aTime;
        }
        const first = parseOsisId(a.verseId);
        const second = parseOsisId(b.verseId);
        const firstIndex = first ? (CANONICAL_VERSIFICATION.indexOf(first) ?? 0) : 0;
        const secondIndex = second ? (CANONICAL_VERSIFICATION.indexOf(second) ?? 0) : 0;
        return firstIndex - secondIndex;
      });
  }, [notes, highlights, search, filter, categoryFilter, sort]);

  async function downloadBackup(): Promise<void> {
    try {
      const data = await exportAnnotations();
      const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'bible-study-annotations.json';
      anchor.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      setNotice(t('annotations.export'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('annotations.error'));
    }
  }

  async function uploadBackup(file: File): Promise<void> {
    try {
      const json = await file.text();
      const parsed = parseAnnotationsBackup(json);
      const proposed = `${t('annotations.import')}: ${String(parsed.annotations.length)} ${t('annotations.notes')}, ${String(parsed.highlights.length)} ${t('annotations.highlight')}, ${String(parsed.bookmarks?.length ?? 0)} bookmarks?`;
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
      <section className={styles.section} aria-label="Reading bookmarks">
        <h3>Reading bookmarks</h3>
        <p className={styles.warning}>
          One moving bookmark per colour. Select a colour to resume that study.
        </p>
        <div className={styles.palette}>
          {HIGHLIGHT_COLORS.map((color) => {
            const bookmark = bookmarks.find((entry) => entry.color === color);
            return (
              <div key={color} className={styles.bookmarkGroup}>
                <button
                  type="button"
                  className={styles.swatch}
                  data-color={color}
                  disabled={!bookmark}
                  onClick={() => {
                    if (bookmark) {
                      onOpenVerse(bookmark.verseId);
                      onClose();
                    }
                  }}
                >
                  {colorLabel(labels, 'bookmark', color)}:{' '}
                  {bookmark?.verseId.replaceAll('.', ' ') ?? 'Not set'}
                </button>
                {bookmark && (
                  <button
                    type="button"
                    className={styles.smallButton}
                    disabled={status !== 'ready'}
                    aria-label={`Remove ${color} bookmark`}
                    onClick={() => {
                      void setReadingBookmark(color, null);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
      <section className={styles.section} aria-label="Colour meanings">
        <div className={styles.notebookHeader}>
          <h3>Highlight and bookmark meanings</h3>
          <button
            type="button"
            className={styles.smallButton}
            aria-expanded={configureColors}
            onClick={() => {
              setConfigureColors(!configureColors);
            }}
          >
            {configureColors ? 'Close' : 'Customise colours'}
          </button>
        </div>
        {configureColors && (
          <div className={styles.labelEditorGrid}>
            {(['highlight', 'bookmark'] as const).flatMap((purpose) =>
              HIGHLIGHT_COLORS.map((color) => (
                <ColourLabelEditor
                  key={`${purpose}:${color}`}
                  purpose={purpose}
                  color={color}
                  labels={labels}
                />
              )),
            )}
          </div>
        )}
      </section>
      <CloudSyncPanel />
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
              void deleteAllAnnotations().catch(() => {
                setError(t('annotations.error'));
              });
            }
          }}
        >
          {t('annotations.clear')}
        </button>
      </div>
      <h3 className={styles.notebookSectionHeading}>My notes & highlights</h3>
      <div className={styles.notebookFilters}>
        <input
          type="search"
          className={styles.search}
          style={{ minBlockSize: '2.5rem' }}
          aria-label={t('annotations.search')}
          placeholder={t('annotations.search')}
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
          }}
        />
        <select
          aria-label={t('annotations.highlight')}
          className={styles.button}
          value={filter}
          onChange={(event) => {
            setFilter(event.target.value as ColourFilter);
          }}
        >
          <option value="all">{t('menu.filters.votes.all')}</option>
          {HIGHLIGHT_COLORS.map((color) => (
            <option key={color} value={color}>
              {t(
                color === 'amber'
                  ? 'annotations.amber'
                  : color === 'green'
                    ? 'annotations.green'
                    : color === 'blue'
                      ? 'annotations.blue'
                      : 'annotations.pink',
              )}
            </option>
          ))}
        </select>
        <select
          className={styles.categoryInput}
          aria-label="Filter note category"
          value={categoryFilter}
          onChange={(event) => {
            setCategoryFilter(event.target.value);
          }}
        >
          <option value="all">All note categories</option>
          {categories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          className={styles.categoryInput}
          aria-label="Sort notes"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value as 'bible' | 'recent');
          }}
        >
          <option value="recent">Recently updated</option>
          <option value="bible">Bible order</option>
        </select>
      </div>
      {rows.length === 0 && <p>{t('annotations.empty')}</p>}
      <ol className={styles.notebookList}>
        {rows.map((row) => (
          <li className={styles.notebookItem} key={row.verseId}>
            <div className={styles.notebookHeader}>
              <strong>{row.verseId.replaceAll('.', ' ')}</strong>
              {row.color && (
                <span>
                  {t('annotations.marked')}: {colorLabel(labels, 'highlight', row.color)}
                </span>
              )}
            </div>
            {row.notes
              .filter((note) => categoryFilter === 'all' || note.category === categoryFilter)
              .map((note) => (
                <NotebookNote
                  key={note.id}
                  note={note}
                  categories={categories}
                  onError={(message) => {
                    setError(message);
                  }}
                />
              ))}
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

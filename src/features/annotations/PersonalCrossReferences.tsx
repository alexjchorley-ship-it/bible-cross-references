import { useState } from 'react';
import { formatVerseRef } from '../../core/bible/reference-format.ts';
import { parseOsisId, toOsisId } from '../../core/bible/verse-ref.ts';
import { useLocalization } from '../../i18n/use-locale.tsx';
import type { VizData } from '../../visualizations/shared/viz-data.ts';
import { versePassage, type Passage } from '../../core/bible/passage.ts';
import {
  deletePersonalCrossReference,
  upsertPersonalCrossReference,
  useAnnotations,
} from './storage.ts';
import type { PersonalCrossReference } from './model.ts';
import { VerseTargetPicker, type TargetVerse } from './VerseTargetPicker.tsx';
import styles from './PersonalCrossReferences.module.css';

/** Personal references use the same editorial card patterns as the notes and passage panel. */
export function PersonalCrossReferences({
  verseId,
  data,
  onSelect,
}: {
  readonly verseId: string;
  readonly data: VizData;
  readonly onSelect: (passage: Passage) => void;
}) {
  const { books } = useLocalization();
  const { crossReferences, status, error } = useAnnotations();
  const [target, setTarget] = useState<TargetVerse | null>(null);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const related = crossReferences.filter(
    (link) => link.fromVerseId === verseId || link.toVerseId === verseId,
  );

  function resetEditor() {
    setTarget(null);
    setNote('');
    setEditing(null);
    setFailure(null);
  }

  async function save() {
    if (!target || data.versification.indexOf(target) === undefined) {
      setFailure('Choose a valid book, chapter and verse.');
      return;
    }
    const toVerseId = toOsisId(target);
    const prior = crossReferences.find((link) => link.id === editing);
    const fromVerseId = prior?.fromVerseId ?? verseId;
    if (toVerseId === fromVerseId) {
      setFailure('Choose a different verse.');
      return;
    }
    const now = new Date().toISOString();
    const link: PersonalCrossReference = {
      id: prior?.id ?? crypto.randomUUID(),
      fromVerseId,
      toVerseId,
      note: note.trim(),
      createdAt: prior?.createdAt ?? now,
      updatedAt: now,
    };
    setBusy(true);
    setFailure(null);
    try {
      await upsertPersonalCrossReference(link);
      resetEditor();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Could not save this link.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.section} aria-label="My cross-references">
      <header className={styles.heading}>
        <span className={styles.headingMark} aria-hidden="true">
          ↗
        </span>
        <span>My cross-references</span>
        <span className={styles.count}>{related.length}</span>
      </header>
      {status === 'unavailable' && (
        <p className={styles.error} role="alert">
          {error ?? 'Local storage unavailable.'}
        </p>
      )}
      {related.length > 0 && (
        <div className={styles.linkList}>
          {related.map((link) => {
            const otherId = link.fromVerseId === verseId ? link.toVerseId : link.fromVerseId;
            const other = parseOsisId(otherId);
            const index = other && data.versification.indexOf(other);
            const text = index !== undefined ? data.translation.verseText(index) : '';
            return (
              <article className={styles.linkCard} key={link.id}>
                <button
                  className={styles.linkTitle}
                  type="button"
                  disabled={index === undefined}
                  onClick={() => {
                    if (index !== undefined) onSelect(versePassage(index));
                  }}
                >
                  <span>{other ? formatVerseRef(other, books) : otherId}</span>
                  <span aria-hidden="true">↗</span>
                </button>
                {text && <p className={styles.scripture}>{text}</p>}
                {link.note && <p className={styles.personalNote}>{link.note}</p>}
                <div className={styles.linkActions}>
                  <span className={styles.personalTag}>Your connection</span>
                  <button
                    className={styles.textButton}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const next = parseOsisId(link.toVerseId);
                      setEditing(link.id);
                      setTarget(next ?? null);
                      setNote(link.note);
                      setFailure(null);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.textButton}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setBusy(true);
                      void deletePersonalCrossReference(link.id)
                        .catch((e: unknown) => {
                          setFailure(
                            e instanceof Error ? e.message : 'Could not delete this link.',
                          );
                        })
                        .finally(() => {
                          setBusy(false);
                        });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <div className={styles.formHeading}>
          <strong>{editing ? 'Edit your connection' : 'Add a personal connection'}</strong>
          <span>Choose a verse and see the text before linking it.</span>
        </div>
        <VerseTargetPicker
          key={editing ?? 'new'}
          data={data}
          value={target}
          onChange={(next) => {
            setTarget(next);
            setFailure(null);
          }}
          disabled={busy || status !== 'ready'}
        />
        <label className={styles.field} htmlFor="personal-reference-note">
          <span>
            Why are these connected? <span className={styles.optional}>(optional)</span>
          </span>
          <textarea
            className={styles.textarea}
            id="personal-reference-note"
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
            }}
            maxLength={5000}
            rows={3}
            disabled={busy || status !== 'ready'}
            placeholder="Your interpretation, theme, or reason for connecting these verses…"
          />
        </label>
        <div className={styles.footer}>
          {editing && (
            <button className={styles.textButton} type="button" onClick={resetEditor}>
              Cancel editing
            </button>
          )}
          <button
            className={styles.primaryButton}
            type="submit"
            disabled={busy || status !== 'ready'}
          >
            {editing ? 'Update cross-reference' : 'Add cross-reference'}
          </button>
        </div>
        {failure && (
          <p className={styles.error} role="alert">
            {failure}
          </p>
        )}
      </form>
    </section>
  );
}

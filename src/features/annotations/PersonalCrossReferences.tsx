import { useState } from 'react';
import { parseReference } from '../../core/bible/reference-parse.ts';
import { formatVerseRef } from '../../core/bible/reference-format.ts';
import { parseOsisId, toOsisId } from '../../core/bible/verse-ref.ts';
import { useLocalization } from '../../i18n/use-locale.tsx';
import type { VizData } from '../../visualizations/shared/viz-data.ts';
import { versePassage, type Passage } from '../../core/bible/passage.ts';
import { deletePersonalCrossReference, upsertPersonalCrossReference, useAnnotations } from './storage.ts';
import type { PersonalCrossReference } from './model.ts';

/** Both ends can discover a link; only one copy is saved and synced. */
export function PersonalCrossReferences({
  verseId, data, onSelect,
}: {
  readonly verseId: string;
  readonly data: VizData;
  readonly onSelect: (passage: Passage) => void;
}) {
  const { books } = useLocalization();
  const { crossReferences, status, error } = useAnnotations();
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const related = crossReferences.filter((link) =>
    link.fromVerseId === verseId || link.toVerseId === verseId,
  );
  const save = async () => {
    const parsed = parseReference(target, data.versification, books);
    if (!parsed.ok || parsed.reference.verse === undefined) {
      setFailure('Enter a valid verse, such as John 1:1.');
      return;
    }
    const toVerseId = toOsisId({ ...parsed.reference, verse: parsed.reference.verse });
    const prior = crossReferences.find((link) => link.id === editing);
    const fromVerseId = prior?.fromVerseId ?? verseId;
    if (toVerseId === fromVerseId) {
      setFailure('Choose a different verse.');
      return;
    }
    const now = new Date().toISOString();
    const link: PersonalCrossReference = {
      id: prior?.id ?? crypto.randomUUID(),
      fromVerseId, toVerseId, note: note.trim(),
      createdAt: prior?.createdAt ?? now, updatedAt: now,
    };
    setBusy(true);
    setFailure(null);
    try {
      await upsertPersonalCrossReference(link);
      setTarget('');
      setNote('');
      setEditing(null);
    } catch (e) {
      setFailure(e instanceof Error ? e.message : 'Could not save this link.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <section aria-label="My cross-references" style={{ display: 'grid', gap: 8 }}>
      <strong>My cross-references ({related.length})</strong>
      {status === 'unavailable' && <p role="alert">{error ?? 'Local storage unavailable.'}</p>}
      {related.map((link) => {
        const otherId = link.fromVerseId === verseId ? link.toVerseId : link.fromVerseId;
        const other = parseOsisId(otherId);
        const index = other && data.versification.indexOf(other);
        return (
          <div key={link.id} style={{ borderInlineStart: '3px dashed var(--color-accent)', paddingInlineStart: 8 }}>
            <button type="button" disabled={index === undefined} onClick={() => {
              if (index !== undefined) onSelect(versePassage(index));
            }}>
              {other ? formatVerseRef(other, books) : otherId} ↗
            </button>
            {link.note && <p style={{ margin: '4px 0', overflowWrap: 'anywhere' }}>{link.note}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" disabled={busy} onClick={() => {
                setEditing(link.id);
                const targetRef = parseOsisId(link.toVerseId);
                setTarget(targetRef ? formatVerseRef(targetRef, books) : link.toVerseId);
                setNote(link.note);
              }}>Edit</button>
              <button type="button" disabled={busy} onClick={() => {
                setBusy(true);
                void deletePersonalCrossReference(link.id).catch((e: unknown) => {
                  setFailure(e instanceof Error ? e.message : 'Could not delete this link.');
                }).finally(() => setBusy(false));
              }}>Delete</button>
            </div>
          </div>
        );
      })}
      <form onSubmit={(event) => { event.preventDefault(); void save(); }}
        style={{ display: 'grid', gap: 8 }}>
        <label htmlFor="personal-reference-target">Link to another verse</label>
        <input id="personal-reference-target" value={target} onChange={(event) => setTarget(event.target.value)}
          placeholder="John 1:1" required maxLength={90} disabled={busy || status !== 'ready'}
          style={{ width: '100%', boxSizing: 'border-box' }} />
        <label htmlFor="personal-reference-note">Why are these connected? (optional)</label>
        <textarea id="personal-reference-note" value={note} onChange={(event) => setNote(event.target.value)}
          maxLength={5000} rows={2} disabled={busy || status !== 'ready'} />
        <button type="submit" disabled={busy || status !== 'ready'}>
          {editing ? 'Update cross-reference' : 'Add cross-reference'}
        </button>
        {editing && <button type="button" onClick={() => {
          setEditing(null); setTarget(''); setNote('');
        }}>Cancel editing</button>}
        {failure && <p role="alert">{failure}</p>}
      </form>
    </section>
  );
}

import { useEffect, useSyncExternalStore } from 'react';
import {
  isCanonicalVerseId,
  isPersonalNote,
  mergeAnnotations,
  mergeHighlights,
  parseAnnotationsBackup,
  serializeAnnotationsBackup,
  type HighlightColor,
  type PersonalNote,
  type VerseHighlight,
} from './model.ts';

type StorageStatus = 'loading' | 'ready' | 'unavailable';

/** A cloud record is a note, highlight, or retained deletion tombstone. */
export interface CloudAnnotation {
  readonly kind: 'note' | 'highlight';
  readonly item_id: string;
  readonly verse_id: string;
  readonly body: string | null;
  readonly color: HighlightColor | null;
  readonly created_at: string;
  readonly updated_at: string;
  readonly deleted: boolean;
}
interface DeletionRecord extends CloudAnnotation {
  readonly id: string;
}
let tombstones: DeletionRecord[] = [];
const recordId = (kind: CloudAnnotation['kind'], id: string): string => `${kind}:${id}`;


export interface AnnotationSnapshot {
  readonly status: StorageStatus;
  readonly error: string | null;
  readonly notes: readonly PersonalNote[];
  readonly highlights: readonly VerseHighlight[];
}

let snapshot: AnnotationSnapshot = {
  status: 'loading',
  error: null,
  notes: [],
  highlights: [],
};
const listeners = new Set<() => void>();
let connection: Promise<IDBDatabase> | null = null;
let initialization: Promise<void> | null = null;
let pending: Promise<void> = Promise.resolve();

function publish(next: AnnotationSnapshot): void {
  snapshot = next;
  for (const listener of listeners) {
    listener();
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'Local storage could not save this change.';
}

function database(): Promise<IDBDatabase> {
  if (connection) {
    return connection;
  }
  connection = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable. Notes cannot be saved in this browser.'));
      return;
    }
    const request = indexedDB.open('bible-study-annotations', 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('highlights')) {
        db.createObjectStore('highlights', { keyPath: 'verseId' });
      }
      if (!db.objectStoreNames.contains('sync_deletions')) {
        db.createObjectStore('sync_deletions', { keyPath: 'id' });
      }
    };
    request.onerror = () => {
      reject(request.error ?? new Error('Cannot open annotations.'));
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        connection = null;
        publish({
          ...snapshot,
          status: 'unavailable',
          error: 'Storage upgraded in another tab. Reload this page.',
        });
      };
      resolve(db);
    };
    request.onblocked = () => {
      reject(new Error('Another tab is blocking an annotations storage upgrade.'));
    };
  });
  return connection;
}

function all<T>(db: IDBDatabase, name: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(name, 'readonly').objectStore(name).getAll();
    request.onsuccess = () => {
      resolve(request.result as T[]);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('Cannot read annotations.'));
    };
  });
}

function write(
  db: IDBDatabase,
  stores: readonly string[],
  change: (transaction: IDBTransaction) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([...stores], 'readwrite');
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('Storage transaction aborted.'));
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('Storage transaction failed.'));
    };
    try {
      change(transaction);
    } catch (error) {
      transaction.abort();
      reject(error instanceof Error ? error : new Error('Cannot complete storage operation.'));
    }
  });
}

async function reload(): Promise<void> {
  const db = await database();
  const [notes, highlights, deletions] = await Promise.all([
    all<PersonalNote>(db, 'notes'),
    all<VerseHighlight>(db, 'highlights'),
    all<DeletionRecord>(db, 'sync_deletions'),
  ]);
  tombstones = deletions;
  publish({ status: 'ready', error: null, notes, highlights });
}

/** Start lazily. A missing IndexedDB does not masquerade as successful in-memory saving. */
export function startAnnotations(): Promise<void> {
  initialization ??= reload().catch((error: unknown) => {
    publish({ ...snapshot, status: 'unavailable', error: message(error) });
  });
  return initialization;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function current(): AnnotationSnapshot {
  return snapshot;
}

/** Shared subscription means changes in Arcs, Threads and Notebook appear simultaneously. */
export function useAnnotations(): AnnotationSnapshot {
  const value = useSyncExternalStore(subscribe, current, current);
  useEffect(() => {
    void startAnnotations();
  }, []);
  return value;
}

async function requireDatabase(): Promise<IDBDatabase> {
  await startAnnotations();
  if (snapshot.status !== 'ready') {
    throw new Error(snapshot.error ?? 'Local annotations are unavailable.');
  }
  return database();
}

/** Serialize writes so two rapid edits cannot overwrite one another out of order. */
function enqueue(operation: (db: IDBDatabase) => Promise<void>, notify = true): Promise<void> {
  const job = pending.then(async () => {
    try {
      const db = await requireDatabase();
      await operation(db);
      await reload();
      if (notify && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('bible-annotations-changed'));
      }
    } catch (error) {
      publish({ ...snapshot, error: message(error) });
      throw error;
    }
  });
  pending = job.catch(() => undefined);
  return job;
}

export function setVerseHighlight(verseId: string, color: HighlightColor | null): Promise<void> {
  if (!isCanonicalVerseId(verseId)) {
    return Promise.reject(new Error('Invalid Bible verse reference.'));
  }
  return enqueue((db) =>
    write(db, ['highlights', 'sync_deletions'], (transaction) => {
      const store = transaction.objectStore('highlights');
      const deleted = transaction.objectStore('sync_deletions');
      const id = recordId('highlight', verseId);
      if (color === null) {
        store.delete(verseId);
        const prior = snapshot.highlights.find((entry) => entry.verseId === verseId);
        if (prior) {
          deleted.put({
            id, kind: 'highlight', item_id: verseId, verse_id: verseId,
            body: null, color: null, created_at: prior.updatedAt,
            updated_at: new Date().toISOString(), deleted: true,
          } satisfies DeletionRecord);
        }
      } else {
        deleted.delete(id);
        store.put({ verseId, color, updatedAt: new Date().toISOString() } satisfies VerseHighlight);
      }
    }),
  );
}

export function upsertPersonalNote(note: PersonalNote): Promise<void> {
  if (!isPersonalNote(note)) {
    return Promise.reject(new Error('A note must contain a valid verse and non-empty text.'));
  }
  return enqueue((db) =>
    write(db, ['notes', 'sync_deletions'], (transaction) => {
      transaction.objectStore('notes').put(note);
      transaction.objectStore('sync_deletions').delete(recordId('note', note.id));
    }),
  );
}

export function deletePersonalNote(id: string): Promise<void> {
  return enqueue((db) =>
    write(db, ['notes', 'sync_deletions'], (transaction) => {
      transaction.objectStore('notes').delete(id);
      const prior = snapshot.notes.find((entry) => entry.id === id);
      if (prior) {
        transaction.objectStore('sync_deletions').put({
          id: recordId('note', id), kind: 'note', item_id: id, verse_id: prior.verseId,
          body: null, color: null, created_at: prior.createdAt,
          updated_at: new Date().toISOString(), deleted: true,
        } satisfies DeletionRecord);
      }
    }),
  );
}

export async function exportAnnotations(): Promise<string> {
  await pending;
  await requireDatabase();
  return serializeAnnotationsBackup(snapshot.notes, snapshot.highlights);
}

/** Merge imports atomically; never destroy local records or replace newer timestamps. */
export async function importAnnotations(
  json: string,
): Promise<{ notes: number; highlights: number }> {
  const backup = parseAnnotationsBackup(json);
  await enqueue((db) => {
    const deleted = new Map(tombstones.map((entry) => [entry.id, entry.updated_at]));
    const notes = mergeAnnotations(snapshot.notes, backup.annotations).filter((note) => {
      const removedAt = deleted.get(recordId('note', note.id));
      return !removedAt || note.updatedAt > removedAt;
    });
    const highlights = mergeHighlights(snapshot.highlights, backup.highlights).filter((item) => {
      const removedAt = deleted.get(recordId('highlight', item.verseId));
      return !removedAt || item.updatedAt > removedAt;
    });
    return write(db, ['notes', 'highlights', 'sync_deletions'], (transaction) => {
      const noteStore = transaction.objectStore('notes');
      const highlightStore = transaction.objectStore('highlights');
      const removalStore = transaction.objectStore('sync_deletions');
      for (const note of notes) {
        noteStore.put(note);
        removalStore.delete(recordId('note', note.id));
      }
      for (const highlight of highlights) {
        highlightStore.put(highlight);
        removalStore.delete(recordId('highlight', highlight.verseId));
      }
    });
  });
  return { notes: backup.annotations.length, highlights: backup.highlights.length };
}

export function deleteAllAnnotations(): Promise<void> {
  return enqueue((db) =>
    write(db, ['notes', 'highlights', 'sync_deletions'], (transaction) => {
      const store = transaction.objectStore('sync_deletions');
      const now = new Date().toISOString();
      for (const note of snapshot.notes) {
        store.put({
          id: recordId('note', note.id), kind: 'note', item_id: note.id,
          verse_id: note.verseId, body: null, color: null,
          created_at: note.createdAt, updated_at: now, deleted: true,
        } satisfies DeletionRecord);
      }
      for (const highlight of snapshot.highlights) {
        store.put({
          id: recordId('highlight', highlight.verseId), kind: 'highlight',
          item_id: highlight.verseId, verse_id: highlight.verseId,
          body: null, color: null, created_at: highlight.updatedAt,
          updated_at: now, deleted: true,
        } satisfies DeletionRecord);
      }
      transaction.objectStore('notes').clear();
      transaction.objectStore('highlights').clear();
    }),
  );
}

/** Read all persisted local changes, including deletions, for cloud reconciliation. */
export async function exportCloudRecords(): Promise<CloudAnnotation[]> {
  await pending;
  await requireDatabase();
  const rows: CloudAnnotation[] = [
    ...snapshot.notes.map((note) => ({
      kind: 'note' as const, item_id: note.id, verse_id: note.verseId,
      body: note.body, color: null, created_at: note.createdAt,
      updated_at: note.updatedAt, deleted: false,
    })),
    ...snapshot.highlights.map((highlight) => ({
      kind: 'highlight' as const, item_id: highlight.verseId,
      verse_id: highlight.verseId, body: null, color: highlight.color,
      created_at: highlight.updatedAt, updated_at: highlight.updatedAt,
      deleted: false,
    })),
    ...tombstones,
  ];
  const latest = new Map<string, CloudAnnotation>();
  for (const row of rows) {
    const id = recordId(row.kind, row.item_id);
    const old = latest.get(id);
    if (!old || row.updated_at > old.updated_at) latest.set(id, row);
  }
  return [...latest.values()];
}

/** Apply newer remote updates inside one atomic IndexedDB transaction. */
export function applyCloudRecords(remote: readonly CloudAnnotation[]): Promise<void> {
  return enqueue(async (db) => {
    const local = new Map((await exportCloudRecordsUnsafe(db)).map((row) => [
      recordId(row.kind, row.item_id), row,
    ]));
    await write(db, ['notes', 'highlights', 'sync_deletions'], (transaction) => {
      const notes = transaction.objectStore('notes');
      const highlights = transaction.objectStore('highlights');
      const deletions = transaction.objectStore('sync_deletions');
      for (const row of remote) {
        if (!isCanonicalVerseId(row.verse_id) ||
            !Number.isFinite(Date.parse(row.updated_at))) continue;
        const id = recordId(row.kind, row.item_id);
        const previous = local.get(id);
        if (previous && previous.updated_at > row.updated_at) continue;
        if (row.deleted) {
          if (row.kind === 'note') notes.delete(row.item_id);
          else highlights.delete(row.item_id);
          deletions.put({ ...row, id } satisfies DeletionRecord);
        } else if (row.kind === 'note' && typeof row.body === 'string' &&
                   row.body.length > 0) {
          notes.put({
            id: row.item_id, verseId: row.verse_id, body: row.body,
            createdAt: row.created_at, updatedAt: row.updated_at,
          } satisfies PersonalNote);
          deletions.delete(id);
        } else if (row.kind === 'highlight' && row.color !== null) {
          highlights.put({
            verseId: row.verse_id, color: row.color, updatedAt: row.updated_at,
          } satisfies VerseHighlight);
          deletions.delete(id);
        }
      }
    });
  }, false);
}

async function exportCloudRecordsUnsafe(db: IDBDatabase): Promise<CloudAnnotation[]> {
  const [notes, highlights, deletions] = await Promise.all([
    all<PersonalNote>(db, 'notes'),
    all<VerseHighlight>(db, 'highlights'),
    all<DeletionRecord>(db, 'sync_deletions'),
  ]);
  return [
    ...notes.map((n) => ({
      kind: 'note' as const, item_id: n.id, verse_id: n.verseId,
      body: n.body, color: null, created_at: n.createdAt,
      updated_at: n.updatedAt, deleted: false,
    })),
    ...highlights.map((h) => ({
      kind: 'highlight' as const, item_id: h.verseId, verse_id: h.verseId,
      body: null, color: h.color, created_at: h.updatedAt,
      updated_at: h.updatedAt, deleted: false,
    })),
    ...deletions,
  ];
}

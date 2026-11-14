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
    const request = indexedDB.open('bible-study-annotations', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('highlights')) {
        db.createObjectStore('highlights', { keyPath: 'verseId' });
      }
    };
    request.onerror = () => reject(request.error ?? new Error('Cannot open annotations.'));
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        connection = null;
        publish({ ...snapshot, status: 'unavailable', error: 'Storage upgraded in another tab. Reload this page.' });
      };
      resolve(db);
    };
    request.onblocked = () => reject(new Error('Another tab is blocking an annotations storage upgrade.'));
  });
  return connection;
}

function all<T>(db: IDBDatabase, name: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const request = db.transaction(name, 'readonly').objectStore(name).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error ?? new Error('Cannot read annotations.'));
  });
}

function write(
  db: IDBDatabase,
  stores: readonly string[],
  change: (transaction: IDBTransaction) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([...stores], 'readwrite');
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error('Storage transaction aborted.'));
    transaction.onerror = () => reject(transaction.error ?? new Error('Storage transaction failed.'));
    try {
      change(transaction);
    } catch (error) {
      transaction.abort();
      reject(error);
    }
  });
}

async function reload(): Promise<void> {
  const db = await database();
  const [notes, highlights] = await Promise.all([
    all<PersonalNote>(db, 'notes'),
    all<VerseHighlight>(db, 'highlights'),
  ]);
  publish({ status: 'ready', error: null, notes, highlights });
}

/** Start lazily. A missing IndexedDB does not masquerade as successful in-memory saving. */
export function startAnnotations(): Promise<void> {
  if (!initialization) {
    initialization = reload().catch((error: unknown) => {
      publish({ ...snapshot, status: 'unavailable', error: message(error) });
    });
  }
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
function enqueue(operation: (db: IDBDatabase) => Promise<void>): Promise<void> {
  const job = pending.then(async () => {
    try {
      const db = await requireDatabase();
      await operation(db);
      await reload();
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
    write(db, ['highlights'], (transaction) => {
      const store = transaction.objectStore('highlights');
      if (color === null) {
        store.delete(verseId);
      } else {
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
    write(db, ['notes'], (transaction) => {
      transaction.objectStore('notes').put(note);
    }),
  );
}

export function deletePersonalNote(id: string): Promise<void> {
  return enqueue((db) =>
    write(db, ['notes'], (transaction) => {
      transaction.objectStore('notes').delete(id);
    }),
  );
}

export async function exportAnnotations(): Promise<string> {
  await pending;
  await requireDatabase();
  return serializeAnnotationsBackup(snapshot.notes, snapshot.highlights);
}

/** Merge imports atomically; never destroy local records or replace newer timestamps. */
export async function importAnnotations(json: string): Promise<{ notes: number; highlights: number }> {
  const backup = parseAnnotationsBackup(json);
  await enqueue((db) => {
    const notes = mergeAnnotations(snapshot.notes, backup.annotations);
    const highlights = mergeHighlights(snapshot.highlights, backup.highlights);
    return write(db, ['notes', 'highlights'], (transaction) => {
      const noteStore = transaction.objectStore('notes');
      const highlightStore = transaction.objectStore('highlights');
      for (const note of notes) {
        noteStore.put(note);
      }
      for (const highlight of highlights) {
        highlightStore.put(highlight);
      }
    });
  });
  return { notes: backup.annotations.length, highlights: backup.highlights.length };
}

export function deleteAllAnnotations(): Promise<void> {
  return enqueue((db) =>
    write(db, ['notes', 'highlights'], (transaction) => {
      transaction.objectStore('notes').clear();
      transaction.objectStore('highlights').clear();
    }),
  );
}

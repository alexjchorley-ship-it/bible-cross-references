import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { PersonalNote } from './model.ts';

const early = '2026-01-01T12:00:00.000Z';
const late = '2026-11-14T12:00:00.000Z';
const note: PersonalNote = {
  id: 'person-1',
  verseId: 'Gen.1.1',
  body: 'Creation: Hebrew אָרֶץ',
  createdAt: early,
  updatedAt: late,
};

type StoreName = 'notes' | 'highlights';

/** Minimal event-driven IndexedDB fixture: keep real transactions and asynchronous request order. */
function installIndexedDB() {
  const stores: Record<StoreName, Map<string, unknown>> = {
    notes: new Map(),
    highlights: new Map(),
  };
  const declared = new Set<string>();
  let failRead = false;
  let failWrite = false;
  let failOpen = false;
  let db: IDBDatabase | null = null;

  function request<T>(result: T, failure = false): IDBRequest<T> {
    const req = {
      result,
      error: failure ? new Error('Mock storage failure') : null,
      onsuccess: null as ((event: Event) => void) | null,
      onerror: null as ((event: Event) => void) | null,
    };
    queueMicrotask(() => {
      const callback = failure ? req.onerror : req.onsuccess;
      callback?.(new Event(failure ? 'error' : 'success'));
    });
    return req as unknown as IDBRequest<T>;
  }

  const database = {
    objectStoreNames: { contains: (name: string) => declared.has(name) },
    createObjectStore(name: string) {
      declared.add(name);
    },
    transaction(_names: string | string[], _mode: string) {
      const transaction = {
        error: null,
        oncomplete: null as ((event: Event) => void) | null,
        onabort: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        objectStore(name: string) {
          if (name !== 'notes' && name !== 'highlights') {
            throw new Error('Unknown store');
          }
          const map = stores[name];
          return {
            getAll() {
              return request([...map.values()], failRead);
            },
            put(value: unknown) {
              if (failWrite) {
                throw new Error('Disk quota exceeded');
              }
              if (typeof value !== 'object' || value === null) {
                throw new Error('Not an object');
              }
              const row = value as Record<string, unknown>;
              const key = name === 'notes' ? row['id'] : row['verseId'];
              if (typeof key !== 'string') {
                throw new Error('Missing key');
              }
              map.set(key, value);
            },
            delete(id: string) {
              map.delete(id);
            },
            clear() {
              map.clear();
            },
          };
        },
        abort() {
          queueMicrotask(() => { this.onabort?.(new Event('abort')); });
        },
      };
      queueMicrotask(() => {
        transaction.oncomplete?.(new Event('complete'));
      });
      return transaction as unknown as IDBTransaction;
    },
    onversionchange: null as ((event: Event) => void) | null,
    close: vi.fn(),
  };
  db = database as unknown as IDBDatabase;

  const factory = {
    open(_name: string, _version: number) {
      const handler = {
        result: db,
        error: failOpen ? new Error('Database denied') : null,
        onupgradeneeded: null as ((event: Event) => void) | null,
        onsuccess: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        onblocked: null as ((event: Event) => void) | null,
      };
      queueMicrotask(() => {
        if (failOpen) {
          handler.onerror?.(new Event('error'));
          return;
        }
        handler.onupgradeneeded?.(new Event('upgradeneeded'));
        handler.onsuccess?.(new Event('success'));
      });
      return handler as unknown as IDBOpenDBRequest;
    },
  };
  const spy = vi.spyOn(factory, 'open');
  vi.stubGlobal('indexedDB', factory);
  return {
    stores,
    spy,
    get database() {
      return database;
    },
    failRead() {
      failRead = true;
    },
    failWrite() {
      failWrite = true;
    },
    failOpen() {
      failOpen = true;
    },
  };
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('local-first verse annotation storage', () => {
  it('creates durable stores and persists, changes, then removes a highlight', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await store.startAnnotations();
    expect(fake.spy).toHaveBeenCalledWith('bible-study-annotations', 1);
    await store.setVerseHighlight('Gen.1.1', 'amber');
    expect(fake.stores.highlights.size).toBe(1);
    await store.setVerseHighlight('Gen.1.1', 'blue');
    expect(fake.stores.highlights.size).toBe(1);
    expect(JSON.parse(await store.exportAnnotations()).highlights).toEqual([
      { verseId: 'Gen.1.1', color: 'blue', updatedAt: expect.any(String) },
    ]);
    await store.setVerseHighlight('Gen.1.1', null);
    expect(fake.stores.highlights.size).toBe(0);
  });

  it('saves, edits and deletes notes without losing Unicode content', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await store.upsertPersonalNote(note);
    const draft = { ...note, body: 'Faith: γῆ', updatedAt: '2026-11-15T12:00:00.000Z' };
    await store.upsertPersonalNote(draft);
    expect(fake.stores.notes.get(note.id)).toEqual(draft);
    expect(JSON.parse(await store.exportAnnotations()).annotations).toEqual([draft]);
    await store.deletePersonalNote(note.id);
    expect(fake.stores.notes.size).toBe(0);
  });

  it('rejects invalid records, including non-canonical verses, before altering storage', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await expect(store.setVerseHighlight('Gen.1.900', 'blue')).rejects.toThrow('Invalid');
    await expect(store.upsertPersonalNote({ ...note, body: '' })).rejects.toThrow('note must');
    expect(fake.stores.notes.size).toBe(0);
    expect(fake.stores.highlights.size).toBe(0);
  });

  it('validates and merges a backup idempotently while preserving newer local edits', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await store.upsertPersonalNote(note);
    await store.setVerseHighlight('Gen.1.1', 'green');
    const older = { ...note, body: 'Old note', updatedAt: early };
    const second = { ...note, id: 'person-2', verseId: 'John.3.16' };
    const backup = JSON.stringify({
      format: 'bible-study-annotations',
      schemaVersion: 1,
      exportedAt: late,
      appVersion: '1.0',
      annotations: [older, second],
      highlights: [{ verseId: 'Gen.1.1', color: 'pink', updatedAt: early }],
    });
    await expect(store.importAnnotations(backup)).resolves.toEqual({ notes: 2, highlights: 1 });
    await store.importAnnotations(backup);
    expect(fake.stores.notes.size).toBe(2);
    expect(fake.stores.notes.get(note.id)).toEqual(note);
    const parsed = JSON.parse(await store.exportAnnotations()) as {
      highlights: Array<{ color: string }>;
    };
    expect(parsed.highlights[0]?.color).toBe('green');
    await expect(store.importAnnotations('{}')).rejects.toThrow('backup');
    expect(fake.stores.notes.size).toBe(2);
  });

  it('requires confirmation in the caller and deletes both stores on clear', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await store.upsertPersonalNote(note);
    await store.setVerseHighlight('Gen.1.1', 'amber');
    await store.deleteAllAnnotations();
    expect(fake.stores.notes.size).toBe(0);
    expect(fake.stores.highlights.size).toBe(0);
  });

  it('does not claim a note was saved when browser storage is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const store = await import('./storage.ts');
    await store.startAnnotations();
    await expect(store.upsertPersonalNote(note)).rejects.toThrow('unavailable');
    await expect(store.exportAnnotations()).rejects.toThrow('unavailable');
  });

  it('surfaces quota/write failures instead of silently losing the text', async () => {
    const fake = installIndexedDB();
    fake.failWrite();
    const store = await import('./storage.ts');
    await expect(store.upsertPersonalNote(note)).rejects.toThrow('Disk quota exceeded');
    expect(fake.stores.notes.size).toBe(0);
  });

  it('shows reads and opening errors rather than replacing local data', async () => {
    const fake = installIndexedDB();
    fake.failOpen();
    const store = await import('./storage.ts');
    await store.startAnnotations();
    await expect(store.exportAnnotations()).rejects.toThrow('Database denied');
    expect(fake.stores.notes.size).toBe(0);
  });

  it('refreshes React subscriptions after a durable IndexedDB transaction', async () => {
    installIndexedDB();
    const storage = await import('./storage.ts');
    function LiveState() {
      const state = storage.useAnnotations();
      return <output>{String(state.notes.length)}:{state.status}</output>;
    }
    render(<LiveState />);
    await storage.startAnnotations();
    await storage.upsertPersonalNote(note);
    expect(await screen.findByText('1:ready')).toBeDefined();
  });
});

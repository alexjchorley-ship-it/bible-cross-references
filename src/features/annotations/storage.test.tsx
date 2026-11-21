import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseAnnotationsBackup, type PersonalNote } from './model.ts';

const early = '2026-01-01T12:00:00.000Z';
const late = '2026-11-14T12:00:00.000Z';
const note: PersonalNote = {
  id: 'person-1',
  verseId: 'Gen.1.1',
  body: 'Creation: Hebrew אָרֶץ',
  createdAt: early,
  updatedAt: late,
};

type StoreName =
  'notes' | 'highlights' | 'bookmarks' | 'labels' | 'cross_references' | 'sync_deletions';

/** Minimal event-driven IndexedDB fixture: keep real transactions and asynchronous request order. */
function installIndexedDB() {
  const stores: Record<StoreName, Map<string, unknown>> = {
    notes: new Map(),
    highlights: new Map(),
    bookmarks: new Map(),
    labels: new Map(),
    cross_references: new Map(),
    sync_deletions: new Map(),
  };
  const declared = new Set<string>();
  let failRead = false;
  let failWrite = false;
  let failOpen = false;
  let blockOpen = false;
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
    transaction() {
      const transaction = {
        error: null,
        oncomplete: null as ((event: Event) => void) | null,
        onabort: null as ((event: Event) => void) | null,
        onerror: null as ((event: Event) => void) | null,
        objectStore(name: string) {
          if (
            name !== 'notes' &&
            name !== 'highlights' &&
            name !== 'bookmarks' &&
            name !== 'labels' &&
            name !== 'cross_references' &&
            name !== 'sync_deletions'
          ) {
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
              const key =
                name === 'notes' ||
                name === 'sync_deletions' ||
                name === 'labels' ||
                name === 'cross_references'
                  ? row['id']
                  : name === 'bookmarks'
                    ? row['color']
                    : row['verseId'];
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
          queueMicrotask(() => {
            this.onabort?.(new Event('abort'));
          });
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
    open() {
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
        if (blockOpen) {
          handler.onblocked?.(new Event('blocked'));
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
    blockOpen() {
      blockOpen = true;
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
    expect(fake.spy).toHaveBeenCalledWith('bible-study-annotations', 5);
    await store.setVerseHighlight('Gen.1.1', 'amber');
    expect(fake.stores.highlights.size).toBe(1);
    await store.setVerseHighlight('Gen.1.1', 'blue');
    expect(fake.stores.highlights.size).toBe(1);
    const highlights = parseAnnotationsBackup(await store.exportAnnotations()).highlights;
    expect(highlights).toHaveLength(1);
    expect(highlights[0]?.verseId).toBe('Gen.1.1');
    expect(highlights[0]?.color).toBe('blue');
    expect(typeof highlights[0]?.updatedAt).toBe('string');
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
    expect(parseAnnotationsBackup(await store.exportAnnotations()).annotations).toEqual([draft]);
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
      highlights: { color: string }[];
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
    const { render, screen } = await import('@testing-library/react/pure');
    function LiveState() {
      const state = storage.useAnnotations();
      return (
        <output>
          {String(state.notes.length)}:{state.status}
        </output>
      );
    }
    render(<LiveState />);
    await storage.startAnnotations();
    await storage.upsertPersonalNote(note);
    expect(await screen.findByText('1:ready')).toBeDefined();
  });
  it('reports a blocked upgrade instead of silently treating storage as ready', async () => {
    const fake = installIndexedDB();
    fake.blockOpen();
    const store = await import('./storage.ts');
    await store.startAnnotations();
    await expect(store.exportAnnotations()).rejects.toThrow('blocking');
  });

  it('closes the old database when another tab starts a schema upgrade', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await store.startAnnotations();
    fake.database.onversionchange?.(new Event('versionchange'));
    expect(fake.database.close).toHaveBeenCalledOnce();
    await expect(store.exportAnnotations()).rejects.toThrow('Storage upgraded');
  });

  it('surfaces a failed database read before allowing new annotations', async () => {
    const fake = installIndexedDB();
    fake.failRead();
    const store = await import('./storage.ts');
    await store.startAnnotations();
    await expect(store.exportAnnotations()).rejects.toThrow('Mock storage failure');
  });
});

describe('cloud-ready IndexedDB migration and tombstones', () => {
  it('exports local notes and highlights and retains both deletions', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await store.upsertPersonalNote(note);
    await store.setVerseHighlight('Gen.1.1', 'amber');
    expect((await store.exportCloudRecords()).filter((row) => !row.deleted)).toHaveLength(2);
    await store.deletePersonalNote(note.id);
    await store.setVerseHighlight('Gen.1.1', null);
    const records = await store.exportCloudRecords();
    expect(records).toHaveLength(2);
    expect(records.every((row) => row.deleted)).toBe(true);
    expect(fake.stores.sync_deletions.size).toBe(2);
  });

  it('merges newer cloud records without destroying newer local notes', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.upsertPersonalNote(note);
    const old = {
      kind: 'note' as const,
      item_id: note.id,
      verse_id: note.verseId,
      body: 'Older remote note',
      color: null,
      created_at: early,
      updated_at: early,
      deleted: false,
    };
    await store.applyCloudRecords([old]);
    expect(parseAnnotationsBackup(await store.exportAnnotations()).annotations[0]?.body).toBe(
      note.body,
    );
    const fresh = { ...old, body: 'Changed on the phone', updated_at: '2026-12-01T12:00:00Z' };
    await store.applyCloudRecords([fresh]);
    expect(parseAnnotationsBackup(await store.exportAnnotations()).annotations[0]?.body).toBe(
      'Changed on the phone',
    );
  });

  it('applies remote deletion and prevents an old backup from reviving a deleted note', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.upsertPersonalNote(note);
    await store.applyCloudRecords([
      {
        kind: 'note',
        item_id: note.id,
        verse_id: note.verseId,
        body: null,
        color: null,
        created_at: early,
        updated_at: '2026-12-01T12:00:00Z',
        deleted: true,
      },
    ]);
    expect(parseAnnotationsBackup(await store.exportAnnotations()).annotations).toHaveLength(0);
    const oldBackup = JSON.stringify({
      format: 'bible-study-annotations',
      schemaVersion: 1,
      exportedAt: late,
      appVersion: '1.0',
      annotations: [note],
      highlights: [],
    });
    await store.importAnnotations(oldBackup);
    expect(parseAnnotationsBackup(await store.exportAnnotations()).annotations).toHaveLength(0);
    expect((await store.exportCloudRecords())[0]?.deleted).toBe(true);
  });

  it('leaves local data intact when cloud returns an invalid verse', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.upsertPersonalNote(note);
    await store.applyCloudRecords([
      {
        kind: 'note',
        item_id: note.id,
        verse_id: 'Gen.900.1',
        body: 'Not a verse',
        color: null,
        created_at: early,
        updated_at: '2026-12-01T12:00:00Z',
        deleted: false,
      },
    ]);
    expect(parseAnnotationsBackup(await store.exportAnnotations()).annotations[0]?.body).toBe(
      note.body,
    );
  });

  it('retains tombstones for delete-all so another device cannot restore stale data', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.upsertPersonalNote(note);
    await store.setVerseHighlight('Gen.1.1', 'blue');
    await store.deleteAllAnnotations();
    const records = await store.exportCloudRecords();
    expect(records).toHaveLength(2);
    expect(records.every((row) => row.deleted)).toBe(true);
    expect(parseAnnotationsBackup(await store.exportAnnotations()).annotations).toEqual([]);
  });
});

describe('one-per-colour reading bookmarks', () => {
  it('moves only the selected colour and retains other reading positions', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await store.setReadingBookmark('green', 'Gen.1.1');
    await store.setReadingBookmark('amber', 'John.3.16');
    await store.setReadingBookmark('green', 'Exod.3.14');
    const backup = parseAnnotationsBackup(await store.exportAnnotations());
    expect(backup.bookmarks).toHaveLength(2);
    expect(backup.bookmarks?.find((b) => b.color === 'green')?.verseId).toBe('Exod.3.14');
    expect(backup.bookmarks?.find((b) => b.color === 'amber')?.verseId).toBe('John.3.16');
    expect(fake.stores.bookmarks.size).toBe(2);
    await store.setReadingBookmark('green', null);
    expect(fake.stores.bookmarks.size).toBe(1);
    expect(
      (await store.exportCloudRecords()).find((r) => r.kind === 'bookmark' && r.item_id === 'green')
        ?.deleted,
    ).toBe(true);
  });

  it('uses a cloud bookmark to replace only its own colour when it is newer', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.setReadingBookmark('amber', 'Gen.1.1');
    await store.setReadingBookmark('green', 'John.3.16');
    await store.applyCloudRecords([
      {
        kind: 'bookmark',
        item_id: 'green',
        verse_id: 'Rev.22.21',
        body: null,
        color: 'green',
        created_at: late,
        updated_at: '2027-01-01T00:00:00.000Z',
        deleted: false,
      },
    ]);
    const bookmarks = parseAnnotationsBackup(await store.exportAnnotations()).bookmarks;
    expect(bookmarks?.find((r) => r.color === 'green')?.verseId).toBe('Rev.22.21');
    expect(bookmarks?.find((r) => r.color === 'amber')?.verseId).toBe('Gen.1.1');
  });

  it('imports older v1 backups without deleting modern bookmarks', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.setReadingBookmark('green', 'John.3.16');
    await store.importAnnotations(
      JSON.stringify({
        format: 'bible-study-annotations',
        schemaVersion: 1,
        exportedAt: late,
        appVersion: '1.0',
        annotations: [],
        highlights: [],
      }),
    );
    expect(parseAnnotationsBackup(await store.exportAnnotations()).bookmarks?.[0]?.verseId).toBe(
      'John.3.16',
    );
  });
});

describe('bookmark cloud deletion and backup safety', () => {
  it('deletes all four colour positions with durable cloud tombstones', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await store.setReadingBookmark('green', 'Gen.1.1');
    await store.setReadingBookmark('amber', 'John.3.16');
    await store.setReadingBookmark('blue', 'Rev.22.21');
    await store.deleteAllAnnotations();
    expect(fake.stores.bookmarks.size).toBe(0);
    const remote = (await store.exportCloudRecords()).filter((entry) => entry.kind === 'bookmark');
    expect(remote).toHaveLength(3);
    expect(remote.every((entry) => entry.deleted)).toBe(true);
  });

  it('applies a newer remote bookmark deletion without reviving an older one', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.setReadingBookmark('green', 'Gen.1.1');
    const now = '2028-01-01T00:00:00.000Z';
    await store.applyCloudRecords([
      {
        kind: 'bookmark',
        item_id: 'green',
        verse_id: 'Gen.1.1',
        body: null,
        color: 'green',
        created_at: now,
        updated_at: now,
        deleted: true,
      },
    ]);
    expect(parseAnnotationsBackup(await store.exportAnnotations()).bookmarks).toEqual([]);
    expect(
      (await store.exportCloudRecords()).find((entry) => entry.kind === 'bookmark')?.deleted,
    ).toBe(true);
  });

  it('imports new bookmark colours without erasing existing different colours', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.setReadingBookmark('amber', 'Gen.1.1');
    const backup = JSON.stringify({
      format: 'bible-study-annotations',
      schemaVersion: 2,
      exportedAt: late,
      appVersion: '1.0',
      annotations: [],
      highlights: [],
      bookmarks: [{ color: 'pink', verseId: 'John.3.16', updatedAt: late }],
    });
    await store.importAnnotations(backup);
    const bookmarks = parseAnnotationsBackup(await store.exportAnnotations()).bookmarks;
    expect(bookmarks).toHaveLength(2);
    expect(bookmarks?.find((item) => item.color === 'amber')?.verseId).toBe('Gen.1.1');
    expect(bookmarks?.find((item) => item.color === 'pink')?.verseId).toBe('John.3.16');
  });

  it('rejects malformed bookmark positions without touching stored data', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await expect(store.setReadingBookmark('amber', 'Gen.0.999')).rejects.toThrow('Invalid');
    expect(fake.stores.bookmarks.size).toBe(0);
  });
});

describe('colour label and note metadata persistence', () => {
  it('keeps a name for each colour purpose independent and cloud-exportable', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    await store.setColorLabel('highlight:green', 'Pray about this');
    await store.setColorLabel('bookmark:green', 'My Bible study');
    const cloud = await store.exportCloudRecords();
    expect(cloud.filter((item) => item.kind === 'label')).toHaveLength(2);
    expect(fake.stores.labels.size).toBe(2);
    const backup = parseAnnotationsBackup(await store.exportAnnotations());
    expect(backup.labels?.map((item) => item.name)).toEqual(['Pray about this', 'My Bible study']);
  });

  it('stores custom categories and titles in backups and in cloud records', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.upsertPersonalNote({ ...note, category: 'Prayer', title: 'My question' });
    const backup = parseAnnotationsBackup(await store.exportAnnotations());
    expect(backup.annotations[0]?.category).toBe('Prayer');
    expect(backup.annotations[0]?.title).toBe('My question');
    const remote = (await store.exportCloudRecords()).find((item) => item.kind === 'note');
    expect(remote?.category).toBe('Prayer');
    expect(remote?.title).toBe('My question');
  });

  it('applies categories and edited colour labels received from another device', async () => {
    installIndexedDB();
    const store = await import('./storage.ts');
    await store.applyCloudRecords([
      {
        kind: 'label',
        item_id: 'highlight:blue',
        verse_id: 'Gen.1.1',
        body: "God's promises",
        color: null,
        created_at: late,
        updated_at: late,
        deleted: false,
      },
      {
        kind: 'note',
        item_id: 'remote-note',
        verse_id: 'John.3.16',
        body: 'God loves the world',
        color: null,
        category: 'Sermon',
        title: 'Sunday message',
        created_at: late,
        updated_at: late,
        deleted: false,
      },
    ]);
    const backup = parseAnnotationsBackup(await store.exportAnnotations());
    expect(backup.labels?.[0]?.name).toBe("God's promises");
    expect(backup.annotations[0]?.category).toBe('Sermon');
  });
});

describe('safe colour meaning updates across devices', () => {
  it('imports independently named colours from another full JSON backup', async () => {
    installIndexedDB();
    const storage = await import('./storage.ts');
    await storage.setColorLabel('highlight:amber', 'Original');
    const backup = JSON.stringify({
      format: 'bible-study-annotations',
      schemaVersion: 3,
      exportedAt: late,
      appVersion: '1.0',
      annotations: [],
      highlights: [],
      bookmarks: [],
      labels: [
        { id: 'highlight:amber', name: 'Miracles', updatedAt: '2030-01-01T00:00:00Z' },
        { id: 'bookmark:amber', name: 'Study group', updatedAt: '2030-01-01T00:00:00Z' },
      ],
    });
    await storage.importAnnotations(backup);
    const labels = parseAnnotationsBackup(await storage.exportAnnotations()).labels ?? [];
    expect(labels.find((item) => item.id === 'highlight:amber')?.name).toBe('Miracles');
    expect(labels.find((item) => item.id === 'bookmark:amber')?.name).toBe('Study group');
  });

  it('rejects empty colour meaning names before they are stored', async () => {
    const fake = installIndexedDB();
    const storage = await import('./storage.ts');
    await expect(storage.setColorLabel('highlight:green', '  ')).rejects.toThrow('Invalid');
    await expect(storage.setColorLabel('bad:red', 'Something')).rejects.toThrow('Invalid');
    expect(fake.stores.labels.size).toBe(0);
  });

  it('deletes personal labels and retains their tombstones on clear-all', async () => {
    const fake = installIndexedDB();
    const storage = await import('./storage.ts');
    await storage.setColorLabel('highlight:amber', 'Miracles');
    await storage.setColorLabel('bookmark:blue', 'Personal reading');
    await storage.deleteAllAnnotations();
    expect(fake.stores.labels.size).toBe(0);
    const removed = (await storage.exportCloudRecords()).filter((item) => item.kind === 'label');
    expect(removed).toHaveLength(2);
    expect(removed.every((item) => item.deleted)).toBe(true);
  });

  it('applies a later remote label deletion but not stale label changes', async () => {
    installIndexedDB();
    const storage = await import('./storage.ts');
    await storage.setColorLabel('highlight:green', 'Pray about it');
    const latest = '2030-01-01T00:00:00Z';
    await storage.applyCloudRecords([
      {
        kind: 'label',
        item_id: 'highlight:green',
        verse_id: 'Gen.1.1',
        color: null,
        body: null,
        created_at: latest,
        updated_at: latest,
        deleted: true,
      },
    ]);
    expect(parseAnnotationsBackup(await storage.exportAnnotations()).labels).toEqual([]);
    await storage.applyCloudRecords([
      {
        kind: 'label',
        item_id: 'highlight:green',
        verse_id: 'Gen.1.1',
        color: null,
        body: 'Old meaning',
        created_at: early,
        updated_at: early,
        deleted: false,
      },
    ]);
    expect(parseAnnotationsBackup(await storage.exportAnnotations()).labels).toEqual([]);
  });

  it('ignores remote labels with invalid IDs or empty meanings', async () => {
    const fake = installIndexedDB();
    const storage = await import('./storage.ts');
    await storage.applyCloudRecords([
      {
        kind: 'label',
        item_id: 'wrong:green',
        verse_id: 'Gen.1.1',
        color: null,
        body: 'Something',
        created_at: late,
        updated_at: late,
        deleted: false,
      },
      {
        kind: 'label',
        item_id: 'bookmark:green',
        verse_id: 'Gen.1.1',
        color: null,
        body: '',
        created_at: late,
        updated_at: late,
        deleted: false,
      },
    ]);
    expect(fake.stores.labels.size).toBe(0);
  });
});

describe('local personal cross-reference persistence', () => {
  it('saves, exports, synchronizes and removes a reader-created link', async () => {
    const fake = installIndexedDB();
    const store = await import('./storage.ts');
    const link = {
      id: 'my-link',
      fromVerseId: 'Gen.1.1',
      toVerseId: 'John.1.1',
      note: 'Both describe creation',
      createdAt: early,
      updatedAt: late,
    };
    await store.startAnnotations();
    await store.upsertPersonalCrossReference(link);
    expect(fake.stores.cross_references.size).toBe(1);
    expect(parseAnnotationsBackup(await store.exportAnnotations()).crossReferences).toEqual([link]);
    expect(
      (await store.exportCloudRecords()).some(
        (row) => row.kind === 'cross-reference' && row.title === 'John.1.1',
      ),
    ).toBe(true);
    await store.deletePersonalCrossReference(link.id);
    expect(fake.stores.cross_references.size).toBe(0);
    expect(
      (await store.exportCloudRecords()).some(
        (row) => row.kind === 'cross-reference' && row.deleted,
      ),
    ).toBe(true);
  });
});

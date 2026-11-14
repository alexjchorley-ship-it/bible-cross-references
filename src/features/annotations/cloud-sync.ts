import { cloudRequest, cloudSession } from './cloud-auth.ts';
import {
  applyCloudRecords,
  exportCloudRecords,
  type CloudAnnotation,
} from './storage.ts';

const COLUMNS = 'kind,item_id,verse_id,body,color,created_at,updated_at,deleted';
let activeSync: Promise<void> | null = null;

function isCloudAnnotation(row: unknown): row is CloudAnnotation {
  if (!row || typeof row !== 'object') return false;
  const data = row as Partial<CloudAnnotation>;
  return (data.kind === 'note' || data.kind === 'highlight') &&
    typeof data.item_id === 'string' && typeof data.verse_id === 'string' &&
    typeof data.created_at === 'string' && typeof data.updated_at === 'string' &&
    typeof data.deleted === 'boolean' &&
    (data.body === null || typeof data.body === 'string') &&
    (data.color === null || data.color === 'amber' || data.color === 'green' ||
      data.color === 'blue' || data.color === 'pink');
}

async function fetchRemote(): Promise<CloudAnnotation[]> {
  const rows: CloudAnnotation[] = [];
  // PostgREST limits responses per request: fetch pages rather than silently
  // dropping older notes when the notebook grows.
  for (let offset = 0; offset < 100000; offset += 500) {
    const result = await cloudRequest(
      `/rest/v1/bible_annotations?select=${COLUMNS}&order=updated_at.asc,kind.asc,item_id.asc&limit=500&offset=${offset}`,
    );
    if (!Array.isArray(result) || !result.every(isCloudAnnotation)) {
      throw new Error('Cloud returned unexpected annotation data.');
    }
    rows.push(...result);
    if (result.length < 500) return rows;
  }
  throw new Error('Cloud returned too many annotations for a safe full sync.');
}

async function reconcile(): Promise<void> {
  // Local IndexedDB is not partitioned by account: never mix two users' data.
  const id = cloudSession()?.user.id;
  if (!id) throw new Error('Sign in to synchronise annotations.');
  const ownerKey = 'bible-study-cloud-owner';
  const storedOwner = localStorage.getItem(ownerKey);
  if (storedOwner && storedOwner !== id) {
    throw new Error('This browser contains another cloud account. Export a backup and use a separate browser profile.');
  }
  if (!storedOwner) localStorage.setItem(ownerKey, id);

  // First ingest newer remote changes, then push local records and tombstones.
  // The SQL RPC only accepts changes newer than what is already in the database.
  await applyCloudRecords(await fetchRemote());
  const changes = await exportCloudRecords();
  for (let index = 0; index < changes.length; index += 200) {
    await cloudRequest('/rest/v1/rpc/merge_bible_annotations', {
      method: 'POST',
      body: JSON.stringify({ changes: changes.slice(index, index + 200) }),
    });
  }
  // A second read picks up any server-side conflict winners.
  await applyCloudRecords(await fetchRemote());
}

/** Reentrant-safe; IndexedDB always remains the first destination for edits. */
export function syncCloudAnnotations(): Promise<void> {
  activeSync ??= reconcile().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

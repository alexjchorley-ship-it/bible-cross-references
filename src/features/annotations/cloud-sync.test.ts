import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as cloud from './cloud-auth.ts';
import * as storage from './storage.ts';
import { syncCloudAnnotations } from './cloud-sync.ts';

vi.mock('./cloud-auth.ts', () => ({
  cloudSession: vi.fn(),
  cloudRequest: vi.fn(),
}));
vi.mock('./storage.ts', () => ({
  applyCloudRecords: vi.fn(() => Promise.resolve()),
  exportCloudRecords: vi.fn(() => Promise.resolve([])),
}));

const date = '2026-11-14T10:00:00.000Z';
const row = {
  kind: 'note' as const,
  item_id: 'note-1',
  verse_id: 'Gen.1.1',
  body: 'Hello from desktop',
  color: null,
  created_at: date,
  updated_at: date,
  deleted: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(cloud.cloudSession).mockReturnValue({
    access_token: 'test',
    refresh_token: 'refresh',
    expires_at: Date.now() + 90000,
    user: { id: 'user-1', email: 'test@example.com' },
  });
  vi.mocked(cloud.cloudRequest).mockImplementation((path) => {
    if (path.startsWith('/rest/v1/bible_annotations')) return Promise.resolve([row]);
    return Promise.resolve(1);
  });
});

describe('cloud reconciliation', () => {
  it('pulls remote notes before pushing local records, then verifies the final state', async () => {
    vi.mocked(storage.exportCloudRecords).mockResolvedValue([row]);
    await syncCloudAnnotations();
    expect(storage.applyCloudRecords).toHaveBeenCalledTimes(2);
    expect(storage.applyCloudRecords).toHaveBeenCalledWith([row]);
    expect(cloud.cloudRequest).toHaveBeenCalledWith(
      '/rest/v1/rpc/merge_bible_annotations',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ changes: [row] }) }),
    );
    expect(localStorage.getItem('bible-study-cloud-owner')).toBe('user-1');
  });

  it('does not cross-contaminate another signed-in user', async () => {
    localStorage.setItem('bible-study-cloud-owner', 'user-2');
    await expect(syncCloudAnnotations()).rejects.toThrow('another cloud account');
    expect(storage.applyCloudRecords).not.toHaveBeenCalled();
  });

  it('does not synchronise without a valid session', async () => {
    vi.mocked(cloud.cloudSession).mockReturnValue(null);
    await expect(syncCloudAnnotations()).rejects.toThrow('Sign in');
  });

  it('rejects malformed server data instead of overwriting local annotations', async () => {
    vi.mocked(cloud.cloudRequest).mockResolvedValueOnce([{ bad: 'record' }]);
    await expect(syncCloudAnnotations()).rejects.toThrow('unexpected annotation');
    expect(storage.applyCloudRecords).not.toHaveBeenCalled();
  });

  it('keeps remote failures visible so retry can succeed', async () => {
    vi.mocked(cloud.cloudRequest).mockRejectedValueOnce(new Error('Offline'));
    await expect(syncCloudAnnotations()).rejects.toThrow('Offline');
    await expect(syncCloudAnnotations()).resolves.toBeUndefined();
  });
});

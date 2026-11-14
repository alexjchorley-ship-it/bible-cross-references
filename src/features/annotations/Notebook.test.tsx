import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as storage from './storage.ts';
import { Notebook } from './Notebook.tsx';

vi.mock('./storage.ts', () => ({
  useAnnotations: vi.fn(),
  exportAnnotations: vi.fn(() => Promise.resolve('{}')),
  importAnnotations: vi.fn(() => Promise.resolve({ notes: 1, highlights: 1 })),
  deleteAllAnnotations: vi.fn(() => Promise.resolve(undefined)),
}));

const now = '2026-11-14T12:00:00.000Z';
const snapshot = {
  status: 'ready' as const,
  error: null,
  notes: [
    { id: 'a', verseId: 'Gen.1.1', body: 'First light', createdAt: now, updatedAt: now },
    { id: 'b', verseId: 'John.3.16', body: 'God so loved', createdAt: now, updatedAt: now },
  ],
  highlights: [
    { verseId: 'Gen.1.1', color: 'amber' as const, updatedAt: now },
    { verseId: 'John.3.16', color: 'green' as const, updatedAt: now },
  ],
};

describe('searchable and exportable personal notebook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(storage.useAnnotations).mockReturnValue(snapshot);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('groups notes by canonical verse and searches both references and text', async () => {
    const onOpenVerse = vi.fn();
    const onClose = vi.fn();
    render(<Notebook open onClose={onClose} onOpenVerse={onOpenVerse} />);
    expect(screen.getByText('Gen 1 1')).toBeDefined();
    expect(screen.getByText('John 3 16')).toBeDefined();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search your notes…' }), 'loved');
    expect(screen.queryByText('First light')).toBeNull();
    expect(screen.getByText('God so loved')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'Open verse' }));
    expect(onOpenVerse).toHaveBeenCalledWith('John.3.16');
    expect(onClose).toHaveBeenCalled();
  });

  it('filters by highlight colour without deleting notes', async () => {
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Highlight' }), 'green');
    expect(screen.getByText('John 3 16')).toBeDefined();
    expect(screen.queryByText('Gen 1 1')).toBeNull();
  });

  it('provides an explicit confirmation before clearing both stores', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete all annotations' }));
    expect(storage.deleteAllAnnotations).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    await userEvent.click(screen.getByRole('button', { name: 'Delete all annotations' }));
    expect(storage.deleteAllAnnotations).toHaveBeenCalledTimes(1);
  });

  it('offers a safe JSON download without contacting any account', async () => {
    const makeUrl = vi.fn(() => 'blob:bible-test');
    const releaseUrl = vi.fn();
    const existingURL = URL;
    vi.stubGlobal(
      'URL',
      Object.assign(class extends existingURL {}, {
        createObjectURL: makeUrl,
        revokeObjectURL: releaseUrl,
      }),
    );
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Export backup' }));
    await waitFor(() => {
      expect(storage.exportAnnotations).toHaveBeenCalledOnce();
      expect(makeUrl).toHaveBeenCalledOnce();
    });
  });

  it('rejects backups without required schema data before import', async () => {
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    const file = new File(['{}'], 'broken.json', { type: 'application/json' });
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('File upload missing.');
    await userEvent.upload(input, file);
    await waitFor(() => {
      expect(screen.getByText(/not a supported Bible Study annotations backup/)).toBeDefined();
    });
    expect(storage.importAnnotations).not.toHaveBeenCalled();
  });

  it('does not allow importing or exporting when IndexedDB is unavailable', () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
      ...snapshot,
      status: 'unavailable',
      error: 'Disk denied.',
    });
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    expect(screen.getByText('Disk denied.')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Export backup' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: 'Import backup' }).hasAttribute('disabled')).toBe(
      true,
    );
  });
});

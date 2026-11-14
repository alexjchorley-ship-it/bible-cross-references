import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as storage from './storage.ts';
import { Notebook } from './Notebook.tsx';

vi.mock('./storage.ts', () => ({
  useAnnotations: vi.fn(),
  exportAnnotations: vi.fn(() => Promise.resolve('{}')),
  importAnnotations: vi.fn(() => Promise.resolve({ notes: 1, highlights: 1 })),
  deleteAllAnnotations: vi.fn(() => Promise.resolve(undefined)),
  setReadingBookmark: vi.fn(() => Promise.resolve(undefined)),
}));

const now = '2026-11-14T12:00:00.000Z';
const snapshot = {
  status: 'ready' as const,
  error: null,
  notes: [
    { id: 'a', verseId: 'Gen.1.1', body: 'First light', createdAt: now, updatedAt: now },
    { id: 'b', verseId: 'John.3.16', body: 'God so loved', createdAt: now, updatedAt: now },
  ],
  bookmarks: [],
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
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
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

  it('imports a valid backup only after showing the record counts', async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal('confirm', confirm);
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    const backup = {
      format: 'bible-study-annotations',
      schemaVersion: 1,
      exportedAt: now,
      appVersion: '1.0',
      annotations: snapshot.notes,
      highlights: snapshot.highlights,
    };
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      throw new Error('Missing backup input');
    }
    await userEvent.upload(
      input,
      new File([JSON.stringify(backup)], 'study-notes.json', { type: 'application/json' }),
    );
    await waitFor(() => {
      expect(storage.importAnnotations).toHaveBeenCalledWith(JSON.stringify(backup));
    });
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('2 Notes'));
    expect(screen.getByRole('status').textContent).toContain('Saved');
  });

  it('does not import a valid backup when confirmation is declined', async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal('confirm', confirm);
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    const backup = {
      format: 'bible-study-annotations',
      schemaVersion: 1,
      exportedAt: now,
      appVersion: '1.0',
      annotations: snapshot.notes,
      highlights: snapshot.highlights,
    };
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) {
      throw new Error('Missing backup input');
    }
    await userEvent.upload(
      input,
      new File([JSON.stringify(backup)], 'study-notes.json', { type: 'application/json' }),
    );
    await waitFor(() => {
      expect(confirm).toHaveBeenCalledOnce();
    });
    expect(storage.importAnnotations).not.toHaveBeenCalled();
  });

  it('reports export errors instead of claiming a backup was saved', async () => {
    vi.mocked(storage.exportAnnotations).mockRejectedValueOnce(new Error('Quota exceeded'));
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Export backup' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Quota exceeded');
  });

  it('reports a failed clear and closes the notebook without losing its contents', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    vi.mocked(storage.deleteAllAnnotations).mockRejectedValueOnce(new Error('Locked'));
    const onClose = vi.fn();
    render(<Notebook open onClose={onClose} onOpenVerse={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete all annotations' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Could not save');
    await userEvent.click(screen.getByRole('button', { name: 'Close notebook' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows a friendly empty state when no annotations exist', () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
      status: 'ready',
      error: null,
      notes: [],
      highlights: [],
      bookmarks: [],
    });
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    expect(screen.getByText('No notes or highlights yet.')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Open verse' })).toBeNull();
  });
  it('opens each colour at its own moving bookmark without changing highlights', async () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
      ...snapshot,
      bookmarks: [
        { color: 'amber', verseId: 'John.3.16', updatedAt: now },
        { color: 'green', verseId: 'Gen.1.1', updatedAt: now },
      ],
    });
    const onOpenVerse = vi.fn();
    const onClose = vi.fn();
    render(<Notebook open onClose={onClose} onOpenVerse={onOpenVerse} />);
    const section = screen.getByRole('region', { name: 'Reading bookmarks' });
    const amber = within(section).getByRole('button', { name: /Amber: John 3 16/ });
    await userEvent.click(amber);
    expect(onOpenVerse).toHaveBeenCalledWith('John.3.16');
    expect(onClose).toHaveBeenCalled();
    expect(storage.setReadingBookmark).not.toHaveBeenCalled();
    await userEvent.click(within(section).getByRole('button', { name: 'Remove green bookmark' }));
    expect(storage.setReadingBookmark).toHaveBeenCalledWith('green', null);
  });

  it('shows unset bookmarks as disabled and preserves all highlight entries', () => {
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    const section = screen.getByRole('region', { name: 'Reading bookmarks' });
    expect(within(section).getByRole('button', { name: /Green: Not set/ }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByText('God so loved')).toBeDefined();
  });

  it('confirms bookmark counts when importing a v2 backup', async () => {
    const confirm = vi.fn(() => true);
    vi.stubGlobal('confirm', confirm);
    render(<Notebook open onClose={vi.fn()} onOpenVerse={vi.fn()} />);
    const backup = {
      format: 'bible-study-annotations', schemaVersion: 2,
      exportedAt: now, appVersion: '1.0',
      annotations: snapshot.notes, highlights: snapshot.highlights,
      bookmarks: [{ color: 'pink', verseId: 'Gen.1.1', updatedAt: now }],
    };
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('Missing backup input');
    await userEvent.upload(input, new File([JSON.stringify(backup)], 'backup.json', {type:'application/json'}));
    await waitFor(() => { expect(confirm).toHaveBeenCalledWith(expect.stringContaining('1 bookmarks')); });
  });
});

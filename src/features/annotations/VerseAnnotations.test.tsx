import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PersonalNote, VerseHighlight } from './model.ts';
import * as storage from './storage.ts';
import { VerseAnnotations } from './VerseAnnotations.tsx';

vi.mock('./storage.ts', () => ({
  useAnnotations: vi.fn(),
  setVerseHighlight: vi.fn(() => Promise.resolve(undefined)),
  upsertPersonalNote: vi.fn(() => Promise.resolve(undefined)),
  deletePersonalNote: vi.fn(() => Promise.resolve(undefined)),
}));

const now = '2026-11-14T12:00:00.000Z';
const note: PersonalNote = {
  id: 'read-1',
  verseId: 'Gen.1.1',
  body: 'Genesis begins with God.',
  createdAt: now,
  updatedAt: now,
};

function current(notes: readonly PersonalNote[] = [], highlights: readonly VerseHighlight[] = []) {
  vi.mocked(storage.useAnnotations).mockReturnValue({
    notes,
    highlights,
    status: 'ready',
    error: null,
  });
}

describe('verse highlights and personal notes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    current();
  });

  it('offers four highlight choices and removal through the same verse ID', async () => {
    current([], [{ verseId: 'Gen.1.1', color: 'amber', updatedAt: now }]);
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.click(screen.getByRole('button', { name: /Highlight/ }));
    expect(screen.getByRole('toolbar', { name: 'Highlight' })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'Green' }));
    expect(storage.setVerseHighlight).toHaveBeenCalledWith('Gen.1.1', 'green');
    await userEvent.click(screen.getByRole('button', { name: 'Remove highlight' }));
    expect(storage.setVerseHighlight).toHaveBeenCalledWith('Gen.1.1', null);
  });

  it('saves a new personal note only if text is present', async () => {
    render(<VerseAnnotations verseId="John.3.16" />);
    await userEvent.click(screen.getByRole('button', { name: 'Notes' }));
    const save = screen.getByRole('button', { name: 'Save new note' });
    expect(save.hasAttribute('disabled')).toBe(true);
    await userEvent.type(screen.getByPlaceholderText('Write a note…'), 'Love of God');
    await userEvent.click(save);
    await waitFor(() => {
      expect(storage.upsertPersonalNote).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'Love of God', verseId: 'John.3.16' }),
      );
    });
    expect(screen.getByPlaceholderText('Write a note…')).toHaveProperty('value', '');
  });

  it('shows existing notes and saves edits when the editor loses focus', async () => {
    current([note]);
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.click(screen.getByRole('button', { name: /Notes \(1\)/ }));
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    fireEvent.change(editor, { target: { value: 'Edited Hebrew note' } });
    fireEvent.blur(editor);
    await waitFor(() => {
      expect(storage.upsertPersonalNote).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'read-1', body: 'Edited Hebrew note' }),
      );
    });
  });

  it('asks before deleting a saved note', async () => {
    current([note]);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.click(screen.getByRole('button', { name: /Notes \(1\)/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete note' }));
    expect(confirm).toHaveBeenCalled();
    expect(storage.deletePersonalNote).toHaveBeenCalledWith('read-1');
    confirm.mockRestore();
  });

  it('never claims a save is possible if device storage is unavailable', async () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
      notes: [],
      highlights: [],
      status: 'unavailable',
      error: 'Permission denied.',
    });
    render(<VerseAnnotations verseId="Gen.1.1" />);
    expect(screen.getByText('Device storage is unavailable; notes cannot be saved.')).toBeDefined();
    expect(screen.getByText('Permission denied.')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /Highlight/ }));
    expect(screen.getByRole('button', { name: 'Amber' }).hasAttribute('disabled')).toBe(true);
  });
});

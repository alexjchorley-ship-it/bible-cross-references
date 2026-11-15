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
  setReadingBookmark: vi.fn(() => Promise.resolve(undefined)),
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
    bookmarks: [],
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
    expect(screen.getByRole('group', { name: 'Highlight colours' })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /Green · Prayer/ }));
    expect(storage.setVerseHighlight).toHaveBeenCalledWith('Gen.1.1', 'green');
    await userEvent.click(screen.getByRole('button', { name: 'Remove highlight' }));
    expect(storage.setVerseHighlight).toHaveBeenCalledWith('Gen.1.1', null);
  });

  it('saves a new personal note only if text is present', async () => {
    render(<VerseAnnotations verseId="John.3.16" />);
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
    const confirm = vi.fn(() => true);
    vi.stubGlobal('confirm', confirm);
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete note' }));
    expect(confirm).toHaveBeenCalled();
    expect(storage.deletePersonalNote).toHaveBeenCalledWith('read-1');
  });

  it('never claims a save is possible if device storage is unavailable', async () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
      notes: [],
      highlights: [],
      bookmarks: [],
      status: 'unavailable',
      error: 'Permission denied.',
    });
    render(<VerseAnnotations verseId="Gen.1.1" />);
    expect(screen.getByText('Device storage is unavailable; notes cannot be saved.')).toBeDefined();
    expect(screen.getByText('Permission denied.')).toBeDefined();
    expect(screen.getByRole('button', { name: /Amber · Miracles/ }).hasAttribute('disabled')).toBe(true);
  });

  it('preserves the text and reports a failed new-note write', async () => {
    vi.mocked(storage.upsertPersonalNote).mockRejectedValueOnce(new Error('Disk denied'));
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.type(screen.getByPlaceholderText('Write a note…'), 'Do not lose this');
    await userEvent.click(screen.getByRole('button', { name: 'Save new note' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Could not save');
    expect(screen.getByPlaceholderText('Write a note…')).toHaveProperty(
      'value',
      'Do not lose this',
    );
  });

  it('shows errors for failed edits and refuses to autosave blank notes', async () => {
    current([note]);
    vi.mocked(storage.upsertPersonalNote).mockRejectedValueOnce(new Error('Disk denied'));
    render(<VerseAnnotations verseId="Gen.1.1" />);
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    fireEvent.change(editor, { target: { value: 'Draft after failed edit' } });
    fireEvent.blur(editor);
    expect(await screen.findByText('Could not save. Copy your text and try again.')).toBeDefined();
    fireEvent.change(editor, { target: { value: '   ' } });
    fireEvent.blur(editor);
    expect(vi.mocked(storage.upsertPersonalNote)).toHaveBeenCalledTimes(1);
  });

  it('never deletes a note when the reader cancels confirmation', async () => {
    current([note]);
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false),
    );
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete note' }));
    expect(storage.deletePersonalNote).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('flushes an unsaved edit when its verse panel closes', async () => {
    current([note]);
    const view = render(<VerseAnnotations verseId="Gen.1.1" />);
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    fireEvent.change(editor, { target: { value: 'Keep this on navigation' } });
    view.unmount();
    await waitFor(() => {
      expect(storage.upsertPersonalNote).toHaveBeenCalledWith(
        expect.objectContaining({ body: 'Keep this on navigation' }),
      );
    });
  });
});

describe('colour-coded reading positions', () => {
  it('offers bookmark colours independently of permanent highlights', async () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
      status: 'ready',
      error: null,
      notes: [],
      highlights: [],
      bookmarks: [{ color: 'green', verseId: 'Gen.1.1', updatedAt: now }],
    });
    render(<VerseAnnotations verseId="John.3.16" />);
    const group = screen.getByRole('group', { name: 'Reading bookmark colours' });
    expect(group).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /Green · Personal reading/ }));
    expect(storage.setReadingBookmark).toHaveBeenCalledWith('green', 'John.3.16');
    expect(storage.setVerseHighlight).not.toHaveBeenCalled();
  });
});


describe('always-visible annotation composer', () => {
  it('allows categorised note creation without expanding any menus', async () => {
    current();
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.type(screen.getByRole('textbox', { name: 'New note title' }), 'Creation');
    await userEvent.type(screen.getByPlaceholderText('Write a note…'), 'It was good');
    await userEvent.type(screen.getByPlaceholderText('Choose or type…'), 'Questions');
    await userEvent.click(screen.getByRole('button', { name: 'Save new note' }));
    await waitFor(() => expect(storage.upsertPersonalNote).toHaveBeenCalledWith(
      expect.objectContaining({title: 'Creation', category: 'Questions', verseId: 'Gen.1.1'})
    ));
  });
});

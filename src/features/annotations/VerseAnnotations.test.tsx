import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    crossReferences: [],
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

  it('never claims a save is possible if device storage is unavailable', () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
    crossReferences: [],
      notes: [],
      highlights: [],
      bookmarks: [],
      status: 'unavailable',
      error: 'Permission denied.',
    });
    render(<VerseAnnotations verseId="Gen.1.1" />);
    expect(screen.getByText('Device storage is unavailable; notes cannot be saved.')).toBeDefined();
    expect(screen.getByText('Permission denied.')).toBeDefined();
    expect(screen.getByRole('button', { name: /Amber · Miracles/ }).hasAttribute('disabled')).toBe(
      true,
    );
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
    crossReferences: [],
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
    await waitFor(() => {
      expect(storage.upsertPersonalNote).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Creation', category: 'Questions', verseId: 'Gen.1.1' }),
      );
    });
  });
});

describe('inline verse annotation quality-of-life controls', () => {
  it('removes a highlight when its selected colour dot is tapped again', async () => {
    current([], [{ verseId: 'Gen.1.1', color: 'amber', updatedAt: now }]);
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.click(screen.getByRole('button', { name: /Amber · Miracles/ }));
    expect(storage.setVerseHighlight).toHaveBeenCalledWith('Gen.1.1', null);
  });

  it('moves one coloured bookmark and removes it by tapping again on its verse', async () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
    crossReferences: [],
      status: 'ready',
      error: null,
      notes: [],
      highlights: [],
      bookmarks: [{ color: 'green', verseId: 'Gen.1.1', updatedAt: now }],
    });
    render(<VerseAnnotations verseId="Gen.1.1" />);
    const group = screen.getByRole('group', { name: 'Reading bookmark colours' });
    const green = within(group).getByRole('button', { name: /Green · Personal reading/ });
    expect(green.getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(green);
    expect(storage.setReadingBookmark).toHaveBeenCalledWith('green', null);
  });

  it('uses the saved meaning of a colour on the always visible dots', () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
    crossReferences: [],
      status: 'ready',
      error: null,
      notes: [],
      highlights: [],
      bookmarks: [],
      labels: [{ id: 'highlight:amber', name: 'Miracles of Jesus', updatedAt: now }],
    });
    render(<VerseAnnotations verseId="Gen.1.1" />);
    expect(screen.getByRole('button', { name: /Amber · Miracles of Jesus/ })).toBeDefined();
  });

  it('shows one of several saved notes at first and expands the full collection', async () => {
    current([
      note,
      { ...note, id: 'read-2', body: 'Second note', createdAt: '2026-11-15T12:00:00Z' },
    ]);
    render(<VerseAnnotations verseId="Gen.1.1" />);
    expect(screen.getByRole('button', { name: 'Show all 2 notes' })).toBeDefined();
    expect(screen.getAllByRole('textbox', { name: 'Notes' })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: 'Show all 2 notes' }));
    expect(screen.getAllByRole('textbox', { name: 'Notes' })).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: 'Show latest note only' }));
    expect(screen.getAllByRole('textbox', { name: 'Notes' })).toHaveLength(1);
  });

  it('edits the saved title and category without changing the verse', async () => {
    current([note]);
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.type(screen.getByRole('textbox', { name: 'Note title' }), 'Creation note');
    await userEvent.type(screen.getByPlaceholderText('Choose or type a category'), 'Sermon');
    fireEvent.blur(screen.getByRole('textbox', { name: 'Notes' }));
    await waitFor(() => {
      expect(storage.upsertPersonalNote).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'read-1', title: 'Creation note', category: 'Sermon' }),
      );
    });
  });

  it('keeps a failed note draft ready for another attempt', async () => {
    vi.mocked(storage.upsertPersonalNote).mockRejectedValueOnce(new Error('Offline'));
    current([note]);
    render(<VerseAnnotations verseId="Gen.1.1" />);
    const editor = screen.getByRole('textbox', { name: 'Notes' });
    fireEvent.change(editor, { target: { value: 'Do not lose this' } });
    fireEvent.blur(editor);
    expect(await screen.findByText('Could not save. Copy your text and try again.')).toBeDefined();
    expect(editor).toHaveProperty('value', 'Do not lose this');
  });

  it('disables the inline composer and colour choices when storage is blocked', () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
    crossReferences: [],
      notes: [],
      highlights: [],
      bookmarks: [],
      status: 'unavailable',
      error: 'Database blocked',
    });
    render(<VerseAnnotations verseId="Gen.1.1" />);
    expect(screen.getByRole('button', { name: 'Save new note' }).hasAttribute('disabled')).toBe(
      true,
    );
    expect(screen.getByRole('button', { name: /Green · Prayer/ }).hasAttribute('disabled')).toBe(
      true,
    );
  });
});

describe('touch-friendly expanded colour legend', () => {
  it('keeps four quick highlights visible and reveals eight labelled colours from an arrow', async () => {
    current();
    render(<VerseAnnotations verseId="Gen.1.1" />);
    const quick = screen.getByRole('group', { name: 'Highlight colours' });
    expect(within(quick).getAllByRole('button')).toHaveLength(5);
    expect(
      screen.queryByRole('group', { name: 'Highlight colour meanings and more colours' }),
    ).toBeNull();
    const arrow = within(quick).getByRole('button', { name: 'Show highlight colour meanings' });
    expect(arrow.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(arrow);
    const legend = screen.getByRole('group', {
      name: 'Highlight colour meanings and more colours',
    });
    expect(within(legend).getAllByRole('button')).toHaveLength(8);
    expect(within(legend).getByRole('button', { name: /Purple · Prophecy/ })).toBeDefined();
    expect(within(legend).getByRole('button', { name: /Teal · Wisdom/ })).toBeDefined();
    expect(within(legend).getByRole('button', { name: /Red · Warnings/ })).toBeDefined();
    expect(within(legend).getByRole('button', { name: /Yellow · Key verses/ })).toBeDefined();
    await userEvent.click(within(legend).getByRole('button', { name: /Purple · Prophecy/ }));
    expect(storage.setVerseHighlight).toHaveBeenCalledWith('Gen.1.1', 'purple');
    await userEvent.click(screen.getByRole('button', { name: 'Hide highlight colour meanings' }));
    expect(
      screen.queryByRole('group', { name: 'Highlight colour meanings and more colours' }),
    ).toBeNull();
  });

  it('shows bookmark purposes without hover and moves a new-colour bookmark independently', async () => {
    current();
    render(<VerseAnnotations verseId="John.3.16" />);
    await userEvent.click(screen.getByRole('button', { name: 'Show bookmark colour meanings' }));
    const legend = screen.getByRole('group', { name: 'Bookmark colour meanings and more colours' });
    expect(within(legend).getByRole('button', { name: /Green · Personal reading/ })).toBeDefined();
    await userEvent.click(within(legend).getByRole('button', { name: /Teal · Devotional/ }));
    expect(storage.setReadingBookmark).toHaveBeenCalledWith('teal', 'John.3.16');
    expect(storage.setVerseHighlight).not.toHaveBeenCalled();
  });

  it('displays user-defined meanings in the expanded list', async () => {
    vi.mocked(storage.useAnnotations).mockReturnValue({
    crossReferences: [],
      notes: [],
      highlights: [],
      bookmarks: [],
      status: 'ready',
      error: null,
      labels: [{ id: 'highlight:purple', name: 'Something to investigate', updatedAt: now }],
    });
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Show highlight colour meanings' }));
    expect(screen.getByRole('button', { name: /Purple · Something to investigate/ })).toBeDefined();
  });

  it('shows selected extra colours in the expanded legend', async () => {
    current([], [{ verseId: 'Gen.1.1', color: 'purple', updatedAt: now }]);
    render(<VerseAnnotations verseId="Gen.1.1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Show highlight colour meanings' }));
    const selected = screen
      .getByRole('group', { name: 'Highlight colour meanings and more colours' })
      .querySelector<HTMLButtonElement>('button[aria-pressed="true"]');
    expect(selected?.getAttribute('aria-label')).toContain('Purple');
  });
});

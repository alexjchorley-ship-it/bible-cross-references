import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createVizData } from '../../test-utils/viz-data.ts';
import { versePassage } from '../../core/bible/passage.ts';
import * as storage from './storage.ts';
import { PersonalCrossReferences } from './PersonalCrossReferences.tsx';

vi.mock('./storage.ts', () => ({
  useAnnotations: vi.fn(),
  upsertPersonalCrossReference: vi.fn(() => Promise.resolve()),
  deletePersonalCrossReference: vi.fn(() => Promise.resolve()),
}));

const now = '2026-11-21T12:00:00.000Z';
const link = {
  id: 'link-1',
  fromVerseId: 'Gen.1.1',
  toVerseId: 'John.1.1',
  note: 'Creation imagery',
  createdAt: now,
  updatedAt: now,
};
const data = createVizData();
const onSelect = vi.fn();

function setup(links = [link], status: 'ready' | 'unavailable' = 'ready') {
  vi.mocked(storage.useAnnotations).mockReturnValue({
    status,
    error: status === 'ready' ? null : 'Storage failed',
    crossReferences: links,
    notes: [],
    highlights: [],
    bookmarks: [],
  });
  return render(<PersonalCrossReferences verseId="Gen.1.1" data={data} onSelect={onSelect} />);
}

describe('personal cross-reference editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows notes and navigates to the other verse', async () => {
    setup();
    expect(screen.getByText('Creation imagery')).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: /John 1:1/ }));
    const index = data.versification.indexOf({ book: 'John', chapter: 1, verse: 1 });
    if (index === undefined) throw new Error('Expected John 1:1');
    expect(onSelect).toHaveBeenCalledWith(versePassage(index));
  });

  it('saves a link with a note from a typed reference', async () => {
    setup([]);
    await userEvent.type(screen.getByLabelText('Link to another verse'), 'John 1:1');
    await userEvent.type(
      screen.getByLabelText(/Why are these connected/),
      'Both start with creation',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add cross-reference' }));
    await waitFor(() => {
      expect(storage.upsertPersonalCrossReference).toHaveBeenCalledWith(
        expect.objectContaining({
          fromVerseId: 'Gen.1.1',
          toVerseId: 'John.1.1',
          note: 'Both start with creation',
        }),
      );
    });
  });

  it('rejects missing verses and self-links before saving', async () => {
    setup([]);
    const input = screen.getByLabelText('Link to another verse');
    await userEvent.type(input, 'John 99:9');
    await userEvent.click(screen.getByRole('button', { name: 'Add cross-reference' }));
    expect(screen.getByRole('alert').textContent).toContain('valid verse');
    await userEvent.clear(input);
    await userEvent.type(input, 'Genesis 1:1');
    await userEvent.click(screen.getByRole('button', { name: 'Add cross-reference' }));
    expect(screen.getByRole('alert').textContent).toContain('different verse');
    expect(storage.upsertPersonalCrossReference).not.toHaveBeenCalled();
  });

  it('edits an existing link and deletes it', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const note = screen.getByLabelText(/Why are these connected/);
    await userEvent.clear(note);
    await userEvent.type(note, 'New connection');
    await userEvent.click(screen.getByRole('button', { name: 'Update cross-reference' }));
    await waitFor(() => {
      expect(storage.upsertPersonalCrossReference).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'link-1', note: 'New connection' }),
      );
    });
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => {
      expect(storage.deletePersonalCrossReference).toHaveBeenCalledWith('link-1');
    });
  });

  it('refuses writes when local storage is unavailable', () => {
    setup([], 'unavailable');
    expect(screen.getByRole('alert').textContent).toContain('Storage failed');
    expect(
      screen.getByRole('button', { name: 'Add cross-reference' }).hasAttribute('disabled'),
    ).toBe(true);
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import { versePassage } from '../../../core/bible/passage.ts';
import { ReferenceSearch } from './ReferenceSearch.tsx';

function renderPicker(passage = null as ReturnType<typeof versePassage> | null) {
  const onSelect = vi.fn();
  render(
    <ReferenceSearch
      versification={CANONICAL_VERSIFICATION}
      passage={passage}
      onSelect={onSelect}
    />,
  );
  return onSelect;
}

describe('Bible book and chapter navigation', () => {
  it('shows Old and New Testament books in their own groups', async () => {
    renderPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Choose Bible book and chapter' }));
    expect(screen.getByRole('heading', { name: 'Choose a book' })).toBeDefined();
    expect(screen.getByRole('region', { name: 'Old Testament' })).toBeDefined();
    expect(screen.getByRole('region', { name: 'New Testament' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Genesis' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Revelation' })).toBeDefined();
  });

  it('navigates only after choosing a chapter; Psalms has 150', async () => {
    const onSelect = renderPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Choose Bible book and chapter' }));
    await userEvent.click(screen.getByRole('button', { name: 'Psalms' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Psalms' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Psalms 150' })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'Psalms 150' }));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'chapter', book: 'Ps', chapter: 150 });
  });

  it('can go back to books without changing passage', async () => {
    const onSelect = renderPicker();
    await userEvent.click(screen.getByRole('button', { name: 'Choose Bible book and chapter' }));
    await userEvent.click(screen.getByRole('button', { name: 'Genesis' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back to books' }));
    expect(screen.getByRole('heading', { name: 'Choose a book' })).toBeDefined();
    await userEvent.click(screen.getByRole('button', { name: 'John' }));
    expect(screen.getByRole('button', { name: 'John 21' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'John 22' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'John 3' }));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'chapter', book: 'John', chapter: 3 });
  });

  it('displays the currently selected passage without a text search field', async () => {
    const john = CANONICAL_VERSIFICATION.indexOf({ book: 'John', chapter: 3, verse: 16 });
    if (john === undefined) {
      throw new Error('Missing fixture verse');
    }
    const onSelect = renderPicker(versePassage(john));
    expect(screen.getByText('John 3:16')).toBeDefined();
    expect(screen.queryByRole('searchbox')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Choose Bible book and chapter' }));
    await userEvent.click(screen.getByRole('button', { name: 'Close Bible navigation' }));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

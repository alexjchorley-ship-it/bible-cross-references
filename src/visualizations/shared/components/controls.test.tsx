import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GENRES } from '../../../core/bible/genres.ts';
import { CANONICAL_VERSIFICATION } from '../../../core/bible/versification.ts';
import { GenreToggles } from './GenreToggles.tsx';
import { ReferenceSearch } from './ReferenceSearch.tsx';

describe('ReferenceSearch', () => {
  function renderPicker() {
    const onSelect = vi.fn();
    render(<ReferenceSearch versification={CANONICAL_VERSIFICATION} onSelect={onSelect} />);
    return {
      onSelect,
      trigger: screen.getByRole('button', { name: 'Choose Bible book and chapter' }),
    };
  }

  it('opens a Bible book and then a chapter, without typing', async () => {
    const { onSelect, trigger } = renderPicker();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Psalms' }));
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Psalms 23' }));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'chapter', book: 'Ps', chapter: 23 });
  });

  it('permits moving back to the full book list, then choosing another book', async () => {
    const { onSelect, trigger } = renderPicker();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Genesis' }));
    await userEvent.click(screen.getByRole('button', { name: 'Back to books' }));
    await userEvent.click(screen.getByRole('button', { name: 'John' }));
    await userEvent.click(screen.getByRole('button', { name: 'John 3' }));
    expect(onSelect).toHaveBeenCalledWith({ kind: 'chapter', book: 'John', chapter: 3 });
  });

  it('only offers real books and valid chapters', async () => {
    const { onSelect, trigger } = renderPicker();
    await userEvent.click(trigger);
    expect(screen.queryByRole('button', { name: 'Hesitations' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Jude' }));
    expect(screen.getByRole('button', { name: 'Jude 1' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Jude 2' })).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('leaves navigation unchanged if the picker is closed without selecting a chapter', async () => {
    const { onSelect, trigger } = renderPicker();
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('button', { name: 'Close Bible navigation' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });
});

describe('GenreToggles', () => {
  it('shows every genre, grouped by testament', () => {
    render(<GenreToggles hiddenGenres={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText('Old Testament')).toBeDefined();
    expect(screen.getByText('New Testament')).toBeDefined();
    expect(screen.getAllByRole('button')).toHaveLength(GENRES.length);
  });

  it('marks a genre that is showing as pressed', () => {
    render(<GenreToggles hiddenGenres={new Set()} onToggle={vi.fn()} />);
    for (const button of screen.getAllByRole('button')) {
      expect(button.getAttribute('aria-pressed')).toBe('true');
    }
  });

  it('marks a hidden genre as not pressed', () => {
    render(<GenreToggles hiddenGenres={new Set(['law'])} onToggle={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Law/ }).getAttribute('aria-pressed')).toBe('false');
  });

  it('reports the genre that was toggled', async () => {
    const onToggle = vi.fn();
    render(<GenreToggles hiddenGenres={new Set()} onToggle={onToggle} />);
    await userEvent.click(screen.getByRole('button', { name: /Revelation/ }));
    expect(onToggle).toHaveBeenCalledWith('revelation');
  });
});

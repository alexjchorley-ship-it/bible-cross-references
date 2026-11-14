import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GENRES } from '../../../core/bible/genres.ts';
import { GenreToggles } from './GenreToggles.tsx';

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

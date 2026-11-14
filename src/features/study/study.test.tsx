import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PILOT_STUDIES, studyForVerse } from './pilot-studies.ts';
import { StudySection } from './StudySection.tsx';

describe('source-backed theological study', () => {
  it('keeps every interpretation tied to existing primary source records', () => {
    const study = studyForVerse('Gen.1.1');
    expect(study?.verseId).toBe('Gen.1.1');
    expect(study?.interpretations.length).toBeGreaterThan(1);
    expect(study?.sources.length).toBeGreaterThan(2);
    for (const position of study?.interpretations ?? []) {
      for (const id of position.sourceIds) {
        expect(study?.sources.some((source) => source.id === id)).toBe(true);
      }
    }
    expect(PILOT_STUDIES['Gen.1.1']).toBe(study);
  });

  it('shows an honest gap instead of inventing a theologian for another verse', async () => {
    render(<StudySection verseId="John.3.16" />);
    await userEvent.click(screen.getByText('Theological study'));
    expect(screen.getByText(/No sourced study note/)).toBeDefined();
    expect(screen.getByRole('link', { name: 'Tyndale Open Study Notes' })).toBeDefined();
  });

  it('offers competing readings and links to their published research', async () => {
    render(<StudySection verseId="Gen.1.1" />);
    await userEvent.click(screen.getByText('Theological study'));
    expect(screen.getByText('An independent opening statement')).toBeDefined();
    expect(screen.getByText(/dependent opening/)).toBeDefined();
    expect(screen.getAllByRole('link').length).toBeGreaterThan(3);
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TyndaleNotes } from './TyndaleNotes.tsx';
import type { TyndaleStudyNote } from './tyndale.ts';

const genesis: TyndaleStudyNote = {
  id: 'StudyNote:Gen.1.1',
  type: 'StudyNote',
  title: 'Genesis 1:1',
  sourceOrder: 2,
  refs: [{ book: 'genesis', startChapter: 1, startVerse: 1, endChapter: 1, endVerse: 1 }],
  content: [
    {
      t: 'p',
      c: [
        'Creation is ',
        { t: 'strong', v: 'intentional' },
        ', ',
        { t: 'em', v: 'good' },
        '. See ',
        { t: 'ref', r: 'Gen.1.2', v: 'the next verse' },
        { t: 'b', v: ' also' },
        { t: 'other', v: ' for context.' },
      ],
    },
  ],
};

const context: TyndaleStudyNote = {
  id: 'StudyNote:Gen.1.1-2.3',
  type: 'StudyNote',
  title: 'Creation context',
  sourceOrder: 1,
  refs: [{ book: 'genesis', startChapter: 1, startVerse: 1, endChapter: 2, endVerse: 3 }],
  content: [{ t: 'p', c: ['God orders creation.'] }],
};

describe('licensed Tyndale study panel', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the selected book and renders direct notes and wider passage context', async () => {
    const request = vi.fn((url: string) => {
      expect(url).toContain('data/commentary/genesis.json');
      return Promise.resolve(new Response(JSON.stringify([genesis, context]), { status: 200 }));
    });
    vi.stubGlobal('fetch', request);
    render(<TyndaleNotes verseId="Gen.1.1" />);
    expect(screen.getByRole('status').textContent).toContain('Loading study notes');
    expect(
      await screen.findByRole('heading', { name: 'Verse commentary · Genesis 1:1' }),
    ).toBeDefined();
    expect(
      screen.getByRole('heading', { name: 'Passage context · Creation context' }),
    ).toBeDefined();
    expect(screen.getByText('intentional').tagName.toLowerCase()).toBe('strong');
    expect(screen.getByText('good').tagName.toLowerCase()).toBe('em');
    expect(screen.getByText('also').tagName.toLowerCase()).toBe('strong');
    expect(screen.getByTitle('Gen.1.2').textContent).toBe('the next verse');
    expect(screen.getByText('God orders creation.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'CC BY-SA 4.0' })).toBeDefined();
    expect(screen.getByRole('link', { name: /One Blue Thread/ })).toBeDefined();
    expect(request).toHaveBeenCalledOnce();
    expect(request.mock.calls[0]?.[0]).toContain('data/commentary/genesis.json');
  });

  it('explains when a valid verse has no available notes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('[]', { status: 200 }))),
    );
    render(<TyndaleNotes verseId="John.3.16" />);
    expect(
      await screen.findByText('No Tyndale note is attached to this verse or its wider passage.'),
    ).toBeDefined();
  });

  it('clearly distinguishes an unavailable book from a verse with no commentary', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('Not found', { status: 404 }))),
    );
    render(<TyndaleNotes verseId="Exod.1.1" />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('not available offline yet');
    expect(screen.queryByText(/No Tyndale note is attached/)).toBeNull();
  });

  it('does not fetch invalid verse references', () => {
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    render(<TyndaleNotes verseId="unrecognised.1.1" />);
    expect(screen.getByText(/No reviewed comparison/)).toBeDefined();
    expect(request).not.toHaveBeenCalled();
  });

  it('shows a translated offline message when the loader fails without an Error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        // A third-party library might reject with a string instead of an Error.
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        return Promise.reject('Offline');
      }),
    );
    render(<TyndaleNotes verseId="Ruth.1.1" />);
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Study notes unavailable offline',
    );
  });

  it('uses passage context for nearby verses instead of assigning the wrong direct note', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(new Response(JSON.stringify([genesis, context]), { status: 200 })),
      ),
    );
    render(<TyndaleNotes verseId="Gen.1.2" />);
    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Passage context · Creation context' }),
      ).toBeDefined();
    });
    expect(screen.queryByRole('heading', { name: 'Verse commentary · Genesis 1:1' })).toBeNull();
  });
});

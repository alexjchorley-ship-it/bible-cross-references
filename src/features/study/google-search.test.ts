import { describe, expect, it } from 'vitest';
import { googleChapterSearchUrl, googleVerseSearchUrl } from './google-search.ts';

describe('opt-in Google research links', () => {
  it('encodes a verse reference and context terms', () => {
    const url = new URL(googleVerseSearchUrl('John 1:1'));
    expect(url.origin).toBe('https://www.google.com');
    expect(url.searchParams.get('q')).toContain('"John 1:1" Bible commentary');
  });
  it('can search selected verse text exactly', () => {
    const query = new URL(googleVerseSearchUrl('John 1:1', 'In the beginning was the Word')).searchParams.get('q');
    expect(query).toContain('"In the beginning was the Word"');
    expect(query).toContain('"John 1:1"');
  });
  it('searches wider chapter interpretation', () => {
    const query = new URL(googleChapterSearchUrl('John', 1)).searchParams.get('q');
    expect(query).toContain('John 1 Bible chapter commentary');
  });
});

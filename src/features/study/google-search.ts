/** Open third-party research only after the reader explicitly follows a link. */
export function googleVerseSearchUrl(reference: string, exactText?: string): string {
  const query = exactText
    ? `"${exactText.trim()}" "${reference}"`
    : `"${reference}" Bible commentary historical context interpretation original language`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

export function googleChapterSearchUrl(book: string, chapter: number): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`${book} ${chapter} Bible chapter commentary historical context scholarly interpretation`)}`;
}

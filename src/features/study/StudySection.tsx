import { TyndaleNotes } from './TyndaleNotes.tsx';
import { parseOsisId } from '../../core/bible/verse-ref.ts';
import { googleChapterSearchUrl } from './google-search.ts';
import { useLocalization } from '../../i18n/use-locale.tsx';
import { studyForVerse } from './pilot-studies.ts';
import styles from '../annotations/annotations.module.css';
import { PanelSection } from '../../visualizations/shared/components/PanelSection.tsx';
import { ReadingIcon } from '../../shared/ui/icons.tsx';

export function StudySection({ verseId }: { readonly verseId: string }) {
  const { t } = useLocalization();
  const study = studyForVerse(verseId);
  const verse = parseOsisId(verseId);
  return (
    <PanelSection
      id="theological-notes"
      icon={ReadingIcon}
      title={t('study.title')}
      description="Commentary and interpretation"
      defaultOpen={false}
    >
      <div className={styles.studyContents}>
        {verse && (
          <a
            href={googleChapterSearchUrl(verse.book, verse.chapter)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Search Google for chapter context ↗
          </a>
        )}
        <TyndaleNotes verseId={verseId} />
        {!study ? (
          <p className={styles.warning}>{t('study.notCurated')}</p>
        ) : (
          <>
            <p className={styles.warning}>
              {t('study.language')} · {t('study.linkedOnly')}
            </p>
            <h4>{t('study.overview')}</h4>
            <p>{study.overview}</p>
            <p lang="he" dir="rtl" className={styles.hebrew}>
              {study.originalLanguage}
            </p>
            <p>{study.originalLanguageNote}</p>
            <h4>{t('study.interpretations')}</h4>
            {study.interpretations.map((position) => (
              <section key={position.title} className={styles.studyCard}>
                <h4>{position.title}</h4>
                <p>{position.summary}</p>
                <ul className={styles.studySources}>
                  {position.sourceIds.map((id) => {
                    const source = study.sources.find((entry) => entry.id === id);
                    return source ? (
                      <li key={id}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.author}
                        </a>
                      </li>
                    ) : null;
                  })}
                </ul>
              </section>
            ))}
            <h4>{t('study.sources')}</h4>
            <ol className={styles.studySources}>
              {study.sources.map((source) => (
                <li key={source.id}>
                  <a href={source.url} target="_blank" rel="noopener noreferrer">
                    {source.title}
                  </a>
                  {' — '}
                  {source.author}. {source.location}
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </PanelSection>
  );
}

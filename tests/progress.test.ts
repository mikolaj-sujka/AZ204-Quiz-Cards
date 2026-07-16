import { describe, expect, it } from 'vitest';
import {
  chapterProgress,
  defaultProgress,
  isArticleRead,
  markArticleRead,
  readProgress,
  recordExamAttempt,
  writeProgress
} from '../src/domain/progress';

function createStorage(initial?: string) {
  const store = new Map<string, string>();
  if (initial) store.set('az204-quiz-cards-progress-v2', initial);
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value)
  };
}

describe('progress storage', () => {
  it('returns defaults for empty or invalid storage', () => {
    expect(readProgress(createStorage())).toEqual(defaultProgress);
    expect(readProgress(createStorage('not-json'))).toEqual(defaultProgress);
  });

  it('an article is unread until explicitly marked read', () => {
    expect(isArticleRead(undefined)).toBe(false);

    const now = new Date('2026-01-01T00:00:00.000Z');
    const next = markArticleRead(defaultProgress, 'art-1', now);
    expect(isArticleRead(next.articles['art-1'])).toBe(true);
    expect(next.articles['art-1'].readAt).toBe(now.toISOString());
  });

  it('chapterProgress counts read articles for a chapter', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    let progress = markArticleRead(defaultProgress, 'art-1', now);
    progress = markArticleRead(progress, 'art-2', now);

    const stats = chapterProgress(progress, 'compute', ['art-1', 'art-2', 'art-3'], ['q1', 'q2']);
    expect(stats.readArticles).toBe(2);
    expect(stats.totalArticles).toBe(3);
    expect(stats.totalQuestions).toBe(2);
  });

  it('records attempts and keeps best score', () => {
    const first = recordExamAttempt(
      defaultProgress,
      'compute:app-service',
      60,
      ['q1'],
      new Date('2026-01-01')
    );
    const second = recordExamAttempt(
      first,
      'compute:app-service',
      40,
      ['q2'],
      new Date('2026-01-02')
    );
    expect(second.examAttempts['compute:app-service'].attempts).toBe(2);
    expect(second.examAttempts['compute:app-service'].bestScore).toBe(60);
    expect(second.examAttempts['compute:app-service'].missedQuestionIds).toEqual(['q2']);
  });

  it('writes serialized progress', () => {
    const storage = createStorage();
    const progress = markArticleRead(defaultProgress, 'art-1', new Date('2026-01-01'));
    writeProgress(progress, storage);
    expect(isArticleRead(readProgress(storage).articles['art-1'])).toBe(true);
  });
});

import type { ChapterId } from './content';

export type ArticleReadState = {
  readAt: string;
};

export type StoredProgress = {
  articles: Record<string, ArticleReadState>;
  examAttempts: Record<
    string,
    {
      bestScore: number;
      attempts: number;
      lastAttemptAt: string;
      missedQuestionIds: string[];
    }
  >;
};

export const defaultProgress: StoredProgress = {
  articles: {},
  examAttempts: {}
};

const storageKey = 'az204-quiz-cards-progress-v2';

export function readProgress(
  storage: Pick<Storage, 'getItem'> = window.localStorage
): StoredProgress {
  const raw = storage.getItem(storageKey);
  if (!raw) return defaultProgress;

  try {
    const parsed = JSON.parse(raw) as StoredProgress;
    return {
      articles: parsed.articles ?? {},
      examAttempts: parsed.examAttempts ?? {}
    };
  } catch {
    return defaultProgress;
  }
}

export function writeProgress(
  progress: StoredProgress,
  storage: Pick<Storage, 'setItem'> = window.localStorage
) {
  storage.setItem(storageKey, JSON.stringify(progress));
}

export function markArticleRead(
  progress: StoredProgress,
  articleId: string,
  now = new Date()
): StoredProgress {
  return {
    ...progress,
    articles: {
      ...progress.articles,
      [articleId]: { readAt: now.toISOString() }
    }
  };
}

export function isArticleRead(state: ArticleReadState | undefined): boolean {
  return !!state;
}

export function recordExamAttempt(
  progress: StoredProgress,
  examKey: string,
  score: number,
  missedQuestionIds: string[],
  now = new Date()
): StoredProgress {
  const previous = progress.examAttempts[examKey];

  return {
    ...progress,
    examAttempts: {
      ...progress.examAttempts,
      [examKey]: {
        bestScore: Math.max(previous?.bestScore ?? 0, score),
        attempts: (previous?.attempts ?? 0) + 1,
        lastAttemptAt: now.toISOString(),
        missedQuestionIds
      }
    }
  };
}

export function chapterProgress(
  progress: StoredProgress,
  chapterId: ChapterId,
  articleIds: string[],
  questionIds: string[]
) {
  const readArticles = articleIds.filter((id) => isArticleRead(progress.articles[id])).length;
  const relatedAttempts = Object.entries(progress.examAttempts).filter(([key]) =>
    key.includes(chapterId)
  );
  const bestExamScore = relatedAttempts.reduce(
    (best, [, attempt]) => Math.max(best, attempt.bestScore),
    0
  );

  return {
    readArticles,
    totalArticles: articleIds.length,
    totalQuestions: questionIds.length,
    bestExamScore
  };
}

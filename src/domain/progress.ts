import type { ChapterId } from './content';

export type FlashcardRating = 'known' | 'again';

export type StoredProgress = {
  flashcards: Record<string, FlashcardRating>;
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
  flashcards: {},
  examAttempts: {}
};

const storageKey = 'az204-quiz-cards-progress-v1';

export function readProgress(storage: Pick<Storage, 'getItem'> = window.localStorage): StoredProgress {
  const raw = storage.getItem(storageKey);
  if (!raw) return defaultProgress;

  try {
    const parsed = JSON.parse(raw) as StoredProgress;
    return {
      flashcards: parsed.flashcards ?? {},
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

export function rateFlashcard(
  progress: StoredProgress,
  flashcardId: string,
  rating: FlashcardRating
): StoredProgress {
  return {
    ...progress,
    flashcards: {
      ...progress.flashcards,
      [flashcardId]: rating
    }
  };
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
  cardIds: string[],
  questionIds: string[]
) {
  const knownCards = cardIds.filter((id) => progress.flashcards[id] === 'known').length;
  const relatedAttempts = Object.entries(progress.examAttempts).filter(([key]) =>
    key.includes(chapterId)
  );
  const bestExamScore = relatedAttempts.reduce(
    (best, [, attempt]) => Math.max(best, attempt.bestScore),
    0
  );

  return {
    knownCards,
    totalCards: cardIds.length,
    totalQuestions: questionIds.length,
    bestExamScore
  };
}

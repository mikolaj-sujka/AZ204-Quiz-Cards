import type { ChapterId } from './content';

export type FlashcardRating = 'again' | 'hard' | 'good' | 'easy';

export type FlashcardBoxState = {
  box: number;
  dueAt: string;
  lapses: number;
};

export type StoredProgress = {
  flashcards: Record<string, FlashcardBoxState>;
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

const storageKey = 'az204-quiz-cards-progress-v2';

// Simplified Leitner-style box schedule: index = box, value = review interval in days.
const BOX_INTERVALS_DAYS = [0, 1, 2, 4, 8, 16, 32, 60];
const MAX_BOX = BOX_INTERVALS_DAYS.length - 1;

export const LEECH_THRESHOLD = 5;
export const MASTERY_BOX = 3;

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

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
  rating: FlashcardRating,
  now = new Date()
): StoredProgress {
  const current = progress.flashcards[flashcardId];
  const currentBox = current?.box ?? 0;
  const lapses = current?.lapses ?? 0;

  let box: number;
  switch (rating) {
    case 'again':
      box = 0;
      break;
    case 'hard':
      box = Math.max(currentBox, 1);
      break;
    case 'good':
      box = Math.min(currentBox + 1, MAX_BOX);
      break;
    case 'easy':
      box = Math.min(currentBox + 2, MAX_BOX);
      break;
  }

  return {
    ...progress,
    flashcards: {
      ...progress.flashcards,
      [flashcardId]: {
        box,
        dueAt: toDateKey(addDays(now, BOX_INTERVALS_DAYS[box])),
        lapses: rating === 'again' ? lapses + 1 : lapses
      }
    }
  };
}

export function resetFlashcardRatings(
  progress: StoredProgress,
  flashcardIds: string[]
): StoredProgress {
  const remaining = { ...progress.flashcards };
  for (const id of flashcardIds) {
    delete remaining[id];
  }
  return { ...progress, flashcards: remaining };
}

export function isDue(state: FlashcardBoxState | undefined, now = new Date()): boolean {
  if (!state) return true;
  return state.dueAt <= toDateKey(now);
}

export function isLeech(state: FlashcardBoxState | undefined): boolean {
  return (state?.lapses ?? 0) >= LEECH_THRESHOLD;
}

export function isMastered(state: FlashcardBoxState | undefined): boolean {
  return (state?.box ?? 0) >= MASTERY_BOX;
}

export function dueInLabel(box: number): string {
  const days = BOX_INTERVALS_DAYS[Math.min(Math.max(box, 0), MAX_BOX)];
  if (days === 0) return 'dziś';
  if (days === 1) return 'jutro';
  return `za ${days} dni`;
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
  const knownCards = cardIds.filter((id) => isMastered(progress.flashcards[id])).length;
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

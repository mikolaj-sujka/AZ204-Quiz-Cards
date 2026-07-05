import { describe, expect, it } from 'vitest';
import {
  defaultProgress,
  rateFlashcard,
  readProgress,
  recordExamAttempt,
  writeProgress
} from '../src/domain/progress';

function createStorage(initial?: string) {
  const store = new Map<string, string>();
  if (initial) store.set('az204-quiz-cards-progress-v1', initial);
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

  it('stores flashcard ratings', () => {
    const next = rateFlashcard(defaultProgress, 'fc-1', 'known');
    expect(next.flashcards['fc-1']).toBe('known');
  });

  it('records attempts and keeps best score', () => {
    const first = recordExamAttempt(defaultProgress, 'compute:app-service', 60, ['q1'], new Date('2026-01-01'));
    const second = recordExamAttempt(first, 'compute:app-service', 40, ['q2'], new Date('2026-01-02'));
    expect(second.examAttempts['compute:app-service'].attempts).toBe(2);
    expect(second.examAttempts['compute:app-service'].bestScore).toBe(60);
    expect(second.examAttempts['compute:app-service'].missedQuestionIds).toEqual(['q2']);
  });

  it('writes serialized progress', () => {
    const storage = createStorage();
    const progress = rateFlashcard(defaultProgress, 'fc-1', 'again');
    writeProgress(progress, storage);
    expect(readProgress(storage).flashcards['fc-1']).toBe('again');
  });
});

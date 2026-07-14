import { describe, expect, it } from 'vitest';
import {
  defaultProgress,
  isDue,
  isLeech,
  isMastered,
  rateFlashcard,
  readProgress,
  recordExamAttempt,
  resetFlashcardRatings,
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

  it('a new card is due, and rating it schedules a future review', () => {
    expect(isDue(undefined)).toBe(true);

    const now = new Date('2026-01-01T00:00:00.000Z');
    const next = rateFlashcard(defaultProgress, 'fc-1', 'good', now);
    const state = next.flashcards['fc-1'];

    expect(state.box).toBe(1);
    expect(state.lapses).toBe(0);
    expect(isDue(state, now)).toBe(false);
    expect(isDue(state, new Date('2026-01-05T00:00:00.000Z'))).toBe(true);
  });

  it('"again" resets the box to 0 and stays due today, and increments lapses', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    let progress = rateFlashcard(defaultProgress, 'fc-1', 'easy', now);
    progress = rateFlashcard(progress, 'fc-1', 'again', now);

    const state = progress.flashcards['fc-1'];
    expect(state.box).toBe(0);
    expect(state.lapses).toBe(1);
    expect(isDue(state, now)).toBe(true);
  });

  it('flags a card as a leech after repeated "again" ratings', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    let progress = defaultProgress;
    for (let i = 0; i < 5; i += 1) {
      progress = rateFlashcard(progress, 'fc-1', 'again', now);
    }
    expect(isLeech(progress.flashcards['fc-1'])).toBe(true);
  });

  it('considers a card mastered once its box reaches the mastery threshold', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    let progress = rateFlashcard(defaultProgress, 'fc-1', 'easy', now);
    expect(isMastered(progress.flashcards['fc-1'])).toBe(false);
    progress = rateFlashcard(progress, 'fc-1', 'easy', now);
    expect(isMastered(progress.flashcards['fc-1'])).toBe(true);
  });

  it('reset clears ratings back to new/due', () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const rated = rateFlashcard(defaultProgress, 'fc-1', 'easy', now);
    const reset = resetFlashcardRatings(rated, ['fc-1']);
    expect(reset.flashcards['fc-1']).toBeUndefined();
    expect(isDue(reset.flashcards['fc-1'], now)).toBe(true);
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
    const progress = rateFlashcard(defaultProgress, 'fc-1', 'again', new Date('2026-01-01'));
    writeProgress(progress, storage);
    expect(readProgress(storage).flashcards['fc-1'].box).toBe(0);
  });
});

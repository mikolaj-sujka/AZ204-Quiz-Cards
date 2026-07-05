import { describe, expect, it } from 'vitest';
import type { Question } from '../src/domain/content';
import { isCorrectAnswer, scoreExam, toggleAnswer } from '../src/domain/scoring';

const question: Question = {
  id: 'q1',
  type: 'multiple',
  chapterId: 'storage',
  subchapterId: 'cosmos-db',
  prompt: 'Select correct answers',
  options: [
    { id: 'a', text: 'A' },
    { id: 'b', text: 'B' },
    { id: 'c', text: 'C' }
  ],
  answerIds: ['a', 'c'],
  explanation: 'A and C are correct.',
  whyWrong: { b: 'B is incorrect.' },
  sourceUrls: ['https://learn.microsoft.com/en-us/azure/cosmos-db/'],
  verifiedAt: '2026-07-05',
  auditStatus: 'verified',
  origin: 'original'
};

describe('scoring', () => {
  it('scores multi-select answers regardless of order', () => {
    expect(isCorrectAnswer(['c', 'a'], ['a', 'c'])).toBe(true);
    expect(isCorrectAnswer(['a'], ['a', 'c'])).toBe(false);
    expect(isCorrectAnswer(['a', 'b', 'c'], ['a', 'c'])).toBe(false);
  });

  it('toggles multi-select answers and replaces single-select answers', () => {
    expect(toggleAnswer(question, ['a'], 'c')).toEqual(['a', 'c']);
    expect(toggleAnswer(question, ['a', 'c'], 'a')).toEqual(['c']);
    expect(toggleAnswer({ ...question, type: 'single' }, ['a'], 'b')).toEqual(['b']);
  });

  it('returns an exam percentage and per-question result', () => {
    const result = scoreExam([question], { q1: ['c', 'a'] });
    expect(result.correct).toBe(1);
    expect(result.total).toBe(1);
    expect(result.percentage).toBe(100);
    expect(result.results[0].correct).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import {
  content,
  getActiveCoverageBySubchapter,
  importedExamQuestionCount,
  importedBacklogCount,
  importedVerifiedCount,
  sourceQuizBank,
  verifiedQuestions
} from '../src/domain/content';

describe('content model', () => {
  it('imports the complete source quiz with Microsoft source mapping', () => {
    expect(importedBacklogCount()).toBe(589);
    expect(importedVerifiedCount()).toBe(589);
    expect(importedExamQuestionCount()).toBe(484);
    expect(sourceQuizBank.items.every((item) => item.auditStatus === 'verified')).toBe(true);
    expect(sourceQuizBank.items.every((item) => item.sourceUrls.every((url) => url.startsWith('https://learn.microsoft.com/')))).toBe(true);
  });

  it('keeps active questions verified and officially sourced', () => {
    expect(verifiedQuestions.length).toBeGreaterThan(450);
    for (const question of verifiedQuestions) {
      expect(question.auditStatus).toBe('verified');
      expect(question.sourceUrls.length).toBeGreaterThan(0);
      expect(question.sourceUrls.every((url) => url.startsWith('https://learn.microsoft.com/'))).toBe(true);
    }
  });

  it('has active coverage for every official subchapter', () => {
    const coverage = getActiveCoverageBySubchapter();
    expect(coverage.length).toBe(11);
    expect(coverage.every((item) => item.questions > 0)).toBe(true);
    expect(coverage.every((item) => item.flashcards > 0)).toBe(true);
  });
});

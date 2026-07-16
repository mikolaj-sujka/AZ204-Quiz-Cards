import { describe, expect, it } from 'vitest';
import {
  articleBank,
  content,
  getActiveCoverageBySubchapter,
  getArticlesForSubchapter,
  importedExamQuestionCount,
  importedBacklogCount,
  importedVerifiedCount,
  sourceQuizBank,
  verifiedArticles,
  verifiedQuestions
} from '../src/domain/content';

describe('content model', () => {
  it('imports the complete source quiz with Microsoft source mapping', () => {
    expect(importedBacklogCount()).toBe(484);
    expect(importedVerifiedCount()).toBe(484);
    expect(importedExamQuestionCount()).toBe(484);
    expect(sourceQuizBank.items.every((item) => item.auditStatus === 'verified')).toBe(true);
    expect(
      sourceQuizBank.items.every((item) =>
        item.sourceUrls.every((url) => url.startsWith('https://learn.microsoft.com/'))
      )
    ).toBe(true);
  });

  it('keeps active questions verified and officially sourced', () => {
    expect(verifiedQuestions.length).toBeGreaterThan(450);
    for (const question of verifiedQuestions) {
      expect(question.auditStatus).toBe('verified');
      expect(question.sourceUrls.length).toBeGreaterThan(0);
      expect(
        question.sourceUrls.every((url) => url.startsWith('https://learn.microsoft.com/'))
      ).toBe(true);
    }
  });

  it('has active coverage for every official subchapter', () => {
    const coverage = getActiveCoverageBySubchapter();
    expect(coverage.length).toBe(11);
    expect(coverage.every((item) => item.questions > 0)).toBe(true);
    expect(coverage.every((item) => item.articles >= 2)).toBe(true);
  });

  it('keeps articles verified, officially sourced, and ordered within their subchapter', () => {
    expect(verifiedArticles.length).toBe(articleBank.articles.length);
    for (const article of verifiedArticles) {
      expect(article.auditStatus).toBe('verified');
      expect(article.keyPoints.length).toBeGreaterThan(0);
      expect(article.sections.length).toBeGreaterThan(0);
      expect(article.sourceUrls.length).toBeGreaterThan(0);
      expect(
        article.sourceUrls.every((url) => url.startsWith('https://learn.microsoft.com/'))
      ).toBe(true);
    }

    for (const chapter of content.chapters) {
      for (const subchapter of chapter.subchapters) {
        const articles = getArticlesForSubchapter(chapter.id, subchapter.id);
        const orders = articles.map((article) => article.order);
        expect(orders).toEqual([...orders].sort((a, b) => a - b));
      }
    }
  });
});

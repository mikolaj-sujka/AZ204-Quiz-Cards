import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentPath = path.join(__dirname, '..', 'src', 'data', 'az204-content.json');
const sourceQuizPath = path.join(__dirname, '..', 'src', 'data', 'source-quiz.generated.json');
const articlesPath = path.join(__dirname, '..', 'src', 'data', 'articles.json');

const officialSourcePattern = /^https:\/\/learn\.microsoft\.com\//;

const content = JSON.parse(await fs.readFile(contentPath, 'utf8'));
const sourceQuiz = JSON.parse(await fs.readFile(sourceQuizPath, 'utf8'));
const articleBank = JSON.parse(await fs.readFile(articlesPath, 'utf8'));
const errors = [];

const chapterIds = new Set(content.chapters.map((chapter) => chapter.id));
const subchapterIds = new Set(
  content.chapters.flatMap((chapter) =>
    chapter.subchapters.map((subchapter) => `${chapter.id}:${subchapter.id}`)
  )
);

for (const chapter of content.chapters) {
  if (!chapter.title || !chapter.weight || !chapter.summary) {
    errors.push(`Chapter ${chapter.id} is missing title, weight, or summary.`);
  }
  if (!Array.isArray(chapter.sourceUrls) || chapter.sourceUrls.length === 0) {
    errors.push(`Chapter ${chapter.id} has no sourceUrls.`);
  }
  for (const subchapter of chapter.subchapters) {
    if (!subchapter.title || !subchapter.studyNotes || subchapter.skills.length === 0) {
      errors.push(`Subchapter ${chapter.id}:${subchapter.id} is incomplete.`);
    }
  }
}

for (const question of content.questions) {
  if (question.auditStatus !== 'verified') continue;
  const prefix = `Question ${question.id}`;
  if (!chapterIds.has(question.chapterId)) {
    errors.push(`${prefix} references missing chapter ${question.chapterId}.`);
  }
  if (!subchapterIds.has(`${question.chapterId}:${question.subchapterId}`)) {
    errors.push(`${prefix} references missing subchapter ${question.subchapterId}.`);
  }
  if (!question.prompt || question.options.length < 2 || question.answerIds.length === 0) {
    errors.push(`${prefix} is missing prompt, options, or answers.`);
  }
  if (!question.explanation || question.explanation.length < 30) {
    errors.push(`${prefix} needs a meaningful explanation.`);
  }
  if (!question.verifiedAt) {
    errors.push(`${prefix} is missing verifiedAt.`);
  }
  if (!Array.isArray(question.sourceUrls) || question.sourceUrls.length === 0) {
    errors.push(`${prefix} has no sourceUrls.`);
  }
  if (!question.sourceUrls.every((url) => officialSourcePattern.test(url))) {
    errors.push(`${prefix} must use official Microsoft Learn source URLs.`);
  }
  for (const answerId of question.answerIds) {
    if (!question.options.some((option) => option.id === answerId)) {
      errors.push(`${prefix} answer ${answerId} does not match any option.`);
    }
  }
  for (const option of question.options) {
    if (!question.answerIds.includes(option.id) && !question.whyWrong[option.id]) {
      errors.push(`${prefix} option ${option.id} needs whyWrong.`);
    }
  }
}

const articleIds = new Set();
const verifiedArticlesBySubchapter = new Map();

for (const article of articleBank.articles) {
  if (article.auditStatus !== 'verified') continue;
  const prefix = `Article ${article.id}`;
  if (articleIds.has(article.id)) {
    errors.push(`${prefix} is not unique.`);
  }
  articleIds.add(article.id);
  if (!chapterIds.has(article.chapterId)) {
    errors.push(`${prefix} references missing chapter ${article.chapterId}.`);
  }
  if (!subchapterIds.has(`${article.chapterId}:${article.subchapterId}`)) {
    errors.push(`${prefix} references missing subchapter ${article.subchapterId}.`);
  }
  if (!article.title || !article.topic || !article.summary) {
    errors.push(`${prefix} is missing title, topic, or summary.`);
  }
  if (!Array.isArray(article.keyPoints) || article.keyPoints.length === 0) {
    errors.push(`${prefix} has no keyPoints.`);
  }
  if (!Array.isArray(article.sections) || article.sections.length === 0) {
    errors.push(`${prefix} has no sections.`);
  } else {
    for (const section of article.sections) {
      if (!section.heading || !section.body || section.body.length < 60) {
        errors.push(`${prefix} has a section with a missing heading or a body under 60 chars.`);
      }
    }
  }
  if (!article.verifiedAt) {
    errors.push(`${prefix} is missing verifiedAt.`);
  }
  if (!Array.isArray(article.sourceUrls) || article.sourceUrls.length === 0) {
    errors.push(`${prefix} has no sourceUrls.`);
  } else if (!article.sourceUrls.every((url) => officialSourcePattern.test(url))) {
    errors.push(`${prefix} must use official Microsoft Learn source URLs.`);
  }

  const key = `${article.chapterId}:${article.subchapterId}`;
  verifiedArticlesBySubchapter.set(key, (verifiedArticlesBySubchapter.get(key) ?? 0) + 1);
}

for (const chapter of content.chapters) {
  for (const subchapter of chapter.subchapters) {
    const key = `${chapter.id}:${subchapter.id}`;
    if ((verifiedArticlesBySubchapter.get(key) ?? 0) < 2) {
      errors.push(`Subchapter ${key} has fewer than 2 verified articles.`);
    }
  }
}

const backlogTotal = content.importedQuestionManifest.reduce((sum, item) => sum + item.count, 0);
if (!Array.isArray(sourceQuiz.items) || sourceQuiz.items.length === 0) {
  errors.push(`Generated source quiz should contain items, got ${sourceQuiz.items?.length ?? 0}.`);
} else if (backlogTotal !== sourceQuiz.items.length) {
  errors.push(
    `Imported question manifest total (${backlogTotal}) does not match generated source quiz item count (${sourceQuiz.items.length}).`
  );
}

for (const item of sourceQuiz.items ?? []) {
  const prefix = `Source quiz item ${item.id}`;
  if (item.auditStatus !== 'verified') {
    errors.push(`${prefix} must be verified after Microsoft source mapping.`);
  }
  if (!chapterIds.has(item.chapterId)) {
    errors.push(`${prefix} references missing chapter ${item.chapterId}.`);
  }
  if (!subchapterIds.has(`${item.chapterId}:${item.subchapterId}`)) {
    errors.push(`${prefix} references missing subchapter ${item.subchapterId}.`);
  }
  if (!item.prompt || !item.answer) {
    errors.push(`${prefix} is missing prompt or answer.`);
  }
  if (!item.verifiedAt) {
    errors.push(`${prefix} is missing verifiedAt.`);
  }
  if (!Array.isArray(item.sourceUrls) || item.sourceUrls.length === 0) {
    errors.push(`${prefix} has no sourceUrls.`);
  }
  if (!item.sourceUrls.every((url) => officialSourcePattern.test(url))) {
    errors.push(`${prefix} must use official Microsoft Learn source URLs.`);
  }
  for (const answerId of item.answerIds ?? []) {
    if (!item.options.some((option) => option.id === answerId)) {
      errors.push(`${prefix} answer ${answerId} does not match any option.`);
    }
  }
}

if (errors.length > 0) {
  console.error(`Content validation failed with ${errors.length} issue(s):`);
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Content validation passed: ${content.questions.length} original questions, ${articleBank.articles.length} articles, ${sourceQuiz.items.length} source-quiz items Microsoft-mapped.`
);

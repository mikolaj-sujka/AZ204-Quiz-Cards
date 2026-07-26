import rawContent from '../data/az204-content.json';
import rawSourceQuiz from '../data/source-quiz.generated.json';
import rawArticles from '../data/articles.json';
import rawHardTopics from '../data/hard-topics.json';

export type ChapterId = 'compute' | 'storage' | 'security' | 'monitoring' | 'integration';

export type AuditStatus = 'verified' | 'deprecated' | 'corrected';

export type QuestionType = 'single' | 'multiple' | 'code';

export type Option = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  type: QuestionType;
  chapterId: ChapterId;
  subchapterId: string;
  prompt: string;
  options: Option[];
  answerIds: string[];
  explanation: string;
  whyWrong: Record<string, string>;
  sourceUrls: string[];
  verifiedAt: string;
  auditStatus: AuditStatus;
  origin: 'original' | 'adapted-source-quiz';
};

export type ArticleSection = {
  heading: string;
  body: string;
};

export type Article = {
  id: string;
  chapterId: ChapterId;
  subchapterId: string;
  topic: string;
  title: string;
  summary: string;
  keyPoints: string[];
  sections: ArticleSection[];
  sourceUrls: string[];
  verifiedAt: string;
  auditStatus: AuditStatus;
  order: number;
};

export type Subchapter = {
  id: string;
  title: string;
  skills: string[];
  studyNotes: string;
  sourceUrls: string[];
};

export type Chapter = {
  id: ChapterId;
  title: string;
  weight: string;
  summary: string;
  sourceUrls: string[];
  subchapters: Subchapter[];
};

export type ImportedQuestionManifestItem = {
  sourceTopic: string;
  count: number;
  mappedChapterId: ChapterId | null;
  mappedSubchapterId: string | null;
  auditStatus: 'microsoft_mapped';
  sourcePath: string;
};

export type SourceQuizItem = {
  id: string;
  sourceTopic: string;
  chapterId: ChapterId;
  subchapterId: string;
  prompt: string;
  answer: string;
  options: Option[];
  answerIds: string[];
  sourceUrls: string[];
  verifiedAt: string;
  auditStatus: 'verified';
  verificationLevel: 'topic_microsoft_mapped';
  correctionNotes: string | null;
};

export type SourceQuizBank = {
  generatedAt: string;
  sourceRepository: string;
  sourceLicense: string;
  policy: string;
  items: SourceQuizItem[];
};

export type ArticleBank = {
  generatedAt: string;
  sourceNote: string;
  articles: Article[];
};

export type HardTopic = {
  id: string;
  chapterId: ChapterId;
  subchapterId: string;
  cluster: string;
  topic: string;
  question: string;
  correctAnswer: string;
  explanation: string;
  example: string;
  sourceUrls: string[];
  verifiedAt: string;
  auditStatus: AuditStatus;
  order: number;
};

export type HardTopicBank = {
  generatedAt: string;
  sourceNote: string;
  topics: HardTopic[];
};

export type ExamContent = {
  metadata: {
    examCode: string;
    examName: string;
    skillsMeasuredAsOf: string;
    examRetiresOn: string;
    language: string;
    sourceUrls: string[];
    sourceQuiz: {
      url: string;
      repository: string;
      license: string;
      policy: string;
    };
  };
  chapters: Chapter[];
  questions: Question[];
  importedQuestionManifest: ImportedQuestionManifestItem[];
};

export const content = rawContent as unknown as ExamContent;
export const sourceQuizBank = rawSourceQuiz as unknown as SourceQuizBank;
export const articleBank = rawArticles as unknown as ArticleBank;
export const hardTopicBank = rawHardTopics as unknown as HardTopicBank;

export const sourceQuizQuestions: Question[] = sourceQuizBank.items
  .filter((item) => item.options.length > 0 && item.answerIds.length > 0)
  .map((item) => ({
    id: item.id,
    type: item.answerIds.length > 1 ? 'multiple' : 'single',
    chapterId: item.chapterId,
    subchapterId: item.subchapterId,
    prompt: item.prompt,
    options: item.options,
    answerIds: item.answerIds,
    explanation:
      item.answer ||
      'Odpowiedź została zachowana z audytowanego zestawu i powiązana z oficjalnymi źródłami Microsoft Learn.',
    whyWrong: Object.fromEntries(
      item.options
        .filter((option) => !item.answerIds.includes(option.id))
        .map((option) => [
          option.id,
          'Ta opcja nie jest oznaczona jako poprawna w audytowanym zestawie. Porównaj ją z wyjaśnieniem oraz linkami Microsoft Learn.'
        ])
    ),
    sourceUrls: item.sourceUrls,
    verifiedAt: item.verifiedAt,
    auditStatus: item.auditStatus,
    origin: 'adapted-source-quiz'
  }));

export const originalVerifiedQuestions = content.questions.filter(
  (question) => question.auditStatus === 'verified'
);

export const verifiedQuestions = [...originalVerifiedQuestions, ...sourceQuizQuestions];

export const verifiedArticles = articleBank.articles.filter(
  (article) => article.auditStatus === 'verified'
);

export const verifiedHardTopics = hardTopicBank.topics
  .filter((topic) => topic.auditStatus === 'verified')
  .sort((a, b) => a.order - b.order);

export function getChapter(chapterId: ChapterId) {
  return content.chapters.find((chapter) => chapter.id === chapterId);
}

export function getSubchapter(chapterId: ChapterId, subchapterId: string) {
  return getChapter(chapterId)?.subchapters.find((subchapter) => subchapter.id === subchapterId);
}

export function getQuestionsForSubchapter(chapterId: ChapterId, subchapterId: string) {
  return verifiedQuestions.filter(
    (question) => question.chapterId === chapterId && question.subchapterId === subchapterId
  );
}

export function getQuestionsForChapter(chapterId: ChapterId) {
  return verifiedQuestions.filter((question) => question.chapterId === chapterId);
}

export function getArticlesForSubchapter(chapterId: ChapterId, subchapterId: string) {
  return verifiedArticles
    .filter((article) => article.chapterId === chapterId && article.subchapterId === subchapterId)
    .sort((a, b) => a.order - b.order);
}

export function getArticlesForChapter(chapterId: ChapterId) {
  return verifiedArticles.filter((article) => article.chapterId === chapterId);
}

export function importedBacklogCount() {
  return content.importedQuestionManifest.reduce((sum, item) => sum + item.count, 0);
}

export function importedVerifiedCount() {
  return sourceQuizBank.items.length;
}

export function importedExamQuestionCount() {
  return sourceQuizQuestions.length;
}

export function getOfficialSubchapterCount() {
  return content.chapters.reduce((sum, chapter) => sum + chapter.subchapters.length, 0);
}

export function getActiveCoverageBySubchapter() {
  return content.chapters.flatMap((chapter) =>
    chapter.subchapters.map((subchapter) => ({
      chapter,
      subchapter,
      questions: getQuestionsForSubchapter(chapter.id, subchapter.id).length,
      articles: getArticlesForSubchapter(chapter.id, subchapter.id).length
    }))
  );
}

export function getWeightedMockQuestions() {
  const targets: Record<ChapterId, number> = {
    compute: 28,
    storage: 18,
    security: 18,
    monitoring: 8,
    integration: 28
  };
  const selected = new Map<string, Question>();

  for (const chapter of content.chapters) {
    getQuestionsForChapter(chapter.id)
      .slice(0, targets[chapter.id])
      .forEach((question) => selected.set(question.id, question));
  }

  return Array.from(selected.values());
}

import type { Question } from './content';

export type AnswerState = Record<string, string[]>;

export type QuestionResult = {
  question: Question;
  selectedIds: string[];
  correct: boolean;
};

export type ExamResult = {
  total: number;
  correct: number;
  percentage: number;
  results: QuestionResult[];
};

export function normalizeAnswer(ids: string[]) {
  return Array.from(new Set(ids)).sort();
}

export function isCorrectAnswer(selectedIds: string[], answerIds: string[]) {
  const selected = normalizeAnswer(selectedIds);
  const answers = normalizeAnswer(answerIds);
  return selected.length === answers.length && selected.every((id, index) => id === answers[index]);
}

export function toggleAnswer(question: Question, selectedIds: string[], optionId: string) {
  if (question.type === 'single') {
    return [optionId];
  }

  if (selectedIds.includes(optionId)) {
    return selectedIds.filter((id) => id !== optionId);
  }

  return [...selectedIds, optionId];
}

export function scoreExam(questions: Question[], answers: AnswerState): ExamResult {
  const results = questions.map((question) => {
    const selectedIds = answers[question.id] ?? [];
    return {
      question,
      selectedIds,
      correct: isCorrectAnswer(selectedIds, question.answerIds)
    };
  });

  const correct = results.filter((result) => result.correct).length;
  const total = questions.length;

  return {
    total,
    correct,
    percentage: total === 0 ? 0 : Math.round((correct / total) * 100),
    results
  };
}

import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  Filter,
  Layers,
  ListChecks,
  RotateCcw,
  SearchCheck,
  Shuffle,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  type Chapter,
  type ChapterId,
  type Flashcard,
  type Question,
  type Subchapter,
  content,
  getActiveCoverageBySubchapter,
  getFlashcardsForChapter,
  getFlashcardsForSubchapter,
  getOfficialSubchapterCount,
  getQuestionsForChapter,
  getQuestionsForSubchapter,
  getWeightedMockQuestions,
  importedExamQuestionCount,
  importedFlashcardCount,
  importedVerifiedCount,
  sourceQuizBank,
  verifiedFlashcards,
  verifiedQuestions
} from './domain/content';
import {
  type AnswerState,
  type ExamResult,
  scoreExam,
  toggleAnswer
} from './domain/scoring';
import {
  type StoredProgress,
  chapterProgress,
  rateFlashcard,
  readProgress,
  recordExamAttempt,
  writeProgress
} from './domain/progress';

type View = 'dashboard' | 'flashcards' | 'exam' | 'audit';
type ThemeMode = 'day' | 'night';

type StudyTarget = {
  chapterId: ChapterId;
  subchapterId: string;
};

const defaultTarget: StudyTarget = {
  chapterId: content.chapters[0].id,
  subchapterId: content.chapters[0].subchapters[0].id
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function shuffleItems<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getSubchapterTitle(chapter: Chapter, subchapterId: string) {
  return chapter.subchapters.find((subchapter) => subchapter.id === subchapterId)?.title ?? '';
}

function useProgress() {
  const [progress, setProgress] = useState<StoredProgress>(() => readProgress());

  useEffect(() => {
    writeProgress(progress);
  }, [progress]);

  return [progress, setProgress] as const;
}

function useThemeMode() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const storedTheme = window.localStorage.getItem('az204-theme');
    return storedTheme === 'day' || storedTheme === 'night' ? storedTheme : 'night';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem('az204-theme', theme);
  }, [theme]);

  return [theme, setTheme] as const;
}

export function App() {
  const [view, setView] = useState<View>('dashboard');
  const [target, setTarget] = useState<StudyTarget>(defaultTarget);
  const [progress, setProgress] = useProgress();
  const [theme, setTheme] = useThemeMode();

  const selectedChapter =
    content.chapters.find((chapter) => chapter.id === target.chapterId) ?? content.chapters[0];
  const selectedSubchapter =
    selectedChapter.subchapters.find((subchapter) => subchapter.id === target.subchapterId) ??
    selectedChapter.subchapters[0];

  function updateChapter(chapterId: ChapterId) {
    const chapter = content.chapters.find((item) => item.id === chapterId);
    if (!chapter) return;
    setTarget({ chapterId, subchapterId: chapter.subchapters[0].id });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Nawigacja">
        <div className="brand-mark">
          <div className="brand-icon">AZ</div>
          <div>
            <strong>AZ-204</strong>
            <span>Quiz Cards</span>
          </div>
        </div>

        <nav className="main-nav">
          <NavButton active={view === 'dashboard'} icon={<BarChart3 />} onClick={() => setView('dashboard')}>
            Dashboard
          </NavButton>
          <NavButton active={view === 'flashcards'} icon={<Layers />} onClick={() => setView('flashcards')}>
            Fiszki
          </NavButton>
          <NavButton active={view === 'exam'} icon={<ClipboardCheck />} onClick={() => setView('exam')}>
            Egzaminy
          </NavButton>
          <NavButton active={view === 'audit'} icon={<SearchCheck />} onClick={() => setView('audit')}>
            Audyt
          </NavButton>
        </nav>

        <button
          className="theme-toggle"
          type="button"
          title={theme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
          aria-label={theme === 'day' ? 'Switch to night mode' : 'Switch to day mode'}
          onClick={() => setTheme(theme === 'day' ? 'night' : 'day')}
        >
          {theme === 'day' ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
          <span>{theme === 'day' ? 'Day mode' : 'Night mode'}</span>
        </button>

        <div className="sidebar-card">
          <span className="mini-label">Active pool</span>
          <strong>{verifiedQuestions.length}</strong>
          <span>pytań testowych</span>
        </div>

        <div className="sidebar-links" aria-label="Sources and licenses">
          <a href="https://github.com/mikolaj-sujka/AZ204-Quiz-Cards/blob/main/NOTICE.md" target="_blank" rel="noreferrer">
            <ExternalLink aria-hidden="true" />
            Sources & licenses
          </a>
        </div>
      </aside>

      <main className="main-content">
        <Header />

        {view !== 'dashboard' && view !== 'audit' ? (
          <StudyFilters
            target={target}
            selectedChapter={selectedChapter}
            selectedSubchapter={selectedSubchapter}
            onChapterChange={updateChapter}
            onSubchapterChange={(subchapterId) => setTarget({ ...target, subchapterId })}
          />
        ) : null}

        {view === 'dashboard' ? (
          <Dashboard progress={progress} onSelectTarget={setTarget} onViewChange={setView} />
        ) : null}
        {view === 'flashcards' ? (
          <FlashcardsView
            target={target}
            chapter={selectedChapter}
            subchapter={selectedSubchapter}
            progress={progress}
            onProgressChange={setProgress}
          />
        ) : null}
        {view === 'exam' ? (
          <ExamView target={target} chapter={selectedChapter} subchapter={selectedSubchapter} progress={progress} onProgressChange={setProgress} />
        ) : null}
        {view === 'audit' ? <AuditView /> : null}
      </main>
    </div>
  );
}

function Header() {
  return (
    <section className="exam-header">
      <div className="exam-header-copy">
        <span className="eyebrow">Microsoft Azure Developer Associate</span>
        <h1>AZ-204 study cockpit</h1>
        <p>
          Fiszki i egzaminy według oficjalnych skills measured. Treści aktywne mają status
          verified i linki do Microsoft Learn.
        </p>
      </div>
      <div className="retirement-banner" role="note">
        <AlertTriangle aria-hidden="true" />
        <div>
          <strong>Retirement: 31 lipca 2026</strong>
          <span>Zakres: skills measured as of 14 stycznia 2026</span>
        </div>
      </div>
    </section>
  );
}

function NavButton({
  active,
  icon,
  children,
  onClick
}: {
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className={cx('nav-button', active && 'is-active')} type="button" onClick={onClick}>
      {icon}
      <span>{children}</span>
    </button>
  );
}

function StudyFilters({
  target,
  selectedChapter,
  selectedSubchapter,
  onChapterChange,
  onSubchapterChange
}: {
  target: StudyTarget;
  selectedChapter: Chapter;
  selectedSubchapter: Subchapter;
  onChapterChange: (chapterId: ChapterId) => void;
  onSubchapterChange: (subchapterId: string) => void;
}) {
  const chapterOptions = content.chapters.map((chapter) => ({
    value: chapter.id,
    label: chapter.title,
    meta: `${chapter.weight} · ${getQuestionsForChapter(chapter.id).length} pytań · ${getFlashcardsForChapter(chapter.id).length} fiszek`
  }));
  const subchapterOptions = selectedChapter.subchapters.map((subchapter) => ({
    value: subchapter.id,
    label: subchapter.title,
    meta: `${getQuestionsForSubchapter(selectedChapter.id, subchapter.id).length} pytań · ${getFlashcardsForSubchapter(selectedChapter.id, subchapter.id).length} fiszek`
  }));

  return (
    <section className="filter-bar" aria-label="Filtry nauki">
      <div className="filter-title">
        <Filter aria-hidden="true" />
        <span>Zakres nauki</span>
      </div>
      <ElegantDropdown
        label="Chapter"
        value={target.chapterId}
        options={chapterOptions}
        onChange={(value) => onChapterChange(value as ChapterId)}
      />
      <ElegantDropdown
        label="Subchapter"
        value={selectedSubchapter.id}
        options={subchapterOptions}
        onChange={onSubchapterChange}
      />
    </section>
  );
}

type DropdownOption = {
  value: string;
  label: string;
  meta?: string;
};

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: 'above' | 'below';
};

function ElegantDropdown({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return undefined;
    }

    function syncPosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportGap = 14;
      const menuGap = 10;
      const maxPreferredHeight = Math.min(420, Math.round(window.innerHeight * 0.52));
      const desiredHeight = Math.min(
        maxPreferredHeight,
        16 + options.length * 58 + Math.max(0, options.length - 1) * 6
      );
      const spaceBelow = window.innerHeight - rect.bottom - viewportGap - menuGap;
      const spaceAbove = rect.top - viewportGap - menuGap;
      const openAbove = desiredHeight > spaceBelow && spaceAbove > spaceBelow;
      const availableHeight = Math.max(
        180,
        Math.min(desiredHeight, openAbove ? spaceAbove : spaceBelow)
      );
      const left = Math.min(
        Math.max(viewportGap, rect.left),
        Math.max(viewportGap, window.innerWidth - rect.width - viewportGap)
      );
      const top = openAbove
        ? Math.max(viewportGap, rect.top - availableHeight - menuGap)
        : rect.bottom + menuGap;

      setPosition({
        top,
        left,
        width: rect.width,
        maxHeight: availableHeight,
        placement: openAbove ? 'above' : 'below'
      });
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (fieldRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    syncPosition();
    window.addEventListener('resize', syncPosition);
    window.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      window.removeEventListener('resize', syncPosition);
      window.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [open, options.length]);

  const menu = open && position
    ? createPortal(
        <div
          ref={menuRef}
          className={cx('dropdown-menu', position.placement === 'above' && 'is-above')}
          role="listbox"
          aria-label={label}
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
            maxHeight: position.maxHeight
          }}
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                className={cx('dropdown-option', active && 'is-active')}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <span>
                  <strong>{option.label}</strong>
                  {option.meta ? <small>{option.meta}</small> : null}
                </span>
                {active ? <Check aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>,
        document.body
      )
    : null;

  return (
    <div
      ref={fieldRef}
      className={cx('filter-field', open && 'is-open')}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false);
        }
      }}
    >
      <span className="filter-label">{label}</span>
      <button
        ref={triggerRef}
        className="dropdown-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${selected?.label ?? ''}`}
        onClick={() => setOpen((current) => !current)}
      >
        <span>
          <strong>{selected?.label}</strong>
          {selected?.meta ? <small>{selected.meta}</small> : null}
        </span>
        <ChevronDown aria-hidden="true" />
      </button>

      {menu}
    </div>
  );
}

function Dashboard({
  progress,
  onSelectTarget,
  onViewChange
}: {
  progress: StoredProgress;
  onSelectTarget: (target: StudyTarget) => void;
  onViewChange: (view: View) => void;
}) {
  const importedCount = importedVerifiedCount();
  const officialSubchapters = getOfficialSubchapterCount();
  const coverage = getActiveCoverageBySubchapter();
  const verifiedCoverage = coverage.filter((item) => item.questions > 0 && item.flashcards > 0).length;
  const knownCards = Object.values(progress.flashcards).filter((rating) => rating === 'known').length;
  const attempts = Object.values(progress.examAttempts);
  const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.bestScore), 0);

  return (
    <div className="stack">
      <section className="metrics-grid">
        <MetricCard icon={<BookOpen />} label="Rozdziały Microsoft" value={content.chapters.length} detail={`${officialSubchapters} podrozdziałów`} />
        <MetricCard icon={<ClipboardCheck />} label="Exam questions" value={verifiedQuestions.length} detail={`${importedExamQuestionCount()} z quizu źródłowego`} />
        <MetricCard icon={<Layers />} label="Known flashcards" value={knownCards} detail={`${verifiedFlashcards.length} fiszek`} />
        <MetricCard icon={<SearchCheck />} label="Microsoft-mapped" value={importedCount} detail="pytania z quizu źródłowego" />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="mini-label">Study map</span>
            <h2>Rozdziały według Microsoft Learn</h2>
          </div>
          <span className="status-pill">{verifiedCoverage}/{officialSubchapters} covered</span>
        </div>

        <div className="chapter-grid">
          {content.chapters.map((chapter) => {
            const cardIds = getFlashcardsForChapter(chapter.id).map((card) => card.id);
            const questionIds = getQuestionsForChapter(chapter.id).map((question) => question.id);
            const stats = chapterProgress(progress, chapter.id, cardIds, questionIds);
            return (
              <article key={chapter.id} className="chapter-card">
                <div className="chapter-card-top">
                  <span className="weight">{chapter.weight}</span>
                  <h3>{chapter.title}</h3>
                </div>
                <p>{chapter.summary}</p>
                <div className="chapter-stat-row">
                  <span>{stats.knownCards}/{stats.totalCards} fiszek</span>
                  <span>{stats.totalQuestions} pytań</span>
                  <span>best {stats.bestExamScore}%</span>
                </div>
                <div className="subchapter-list">
                  {chapter.subchapters.map((subchapter) => (
                    <button
                      key={subchapter.id}
                      type="button"
                      onClick={() => {
                        onSelectTarget({ chapterId: chapter.id, subchapterId: subchapter.id });
                        onViewChange('flashcards');
                      }}
                    >
                      <span>{subchapter.title}</span>
                      <ChevronRight aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel split-panel">
        <div>
          <span className="mini-label">Mock exam</span>
          <h2>Najlepszy wynik: {bestScore}%</h2>
          <p>
            Tryb mock exam używa pytań oryginalnych oraz zaimportowanego banku z mapowaniem
            Microsoft Learn. Pytania opisowe/kodowe są dostępne jako fiszki.
          </p>
        </div>
        <button className="primary-action" type="button" onClick={() => onViewChange('exam')}>
          <ClipboardCheck aria-hidden="true" />
          Otwórz egzaminy
        </button>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function FlashcardsView({
  target,
  chapter,
  subchapter,
  progress,
  onProgressChange
}: {
  target: StudyTarget;
  chapter: Chapter;
  subchapter: Subchapter;
  progress: StoredProgress;
  onProgressChange: (progress: StoredProgress) => void;
}) {
  const [cards, setCards] = useState<Flashcard[]>(() =>
    getFlashcardsForSubchapter(target.chapterId, target.subchapterId)
  );
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setCards(getFlashcardsForSubchapter(target.chapterId, target.subchapterId));
    setIndex(0);
    setFlipped(false);
  }, [target.chapterId, target.subchapterId]);

  const card = cards[index];
  const knownCount = cards.filter((item) => progress.flashcards[item.id] === 'known').length;

  function move(delta: number) {
    setIndex((current) => Math.min(Math.max(current + delta, 0), Math.max(cards.length - 1, 0)));
    setFlipped(false);
  }

  function rate(rating: 'known' | 'again') {
    if (!card) return;
    onProgressChange(rateFlashcard(progress, card.id, rating));
    move(1);
  }

  return (
    <div className="stack">
      <section className="panel split-panel">
        <div>
          <span className="mini-label">{chapter.title}</span>
          <h2>{subchapter.title}</h2>
          <p>{subchapter.studyNotes}</p>
        </div>
        <div className="button-row">
          <button className="icon-button" type="button" title="Shuffle fiszki" onClick={() => setCards(shuffleItems(cards))}>
            <Shuffle aria-hidden="true" />
          </button>
          <span className="status-pill">{knownCount}/{cards.length} known</span>
        </div>
      </section>

      {card ? (
        <section className={cx('flashcard-stage', flipped && 'is-flipped')}>
          <button
            className="flashcard"
            type="button"
            onClick={() => setFlipped((value) => !value)}
            aria-pressed={flipped}
          >
            <span className="flashcard-face flashcard-front">
              <span className="mini-label">Prompt</span>
              <TextBlock text={card.front} featured />
              <span className="tap-hint">Kliknij kartę, aby odwrócić</span>
            </span>
            <span className="flashcard-face flashcard-back">
              <span className="mini-label">Answer</span>
              <TextBlock text={card.back} />
              <ul>
                {card.keyPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </span>
          </button>
          <div className="card-controls">
            <button className="secondary-action" type="button" onClick={() => move(-1)} disabled={index === 0}>
              <ChevronLeft aria-hidden="true" />
              Poprzednia
            </button>
            <span>{index + 1} / {cards.length}</span>
            <button className="secondary-action" type="button" onClick={() => move(1)} disabled={index === cards.length - 1}>
              Następna
              <ChevronRight aria-hidden="true" />
            </button>
          </div>
          <div className="card-controls">
            <button className="danger-action" type="button" onClick={() => rate('again')}>
              <RotateCcw aria-hidden="true" />
              Powtórz
            </button>
            <button className="success-action" type="button" onClick={() => rate('known')}>
              <Check aria-hidden="true" />
              Znam
            </button>
          </div>
          <SourceLinks urls={card.sourceUrls} />
        </section>
      ) : (
        <EmptyState title="Brak fiszek" body="Ten podrozdział nie ma jeszcze zweryfikowanych fiszek." />
      )}
    </div>
  );
}

function ExamView({
  target,
  chapter,
  subchapter,
  progress,
  onProgressChange
}: {
  target: StudyTarget;
  chapter: Chapter;
  subchapter: Subchapter;
  progress: StoredProgress;
  onProgressChange: (progress: StoredProgress) => void;
}) {
  const [mode, setMode] = useState<'subchapter' | 'mock'>('subchapter');
  const [answers, setAnswers] = useState<AnswerState>({});
  const [result, setResult] = useState<ExamResult | null>(null);
  const [retryQuestions, setRetryQuestions] = useState<Question[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const questions = useMemo(() => {
    const baseQuestions = retryQuestions
      ? retryQuestions
      : mode === 'mock'
      ? getWeightedMockQuestions()
      : getQuestionsForSubchapter(target.chapterId, target.subchapterId);

    return mode === 'mock' || baseQuestions.length > 100
      ? baseQuestions.slice(0, 100)
      : baseQuestions;
  }, [mode, retryQuestions, target.chapterId, target.subchapterId]);

  useEffect(() => {
    setAnswers({});
    setResult(null);
    setRetryQuestions(null);
    setCurrentIndex(0);
  }, [mode, target.chapterId, target.subchapterId]);

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, Math.max(questions.length - 1, 0)));
  }, [questions.length]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] ?? [] : [];
  const answeredCount = questions.filter((question) => (answers[question.id] ?? []).length > 0).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canMoveForward = currentAnswer.length > 0;
  const completionPercent = questions.length === 0 ? 0 : Math.round((answeredCount / questions.length) * 100);

  function submitExam() {
    const nextResult = scoreExam(questions, answers);
    const examKey =
      mode === 'mock'
        ? 'mock-weighted'
        : `${target.chapterId}:${target.subchapterId}`;
    const missedQuestionIds = nextResult.results
      .filter((item) => !item.correct)
      .map((item) => item.question.id);
    setResult(nextResult);
    setCurrentIndex(0);
    onProgressChange(recordExamAttempt(progress, examKey, nextResult.percentage, missedQuestionIds));
  }

  function retryMissed() {
    if (!result) return;
    const missed = result.results.filter((item) => !item.correct).map((item) => item.question);
    setRetryQuestions(missed);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
  }

  return (
    <div className="stack">
      <section className="panel split-panel">
        <div>
          <span className="mini-label">{mode === 'mock' ? 'Weighted mock exam' : chapter.title}</span>
          <h2>{mode === 'mock' ? 'Pełny mock exam' : subchapter.title}</h2>
          <p>
            {mode === 'mock'
              ? 'Egzamin ma 100 pytań dobranych z verified pool i rozłożonych po oficjalnych domains.'
              : 'Egzamin obejmuje aktywne, zweryfikowane pytania dla wybranego podrozdziału, maksymalnie 100 w jednej sesji.'}
          </p>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Tryb egzaminu">
          <button className={cx(mode === 'subchapter' && 'is-active')} type="button" onClick={() => setMode('subchapter')}>
            Subchapter
          </button>
          <button className={cx(mode === 'mock' && 'is-active')} type="button" onClick={() => setMode('mock')}>
            Mock
          </button>
        </div>
      </section>

      {questions.length === 0 ? (
        <EmptyState title="Brak pytań" body="Ten zakres nie ma jeszcze aktywnych pytań verified." />
      ) : result ? (
        <section className="exam-panel">
          <div className="result-hero">
            <div>
              <span className="mini-label">Wynik egzaminu</span>
              <h2>{result.correct}/{result.total} poprawnych · {result.percentage}%</h2>
              <p>
                Poniżej masz pełną listę pytań, swoje odpowiedzi, poprawne odpowiedzi,
                wyjaśnienia oraz źródła Microsoft Learn.
              </p>
            </div>
            <div className="button-row">
              <button className="primary-action" type="button" onClick={() => {
                setAnswers({});
                setResult(null);
                setCurrentIndex(0);
              }}>
                <RotateCcw aria-hidden="true" />
                Jeszcze raz
              </button>
              <button className="secondary-action" type="button" onClick={retryMissed} disabled={result.correct === result.total}>
                <ListChecks aria-hidden="true" />
                Powtórz błędne
              </button>
            </div>
          </div>

          <div className="exam-review-list">
            {questions.map((question, questionIndex) => (
              <QuestionCard
                key={question.id}
                question={question}
                index={questionIndex}
                selectedIds={answers[question.id] ?? []}
                disabled
                result={result}
                onToggle={() => undefined}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="exam-panel">
          <div className="exam-toolbar exam-toolbar-vertical">
            <div className="exam-progress-copy">
              <span className="mini-label">Pytanie {currentIndex + 1} z {questions.length}</span>
              <h2>{mode === 'mock' ? 'Mock exam 100 pytań' : getSubchapterTitle(chapter, subchapter.id)}</h2>
            </div>
            <div className="exam-progress-meta">
              <span className="status-pill">{answeredCount}/{questions.length} odpowiedzi</span>
              <span className="status-pill">{completionPercent}%</span>
            </div>
            <div className="exam-progress-track" aria-hidden="true">
              <span style={{ width: `${completionPercent}%` }} />
            </div>
            <button className="secondary-action" type="button" onClick={() => {
              setAnswers({});
              setResult(null);
              setRetryQuestions(null);
              setCurrentIndex(0);
            }}>
              <RotateCcw aria-hidden="true" />
              Reset
            </button>
          </div>

          {currentQuestion ? (
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              index={currentIndex}
              selectedIds={currentAnswer}
              disabled={false}
              result={null}
              onToggle={(optionId) =>
                setAnswers((current) => ({
                  ...current,
                  [currentQuestion.id]: toggleAnswer(
                    currentQuestion,
                    current[currentQuestion.id] ?? [],
                    optionId
                  )
                }))
              }
            />
          ) : null}

          <div className="exam-step-controls">
            <button
              className="secondary-action"
              type="button"
              onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
              disabled={currentIndex === 0}
            >
              <ChevronLeft aria-hidden="true" />
              Wstecz
            </button>
            {!isLastQuestion ? (
              <button
                className="primary-action"
                type="button"
                onClick={() => setCurrentIndex((index) => Math.min(index + 1, questions.length - 1))}
                disabled={!canMoveForward}
              >
                Dalej
                <ChevronRight aria-hidden="true" />
              </button>
            ) : (
              <button
                className="primary-action"
                type="button"
                onClick={submitExam}
                disabled={answeredCount < questions.length}
              >
                <ClipboardCheck aria-hidden="true" />
                Zakończ egzamin
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function QuestionCard({
  question,
  index,
  selectedIds,
  disabled,
  result,
  onToggle
}: {
  question: Question;
  index: number;
  selectedIds: string[];
  disabled: boolean;
  result: ExamResult | null;
  onToggle: (optionId: string) => void;
}) {
  const questionResult = result?.results.find((item) => item.question.id === question.id);
  const isCorrect = questionResult?.correct;

  return (
    <article className={cx('question-card', result && (isCorrect ? 'is-correct' : 'is-wrong'))}>
      <div className="question-heading">
        <span>Question {index + 1}</span>
        <span className="status-pill">{question.type}</span>
      </div>
      <div className="question-prompt">
        <TextBlock text={question.prompt} />
      </div>
      <div className="option-list">
        {question.options.map((option) => {
          const selected = selectedIds.includes(option.id);
          const correct = question.answerIds.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              className={cx('option-button', selected && 'is-selected', result && correct && 'is-answer')}
              onClick={() => onToggle(option.id)}
              disabled={disabled}
            >
              <span className="option-marker">{selected ? <Check aria-hidden="true" /> : null}</span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {result ? (
        <div className="explanation">
          <strong>{isCorrect ? 'Poprawnie' : 'Do poprawki'}</strong>
          <TextBlock text={question.explanation} />
          {!isCorrect ? (
            <ul>
              {Object.entries(question.whyWrong).map(([id, text]) => (
                <li key={id}>
                  <strong>{id.toUpperCase()}:</strong> {text}
                </li>
              ))}
            </ul>
          ) : null}
          <SourceLinks urls={question.sourceUrls} />
        </div>
      ) : null}
    </article>
  );
}

function AuditView() {
  const importedCount = importedVerifiedCount();
  const rows = content.importedQuestionManifest;
  const coverage = getActiveCoverageBySubchapter();
  const correctionCount = sourceQuizBank.items.filter((item) => item.correctionNotes).length;

  return (
    <div className="stack">
      <section className="panel split-panel">
        <div>
          <span className="mini-label">Content audit</span>
          <h2>{importedCount} pytań z quizu zaimportowane do banku</h2>
          <p>
            Każdy element ma mapowanie do oficjalnego rozdziału i źródeł Microsoft Learn.
            {` ${importedExamQuestionCount()} pytań zamkniętych zasila egzaminy, ${importedFlashcardCount()} pozycji zasila fiszki, a ${correctionCount} znane błędy zostały poprawione.`}
          </p>
        </div>
        <span className="status-pill verified">Microsoft Learn mapped</span>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="mini-label">Official coverage</span>
            <h2>Pokrycie verified content</h2>
          </div>
        </div>
        <div className="coverage-table" role="table" aria-label="Pokrycie podrozdziałów">
          <div className="table-row table-head" role="row">
            <span>Domain</span>
            <span>Subchapter</span>
            <span>Questions</span>
            <span>Flashcards</span>
          </div>
          {coverage.map(({ chapter, subchapter, questions, flashcards }) => (
            <div className="table-row" role="row" key={`${chapter.id}-${subchapter.id}`}>
              <span>{chapter.title}</span>
              <span>{subchapter.title}</span>
            <span>{questions}</span>
            <span>{flashcards}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="mini-label">Source quiz manifest</span>
          <h2>Źródłowy quiz po mapowaniu</h2>
          </div>
        </div>
        <div className="audit-list">
          {rows.map((item) => (
            <article key={item.sourcePath} className="audit-item">
              <div>
                <strong>{item.sourceTopic}</strong>
                <span>{item.sourcePath}</span>
              </div>
              <div>
                <span className="status-pill">{item.count} items</span>
                <span className="status-pill verified">microsoft_mapped</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="empty-state">
      <X aria-hidden="true" />
      <h2>{title}</h2>
      <p>{body}</p>
    </section>
  );
}

function SourceLinks({ urls }: { urls: string[] }) {
  return (
    <div className="source-links" aria-label="Źródła Microsoft Learn">
      {urls.map((url) => (
        <a key={url} href={url} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden="true" />
          Microsoft Learn
        </a>
      ))}
    </div>
  );
}

function TextBlock({ text, featured = false }: { text: string; featured?: boolean }) {
  const blocks = text.split(/```/g);

  return (
    <div className={cx('markdown-lite', featured && 'is-featured')}>
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          const [languageLine, ...codeLines] = block.split('\n');
          const code = codeLines.join('\n').trim();
          return (
            <pre key={`${index}-${languageLine}`}>
              <code>{code}</code>
            </pre>
          );
        }

        return block
          .split(/\n{2,}/)
          .map((paragraph) => paragraph.trim())
          .filter(Boolean)
          .map((paragraph, paragraphIndex) => (
            <p key={`${index}-${paragraphIndex}`}>{paragraph.replace(/\*\*/g, '')}</p>
          ));
      })}
    </div>
  );
}

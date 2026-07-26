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
  Flame,
  Layers,
  ListChecks,
  RotateCcw,
  SearchCheck,
  Moon,
  Sun,
  X
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  type Article,
  type Chapter,
  type ChapterId,
  type HardTopic,
  type Question,
  type Subchapter,
  content,
  getActiveCoverageBySubchapter,
  getArticlesForChapter,
  getArticlesForSubchapter,
  getOfficialSubchapterCount,
  getQuestionsForChapter,
  getQuestionsForSubchapter,
  getWeightedMockQuestions,
  importedExamQuestionCount,
  importedVerifiedCount,
  sourceQuizBank,
  verifiedArticles,
  verifiedHardTopics,
  verifiedQuestions
} from './domain/content';
import {
  type AnswerState,
  type ExamResult,
  isCorrectAnswer,
  scoreExam,
  toggleAnswer
} from './domain/scoring';
import {
  type StoredProgress,
  chapterProgress,
  isArticleRead,
  markArticleRead,
  readProgress,
  recordExamAttempt,
  writeProgress
} from './domain/progress';

type View = 'dashboard' | 'articles' | 'hard-topics' | 'exam' | 'audit';
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
          <NavButton
            active={view === 'dashboard'}
            icon={<BarChart3 />}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </NavButton>
          <NavButton
            active={view === 'articles'}
            icon={<Layers />}
            onClick={() => setView('articles')}
          >
            Artykuły
          </NavButton>
          <NavButton
            active={view === 'hard-topics'}
            icon={<Flame />}
            onClick={() => setView('hard-topics')}
          >
            Trudne tematy
          </NavButton>
          <NavButton
            active={view === 'exam'}
            icon={<ClipboardCheck />}
            onClick={() => setView('exam')}
          >
            Egzaminy
          </NavButton>
          <NavButton
            active={view === 'audit'}
            icon={<SearchCheck />}
            onClick={() => setView('audit')}
          >
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
          <a
            href="https://github.com/mikolaj-sujka/AZ204-Quiz-Cards/blob/main/NOTICE.md"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink aria-hidden="true" />
            Sources & licenses
          </a>
        </div>
      </aside>

      <main className="main-content">
        <Header />

        {view !== 'dashboard' && view !== 'audit' && view !== 'hard-topics' ? (
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
        {view === 'articles' ? (
          <ArticlesView
            target={target}
            chapter={selectedChapter}
            subchapter={selectedSubchapter}
            progress={progress}
            onProgressChange={setProgress}
          />
        ) : null}
        {view === 'hard-topics' ? <HardTopicsView /> : null}
        {view === 'exam' ? (
          <ExamView
            target={target}
            chapter={selectedChapter}
            subchapter={selectedSubchapter}
            progress={progress}
            onProgressChange={setProgress}
          />
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
          Artykuły i egzaminy według oficjalnych skills measured. Treści aktywne mają status
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
    meta: `${chapter.weight} · ${getQuestionsForChapter(chapter.id).length} pytań · ${getArticlesForChapter(chapter.id).length} artykułów`
  }));
  const subchapterOptions = selectedChapter.subchapters.map((subchapter) => ({
    value: subchapter.id,
    label: subchapter.title,
    meta: `${getQuestionsForSubchapter(selectedChapter.id, subchapter.id).length} pytań · ${getArticlesForSubchapter(selectedChapter.id, subchapter.id).length} artykułów`
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

  const menu =
    open && position
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
  const verifiedCoverage = coverage.filter(
    (item) => item.questions > 0 && item.articles > 0
  ).length;
  const readArticles = Object.keys(progress.articles).length;
  const attempts = Object.values(progress.examAttempts);
  const bestScore = attempts.reduce((best, attempt) => Math.max(best, attempt.bestScore), 0);

  return (
    <div className="stack">
      <section className="metrics-grid">
        <MetricCard
          icon={<BookOpen />}
          label="Rozdziały Microsoft"
          value={content.chapters.length}
          detail={`${officialSubchapters} podrozdziałów`}
        />
        <MetricCard
          icon={<ClipboardCheck />}
          label="Exam questions"
          value={verifiedQuestions.length}
          detail={`${importedExamQuestionCount()} z quizu źródłowego`}
        />
        <MetricCard
          icon={<Layers />}
          label="Articles read"
          value={readArticles}
          detail={`${verifiedArticles.length} artykułów`}
        />
        <MetricCard
          icon={<SearchCheck />}
          label="Microsoft-mapped"
          value={importedCount}
          detail="pytania z quizu źródłowego"
        />
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <span className="mini-label">Study map</span>
            <h2>Rozdziały według Microsoft Learn</h2>
          </div>
          <span className="status-pill">
            {verifiedCoverage}/{officialSubchapters} covered
          </span>
        </div>

        <div className="chapter-grid">
          {content.chapters.map((chapter) => {
            const articleIds = getArticlesForChapter(chapter.id).map((article) => article.id);
            const questionIds = getQuestionsForChapter(chapter.id).map((question) => question.id);
            const stats = chapterProgress(progress, chapter.id, articleIds, questionIds);
            return (
              <article key={chapter.id} className="chapter-card">
                <div className="chapter-card-top">
                  <span className="weight">{chapter.weight}</span>
                  <h3>{chapter.title}</h3>
                </div>
                <p>{chapter.summary}</p>
                <div className="chapter-stat-row">
                  <span>
                    {stats.readArticles}/{stats.totalArticles} artykułów
                  </span>
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
                        onViewChange('articles');
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
            Microsoft Learn.
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

function ArticlesView({
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
  const articles = useMemo(
    () => getArticlesForSubchapter(target.chapterId, target.subchapterId),
    [target.chapterId, target.subchapterId]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setSelectedId(null);
  }, [target.chapterId, target.subchapterId]);

  const readCount = articles.filter((article) =>
    isArticleRead(progress.articles[article.id])
  ).length;
  const selectedIndex = articles.findIndex((article) => article.id === selectedId);
  const selected = selectedIndex >= 0 ? articles[selectedIndex] : null;

  function toggleRead(articleId: string) {
    if (isArticleRead(progress.articles[articleId])) {
      const nextArticles = { ...progress.articles };
      delete nextArticles[articleId];
      onProgressChange({ ...progress, articles: nextArticles });
    } else {
      onProgressChange(markArticleRead(progress, articleId));
    }
  }

  return (
    <div className="stack">
      <section className="panel split-panel">
        <div>
          <span className="mini-label">{chapter.title}</span>
          <h2>{subchapter.title}</h2>
          <p>{subchapter.studyNotes}</p>
        </div>
        <span className="status-pill">
          {readCount}/{articles.length} przeczytane
        </span>
      </section>

      {selected ? (
        <ArticleDetail
          article={selected}
          isRead={isArticleRead(progress.articles[selected.id])}
          onToggleRead={() => toggleRead(selected.id)}
          onBack={() => setSelectedId(null)}
          onPrev={
            selectedIndex > 0 ? () => setSelectedId(articles[selectedIndex - 1].id) : undefined
          }
          onNext={
            selectedIndex < articles.length - 1
              ? () => setSelectedId(articles[selectedIndex + 1].id)
              : undefined
          }
          position={selectedIndex + 1}
          total={articles.length}
        />
      ) : articles.length > 0 ? (
        <section className="panel">
          <div className="audit-list">
            {articles.map((article) => {
              const read = isArticleRead(progress.articles[article.id]);
              return (
                <button
                  key={article.id}
                  type="button"
                  className="audit-item article-row"
                  onClick={() => setSelectedId(article.id)}
                >
                  <div>
                    <strong>{article.title}</strong>
                    <span>{article.summary}</span>
                  </div>
                  <div>
                    <span className={cx('status-pill', read && 'verified')}>
                      {read ? 'Przeczytane' : 'Nieprzeczytane'}
                    </span>
                    <ChevronRight aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Brak artykułów"
          body="Ten podrozdział nie ma jeszcze zweryfikowanych artykułów."
        />
      )}
    </div>
  );
}

function ArticleDetail({
  article,
  isRead,
  onToggleRead,
  onBack,
  onPrev,
  onNext,
  position,
  total
}: {
  article: Article;
  isRead: boolean;
  onToggleRead: () => void;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  position: number;
  total: number;
}) {
  return (
    <section className="panel article-detail">
      <div className="card-controls">
        <button className="secondary-action" type="button" onClick={onBack}>
          <ChevronLeft aria-hidden="true" />
          Lista artykułów
        </button>
        <span>
          {position} / {total}
        </span>
      </div>

      <span className="mini-label">{article.topic}</span>
      <h2>{article.title}</h2>
      <p>{article.summary}</p>

      <ul>
        {article.keyPoints.map((point) => (
          <li key={point}>{point}</li>
        ))}
      </ul>

      {article.sections.map((section) => (
        <div key={section.heading} className="article-section">
          <h3>{section.heading}</h3>
          <TextBlock text={section.body} />
        </div>
      ))}

      <SourceLinks urls={article.sourceUrls} />

      <div className="card-controls">
        <button className="secondary-action" type="button" onClick={onPrev} disabled={!onPrev}>
          <ChevronLeft aria-hidden="true" />
          Poprzedni
        </button>
        <button
          className={cx(isRead ? 'secondary-action' : 'success-action')}
          type="button"
          onClick={onToggleRead}
        >
          <Check aria-hidden="true" />
          {isRead ? 'Oznacz jako nieprzeczytane' : 'Oznacz jako przeczytane'}
        </button>
        <button className="secondary-action" type="button" onClick={onNext} disabled={!onNext}>
          Następny
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

function HardTopicsView() {
  const clusters: { cluster: string; topics: HardTopic[] }[] = [];
  for (const topic of verifiedHardTopics) {
    const group = clusters[clusters.length - 1];
    if (group && group.cluster === topic.cluster) {
      group.topics.push(topic);
    } else {
      clusters.push({ cluster: topic.cluster, topics: [topic] });
    }
  }

  return (
    <div className="stack">
      <section className="panel split-panel">
        <div>
          <span className="mini-label">Powtórka przed egzaminem</span>
          <h2>Trudne tematy</h2>
          <p>
            Zagadnienia zgłoszone jako trudne do zapamiętania — pytanie, poprawna odpowiedź,
            wyjaśnienie i przykład, do szybkiego doczytania w jednym miejscu.
          </p>
        </div>
        <span className="status-pill">{verifiedHardTopics.length} zagadnień</span>
      </section>

      {clusters.map(({ cluster, topics }) => (
        <section key={cluster} className="panel">
          <div className="section-heading">
            <div>
              <span className="mini-label">Grupa tematyczna</span>
              <h2>{cluster}</h2>
            </div>
          </div>
          <div className="hard-topic-list">
            {topics.map((topic) => (
              <HardTopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function HardTopicCard({ topic }: { topic: HardTopic }) {
  return (
    <article className="hard-topic-card">
      <span className="mini-label">{topic.topic}</span>

      <div className="hard-topic-question">
        <TextBlock text={topic.question} />
      </div>

      <div className="hard-topic-answer">
        <Check aria-hidden="true" />
        <span>{topic.correctAnswer}</span>
      </div>

      <TextBlock text={topic.explanation} />

      <div className="hard-topic-example">
        <span className="mini-label">Przykład</span>
        <TextBlock text={topic.example} />
      </div>

      <SourceLinks urls={topic.sourceUrls} />
    </article>
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
  const [checked, setChecked] = useState<Record<string, boolean>>({});
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
    setChecked({});
    setResult(null);
    setRetryQuestions(null);
    setCurrentIndex(0);
  }, [mode, target.chapterId, target.subchapterId]);

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, Math.max(questions.length - 1, 0)));
  }, [questions.length]);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] ?? []) : [];
  const answeredCount = questions.filter(
    (question) => (answers[question.id] ?? []).length > 0
  ).length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const canMoveForward = currentAnswer.length > 0;
  const completionPercent =
    questions.length === 0 ? 0 : Math.round((answeredCount / questions.length) * 100);
  const isCurrentChecked = currentQuestion ? (checked[currentQuestion.id] ?? false) : false;

  function checkCurrentAnswer() {
    if (!currentQuestion) return;
    setChecked((current) => ({ ...current, [currentQuestion.id]: true }));
  }

  function toggleCurrentOption(optionId: string) {
    if (!currentQuestion) return;
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: toggleAnswer(
        currentQuestion,
        current[currentQuestion.id] ?? [],
        optionId
      )
    }));
  }

  function goBack() {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  }

  function goNext() {
    if (isLastQuestion) {
      if (answeredCount === questions.length) submitExam();
      return;
    }
    if (canMoveForward) {
      setCurrentIndex((index) => Math.min(index + 1, questions.length - 1));
    }
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || result || !currentQuestion) return;
      if (/^[1-9]$/.test(event.key)) {
        const option = currentQuestion.options[Number(event.key) - 1];
        if (option) toggleCurrentOption(option.id);
        return;
      }
      switch (event.key) {
        case 'ArrowLeft':
          goBack();
          break;
        case 'ArrowRight':
        case 'Enter':
          goNext();
          break;
        case 'c':
        case 'C':
          if (canMoveForward && !isCurrentChecked) checkCurrentAnswer();
          break;
        default:
          break;
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  function submitExam() {
    const nextResult = scoreExam(questions, answers);
    const examKey =
      mode === 'mock' ? 'mock-weighted' : `${target.chapterId}:${target.subchapterId}`;
    const missedQuestionIds = nextResult.results
      .filter((item) => !item.correct)
      .map((item) => item.question.id);
    setResult(nextResult);
    setCurrentIndex(0);
    onProgressChange(
      recordExamAttempt(progress, examKey, nextResult.percentage, missedQuestionIds)
    );
  }

  function retryMissed() {
    if (!result) return;
    const missed = result.results.filter((item) => !item.correct).map((item) => item.question);
    setRetryQuestions(missed);
    setAnswers({});
    setChecked({});
    setResult(null);
    setCurrentIndex(0);
  }

  return (
    <div className="stack">
      <section className="panel split-panel">
        <div>
          <span className="mini-label">
            {mode === 'mock' ? 'Weighted mock exam' : chapter.title}
          </span>
          <h2>{mode === 'mock' ? 'Pełny mock exam' : subchapter.title}</h2>
          <p>
            {mode === 'mock'
              ? 'Egzamin ma 100 pytań dobranych z verified pool i rozłożonych po oficjalnych domains.'
              : 'Egzamin obejmuje aktywne, zweryfikowane pytania dla wybranego podrozdziału, maksymalnie 100 w jednej sesji.'}
          </p>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Tryb egzaminu">
          <button
            className={cx(mode === 'subchapter' && 'is-active')}
            type="button"
            onClick={() => setMode('subchapter')}
          >
            Subchapter
          </button>
          <button
            className={cx(mode === 'mock' && 'is-active')}
            type="button"
            onClick={() => setMode('mock')}
          >
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
              <h2>
                {result.correct}/{result.total} poprawnych · {result.percentage}%
              </h2>
              <p>
                Poniżej masz pełną listę pytań, swoje odpowiedzi, poprawne odpowiedzi, wyjaśnienia
                oraz źródła Microsoft Learn.
              </p>
            </div>
            <div className="button-row">
              <button
                className="primary-action"
                type="button"
                onClick={() => {
                  setAnswers({});
                  setChecked({});
                  setResult(null);
                  setCurrentIndex(0);
                }}
              >
                <RotateCcw aria-hidden="true" />
                Jeszcze raz
              </button>
              <button
                className="secondary-action"
                type="button"
                onClick={retryMissed}
                disabled={result.correct === result.total}
              >
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
                revealed
                onToggle={() => undefined}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="exam-panel">
          <div className="exam-toolbar exam-toolbar-vertical">
            <div className="exam-progress-copy">
              <span className="mini-label">
                Pytanie {currentIndex + 1} z {questions.length}
              </span>
              <h2>
                {mode === 'mock'
                  ? 'Mock exam 100 pytań'
                  : getSubchapterTitle(chapter, subchapter.id)}
              </h2>
            </div>
            <div className="exam-progress-meta">
              <span className="status-pill">
                {answeredCount}/{questions.length} odpowiedzi
              </span>
              <span className="status-pill">{completionPercent}%</span>
            </div>
            <div className="exam-progress-track" aria-hidden="true">
              <span style={{ width: `${completionPercent}%` }} />
            </div>
            <button
              className="secondary-action"
              type="button"
              onClick={() => {
                setAnswers({});
                setChecked({});
                setResult(null);
                setRetryQuestions(null);
                setCurrentIndex(0);
              }}
            >
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
              disabled={isCurrentChecked}
              revealed={isCurrentChecked}
              onToggle={toggleCurrentOption}
            />
          ) : null}

          <div className="exam-check-row">
            <button
              className="secondary-action"
              type="button"
              onClick={checkCurrentAnswer}
              disabled={!canMoveForward || isCurrentChecked}
            >
              <SearchCheck aria-hidden="true" />
              Sprawdź odpowiedź
            </button>
          </div>
          <span className="shortcut-hint">
            Skróty: 1–9 — wybierz opcję, C — sprawdź, ←/→ lub Enter — nawigacja
          </span>

          <div className="exam-step-controls">
            <button
              className="secondary-action"
              type="button"
              onClick={goBack}
              disabled={currentIndex === 0}
            >
              <ChevronLeft aria-hidden="true" />
              Wstecz
            </button>
            {!isLastQuestion ? (
              <button
                className="primary-action"
                type="button"
                onClick={goNext}
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
  revealed,
  onToggle
}: {
  question: Question;
  index: number;
  selectedIds: string[];
  disabled: boolean;
  revealed: boolean;
  onToggle: (optionId: string) => void;
}) {
  const isCorrect = isCorrectAnswer(selectedIds, question.answerIds);

  return (
    <article className={cx('question-card', revealed && (isCorrect ? 'is-correct' : 'is-wrong'))}>
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
              className={cx(
                'option-button',
                selected && 'is-selected',
                revealed && correct && 'is-answer'
              )}
              onClick={() => onToggle(option.id)}
              disabled={disabled}
            >
              <span className="option-marker">
                {selected ? <Check aria-hidden="true" /> : null}
              </span>
              <span>{option.text}</span>
            </button>
          );
        })}
      </div>

      {revealed ? (
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
            {` ${importedExamQuestionCount()} pytań zamkniętych zasila egzaminy, a ${correctionCount} znane błędy zostały poprawione.`}
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
            <span>Articles</span>
          </div>
          {coverage.map(({ chapter, subchapter, questions, articles }) => (
            <div className="table-row" role="row" key={`${chapter.id}-${subchapter.id}`}>
              <span>{chapter.title}</span>
              <span>{subchapter.title}</span>
              <span>{questions}</span>
              <span>{articles}</span>
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

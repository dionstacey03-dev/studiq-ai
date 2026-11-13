import React, { useEffect, useState } from 'react';
import {
  CheckSquare,
  Sparkles,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trash2,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useStudy } from '../../context/StudyContext';
import { requestQuizGeneration } from '../../services/aiClient';
import { Quiz } from '../../types/study';
import { playCorrectAnswerChime } from '../../utils/soundEffects';
import {
  PageHeader,
  ErrorBanner,
  EmptyState,
  SourceAttribution,
  LoadingSkeleton,
} from '../ui/CommonUI';

export const QuizView: React.FC = () => {
  const { state, draft, clearDraft, addQuiz, deleteQuiz, recordQuizAttempt } = useStudy();

  const [topic, setTopic] = useState('');
  const [sourceNotes, setSourceNotes] = useState('');
  const [subject, setSubject] = useState<string>(state.subjects[0] ?? 'General Studies');
  const [difficulty, setDifficulty] = useState<Quiz['difficulty']>('Intermediate');
  const [questionType, setQuestionType] = useState<Quiz['questionType']>('multiple-choice');
  const [questionCount, setQuestionCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Interactive Quiz Player State
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [celebratingKey, setCelebratingKey] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('studiq_quiz_sound_enabled');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });
  const shouldReduceMotion = useReducedMotion();

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('studiq_quiz_sound_enabled', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  useEffect(() => {
    if (draft && draft.targetModule === 'quiz') {
      setTopic(draft.topic);
      setSubject(draft.subject);
      setSourceNotes(draft.notes ?? '');
      setActiveQuizId(null);
      clearDraft();
    }
  }, [draft, clearDraft]);

  const activeQuiz = state.quizzes.find((q) => q.id === activeQuizId) ?? null;

  const startQuiz = (quizId: string) => {
    setActiveQuizId(quizId);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setRevealedQuestions({});
    setQuizCompleted(false);
  };

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !sourceNotes.trim()) {
      setError('Enter a topic or paste study material to generate a quiz.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const generated = await requestQuizGeneration({
        topic,
        sourceNotes,
        subject,
        difficulty,
        questionCount,
        questionType,
      });

      const createdQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: generated.title || topic || `${subject} Practice Quiz`,
        subject: generated.subject || subject,
        difficulty,
        questionType,
        createdAt: new Date().toISOString(),
        source: 'gemini',
        questions: generated.questions.map((q, idx) => ({
          ...q,
          id: `q-${Date.now()}-${idx}`,
          type: q.options.length === 2 ? 'true-false' : 'multiple-choice',
          correctIndex: Math.min(Math.max(0, Number(q.correctIndex) || 0), q.options.length - 1),
        })),
      };

      addQuiz(createdQuiz);
      setTopic('');
      setSourceNotes('');
      startQuiz(createdQuiz.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate quiz.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qIndex: number, optionIdx: number) => {
    if (revealedQuestions[qIndex] || quizCompleted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optionIdx }));
  };

  const handleCheckAnswer = (qIndex: number) => {
    if (selectedAnswers[qIndex] === undefined || !activeQuiz) return;
    setRevealedQuestions((prev) => ({ ...prev, [qIndex]: true }));
    const question = activeQuiz.questions[qIndex];
    if (question && selectedAnswers[qIndex] === question.correctIndex) {
      if (soundEnabled) {
        playCorrectAnswerChime();
      }
      const key = `${activeQuiz.id}-${qIndex}`;
      setCelebratingKey(key);
      setTimeout(() => {
        setCelebratingKey((prev) => (prev === key ? null : prev));
      }, 1100);
    }
  };

  const handleFinishQuiz = () => {
    if (!activeQuiz) return;
    let correctCount = 0;
    activeQuiz.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) correctCount += 1;
    });
    const total = activeQuiz.questions.length;
    const percentage = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    recordQuizAttempt({
      id: `att-${Date.now()}`,
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      subject: activeQuiz.subject,
      score: correctCount,
      total,
      percentage,
      completedAt: new Date().toISOString(),
    });
    setQuizCompleted(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Quiz Generator"
        subtitle="Generate multiple-choice and True/False quizzes from topics or study materials, review explanations, and track quiz history."
        action={
          activeQuiz && (
            <button
              type="button"
              onClick={() => setActiveQuizId(null)}
              className="px-4 py-2 text-sm font-medium text-[var(--text-main)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
            >
              Back to Quiz Library
            </button>
          )
        }
      />

      {activeQuiz ? (
        <section className="max-w-3xl mx-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--border-color)]">
            <div>
              <SourceAttribution
                source={activeQuiz.source}
                subject={activeQuiz.subject}
                extra={`${activeQuiz.difficulty} · ${activeQuiz.questionType}`}
              />
              <h2 className="text-xl font-bold text-[var(--text-main)] mt-1">{activeQuiz.title}</h2>
            </div>
            {!quizCompleted && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={toggleSound}
                  aria-pressed={soundEnabled}
                  aria-label={soundEnabled ? 'Mute quiz answer sounds' : 'Enable quiz answer sounds'}
                  title={soundEnabled ? 'Sound effects on' : 'Sound effects muted'}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    soundEnabled
                      ? 'bg-[var(--bg-subtle)] text-[var(--color-primary)] border-[var(--color-primary)]/30'
                      : 'bg-[var(--bg-main)] text-[var(--text-muted)] border-[var(--border-color)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5" />
                  )}
                  <span>{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
                </button>
                <div className="text-sm font-mono tabular-nums font-semibold text-[var(--color-primary)]">
                  Question {currentIdx + 1} / {activeQuiz.questions.length}
                </div>
              </div>
            )}
          </div>

          {!quizCompleted ? (
            (() => {
              const q = activeQuiz.questions[currentIdx];
              const chosen = selectedAnswers[currentIdx];
              const isRevealed = !!revealedQuestions[currentIdx];
              const allAnswered = activeQuiz.questions.every(
                (_, idx) => selectedAnswers[idx] !== undefined
              );

              return (
                <div className="space-y-6">
                  <div className="h-1.5 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] transition-all duration-200"
                      style={{
                        width: `${((currentIdx + 1) / activeQuiz.questions.length) * 100}%`,
                      }}
                    />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-[var(--text-muted)] mb-1.5">
                      Concept: {q.concept}
                    </p>
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--text-main)] leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = chosen === oIdx;
                      const isCorrectOption = oIdx === q.correctIndex;
                      const isJustCelebrated =
                        isRevealed &&
                        isCorrectOption &&
                        isSelected &&
                        celebratingKey === `${activeQuiz.id}-${currentIdx}`;

                      let styleClasses =
                        'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--color-primary)] text-[var(--text-main)]';
                      if (isRevealed) {
                        if (isCorrectOption) {
                          styleClasses =
                            'border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';
                        } else if (isSelected && !isCorrectOption) {
                          styleClasses =
                            'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-200';
                        } else {
                          styleClasses =
                            'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-muted)]';
                        }
                      } else if (isSelected) {
                        styleClasses =
                          'border-[var(--color-primary)] bg-[var(--bg-subtle)] text-[var(--text-main)]';
                      }

                      return (
                        <motion.button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentIdx, oIdx)}
                          disabled={isRevealed}
                          animate={
                            isJustCelebrated && !shouldReduceMotion
                              ? { scale: [1, 1.02, 1] }
                              : { scale: 1 }
                          }
                          transition={{ duration: 0.35, ease: 'easeOut' }}
                          className={`relative overflow-visible w-full text-left px-4 py-3.5 rounded-xl border transition-colors flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${styleClasses}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="font-mono text-xs font-semibold mt-0.5 text-[var(--text-muted)]">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span className="text-sm font-medium">{opt}</span>
                          </div>

                          {isRevealed && isCorrectOption && (
                            <motion.span
                              initial={shouldReduceMotion ? false : { scale: 0.75, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                              className="relative inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0"
                            >
                              <AnimatePresence>
                                {isJustCelebrated && !shouldReduceMotion && (
                                  <span
                                    aria-hidden="true"
                                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                                  >
                                    {[
                                      { x: -22, y: -16, color: '#42E6D0' },
                                      { x: 18, y: -18, color: '#FFBE73' },
                                      { x: 26, y: 4, color: '#10B981' },
                                      { x: -18, y: 16, color: '#42B8AE' },
                                      { x: 12, y: 18, color: '#FFBE73' },
                                      { x: 0, y: -22, color: '#10B981' },
                                    ].map((dot, dIdx) => (
                                      <motion.span
                                        key={dIdx}
                                        initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                                        animate={{
                                          x: dot.x,
                                          y: dot.y,
                                          scale: [0.6, 1.15, 0],
                                          opacity: [1, 1, 0],
                                        }}
                                        transition={{
                                          duration: 0.65,
                                          delay: dIdx * 0.025,
                                          ease: 'easeOut',
                                        }}
                                        className="absolute w-1.5 h-1.5 rounded-full"
                                        style={{ backgroundColor: dot.color }}
                                      />
                                    ))}
                                  </span>
                                )}
                              </AnimatePresence>
                              <CheckCircle2 className="w-4 h-4" />
                              Correct
                            </motion.span>
                          )}
                          {isRevealed && isSelected && !isCorrectOption && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                              <XCircle className="w-4 h-4" />
                              Incorrect
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>

                  {isRevealed && (
                    <motion.div
                      initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[var(--color-primary)]">
                          Explanation
                        </span>
                        {chosen === q.correctIndex && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            Nice work!
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[var(--text-main)] leading-relaxed">
                        {q.explanation}
                      </p>
                    </motion.div>
                  )}

                  <div className="pt-4 border-t border-[var(--border-color)] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentIdx === 0}
                        onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                        className="px-3.5 py-2 text-xs font-medium text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-subtle)] disabled:opacity-40 cursor-pointer"
                      >
                        Previous
                      </button>
                      {!isRevealed && (
                        <button
                          type="button"
                          disabled={chosen === undefined}
                          onClick={() => handleCheckAnswer(currentIdx)}
                          className="px-3.5 py-2 text-xs font-semibold text-[var(--color-primary)] bg-[var(--bg-subtle)] border border-[var(--border-color)] rounded-lg disabled:opacity-40 cursor-pointer"
                        >
                          Check Answer
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {currentIdx < activeQuiz.questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setCurrentIdx((i) =>
                              Math.min(activeQuiz.questions.length - 1, i + 1)
                            )
                          }
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg cursor-pointer"
                        >
                          Next Question
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!allAnswered}
                          onClick={handleFinishQuiz}
                          className="px-4 py-2 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] disabled:opacity-40 rounded-lg cursor-pointer"
                        >
                          Submit & Grade Quiz
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            (() => {
              const total = activeQuiz.questions.length;
              const correctCount = activeQuiz.questions.reduce(
                (sum, q, idx) => sum + (selectedAnswers[idx] === q.correctIndex ? 1 : 0),
                0
              );
              const pct = Math.round((correctCount / total) * 100);

              return (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="text-xs text-[var(--color-primary)] font-semibold">
                        Final Assessment Result
                      </div>
                      <div className="text-3xl font-bold font-mono tabular-nums text-[var(--text-main)] mt-1">
                        {correctCount} / {total} ({pct}%)
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Recorded in Quiz History and Progress & Analytics.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startQuiz(activeQuiz.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Retake Quiz
                    </button>
                  </div>

                  <div className="divide-y divide-[var(--border-color)] border border-[var(--border-color)] rounded-xl overflow-hidden">
                    {activeQuiz.questions.map((q, idx) => {
                      const chosen = selectedAnswers[idx];
                      const isCorrect = chosen === q.correctIndex;
                      return (
                        <div key={q.id} className="p-4 sm:p-5 bg-[var(--bg-main)] space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm font-semibold text-[var(--text-main)]">
                              {idx + 1}. {q.question}
                            </p>
                            {isCorrect ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                                <CheckCircle2 className="w-4 h-4" />
                                Correct
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                                <XCircle className="w-4 h-4" />
                                Incorrect
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">
                            Your answer:{' '}
                            <strong className="text-[var(--text-main)]">
                              {chosen !== undefined ? q.options[chosen] : 'Unanswered'}
                            </strong>{' '}
                            · Correct answer:{' '}
                            <strong className="text-emerald-600 dark:text-emerald-400">
                              {q.options[q.correctIndex]}
                            </strong>
                          </p>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}
        </section>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Quiz Generator Form */}
          <form
            onSubmit={handleGenerateQuiz}
            className="xl:col-span-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4"
          >
            <h2 className="text-base font-semibold text-[var(--text-main)]">
              Create Custom AI Quiz
            </h2>

            <div>
              <label htmlFor="quiz-topic" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Topic or Concept
              </label>
              <input
                id="quiz-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Oxidative Phosphorylation & Electron Transport"
                className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quiz-subject" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Subject
                </label>
                <select
                  id="quiz-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-medium bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {state.subjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quiz-type" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Question Type
                </label>
                <select
                  id="quiz-type"
                  value={questionType}
                  onChange={(e) => setQuestionType(e.target.value as Quiz['questionType'])}
                  className="w-full px-3 py-2 text-xs font-medium bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True / False</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="quiz-diff" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Difficulty
                </label>
                <select
                  id="quiz-diff"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as Quiz['difficulty'])}
                  className="w-full px-3 py-2 text-xs font-medium bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="Foundational">Foundational</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="quiz-count" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Question Count
                </label>
                <select
                  id="quiz-count"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-medium font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value={3}>3 questions</option>
                  <option value={5}>5 questions</option>
                  <option value={8}>8 questions</option>
                  <option value={10}>10 questions</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="quiz-notes" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Optional Study Material
              </label>
              <textarea
                id="quiz-notes"
                rows={4}
                value={sourceNotes}
                onChange={(e) => setSourceNotes(e.target.value)}
                placeholder="Paste notes or excerpts to generate questions directly from your material..."
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y"
              />
            </div>

            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Generating Quiz...' : 'Generate Quiz with Gemini'}
            </button>
          </form>

          {/* Quiz Library + Recent History */}
          <div className="xl:col-span-7 space-y-6">
            {loading && <LoadingSkeleton lines={5} />}

            {state.quizzes.length === 0 && !loading ? (
              <EmptyState
                icon={<CheckSquare className="w-5 h-5" />}
                title="No quizzes available"
                description="Generate a multiple-choice or True/False quiz on the left to test your mastery."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {state.quizzes.map((quiz) => {
                  const attempts = state.quizAttempts.filter((a) => a.quizId === quiz.id);
                  const bestScore =
                    attempts.length > 0
                      ? Math.max(...attempts.map((a) => a.percentage))
                      : null;

                  return (
                    <article
                      key={quiz.id}
                      className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <SourceAttribution
                          source={quiz.source}
                          subject={quiz.subject}
                          extra={quiz.difficulty}
                        />
                        <h3 className="text-base font-semibold text-[var(--text-main)] leading-snug">
                          {quiz.title}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] font-mono tabular-nums">
                          {quiz.questions.length} questions · {quiz.questionType}
                          {bestScore !== null ? ` · Best: ${bestScore}%` : ''}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                        <button
                          type="button"
                          onClick={() => startQuiz(quiz.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5" />
                          Start Quiz
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${quiz.title}`}
                          onClick={() => deleteQuiz(quiz.id)}
                          className="p-2 text-[var(--text-muted)] hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Quiz History */}
            {state.quizAttempts.length > 0 && (
              <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-[var(--text-main)]">
                  Recent Quiz History
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-muted)]">
                        <th className="py-2 pr-3">Quiz</th>
                        <th className="py-2 px-3 text-right">Score</th>
                        <th className="py-2 pl-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)] text-xs">
                      {state.quizAttempts.slice(0, 5).map((att) => (
                        <tr key={att.id}>
                          <td className="py-2.5 pr-3">
                            <div className="font-medium text-[var(--text-main)]">{att.quizTitle}</div>
                            <div className="text-[var(--text-muted)]">{att.subject}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-[var(--color-primary)]">
                            {att.score}/{att.total} ({att.percentage}%)
                          </td>
                          <td className="py-2.5 pl-3 text-right font-mono tabular-nums text-[var(--text-muted)]">
                            {new Date(att.completedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

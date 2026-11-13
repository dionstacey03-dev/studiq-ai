import React, { useState } from 'react';
import {
  Clock,
  Flame,
  Award,
  CheckCircle2,
  Circle,
  ArrowRight,
  Compass,
  BookCheck,
  Sparkles,
  Maximize2,
  Minimize2,
  Bookmark,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { DayOfWeek } from '../../types/study';
import { PageHeader, StatMetricCard, EmptyState, SourceAttribution } from '../ui/CommonUI';

const DAYS_ORDER: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DashboardView: React.FC = () => {
  const {
    state,
    setActiveModule,
    toggleTaskCompletion,
    setIsSessionModalOpen,
    openWithDraft,
    focusMode,
    toggleFocusMode,
    openReadLaterInFocus,
    openReadLaterQueue,
    toggleReadLaterStatus,
  } = useStudy();
  const [hoveredDay, setHoveredDay] = useState<DayOfWeek | null>(null);

  const todayMinutes = state.sessions
    .filter((s) => s.date === '2026-11-12')
    .reduce((sum, s) => sum + s.minutes, 0);
  const dailyGoalPct = Math.min(
    100,
    Math.round((todayMinutes / Math.max(1, state.profile.dailyGoalMinutes)) * 100)
  );

  const totalMinutes = state.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  const avgQuizAccuracy =
    state.quizAttempts.length > 0
      ? Math.round(
          state.quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / state.quizAttempts.length
        )
      : 0;

  const completedTopics = state.tasks.filter((t) => t.completed).length + state.summaries.length;

  const minutesByDay: Record<DayOfWeek, number> = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };
  for (const s of state.sessions) {
    if (minutesByDay[s.day] !== undefined) {
      minutesByDay[s.day] += s.minutes;
    }
  }
  const maxDayMinutes = Math.max(120, ...Object.values(minutesByDay));

  const upcomingSessions = state.tasks
    .filter((t) => !t.completed)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.startTime.localeCompare(b.startTime))
    .slice(0, 5);

  // Dynamic learning recommendations based on real state
  const difficultCardsCount = state.decks.reduce(
    (sum, d) => sum + d.cards.filter((c) => c.mastery === 'difficult').length,
    0
  );
  const lowestAttempt = [...state.quizAttempts].sort((a, b) => a.percentage - b.percentage)[0];

  const recommendations = [
    difficultCardsCount > 0
      ? {
          id: 'rec-cards',
          title: `Review ${difficultCardsCount} difficult flashcard${difficultCardsCount > 1 ? 's' : ''}`,
          detail: 'Targeted recall on flagged concepts improves retention.',
          actionLabel: 'Open Flashcards',
          onClick: () => setActiveModule('flashcards'),
        }
      : null,
    lowestAttempt && lowestAttempt.percentage < 85
      ? {
          id: 'rec-quiz',
          title: `Strengthen ${lowestAttempt.subject}`,
          detail: `Recent quiz score was ${lowestAttempt.percentage}%. Run an AI explanation or practice quiz.`,
          actionLabel: 'Ask AI Tutor',
          onClick: () =>
            openWithDraft({
              targetModule: 'assistant',
              topic: `Help me master key concepts in ${lowestAttempt.subject}`,
              subject: lowestAttempt.subject,
            }),
        }
      : null,
    {
      id: 'rec-summarize',
      title: 'Synthesize recent lecture notes',
      detail: 'Turn raw class notes into revision outlines and self-check questions.',
      actionLabel: 'Summarize Notes',
      onClick: () => setActiveModule('summarizer'),
    },
  ].filter(Boolean) as Array<{
    id: string;
    title: string;
    detail: string;
    actionLabel: string;
    onClick: () => void;
  }>;

  const hasOnlySampleData =
    state.sessions.every((s) => s.source === 'sample') &&
    state.activities.every((a) => a.source === 'sample');

  return (
    <div className="space-y-7">
      <PageHeader
        title={`Welcome back, ${state.profile.name.split(' ')[0]}`}
        subtitle={`Think Deeper. Learn Faster. ${
          hasOnlySampleData
            ? 'Showing preloaded sample academic data until you log new activity or generate AI study items.'
            : 'Your workspace reflects your live study sessions, quizzes, and AI study materials.'
        }`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={toggleFocusMode}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {focusMode ? (
                <>
                  <Minimize2 className="w-4 h-4 text-[var(--color-primary)]" />
                  Exit Focus
                </>
              ) : (
                <>
                  <Maximize2 className="w-4 h-4 text-[var(--color-primary)]" />
                  Focus Mode
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveModule('assistant')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-[var(--color-primary)]" />
              Ask AI
            </button>
            <button
              type="button"
              onClick={() => setIsSessionModalOpen(true)}
              className="px-4 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Log Study Session
            </button>
          </div>
        }
      />

      {/* 5-Metric Responsive KPI Grid */}
      <section aria-label="Study overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)]">Daily Study Goal</span>
            <Clock className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono tabular-nums text-[var(--text-main)]">
              {todayMinutes} / {state.profile.dailyGoalMinutes}m
            </div>
            <div className="mt-2 h-1.5 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                style={{ width: `${dailyGoalPct}%` }}
              />
            </div>
          </div>
        </div>

        <StatMetricCard
          label="Study Streak"
          value={`${state.profile.studyStreakDays} days`}
          detail="Consistent daily learning"
          icon={<Flame className="w-4 h-4 text-[var(--color-accent)]" />}
        />

        <StatMetricCard
          label="Total Study Hours"
          value={`${totalHours} hrs`}
          detail={`Goal: ${state.profile.weeklyGoalHours} hrs / week`}
          icon={<Clock className="w-4 h-4" />}
        />

        <StatMetricCard
          label="Completed Topics"
          value={`${completedTopics}`}
          detail={`${state.summaries.length} summaries · ${state.tasks.filter((t) => t.completed).length} tasks`}
          icon={<BookCheck className="w-4 h-4" />}
        />

        <StatMetricCard
          label="Quiz Performance"
          value={state.quizAttempts.length > 0 ? `${avgQuizAccuracy}%` : '—'}
          detail={`${state.quizAttempts.length} completed quizzes`}
          icon={<Award className="w-4 h-4" />}
        />
      </section>

      {/* Weekly Progress Chart + Upcoming Study Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-main)]">
                Weekly Study Progress
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Study minutes logged per day · Hover bars for exact totals
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('progress')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              View analytics
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative h-56 flex items-end gap-3 sm:gap-5 pt-6 pb-2 border-b border-[var(--border-color)]">
            {DAYS_ORDER.map((day) => {
              const mins = minutesByDay[day];
              const heightPct = Math.max(4, Math.round((mins / maxDayMinutes) * 100));
              const isHovered = hoveredDay === day;
              return (
                <div
                  key={day}
                  onMouseEnter={() => setHoveredDay(day)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex-1 h-full flex flex-col items-center justify-end relative"
                >
                  {isHovered && (
                    <div className="absolute -top-2 z-10 px-2.5 py-1 rounded-md bg-[var(--text-main)] text-[var(--bg-card)] text-[11px] font-mono tabular-nums whitespace-nowrap shadow-sm">
                      {mins} min ({(mins / 60).toFixed(1)}h)
                    </div>
                  )}
                  <div className="w-full max-w-[44px] flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-200"
                      style={{
                        height: `${mins === 0 ? 4 : heightPct}%`,
                        backgroundColor:
                          mins === 0
                            ? 'var(--bg-subtle)'
                            : isHovered
                            ? 'var(--color-primary)'
                            : 'var(--color-secondary)',
                      }}
                    />
                  </div>
                  <span className="mt-2.5 text-xs font-medium text-[var(--text-muted)]">{day}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
            <span>
              Total weekly minutes:{' '}
              <strong className="text-[var(--text-main)] font-mono tabular-nums">
                {totalMinutes} min
              </strong>
            </span>
            <span>
              Daily average:{' '}
              <strong className="text-[var(--text-main)] font-mono tabular-nums">
                {Math.round(totalMinutes / 7)} min/day
              </strong>
            </span>
          </div>
        </section>

        {/* Upcoming Study Sessions */}
        <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-main)]">
                Upcoming Study Sessions
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Next scheduled tasks in Study Planner
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveModule('planner')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
            >
              Planner
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {upcomingSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <CheckCircle2 className="w-7 h-7 text-[var(--color-primary)] mb-2" />
              <p className="text-sm font-medium text-[var(--text-main)]">
                All scheduled sessions completed
              </p>
              <button
                type="button"
                onClick={() => setActiveModule('planner')}
                className="mt-3 text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
              >
                Schedule a new session
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border-color)] flex-1">
              {upcomingSessions.map((task) => (
                <li key={task.id} className="py-3 first:pt-1 last:pb-0">
                  <button
                    type="button"
                    onClick={() => toggleTaskCompletion(task.id)}
                    className="w-full flex items-start gap-3 text-left group cursor-pointer"
                  >
                    <Circle className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--color-primary)] shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--text-main)] leading-snug">
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)] font-mono tabular-nums">
                        {task.day} {task.startTime} · {task.durationMinutes}m · {task.subject}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Read Later Queue */}
      <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-main)]">
              Read Later Queue
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Bookmarked AI explanations and study notes ready for distraction-free Focus Mode sessions
            </p>
          </div>
          <button
            type="button"
            onClick={openReadLaterQueue}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Manage queue ({state.readLater.filter((r) => r.status === 'unread').length} unread)
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {state.readLater.filter((r) => r.status === 'unread').length === 0 ? (
          <EmptyState
            icon={<Bookmark className="w-5 h-5" />}
            title="Your Read Later queue is clear"
            description="Bookmark long AI Assistant explanations, Notes Summarizer guides, or lecture documents to review them in Focus Mode."
            actionLabel="Browse Materials"
            onAction={openReadLaterQueue}
          />
        ) : (
          <div className="divide-y divide-[var(--border-color)]">
            {state.readLater
              .filter((r) => r.status === 'unread')
              .slice(0, 4)
              .map((item) => {
                const originLabel =
                  item.origin === 'assistant'
                    ? 'AI Assistant'
                    : item.origin === 'summarizer'
                    ? 'Notes Summarizer'
                    : 'Study Materials';

                return (
                  <div
                    key={item.id}
                    className="py-3.5 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="text-sm font-semibold text-[var(--text-main)] truncate">
                        {item.title}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
                        <SourceAttribution
                          source={item.source}
                          subject={item.subject}
                          extra={originLabel}
                        />
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          ~{item.estimatedMinutes} min read
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleReadLaterStatus(item.id)}
                        title="Mark as completed"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] bg-[var(--bg-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => openReadLaterInFocus(item.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Read in Focus
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Recommended Learning Activities + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-main)]">
              Recommended Activities
            </h2>
            <Compass className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="space-y-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-2"
              >
                <div className="text-sm font-semibold text-[var(--text-main)]">{rec.title}</div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{rec.detail}</p>
                <button
                  type="button"
                  onClick={rec.onClick}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  {rec.actionLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-main)]">Recent Activity</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Distinguishes preloaded sample records from your live actions and Gemini results
              </p>
            </div>
          </div>

          {state.activities.length === 0 ? (
            <EmptyState
              icon={<Clock className="w-5 h-5" />}
              title="No recent activity"
              description="Start asking questions, summarizing notes, or taking quizzes to track your learning progress."
            />
          ) : (
            <div className="divide-y divide-[var(--border-color)]">
              {state.activities.slice(0, 6).map((act) => (
                <div
                  key={act.id}
                  className="py-3 first:pt-1 last:pb-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-main)] truncate">
                      {act.action} —{' '}
                      <span className="text-[var(--text-muted)] font-normal">{act.detail}</span>
                    </p>
                    <SourceAttribution
                      source={act.source}
                      subject={act.subject}
                      timestamp={act.timestamp}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveModule(act.module)}
                    className="self-start sm:self-center text-xs font-semibold text-[var(--color-primary)] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

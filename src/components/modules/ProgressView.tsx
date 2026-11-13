import React, { useState } from 'react';
import {
  BarChart3,
  Clock,
  Award,
  Flame,
  Target,
  AlertTriangle,
  ArrowRight,
  FileSpreadsheet,
  FileText,
  Check,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { DayOfWeek } from '../../types/study';
import { exportPerformanceCsv, exportPerformancePdf } from '../../utils/exportPerformance';
import { PageHeader, StatMetricCard, EmptyState, SourceAttribution } from '../ui/CommonUI';

const DAYS_ORDER: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ProgressView: React.FC = () => {
  const { state, updateProfile, setIsSessionModalOpen, setActiveModule, openWithDraft } =
    useStudy();

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(state.profile.weeklyGoalHours));
  const [exportNotice, setExportNotice] = useState<'csv' | 'pdf' | null>(null);

  const totalMinutes = state.sessions.reduce((sum, s) => sum + s.minutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const avgQuizPct =
    state.quizAttempts.length > 0
      ? Math.round(
          state.quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / state.quizAttempts.length
        )
      : 0;

  const completedTasks = state.tasks.filter((t) => t.completed).length;
  const totalCards = state.decks.reduce((sum, d) => sum + d.cards.length, 0);
  const masteredCards = state.decks.reduce(
    (sum, d) => sum + d.cards.filter((c) => c.mastery === 'mastered').length,
    0
  );

  // Daily activity map
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
  const maxDayMinutes = Math.max(90, ...Object.values(minutesByDay));

  // Subject aggregation
  const subjectSet = new Set<string>([
    ...state.sessions.map((s) => s.subject),
    ...state.quizAttempts.map((a) => a.subject),
    ...state.decks.map((d) => d.subject),
  ]);

  const subjectRows = Array.from(subjectSet)
    .map((subject) => {
      const studyMins = state.sessions
        .filter((s) => s.subject === subject)
        .reduce((acc, s) => acc + s.minutes, 0);
      const attempts = state.quizAttempts.filter((a) => a.subject === subject);
      const quizAvg =
        attempts.length > 0
          ? Math.round(attempts.reduce((acc, a) => acc + a.percentage, 0) / attempts.length)
          : null;
      const decks = state.decks.filter((d) => d.subject === subject);
      const deckCards = decks.reduce((acc, d) => acc + d.cards.length, 0);
      const deckMastered = decks.reduce(
        (acc, d) => acc + d.cards.filter((c) => c.mastery === 'mastered').length,
        0
      );
      const difficultCount = decks.reduce(
        (acc, d) => acc + d.cards.filter((c) => c.mastery === 'difficult').length,
        0
      );

      return {
        subject,
        studyMins,
        quizAvg,
        attemptsCount: attempts.length,
        deckMastered,
        deckCards,
        difficultCount,
      };
    })
    .sort((a, b) => b.studyMins - a.studyMins);

  const maxSubjectMins = Math.max(60, ...subjectRows.map((r) => r.studyMins));

  // Areas requiring improvement computed strictly from stored data
  const improvementAreas: Array<{
    id: string;
    subject: string;
    reason: string;
    actionLabel: string;
    onClick: () => void;
  }> = [];

  subjectRows.forEach((row) => {
    if (row.quizAvg !== null && row.quizAvg < 80) {
      improvementAreas.push({
        id: `imp-quiz-${row.subject}`,
        subject: row.subject,
        reason: `Average quiz score is ${row.quizAvg}% across ${row.attemptsCount} attempt${row.attemptsCount > 1 ? 's' : ''}.`,
        actionLabel: 'Review with AI Assistant',
        onClick: () =>
          openWithDraft({
            targetModule: 'assistant',
            topic: `Explain the foundational principles and common exam pitfalls in ${row.subject}`,
            subject: row.subject,
          }),
      });
    }
    if (row.difficultCount > 0) {
      improvementAreas.push({
        id: `imp-fc-${row.subject}`,
        subject: row.subject,
        reason: `${row.difficultCount} flashcard${row.difficultCount > 1 ? 's' : ''} marked as Difficult.`,
        actionLabel: 'Practice Flashcards',
        onClick: () => setActiveModule('flashcards'),
      });
    }
  });

  const pendingHighPriority = state.tasks.filter((t) => !t.completed && t.priority === 'High');
  if (pendingHighPriority.length > 0) {
    improvementAreas.push({
      id: 'imp-tasks',
      subject: pendingHighPriority[0].subject,
      reason: `${pendingHighPriority.length} high-priority study task${pendingHighPriority.length > 1 ? 's' : ''} still pending.`,
      actionLabel: 'Open Study Planner',
      onClick: () => setActiveModule('planner'),
    });
  }

  const saveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ weeklyGoalHours: Math.max(1, Math.min(60, Number(goalDraft) || 14)) });
    setEditingGoal(false);
  };

  const hasSampleOnly = state.sessions.every((s) => s.source === 'sample');

  const handleExport = (format: 'csv' | 'pdf') => {
    const payload = {
      state,
      totalMinutes,
      totalHours,
      avgQuizPct,
      completedTasks,
      totalCards,
      masteredCards,
      minutesByDay,
      subjectRows,
    };
    if (format === 'csv') {
      exportPerformanceCsv(payload);
    } else {
      exportPerformancePdf(payload);
    }
    setExportNotice(format);
    setTimeout(() => setExportNotice(null), 2500);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Progress & Analytics"
        subtitle={`Metrics computed directly from your stored study sessions, quizzes, and flashcard mastery. ${
          hasSampleOnly
            ? 'Initial figures reflect preloaded sample study data.'
            : 'Includes your live study activity.'
        }`}
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {exportNotice === 'csv' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Exported CSV
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4 text-[var(--color-primary)]" />
                  Export CSV
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {exportNotice === 'pdf' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-500" />
                  Exported PDF
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 text-[var(--color-primary)]" />
                  Export PDF
                </>
              )}
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

      {/* Top Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatMetricCard
          label="Total Study Time"
          value={`${totalHours} hrs`}
          detail={`${state.sessions.length} recorded study session${state.sessions.length === 1 ? '' : 's'}`}
          icon={<Clock className="w-5 h-5" />}
        />
        <StatMetricCard
          label="Quiz Accuracy"
          value={state.quizAttempts.length > 0 ? `${avgQuizPct}%` : '—'}
          detail={`${state.quizAttempts.length} completed assessment${state.quizAttempts.length === 1 ? '' : 's'}`}
          icon={<Award className="w-5 h-5" />}
        />
        <StatMetricCard
          label="Study Streak & Goals"
          value={`${state.profile.studyStreakDays} days`}
          detail={`${completedTasks} tasks completed · ${masteredCards}/${totalCards} cards mastered`}
          icon={<Flame className="w-5 h-5 text-[var(--color-accent)]" />}
        />
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-muted)]">Weekly Hour Goal</span>
            <Target className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          {!editingGoal ? (
            <div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[var(--text-main)]">
                  {state.profile.weeklyGoalHours} hrs
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setGoalDraft(String(state.profile.weeklyGoalHours));
                    setEditingGoal(true);
                  }}
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                >
                  Edit target
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)] tabular-nums">
                {Math.min(
                  100,
                  Math.round((totalMinutes / (state.profile.weeklyGoalHours * 60)) * 100)
                )}
                % reached
              </p>
            </div>
          ) : (
            <form onSubmit={saveGoal} className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={60}
                value={goalDraft}
                onChange={(e) => setGoalDraft(e.target.value)}
                className="w-20 px-2.5 py-1.5 text-sm font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-primary)] text-[var(--text-on-primary)] rounded-lg cursor-pointer"
              >
                Save
              </button>
            </form>
          )}
        </div>
      </section>

      {/* Daily Activity Chart + Areas Requiring Improvement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-main)]">
              Daily & Weekly Activity
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Minutes studied per day across the active week
            </p>
          </div>

          <div className="h-52 flex items-end gap-3 sm:gap-5 pt-4 pb-2 border-b border-[var(--border-color)]">
            {DAYS_ORDER.map((day) => {
              const mins = minutesByDay[day];
              const pct = Math.max(4, Math.round((mins / maxDayMinutes) * 100));
              return (
                <div key={day} className="flex-1 h-full flex flex-col items-center justify-end">
                  <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] mb-1.5">
                    {mins > 0 ? `${mins}m` : ''}
                  </span>
                  <div className="w-full max-w-[42px] flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg transition-all duration-300"
                      style={{
                        height: `${mins === 0 ? 4 : pct}%`,
                        backgroundColor:
                          mins > 0 ? 'var(--color-primary)' : 'var(--bg-subtle)',
                      }}
                    />
                  </div>
                  <span className="mt-2 text-xs font-medium text-[var(--text-muted)]">{day}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-[var(--text-main)]">
              Areas Requiring Improvement
            </h2>
            <AlertTriangle className="w-4 h-4 text-[var(--color-accent)]" />
          </div>

          {improvementAreas.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4">
              Great balance! No low quiz scores, difficult flashcards, or overdue high-priority tasks detected.
            </p>
          ) : (
            <div className="space-y-3">
              {improvementAreas.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] space-y-1.5"
                >
                  <div className="text-xs font-semibold text-[var(--color-primary)]">
                    {item.subject}
                  </div>
                  <p className="text-xs text-[var(--text-main)] leading-relaxed">{item.reason}</p>
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    {item.actionLabel}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Subject-wise Distribution + Performance Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-main)]">
              Study Time by Subject
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Distribution of logged focus minutes
            </p>
          </div>

          {subjectRows.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="w-5 h-5" />}
              title="No subject activity recorded"
              description="Log a study session or complete a quiz to see subject breakdowns."
            />
          ) : (
            <div className="space-y-4">
              {subjectRows.map((row) => {
                const widthPct = Math.max(4, Math.round((row.studyMins / maxSubjectMins) * 100));
                return (
                  <div key={row.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text-main)]">{row.subject}</span>
                      <span className="font-mono tabular-nums text-[var(--text-muted)]">
                        {row.studyMins} min ({(row.studyMins / 60).toFixed(1)}h)
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-main)]">
              Subject-Wise Performance
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Quiz accuracy and flashcard completion per subject
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-muted)]">
                  <th className="py-2.5 pr-4">Subject</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                  <th className="py-2.5 px-3 text-right">Quiz Avg</th>
                  <th className="py-2.5 pl-3 text-right">Cards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm">
                {subjectRows.map((row) => (
                  <tr key={row.subject}>
                    <td className="py-3 pr-4 font-medium text-[var(--text-main)]">
                      {row.subject}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-[var(--text-muted)]">
                      {(row.studyMins / 60).toFixed(1)}h
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[var(--color-primary)]">
                      {row.quizAvg !== null ? `${row.quizAvg}%` : '—'}
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular-nums text-[var(--text-muted)]">
                      {row.deckCards > 0 ? `${row.deckMastered}/${row.deckCards}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Session Logs */}
      <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-[var(--text-main)]">Study Session Log</h2>
        {state.sessions.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">No study sessions logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[11px] font-semibold text-[var(--text-muted)]">
                  <th className="py-2.5 pr-4">Topic & Source</th>
                  <th className="py-2.5 px-3 text-right">Duration</th>
                  <th className="py-2.5 pl-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)] text-sm">
                {state.sessions.slice(0, 10).map((ses) => (
                  <tr key={ses.id}>
                    <td className="py-3 pr-4">
                      <div className="font-medium text-[var(--text-main)]">{ses.topic}</div>
                      <SourceAttribution source={ses.source} subject={ses.subject} />
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[var(--text-main)]">
                      {ses.minutes} min
                    </td>
                    <td className="py-3 pl-3 text-right font-mono tabular-nums text-xs text-[var(--text-muted)]">
                      {ses.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Bell,
  X,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { DayOfWeek, StudyTask } from '../../types/study';
import { PageHeader, EmptyState } from '../ui/CommonUI';

const DAYS_OF_WEEK: Array<{ day: DayOfWeek; label: string; dateLabel: string; iso: string }> = [
  { day: 'Mon', label: 'Monday', dateLabel: 'Nov 9', iso: '2026-11-09' },
  { day: 'Tue', label: 'Tuesday', dateLabel: 'Nov 10', iso: '2026-11-10' },
  { day: 'Wed', label: 'Wednesday', dateLabel: 'Nov 11', iso: '2026-11-11' },
  { day: 'Thu', label: 'Thursday', dateLabel: 'Nov 12', iso: '2026-11-12' },
  { day: 'Fri', label: 'Friday', dateLabel: 'Nov 13', iso: '2026-11-13' },
  { day: 'Sat', label: 'Saturday', dateLabel: 'Nov 14', iso: '2026-11-14' },
  { day: 'Sun', label: 'Sunday', dateLabel: 'Nov 15', iso: '2026-11-15' },
];

export const PlannerView: React.FC = () => {
  const {
    state,
    addTask,
    toggleTaskCompletion,
    deleteTask,
    addSubject,
    removeSubject,
    logStudySession,
  } = useStudy();

  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('Thu');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Task creation form
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<string>(state.subjects[0] ?? 'General Studies');
  const [taskDay, setTaskDay] = useState<DayOfWeek>('Thu');
  const [dueDate, setDueDate] = useState('2026-11-12');
  const [startTime, setStartTime] = useState('15:00');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [priority, setPriority] = useState<StudyTask['priority']>('Medium');
  const [reminderEnabled, setReminderEnabled] = useState(true);

  // Subject management
  const [newSubject, setNewSubject] = useState('');

  // Focus Study Timer
  const [timerPresetMinutes, setTimerPresetMinutes] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSubject, setTimerSubject] = useState<string>(state.subjects[0] ?? 'General Studies');
  const [timerLoggedMessage, setTimerLoggedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning]);

  const selectPreset = (mins: number) => {
    setTimerRunning(false);
    setTimerPresetMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const handleLogFocusTimer = () => {
    const elapsedSeconds = timerPresetMinutes * 60 - secondsLeft;
    const loggedMinutes = Math.max(5, Math.round(elapsedSeconds / 60) || timerPresetMinutes);
    logStudySession({
      subject: timerSubject,
      topic: 'Focus Timer Study Session',
      minutes: loggedMinutes,
      date: '2026-11-12',
      day: 'Thu',
      source: 'user',
    });
    setTimerLoggedMessage(`Logged ${loggedMinutes} min for ${timerSubject}.`);
    setTimeout(() => setTimerLoggedMessage(null), 3500);
    selectPreset(timerPresetMinutes);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const dayInfo = DAYS_OF_WEEK.find((d) => d.day === taskDay);
    addTask({
      title: title.trim(),
      subject,
      day: taskDay,
      dateLabel: dayInfo?.dateLabel ?? 'Nov 12',
      dueDate: dueDate || dayInfo?.iso || '2026-11-12',
      startTime,
      durationMinutes: Math.max(10, Math.min(300, Number(durationMinutes) || 45)),
      priority,
      reminderEnabled,
      completed: false,
    });
    setTitle('');
    setSelectedDay(taskDay);
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;
    addSubject(newSubject.trim());
    setSubject(newSubject.trim());
    setNewSubject('');
  };

  const filterTasks = (tasks: StudyTask[]) =>
    tasks
      .filter((t) => {
        if (statusFilter === 'pending') return !t.completed;
        if (statusFilter === 'completed') return t.completed;
        return true;
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const dailyTasks = filterTasks(state.tasks.filter((t) => t.day === selectedDay));

  const totalTasks = state.tasks.length;
  const completedCount = state.tasks.filter((t) => t.completed).length;
  const completionPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Study Planner"
        subtitle="Manage subjects, schedule daily and weekly study sessions with priorities and due dates, and set in-app reminders."
        action={
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Daily View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                viewMode === 'weekly'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Weekly Calendar
            </button>
          </div>
        }
      />

      {/* Overall Schedule Completion Indicator */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-sm font-semibold text-[var(--text-main)]">
            Weekly Plan Completion
          </div>
          <span className="text-xs font-mono tabular-nums text-[var(--color-primary)] font-semibold">
            {completedCount} / {totalTasks} tasks ({completionPct}%)
          </span>
        </div>
        <div className="flex-1 max-w-md h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary)] rounded-full transition-all duration-300"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Add Task + Focus Timer + Subject Management */}
        <div className="xl:col-span-4 space-y-6">
          {/* Focus Timer */}
          <section className="bg-[#0B1928] text-[#F0F8FF] border border-[#254258] rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Focus Session Timer</h2>
              <Clock className="w-4 h-4 text-[#42E6D0]" />
            </div>

            <div className="text-4xl font-bold font-mono tabular-nums tracking-tight text-center py-1">
              {mm}:{ss}
            </div>

            <div className="flex items-center justify-center gap-2">
              {[15, 25, 50].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => selectPreset(mins)}
                  className={`px-3 py-1 text-xs font-mono tabular-nums rounded-md transition-colors cursor-pointer ${
                    timerPresetMinutes === mins
                      ? 'bg-[#42E6D0] text-[#0B1928] font-semibold'
                      : 'bg-[#142B40] text-[#A9C4D4] hover:text-white'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>

            <div>
              <select
                aria-label="Timer subject"
                value={timerSubject}
                onChange={(e) => setTimerSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#142B40] border border-[#254258] text-[#F0F8FF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#42E6D0]"
              >
                {state.subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTimerRunning((r) => !r)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#42E6D0] text-[#0B1928] hover:opacity-90 rounded-lg cursor-pointer"
              >
                {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {timerRunning ? 'Pause' : 'Start'}
              </button>
              <button
                type="button"
                onClick={() => selectPreset(timerPresetMinutes)}
                aria-label="Reset timer"
                className="p-2 bg-[#142B40] text-[#A9C4D4] hover:text-white rounded-lg cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleLogFocusTimer}
                className="px-3 py-2 text-xs font-medium bg-[#142B40] text-[#F0F8FF] hover:bg-[#1B3752] rounded-lg whitespace-nowrap cursor-pointer"
              >
                Log Time
              </button>
            </div>

            {timerLoggedMessage && (
              <p className="text-xs text-[#42E6D0] text-center">{timerLoggedMessage}</p>
            )}
          </section>

          {/* Create Study Session Form */}
          <form
            onSubmit={handleCreateTask}
            className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-3.5"
          >
            <h2 className="text-base font-semibold text-[var(--text-main)]">
              Create Study Session
            </h2>

            <div>
              <label htmlFor="task-title" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Task / Session Title
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Practice Eigenvalue proofs"
                required
                className="w-full px-3 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>

            <div>
              <label htmlFor="task-subject" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                Subject
              </label>
              <select
                id="task-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {state.subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="task-day" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Schedule Day
                </label>
                <select
                  id="task-day"
                  value={taskDay}
                  onChange={(e) => {
                    const nextDay = e.target.value as DayOfWeek;
                    setTaskDay(nextDay);
                    const found = DAYS_OF_WEEK.find((d) => d.day === nextDay);
                    if (found) setDueDate(found.iso);
                  }}
                  className="w-full px-3 py-2 text-xs font-medium bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d.day} value={d.day}>
                      {d.label} ({d.dateLabel})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="task-due" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Due Date
                </label>
                <input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="task-time" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Start
                </label>
                <input
                  id="task-time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="task-dur" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Minutes
                </label>
                <input
                  id="task-dur"
                  type="number"
                  min={10}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-2.5 py-2 text-xs font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label htmlFor="task-prio" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
                  Priority
                </label>
                <select
                  id="task-prio"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as StudyTask['priority'])}
                  className="w-full px-2 py-2 text-xs font-medium bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[var(--text-main)] cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="rounded border-[var(--border-color)] accent-[var(--color-primary)]"
              />
              <span>Enable in-app study reminder</span>
            </label>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Study Session
            </button>
          </form>

          {/* Subject Management */}
          <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">Manage Subjects</h2>
            <form onSubmit={handleAddSubject} className="flex gap-2">
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Add new subject..."
                className="flex-1 px-3 py-1.5 text-xs bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-primary)] text-[var(--text-on-primary)] rounded-lg cursor-pointer"
              >
                Add
              </button>
            </form>
            <div className="divide-y divide-[var(--border-color)] max-h-40 overflow-y-auto">
              {state.subjects.map((subj) => (
                <div key={subj} className="py-1.5 flex items-center justify-between text-xs">
                  <span className="text-[var(--text-main)] truncate">{subj}</span>
                  {state.subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSubject(subj)}
                      aria-label={`Remove ${subj}`}
                      className="p-1 text-[var(--text-muted)] hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Calendar / Schedule View */}
        <div className="xl:col-span-8 space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            {viewMode === 'daily' ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDay(d.day)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                      selectedDay === d.day
                        ? 'bg-[var(--color-primary)] text-[var(--text-on-primary)] font-semibold'
                        : 'bg-[var(--bg-main)] text-[var(--text-muted)] hover:text-[var(--text-main)] border border-[var(--border-color)]'
                    }`}
                  >
                    {d.day} · {d.dateLabel}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-sm font-semibold text-[var(--text-main)]">
                Weekly Calendar · Nov 9 – Nov 15
              </div>
            )}

            <div className="flex items-center gap-1 p-1 bg-[var(--bg-subtle)] rounded-lg">
              {(['all', 'pending', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {viewMode === 'daily' ? (
            dailyTasks.length === 0 ? (
              <EmptyState
                icon={<CalendarDays className="w-5 h-5" />}
                title={`No study blocks on ${selectedDay}`}
                description="Use the schedule form on the left to add a study block or switch days."
              />
            ) : (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl divide-y divide-[var(--border-color)]">
                {dailyTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-[var(--bg-subtle)]/30 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskCompletion(task.id)}
                      className="flex items-start gap-3.5 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="w-5 h-5 text-[var(--text-muted)] hover:text-[var(--color-primary)] shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            task.completed
                              ? 'line-through text-[var(--text-muted)]'
                              : 'text-[var(--text-main)]'
                          }`}
                        >
                          {task.title}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-[var(--text-muted)]">
                          <span className="font-mono tabular-nums text-[var(--text-main)] font-medium">
                            {task.startTime}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">{task.durationMinutes} min</span>
                          <span aria-hidden="true">·</span>
                          <span>{task.subject}</span>
                          <span aria-hidden="true">·</span>
                          <span>Due {task.dueDate}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              task.priority === 'High'
                                ? 'text-rose-600 dark:text-rose-400 font-medium'
                                : task.priority === 'Medium'
                                ? 'text-amber-600 dark:text-amber-400 font-medium'
                                : ''
                            }
                          >
                            {task.priority} priority
                          </span>
                          {task.reminderEnabled && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 text-[var(--color-primary)]">
                                <Bell className="w-3 h-3" />
                                Reminder on
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      aria-label={`Delete ${task.title}`}
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAYS_OF_WEEK.map((d) => {
                const dayItems = filterTasks(state.tasks.filter((t) => t.day === d.day));
                const dayTotalMins = dayItems.reduce((sum, t) => sum + t.durationMinutes, 0);

                return (
                  <section
                    key={d.day}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--border-color)]">
                        <h3 className="text-sm font-semibold text-[var(--text-main)]">
                          {d.label}{' '}
                          <span className="text-[var(--text-muted)] font-normal">
                            · {d.dateLabel}
                          </span>
                        </h3>
                        <span className="text-xs font-mono tabular-nums text-[var(--color-primary)] font-semibold">
                          {dayTotalMins}m
                        </span>
                      </div>

                      {dayItems.length === 0 ? (
                        <p className="text-xs text-[var(--text-muted)] py-4 text-center">
                          No sessions scheduled
                        </p>
                      ) : (
                        <ul className="space-y-2.5">
                          {dayItems.map((task) => (
                            <li key={task.id}>
                              <button
                                type="button"
                                onClick={() => toggleTaskCompletion(task.id)}
                                className="w-full flex items-start gap-2 text-left cursor-pointer"
                              >
                                {task.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                                ) : (
                                  <Circle className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" />
                                )}
                                <div className="min-w-0">
                                  <div
                                    className={`text-xs font-medium leading-snug ${
                                      task.completed
                                        ? 'line-through text-[var(--text-muted)]'
                                        : 'text-[var(--text-main)]'
                                    }`}
                                  >
                                    {task.title}
                                  </div>
                                  <div className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums mt-0.5">
                                    {task.startTime} · {task.durationMinutes}m · {task.subject}
                                  </div>
                                </div>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

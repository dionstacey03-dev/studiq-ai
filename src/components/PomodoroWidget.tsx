import React, { useEffect, useRef, useState } from 'react';
import {
  Timer,
  Coffee,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { PomodoroMode } from '../types/study';

export function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

const MODE_META: Record<
  PomodoroMode,
  { label: string; shortLabel: string; description: string }
> = {
  focus: {
    label: 'Focus Sprint',
    shortLabel: 'Focus',
    description: 'Deep work sprint tracked toward study goals',
  },
  shortBreak: {
    label: 'Short Break',
    shortLabel: 'Break',
    description: 'Step back and rest your eyes briefly',
  },
  longBreak: {
    label: 'Long Break',
    shortLabel: 'Long',
    description: 'Extended recharge after 4 focus sprints',
  },
};

const FOCUS_PRESETS = [15, 25, 45, 50];
const SHORT_BREAK_PRESETS = [5, 10, 15];
const LONG_BREAK_PRESETS = [15, 20, 30];

export const PomodoroWidget: React.FC = () => {
  const {
    state,
    pomodoro,
    pomodoroNotice,
    clearPomodoroNotice,
    togglePomodoro,
    resetPomodoro,
    setPomodoroMode,
    updatePomodoroConfig,
    completePomodoroEarly,
  } = useStudy();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const totalSeconds =
    (pomodoro.mode === 'focus'
      ? pomodoro.focusMinutes
      : pomodoro.mode === 'shortBreak'
        ? pomodoro.shortBreakMinutes
        : pomodoro.longBreakMinutes) * 60;

  const progressPct =
    totalSeconds > 0
      ? Math.min(100, Math.max(0, Math.round(((totalSeconds - pomodoro.remainingSeconds) / totalSeconds) * 100)))
      : 0;

  const elapsedSeconds = Math.max(0, totalSeconds - pomodoro.remainingSeconds);
  const canLogEarly = pomodoro.mode === 'focus' && elapsedSeconds >= 60;
  const isBreak = pomodoro.mode !== 'focus';
  const ModeIcon = isBreak ? Coffee : Timer;
  const currentMeta = MODE_META[pomodoro.mode];

  const activePresets =
    pomodoro.mode === 'focus'
      ? FOCUS_PRESETS
      : pomodoro.mode === 'shortBreak'
        ? SHORT_BREAK_PRESETS
        : LONG_BREAK_PRESETS;

  const activeDurationValue =
    pomodoro.mode === 'focus'
      ? pomodoro.focusMinutes
      : pomodoro.mode === 'shortBreak'
        ? pomodoro.shortBreakMinutes
        : pomodoro.longBreakMinutes;

  const handlePresetClick = (minutes: number) => {
    if (pomodoro.mode === 'focus') {
      updatePomodoroConfig({ focusMinutes: minutes });
    } else if (pomodoro.mode === 'shortBreak') {
      updatePomodoroConfig({ shortBreakMinutes: minutes });
    } else {
      updatePomodoroConfig({ longBreakMinutes: minutes });
    }
  };

  return (
    <div ref={containerRef} className="relative shrink-0">
      {/* Compact TopBar Control Group */}
      <div
        className={`inline-flex items-center rounded-lg border bg-[var(--bg-card)] transition-colors ${
          pomodoro.isRunning
            ? 'border-[var(--color-primary)]/60 ring-1 ring-[var(--color-primary)]/20'
            : 'border-[var(--border-color)]'
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={`Pomodoro timer: ${currentMeta.label}, ${formatCountdown(pomodoro.remainingSeconds)}`}
          title={`${currentMeta.label} (${pomodoro.subject}) — Click for settings`}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-l-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ModeIcon
            className={`w-3.5 h-3.5 shrink-0 ${
              isBreak ? 'text-[var(--color-accent)]' : 'text-[var(--color-primary)]'
            }`}
          />
          <span className="font-mono tabular-nums font-semibold tracking-tight">
            {formatCountdown(pomodoro.remainingSeconds)}
          </span>
          <span className="hidden xl:inline text-[11px] text-[var(--text-muted)]">
            {currentMeta.shortLabel}
          </span>
          {pomodoro.isRunning && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] animate-pulse"
              aria-hidden="true"
            />
          )}
        </button>

        <span className="w-px h-4 bg-[var(--border-color)]" aria-hidden="true" />

        <button
          type="button"
          onClick={togglePomodoro}
          aria-label={pomodoro.isRunning ? 'Pause Pomodoro timer' : 'Start Pomodoro timer'}
          title={pomodoro.isRunning ? 'Pause timer' : 'Start timer'}
          className="px-2 py-1.5 text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--bg-subtle)] rounded-r-lg transition-colors cursor-pointer"
        >
          {pomodoro.isRunning ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Non-intrusive Completion Toast when Popover is Closed */}
      {!open && pomodoroNotice && (
        <div
          role="status"
          className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-2rem)] sm:w-72 bg-[var(--bg-card)] border border-[var(--color-primary)]/40 rounded-xl shadow-lg p-3 z-50 flex items-start gap-2.5"
        >
          <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-main)] flex-1 leading-relaxed">
            {pomodoroNotice}
          </p>
          <button
            type="button"
            onClick={clearPomodoroNotice}
            aria-label="Dismiss timer notification"
            className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Pomodoro Controls Popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Global Pomodoro Timer"
          className="fixed sm:absolute right-4 sm:right-0 top-16 sm:top-auto sm:mt-2 w-[calc(100vw-2rem)] sm:w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg p-4 z-50 space-y-4 max-h-[calc(100vh-5rem)] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-[var(--text-main)]">
                Pomodoro Focus Timer
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {currentMeta.description}
              </div>
            </div>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-[var(--color-primary)] shrink-0">
              {pomodoro.completedPomodoros} done
            </span>
          </div>

          {pomodoroNotice && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--color-primary)]/30 text-xs text-[var(--text-main)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <span className="flex-1">{pomodoroNotice}</span>
              <button
                type="button"
                onClick={clearPomodoroNotice}
                aria-label="Dismiss notification"
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-[var(--bg-subtle)]">
            {(['focus', 'shortBreak', 'longBreak'] as PomodoroMode[]).map((modeKey) => {
              const active = pomodoro.mode === modeKey;
              return (
                <button
                  key={modeKey}
                  type="button"
                  onClick={() => setPomodoroMode(modeKey)}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-[var(--bg-card)] text-[var(--color-primary)] font-semibold shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  {modeKey === 'focus'
                    ? 'Focus'
                    : modeKey === 'shortBreak'
                      ? 'Short Break'
                      : 'Long Break'}
                </button>
              );
            })}
          </div>

          {/* Countdown & Progress Bar */}
          <div className="text-center py-2 px-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)]">
            <div className="text-3xl font-bold font-mono tabular-nums tracking-tight text-[var(--text-main)]">
              {formatCountdown(pomodoro.remainingSeconds)}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-1 truncate">
              {pomodoro.mode === 'focus'
                ? `Subject: ${pomodoro.subject}`
                : 'Break interval · cycle continues next sprint'}
            </div>
            <div className="mt-3 h-1.5 w-full rounded-full bg-[var(--bg-subtle)] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isBreak ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-primary)]'
                }`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePomodoro}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
            >
              {pomodoro.isRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>{elapsedSeconds > 0 ? 'Resume' : 'Start'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetPomodoro}
              title="Reset current interval"
              aria-label="Reset current interval"
              className="p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {canLogEarly && (
              <button
                type="button"
                onClick={completePomodoroEarly}
                title="Finish sprint now and log elapsed focus minutes"
                className="inline-flex items-center gap-1 py-2 px-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--bg-subtle)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Log</span>
              </button>
            )}
          </div>

          {/* Subject & Interval Settings */}
          <div className="pt-3 border-t border-[var(--border-color)] space-y-3">
            <div>
              <label
                htmlFor="pomodoro-subject-select"
                className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1"
              >
                Focus Subject
              </label>
              <select
                id="pomodoro-subject-select"
                value={pomodoro.subject}
                onChange={(e) => updatePomodoroConfig({ subject: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                {state.subjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-semibold text-[var(--text-muted)]">
                  {currentMeta.shortLabel} Duration
                </span>
                <span className="font-mono tabular-nums text-[var(--text-muted)]">
                  {activeDurationValue} min
                </span>
              </div>
              <div
                className={`grid gap-1.5 ${
                  activePresets.length === 3 ? 'grid-cols-3' : 'grid-cols-4'
                }`}
              >
                {activePresets.map((mins) => {
                  const isSelected = activeDurationValue === mins;
                  return (
                    <button
                      key={mins}
                      type="button"
                      disabled={pomodoro.isRunning}
                      onClick={() => handlePresetClick(mins)}
                      className={`py-1 rounded-md text-[11px] font-mono tabular-nums border transition-colors ${
                        isSelected
                          ? 'border-[var(--color-primary)] bg-[var(--bg-subtle)] text-[var(--color-primary)] font-semibold'
                          : 'border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                      } ${pomodoro.isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {mins}m
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="flex items-center justify-between gap-2 text-xs text-[var(--text-main)] cursor-pointer">
                <span>Auto-log focus sprints</span>
                <input
                  type="checkbox"
                  checked={pomodoro.autoLogSession}
                  onChange={(e) =>
                    updatePomodoroConfig({ autoLogSession: e.target.checked })
                  }
                  className="rounded border-[var(--border-color)] accent-[var(--color-primary)] cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between gap-2 text-xs text-[var(--text-main)] cursor-pointer">
                <span className="inline-flex items-center gap-1.5">
                  {pomodoro.soundEnabled ? (
                    <Volume2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                  )}
                  <span>Completion sound chime</span>
                </span>
                <input
                  type="checkbox"
                  checked={pomodoro.soundEnabled}
                  onChange={(e) =>
                    updatePomodoroConfig({ soundEnabled: e.target.checked })
                  }
                  className="rounded border-[var(--border-color)] accent-[var(--color-primary)] cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

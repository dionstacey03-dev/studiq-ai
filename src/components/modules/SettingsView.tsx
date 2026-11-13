import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useStudy } from '../../context/StudyContext';
import { ThemeMode, UserProfile } from '../../types/study';
import { PageHeader, ErrorBanner } from '../ui/CommonUI';

export const SettingsView: React.FC = () => {
  const {
    state,
    themeMode,
    resolvedTheme,
    setThemeMode,
    updateProfile,
    importWorkspaceJson,
    clearUserHistory,
    resetToSampleData,
  } = useStudy();

  const [name, setName] = useState(state.profile.name);
  const [major, setMajor] = useState(state.profile.major);
  const [institution, setInstitution] = useState(state.profile.institution);
  const [academicLevel, setAcademicLevel] = useState<UserProfile['academicLevel']>(
    state.profile.academicLevel
  );
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(state.profile.dailyGoalMinutes);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(state.profile.weeklyGoalHours);
  const [enableReminders, setEnableReminders] = useState(state.profile.enableReminders);
  const [enableGoalAlerts, setEnableGoalAlerts] = useState(state.profile.enableGoalAlerts);

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<'clear' | 'reset' | null>(null);

  const showToast = (msg: string) => {
    setSavedFeedback(msg);
    setTimeout(() => setSavedFeedback(null), 3000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display name is required.');
      return;
    }
    setError(null);
    updateProfile({
      name: name.trim(),
      major: major.trim() || 'General Studies',
      institution: institution.trim(),
      academicLevel,
      dailyGoalMinutes: Math.max(15, Math.min(600, Number(dailyGoalMinutes) || 120)),
      weeklyGoalHours: Math.max(1, Math.min(60, Number(weeklyGoalHours) || 14)),
      enableReminders,
      enableGoalAlerts,
    });
    showToast('Profile and study preferences saved.');
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studiq-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Workspace JSON backup exported.');
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    try {
      const text = await file.text();
      importWorkspaceJson(text);
      showToast('Workspace backup restored successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import backup JSON.');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Settings"
        subtitle="Customize Arctic Aurora appearance, academic profile, study targets, notification alerts, and local workspace data."
      />

      {savedFeedback && (
        <div
          role="status"
          className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          {savedFeedback}
        </div>
      )}

      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

      {/* 1. Appearance Preferences */}
      <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-main)]">
              Appearance Preferences
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Arctic Aurora palette · Active resolved theme:{' '}
              <strong className="text-[var(--text-main)] capitalize">{resolvedTheme}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              {
                mode: 'light',
                title: 'Light Mode',
                desc: 'Crisp glacier canvas (#F1F7F8) with deep teal accents.',
                Icon: Sun,
              },
              {
                mode: 'dark',
                title: 'Dark Mode',
                desc: 'Arctic midnight navy (#0B1928) with luminous mint.',
                Icon: Moon,
              },
              {
                mode: 'system',
                title: 'System Default',
                desc: 'Automatically follows your operating system theme.',
                Icon: Monitor,
              },
            ] as Array<{
              mode: ThemeMode;
              title: string;
              desc: string;
              Icon: React.ComponentType<{ className?: string }>;
            }>
          ).map(({ mode, title, desc, Icon }) => {
            const active = themeMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setThemeMode(mode)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'border-[var(--color-primary)] bg-[var(--bg-subtle)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-main)] hover:border-[var(--color-primary)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-4 h-4 text-[var(--color-primary)]" />
                  {active && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
                </div>
                <div className="text-sm font-semibold text-[var(--text-main)]">{title}</div>
                <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Profile, Study Preferences & Notification Preferences */}
      <form
        onSubmit={handleSaveProfile}
        className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-6"
      >
        <div>
          <h2 className="text-base font-semibold text-[var(--text-main)]">
            Profile & Study Preferences
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Personalizes your dashboard greeting, daily study targets, and reminder alerts
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="prof-name" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Full Name
            </label>
            <input
              id="prof-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label htmlFor="prof-level" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Academic Level
            </label>
            <select
              id="prof-level"
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value as UserProfile['academicLevel'])}
              className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              <option value="High School">High School</option>
              <option value="Undergraduate">Undergraduate</option>
              <option value="Graduate">Graduate</option>
            </select>
          </div>
          <div>
            <label htmlFor="prof-major" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Major / Field of Study
            </label>
            <input
              id="prof-major"
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label htmlFor="prof-inst" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Institution
            </label>
            <input
              id="prof-inst"
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label htmlFor="prof-daily" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Daily Study Goal (minutes)
            </label>
            <input
              id="prof-daily"
              type="number"
              min={15}
              max={600}
              value={dailyGoalMinutes}
              onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label htmlFor="prof-weekly" className="block text-xs font-semibold text-[var(--text-main)] mb-1">
              Weekly Study Goal (hours)
            </label>
            <input
              id="prof-weekly"
              type="number"
              min={1}
              max={60}
              value={weeklyGoalHours}
              onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm font-mono tabular-nums bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border-color)] space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-main)]">Notification Preferences</h3>
          <label className="flex items-center gap-2.5 text-sm text-[var(--text-main)] cursor-pointer">
            <input
              type="checkbox"
              checked={enableReminders}
              onChange={(e) => setEnableReminders(e.target.checked)}
              className="rounded border-[var(--border-color)] accent-[var(--color-primary)]"
            />
            <span>Show scheduled study session reminders in top bar notifications</span>
          </label>
          <label className="flex items-center gap-2.5 text-sm text-[var(--text-main)] cursor-pointer">
            <input
              type="checkbox"
              checked={enableGoalAlerts}
              onChange={(e) => setEnableGoalAlerts(e.target.checked)}
              className="rounded border-[var(--border-color)] accent-[var(--color-primary)]"
            />
            <span>Show daily study goal progress alerts</span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 text-sm font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors cursor-pointer"
          >
            Save Preferences
          </button>
        </div>
      </form>

      {/* 3. Data Management */}
      <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--text-main)]">Data Management</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            All study materials, quizzes, flashcards, and progress logs persist locally in your browser.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExportJson}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            Export Backup (.json)
          </button>

          <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            <span>Import Backup (.json)</span>
            <input type="file" accept=".json,application/json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            type="button"
            onClick={() => setConfirmAction('reset')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-[var(--bg-main)] text-[var(--text-main)] border border-[var(--border-color)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[var(--color-primary)]" />
            Restore Sample Data
          </button>

          <button
            type="button"
            onClick={() => setConfirmAction('clear')}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All Workspace Data
          </button>
        </div>

        {confirmAction && (
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs font-medium text-[var(--text-main)]">
              {confirmAction === 'reset'
                ? 'Restore initial STUDIQ AI sample courses, quizzes, and schedule?'
                : 'Delete all notes, summaries, quizzes, flashcards, and progress logs?'}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (confirmAction === 'reset') {
                    resetToSampleData();
                    showToast('Initial sample workspace restored.');
                  } else {
                    clearUserHistory();
                    showToast('Workspace data cleared.');
                  }
                  setConfirmAction(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-[var(--color-primary)] text-[var(--text-on-primary)] rounded-lg cursor-pointer"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-3 py-1.5 text-xs font-medium bg-[var(--bg-card)] text-[var(--text-main)] border border-[var(--border-color)] rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. Application Information */}
      <section className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-base font-semibold text-[var(--text-main)]">
            Application Information
          </h2>
        </div>
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
          <div>
            <dt className="text-[var(--text-muted)]">Platform</dt>
            <dd className="font-semibold text-[var(--text-main)] mt-0.5">
              STUDIQ AI — Think Deeper. Learn Faster.
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">AI Runtime</dt>
            <dd className="font-semibold text-[var(--text-main)] mt-0.5">
              Server-side Google Gemini API
            </dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Design System</dt>
            <dd className="font-semibold text-[var(--text-main)] mt-0.5">
              Arctic Aurora (Light / Dark / System)
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
};

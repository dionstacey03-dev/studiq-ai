/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Minimize2, Sun, Moon, Timer, Coffee, Play, Pause } from 'lucide-react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Sidebar, NAV_ITEMS } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { formatCountdown } from './components/PomodoroWidget';
import { LogSessionModal } from './components/LogSessionModal';
import { DashboardView } from './components/modules/DashboardView';
import { AssistantView } from './components/modules/AssistantView';
import { SummarizerView } from './components/modules/SummarizerView';
import { QuizView } from './components/modules/QuizView';
import { FlashcardsView } from './components/modules/FlashcardsView';
import { PlannerView } from './components/modules/PlannerView';
import { MaterialsView } from './components/modules/MaterialsView';
import { ProgressView } from './components/modules/ProgressView';
import { SettingsView } from './components/modules/SettingsView';

const WorkspaceShell: React.FC = () => {
  const {
    activeModule,
    focusMode,
    setFocusMode,
    activeReadLaterId,
    resolvedTheme,
    setThemeMode,
    isSessionModalOpen,
    pomodoro,
    togglePomodoro,
  } = useStudy();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Allow exiting Focus Mode with Escape when no modal is open
  useEffect(() => {
    if (!focusMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSessionModalOpen) {
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusMode, isSessionModalOpen, setFocusMode]);

  // Track reading/scroll progress while Focus Mode is active
  useEffect(() => {
    if (!focusMode) {
      setScrollProgress(0);
      return;
    }

    const computeProgress = (eventTarget?: EventTarget | null) => {
      const doc = document.documentElement;
      const docScrollable = doc.scrollHeight - window.innerHeight;

      if (docScrollable > 8) {
        const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / docScrollable) * 100)));
        setScrollProgress(pct);
        return;
      }

      // Fallback for modules with an internal scrollable pane (e.g. AI Assistant chat)
      if (
        eventTarget instanceof HTMLElement &&
        eventTarget.scrollHeight - eventTarget.clientHeight > 8
      ) {
        const innerScrollable = eventTarget.scrollHeight - eventTarget.clientHeight;
        const pct = Math.min(
          100,
          Math.max(0, Math.round((eventTarget.scrollTop / innerScrollable) * 100))
        );
        setScrollProgress(pct);
        return;
      }

      setScrollProgress(100);
    };

    const handleScroll = (e: Event) => computeProgress(e.target);
    const handleResize = () => computeProgress();

    const rafId = requestAnimationFrame(() => computeProgress());
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', handleResize);
    };
  }, [focusMode, activeModule, activeReadLaterId]);

  const currentModuleLabel =
    NAV_ITEMS.find((item) => item.id === activeModule)?.label ?? 'Workspace';

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardView />;
      case 'assistant':
        return <AssistantView />;
      case 'summarizer':
        return <SummarizerView />;
      case 'quiz':
        return <QuizView />;
      case 'flashcards':
        return <FlashcardsView />;
      case 'planner':
        return <PlannerView />;
      case 'materials':
        return <MaterialsView />;
      case 'progress':
        return <ProgressView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex aurora-canvas text-[var(--text-main)] transition-colors duration-200">
      {!focusMode && (
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          mobileOpen={mobileNavOpen}
          onCloseMobile={() => setMobileNavOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {!focusMode ? (
          <TopBar onOpenMobileNav={() => setMobileNavOpen(true)} />
        ) : (
          <>
            {/* Top Reading Progress Bar */}
            <div
              role="progressbar"
              aria-label="Study content reading progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={scrollProgress}
              className="no-print fixed top-0 left-0 right-0 z-30 h-[3px] bg-[var(--bg-subtle)]"
            >
              <div
                className="h-full w-full bg-[var(--color-primary)] origin-left transition-transform duration-150 ease-out"
                style={{ transform: `scaleX(${scrollProgress / 100})` }}
              />
            </div>

            <div className="no-print sticky top-0 z-20 px-4 sm:px-8 pt-4 flex items-center justify-end pointer-events-none">
              <div className="pointer-events-auto inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[var(--bg-card)]/95 backdrop-blur border border-[var(--border-color)] shadow-sm">
                <span className="text-xs font-medium text-[var(--text-muted)] hidden sm:inline">
                  Focus Mode · {currentModuleLabel}
                </span>
                <span className="text-xs font-mono tabular-nums font-semibold text-[var(--color-primary)]">
                  {scrollProgress}%
                </span>
                <span className="w-px h-4 bg-[var(--border-color)]" aria-hidden="true" />
                <button
                  type="button"
                  onClick={togglePomodoro}
                  aria-label={
                    pomodoro.isRunning ? 'Pause Pomodoro timer' : 'Start Pomodoro timer'
                  }
                  title={`Pomodoro (${pomodoro.mode === 'focus' ? 'Focus' : 'Break'}) — Click to ${
                    pomodoro.isRunning ? 'pause' : 'start'
                  }`}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-[var(--bg-subtle)] text-xs font-mono tabular-nums font-semibold text-[var(--text-main)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {pomodoro.mode === 'focus' ? (
                    <Timer className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  ) : (
                    <Coffee className="w-3.5 h-3.5 text-[var(--color-accent)]" />
                  )}
                  <span>{formatCountdown(pomodoro.remainingSeconds)}</span>
                  {pomodoro.isRunning ? (
                    <Pause className="w-3 h-3 text-[var(--color-primary)]" />
                  ) : (
                    <Play className="w-3 h-3 text-[var(--text-muted)]" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  aria-label="Toggle Light or Dark theme"
                  title="Toggle Light / Dark theme"
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                >
                  {resolvedTheme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5" />
                  ) : (
                    <Moon className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setFocusMode(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--text-on-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Focus</span>
                  <span className="hidden sm:inline opacity-80 font-mono">(Esc)</span>
                </button>
              </div>
            </div>
          </>
        )}

        <main
          className={`flex-1 w-full mx-auto transition-all duration-200 ${
            focusMode
              ? 'px-4 sm:px-8 py-6 sm:py-8 max-w-5xl'
              : 'px-4 sm:px-8 py-6 sm:py-8 max-w-7xl'
          }`}
        >
          <div key={activeModule} className="animate-[fadeIn_180ms_ease-out]">
            {renderModule()}
          </div>
        </main>
      </div>
      <LogSessionModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <StudyProvider>
        <WorkspaceShell />
      </StudyProvider>
    </ErrorBoundary>
  );
}

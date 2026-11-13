import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  Plus,
  Check,
  User,
  Settings,
  X,
  Maximize2,
} from 'lucide-react';
import { useStudy } from '../context/StudyContext';
import { NAV_ITEMS } from './Sidebar';
import { ModuleId, ThemeMode } from '../types/study';
import { PomodoroWidget } from './PomodoroWidget';

interface TopBarProps {
  onOpenMobileNav: () => void;
}

interface SearchHit {
  id: string;
  title: string;
  subtitle: string;
  module: ModuleId;
  category: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileNav }) => {
  const {
    activeModule,
    setActiveModule,
    state,
    themeMode,
    setThemeMode,
    setFocusMode,
    setActiveReadLaterId,
    setMaterialsInitialTab,
    setIsSessionModalOpen,
    markNotificationsRead,
  } = useStudy();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const currentItem = NAV_ITEMS.find((item) => item.id === activeModule);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
      if (themeRef.current && !themeRef.current.contains(target)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Search Results across all modules
  const searchResults = useMemo<SearchHit[]>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const hits: SearchHit[] = [];

    state.documents.forEach((doc) => {
      if (doc.title.toLowerCase().includes(q) || doc.subject.toLowerCase().includes(q)) {
        hits.push({
          id: doc.id,
          title: doc.title,
          subtitle: `${doc.subject} · ${doc.docType}`,
          module: 'materials',
          category: 'Document',
        });
      }
    });

    state.summaries.forEach((s) => {
      if (s.title.toLowerCase().includes(q) || s.subject.toLowerCase().includes(q)) {
        hits.push({
          id: s.id,
          title: s.title,
          subtitle: `${s.subject} · ${s.format}`,
          module: 'summarizer',
          category: 'Summary',
        });
      }
    });

    state.quizzes.forEach((quiz) => {
      if (quiz.title.toLowerCase().includes(q) || quiz.subject.toLowerCase().includes(q)) {
        hits.push({
          id: quiz.id,
          title: quiz.title,
          subtitle: `${quiz.subject} · ${quiz.questions.length} questions`,
          module: 'quiz',
          category: 'Quiz',
        });
      }
    });

    state.decks.forEach((deck) => {
      if (deck.title.toLowerCase().includes(q) || deck.subject.toLowerCase().includes(q)) {
        hits.push({
          id: deck.id,
          title: deck.title,
          subtitle: `${deck.subject} · ${deck.cards.length} cards`,
          module: 'flashcards',
          category: 'Flashcards',
        });
      }
    });

    state.tasks.forEach((task) => {
      if (task.title.toLowerCase().includes(q) || task.subject.toLowerCase().includes(q)) {
        hits.push({
          id: task.id,
          title: task.title,
          subtitle: `${task.day} ${task.startTime} · ${task.subject}`,
          module: 'planner',
          category: 'Schedule',
        });
      }
    });

    state.threads.forEach((thread) => {
      if (thread.title.toLowerCase().includes(q) || thread.subject.toLowerCase().includes(q)) {
        hits.push({
          id: thread.id,
          title: thread.title,
          subtitle: `${thread.subject} · AI Assistant`,
          module: 'assistant',
          category: 'Chat',
        });
      }
    });

    state.readLater.forEach((item) => {
      if (item.title.toLowerCase().includes(q) || item.subject.toLowerCase().includes(q)) {
        hits.push({
          id: item.id,
          title: item.title,
          subtitle: `${item.subject} · ~${item.estimatedMinutes} min read`,
          module: 'materials',
          category: 'Read Later',
        });
      }
    });

    return hits.slice(0, 8);
  }, [searchQuery, state]);

  // Real Notifications derived from Planner reminders & daily study goal
  const notifications = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      detail: string;
      module: ModuleId;
      unread: boolean;
    }> = [];

    if (state.profile.enableReminders) {
      state.tasks
        .filter((t) => !t.completed && t.reminderEnabled)
        .forEach((t) => {
          list.push({
            id: `rem-${t.id}`,
            title: `Reminder: ${t.title}`,
            detail: `${t.day} at ${t.startTime} · ${t.subject}`,
            module: 'planner',
            unread: !state.readNotificationIds.includes(`rem-${t.id}`),
          });
        });
    }

    if (state.profile.enableGoalAlerts) {
      const todayMinutes = state.sessions
        .filter((s) => s.date === '2026-11-12')
        .reduce((sum, s) => sum + s.minutes, 0);
      if (todayMinutes < state.profile.dailyGoalMinutes) {
        const remaining = state.profile.dailyGoalMinutes - todayMinutes;
        list.push({
          id: 'goal-today',
          title: `${remaining} min left for today’s goal`,
          detail: `${todayMinutes} / ${state.profile.dailyGoalMinutes} min logged today`,
          module: 'progress',
          unread: !state.readNotificationIds.includes('goal-today'),
        });
      }
    }

    return list;
  }, [state.tasks, state.sessions, state.profile, state.readNotificationIds]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const initials = state.profile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-card)]/95 backdrop-blur border-b border-[var(--border-color)] px-4 sm:px-6 h-16 flex items-center justify-between gap-4 transition-colors duration-200">
      {/* Left: Mobile Drawer Button + Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-semibold text-[var(--text-muted)] whitespace-nowrap hidden md:inline">
            STUDIQ AI
          </span>
          <span className="text-[var(--text-muted)] hidden md:inline" aria-hidden="true">
            /
          </span>
          <span className="font-semibold text-[var(--text-main)] truncate">
            {currentItem?.label ?? 'Workspace'}
          </span>
        </div>
      </div>

      {/* Right: Global Search, Notifications, Theme Toggle, Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Global Search */}
        <div ref={searchRef} className="relative hidden sm:block w-52 md:w-64">
          <Search
            className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Global workspace search"
            value={searchQuery}
            onFocus={() => setSearchOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchOpen(true);
            }}
            placeholder="Search notes, quizzes, plans..."
            className="w-full pl-9 pr-7 py-1.5 text-xs bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {searchOpen && searchQuery.trim() && (
            <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50">
              {searchResults.length === 0 ? (
                <div className="p-4 text-xs text-[var(--text-muted)] text-center">
                  No matching study materials found.
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border-color)] max-h-80 overflow-y-auto">
                  {searchResults.map((hit) => (
                    <li key={`${hit.category}-${hit.id}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (hit.category === 'Read Later') {
                            setMaterialsInitialTab('readLater');
                            setActiveReadLaterId(hit.id);
                          } else if (hit.module === 'materials') {
                            setActiveReadLaterId(null);
                          }
                          setActiveModule(hit.module);
                          setSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-[var(--text-main)] truncate">
                            {hit.title}
                          </span>
                          <span className="text-[11px] font-medium text-[var(--color-primary)] shrink-0">
                            {hit.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                          {hit.subtitle}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Global Pomodoro Timer */}
        <PomodoroWidget />

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={`Notifications (${unreadCount} unread)`}
            className="relative p-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[var(--color-accent)] text-[#10283A] text-[10px] font-bold font-mono tabular-nums flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-main)]">
                  Study Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markNotificationsRead(notifications.map((n) => n.id))}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-5 text-xs text-[var(--text-muted)] text-center">
                  You are all caught up on reminders and goals.
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border-color)] max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => {
                          markNotificationsRead([n.id]);
                          setActiveModule(n.module);
                          setNotifOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer ${
                          n.unread ? 'bg-[var(--bg-subtle)]/40' : ''
                        }`}
                      >
                        <div className="text-xs font-semibold text-[var(--text-main)]">
                          {n.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {n.detail}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Focus Mode Toggle */}
        <button
          type="button"
          onClick={() => setFocusMode(true)}
          title="Enter distraction-free Focus Mode"
          aria-label="Enter Focus Mode"
          className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5 text-[var(--color-primary)]" />
          <span className="hidden lg:inline">Focus Mode</span>
        </button>

        {/* Theme Mode Switcher */}
        <div ref={themeRef} className="relative">
          <button
            type="button"
            onClick={() => setThemeOpen((o) => !o)}
            aria-label="Theme mode selector"
            title={`Theme: ${themeMode}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium cursor-pointer"
          >
            {themeMode === 'light' ? (
              <Sun className="w-4 h-4 text-[var(--color-primary)]" />
            ) : themeMode === 'dark' ? (
              <Moon className="w-4 h-4 text-[var(--color-primary)]" />
            ) : (
              <Monitor className="w-4 h-4 text-[var(--color-primary)]" />
            )}
            <span className="hidden md:inline capitalize">{themeMode}</span>
          </button>

          {themeOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg p-1.5 z-50">
              {(
                [
                  { mode: 'light', label: 'Light Mode', Icon: Sun },
                  { mode: 'dark', label: 'Dark Mode', Icon: Moon },
                  { mode: 'system', label: 'System Default', Icon: Monitor },
                ] as Array<{
                  mode: ThemeMode;
                  label: string;
                  Icon: React.ComponentType<{ className?: string }>;
                }>
              ).map(({ mode, label, Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setThemeMode(mode);
                    setThemeOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                    themeMode === mode
                      ? 'bg-[var(--bg-subtle)] text-[var(--color-primary)] font-semibold'
                      : 'text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </span>
                  {themeMode === mode && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((o) => !o)}
            aria-label="User profile menu"
            className="inline-flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-md bg-[var(--color-primary)] text-[var(--text-on-primary)] text-xs font-bold flex items-center justify-center">
              {initials || 'ST'}
            </div>
            <span className="hidden xl:inline text-xs font-medium text-[var(--text-main)] max-w-[110px] truncate">
              {state.profile.name}
            </span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-[var(--border-color)]">
                <div className="text-sm font-semibold text-[var(--text-main)] truncate">
                  {state.profile.name}
                </div>
                <div className="text-xs text-[var(--text-muted)] truncate">
                  {state.profile.major}
                </div>
              </div>
              <div className="p-1.5 space-y-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsSessionModalOpen(true);
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Log Study Session
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('progress');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Progress & Analytics
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveModule('settings');
                    setProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-subtle)] rounded-lg cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  Account & Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

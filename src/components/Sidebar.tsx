import React from 'react';
import {
  LayoutDashboard,
  MessageSquareText,
  FileText,
  CheckSquare,
  Layers,
  CalendarDays,
  FolderOpen,
  BarChart3,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Sun,
  Moon,
  Monitor,
  X,
} from 'lucide-react';
import { ModuleId, ThemeMode } from '../types/study';
import { useStudy } from '../context/StudyContext';
import { StudiqLogo } from './StudiqLogo';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const NAV_ITEMS: Array<{
  id: ModuleId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'assistant', label: 'AI Study Assistant', icon: MessageSquareText },
  { id: 'summarizer', label: 'Notes Summarizer', icon: FileText },
  { id: 'quiz', label: 'Quiz Generator', icon: CheckSquare },
  { id: 'flashcards', label: 'Flashcards', icon: Layers },
  { id: 'planner', label: 'Study Planner', icon: CalendarDays },
  { id: 'materials', label: 'My Study Materials', icon: FolderOpen },
  { id: 'progress', label: 'Progress & Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const {
    activeModule,
    setActiveModule,
    setActiveReadLaterId,
    state,
    themeMode,
    setThemeMode,
  } = useStudy();

  const handleSelect = (id: ModuleId) => {
    if (id === 'materials') {
      setActiveReadLaterId(null);
    }
    setActiveModule(id);
    onCloseMobile();
  };

  const initials = state.profile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full bg-[var(--bg-sidebar)] text-[var(--text-main)] border-r border-[var(--border-color)] transition-colors duration-200 select-none">
      {/* Header / Brand Mark */}
      <div
        className={`h-16 px-4 border-b border-[var(--border-color)] flex items-center ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <button
          type="button"
          onClick={() => handleSelect('dashboard')}
          className="text-left cursor-pointer focus:outline-none"
          title="STUDIQ AI — Think Deeper. Learn Faster."
        >
          <StudiqLogo collapsed={isCollapsed} showTagline={!isCollapsed} />
        </button>

        {!isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="hidden lg:inline-flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Expand Trigger when Collapsed */}
      {isCollapsed && (
        <div className="px-3 pt-3 hidden lg:flex justify-center">
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 9 Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${
                isCollapsed ? 'justify-center px-2.5' : 'gap-3 px-3.5'
              } py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[var(--color-primary)] text-[var(--text-on-primary)] font-semibold shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Theme Controls & User Profile */}
      <div className="p-3 border-t border-[var(--border-color)] space-y-3">
        {!isCollapsed ? (
          <div className="flex items-center justify-between gap-1 p-1 rounded-lg bg-[var(--bg-subtle)]">
            {(
              [
                { mode: 'light', label: 'Light', Icon: Sun },
                { mode: 'dark', label: 'Dark', Icon: Moon },
                { mode: 'system', label: 'System', Icon: Monitor },
              ] as Array<{ mode: ThemeMode; label: string; Icon: React.ComponentType<{ className?: string }> }>
            ).map(({ mode, label, Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setThemeMode(mode)}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-[11px] font-medium rounded-md transition-colors cursor-pointer ${
                  themeMode === mode
                    ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-sm font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() =>
              setThemeMode(
                themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light'
              )
            }
            title={`Theme: ${themeMode}`}
            aria-label={`Switch theme (current: ${themeMode})`}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-[var(--bg-subtle)] text-[var(--text-main)] cursor-pointer"
          >
            {themeMode === 'light' ? (
              <Sun className="w-4 h-4" />
            ) : themeMode === 'dark' ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Monitor className="w-4 h-4" />
            )}
          </button>
        )}

        {/* User Profile */}
        <button
          type="button"
          onClick={() => handleSelect('settings')}
          title={isCollapsed ? `${state.profile.name} — Settings` : undefined}
          className={`w-full flex items-center ${
            isCollapsed ? 'justify-center' : 'gap-3 px-2.5'
          } py-2 rounded-xl hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer`}
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-[var(--text-on-primary)] text-xs font-bold flex items-center justify-center shrink-0">
            {initials || 'ST'}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[var(--text-main)] truncate">
                {state.profile.name}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">
                {state.profile.academicLevel} · {state.profile.studyStreakDays}d streak
              </div>
            </div>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Collapsible Rail */}
      <aside
        className={`hidden lg:block shrink-0 transition-all duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="sticky top-0 h-screen">{renderSidebarContent(collapsed)}</div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[85vw] h-full z-50">
            {renderSidebarContent(false)}
          </div>
        </div>
      )}
    </>
  );
};

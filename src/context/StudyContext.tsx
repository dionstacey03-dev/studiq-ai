import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ActivityEvent,
  CardMastery,
  ChatThread,
  ContentSource,
  CrossModuleDraft,
  DayOfWeek,
  FlashcardDeck,
  ModuleId,
  PomodoroMode,
  PomodoroState,
  Quiz,
  QuizAttempt,
  ReadLaterItem,
  StudyDocument,
  StudyNoteSummary,
  StudySessionLog,
  StudyStoreState,
  StudyTag,
  StudyTask,
  TagCategory,
  TagColorId,
  TaggableCollection,
  ThemeMode,
  UserProfile,
} from '../types/study';
import { INITIAL_STUDY_STATE } from '../data/seedData';
import { estimateReadingMinutes } from '../utils/studyFormatters';
import { playPomodoroCompleteChime } from '../utils/soundEffects';

const STORAGE_KEY = 'studiq_ai_workspace_v1';
const THEME_STORAGE_KEY = 'studiq_theme_mode';
const POMODORO_STORAGE_KEY = 'studiq_pomodoro_v1';

interface StudyContextValue {
  state: StudyStoreState;
  activeModule: ModuleId;
  setActiveModule: (module: ModuleId) => void;
  // Theme System
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  // Focus Mode
  focusMode: boolean;
  setFocusMode: (enabled: boolean) => void;
  toggleFocusMode: () => void;
  // Global Pomodoro Timer
  pomodoro: PomodoroState;
  pomodoroNotice: string | null;
  clearPomodoroNotice: () => void;
  togglePomodoro: () => void;
  resetPomodoro: () => void;
  setPomodoroMode: (mode: PomodoroMode) => void;
  updatePomodoroConfig: (
    patch: Partial<
      Pick<
        PomodoroState,
        | 'focusMinutes'
        | 'shortBreakMinutes'
        | 'longBreakMinutes'
        | 'subject'
        | 'autoLogSession'
        | 'soundEnabled'
      >
    >
  ) => void;
  completePomodoroEarly: () => void;
  // Read Later
  activeReadLaterId: string | null;
  setActiveReadLaterId: (id: string | null) => void;
  materialsInitialTab: 'all' | 'documents' | 'summaries' | 'quizzes' | 'flashcards' | 'readLater';
  setMaterialsInitialTab: (
    tab: 'all' | 'documents' | 'summaries' | 'quizzes' | 'flashcards' | 'readLater'
  ) => void;
  addToReadLater: (item: {
    title: string;
    subject: string;
    origin: ReadLaterItem['origin'];
    originId?: string;
    content: string;
    source: ContentSource;
    tagIds?: string[];
  }) => ReadLaterItem;
  toggleReadLaterStatus: (id: string) => void;
  removeFromReadLater: (id: string) => void;
  openReadLaterInFocus: (id: string) => void;
  openReadLaterQueue: () => void;
  // Cross-module draft & session modal
  draft: CrossModuleDraft | null;
  clearDraft: () => void;
  openWithDraft: (draft: CrossModuleDraft) => void;
  isSessionModalOpen: boolean;
  setIsSessionModalOpen: (open: boolean) => void;
  // Profile & Subjects
  updateProfile: (patch: Partial<UserProfile>) => void;
  addSubject: (subjectName: string) => void;
  removeSubject: (subjectName: string) => void;
  // Color-coded Tags
  createTag: (input: { name: string; color: TagColorId; category: TagCategory }) => StudyTag;
  updateTag: (tag: StudyTag) => void;
  deleteTag: (tagId: string) => void;
  setItemTags: (collection: TaggableCollection, itemId: string, tagIds: string[]) => void;
  // Threads
  addThread: (thread: ChatThread) => void;
  updateThread: (thread: ChatThread) => void;
  deleteThread: (id: string) => void;
  // Summaries
  addSummary: (summary: StudyNoteSummary) => void;
  updateSummary: (summary: StudyNoteSummary) => void;
  deleteSummary: (id: string) => void;
  // Documents / Notes
  addDocument: (doc: Omit<StudyDocument, 'id' | 'createdAt' | 'updatedAt'>) => StudyDocument;
  updateDocument: (doc: StudyDocument) => void;
  deleteDocument: (id: string) => void;
  // Quizzes
  addQuiz: (quiz: Quiz) => void;
  deleteQuiz: (id: string) => void;
  recordQuizAttempt: (attempt: QuizAttempt) => void;
  // Flashcards
  addDeck: (deck: FlashcardDeck) => void;
  updateDeck: (deck: FlashcardDeck) => void;
  deleteDeck: (id: string) => void;
  updateCardMastery: (deckId: string, cardId: string, mastery: CardMastery) => void;
  addCardToDeck: (deckId: string, front: string, back: string, hint: string) => void;
  // Planner
  addTask: (task: Omit<StudyTask, 'id'>) => void;
  toggleTaskCompletion: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  // Sessions & Notifications
  logStudySession: (session: Omit<StudySessionLog, 'id' | 'source'> & { source?: ContentSource }) => void;
  markNotificationsRead: (ids: string[]) => void;
  // Utility
  addActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => void;
  importWorkspaceJson: (rawJson: string) => void;
  clearUserHistory: () => void;
  resetToSampleData: () => void;
}

const StudyContext = createContext<StudyContextValue | null>(null);

function getDayFromDate(dateStr: string): DayOfWeek {
  const days: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const parsed = new Date(`${dateStr}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? 'Thu' : days[parsed.getDay()];
}

function loadInitialState(): StudyStoreState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STUDY_STATE;
    const parsed = JSON.parse(raw) as Partial<StudyStoreState>;
    return {
      ...INITIAL_STUDY_STATE,
      ...parsed,
      profile: {
        ...INITIAL_STUDY_STATE.profile,
        ...(parsed.profile ?? {}),
      },
      subjects:
        Array.isArray(parsed.subjects) && parsed.subjects.length > 0
          ? parsed.subjects
          : INITIAL_STUDY_STATE.subjects,
      tags: Array.isArray(parsed.tags) ? parsed.tags : INITIAL_STUDY_STATE.tags,
      readLater: Array.isArray(parsed.readLater)
        ? parsed.readLater
        : INITIAL_STUDY_STATE.readLater,
    };
  } catch {
    return INITIAL_STUDY_STATE;
  }
}

function loadInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'system';
}

function getModeSeconds(
  mode: PomodoroMode,
  cfg: Pick<PomodoroState, 'focusMinutes' | 'shortBreakMinutes' | 'longBreakMinutes'>
): number {
  if (mode === 'focus') return cfg.focusMinutes * 60;
  if (mode === 'shortBreak') return cfg.shortBreakMinutes * 60;
  return cfg.longBreakMinutes * 60;
}

function loadInitialPomodoro(defaultSubject: string): PomodoroState {
  const defaults: PomodoroState = {
    mode: 'focus',
    focusMinutes: 25,
    shortBreakMinutes: 5,
    longBreakMinutes: 15,
    remainingSeconds: 25 * 60,
    isRunning: false,
    targetEndAt: null,
    completedPomodoros: 0,
    subject: defaultSubject,
    autoLogSession: true,
    soundEnabled: true,
  };
  try {
    const raw = localStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<PomodoroState>;
    const merged: PomodoroState = {
      ...defaults,
      ...parsed,
      subject: parsed.subject || defaultSubject,
    };
    if (merged.isRunning && merged.targetEndAt) {
      const left = Math.max(0, Math.ceil((merged.targetEndAt - Date.now()) / 1000));
      if (left <= 0) {
        return {
          ...merged,
          isRunning: false,
          targetEndAt: null,
          remainingSeconds: getModeSeconds(merged.mode, merged),
        };
      }
      return {
        ...merged,
        remainingSeconds: left,
      };
    }
    return {
      ...merged,
      isRunning: false,
      targetEndAt: null,
    };
  } catch {
    return defaults;
  }
}

const VALID_MODULES: readonly ModuleId[] = [
  'dashboard',
  'assistant',
  'summarizer',
  'quiz',
  'flashcards',
  'planner',
  'materials',
  'progress',
  'settings',
];

function resolveModuleFromPath(pathname: string): ModuleId {
  const clean = pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean || clean === 'dashboard') return 'dashboard';
  return (VALID_MODULES as readonly string[]).includes(clean)
    ? (clean as ModuleId)
    : 'dashboard';
}

function getPathForModule(moduleId: ModuleId): string {
  return moduleId === 'dashboard' ? '/' : `/${moduleId}`;
}

export const StudyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<StudyStoreState>(loadInitialState);
  const [activeModule, setActiveModuleState] = useState<ModuleId>(() =>
    typeof window !== 'undefined' ? resolveModuleFromPath(window.location.pathname) : 'dashboard'
  );
  const [themeMode, setThemeModeState] = useState<ThemeMode>(loadInitialTheme);
  const [systemDark, setSystemDark] = useState<boolean>(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  );
  const [draft, setDraft] = useState<CrossModuleDraft | null>(null);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [activeReadLaterId, setActiveReadLaterId] = useState<string | null>(null);
  const [materialsInitialTab, setMaterialsInitialTab] = useState<
    'all' | 'documents' | 'summaries' | 'quizzes' | 'flashcards' | 'readLater'
  >('all');
  const [pomodoro, setPomodoro] = useState<PomodoroState>(() =>
    loadInitialPomodoro(INITIAL_STUDY_STATE.subjects[0] ?? 'General Studies')
  );
  const [pomodoroNotice, setPomodoroNotice] = useState<string | null>(null);

  const setActiveModule = (nextModule: ModuleId) => {
    setActiveModuleState(nextModule);
    if (typeof window !== 'undefined') {
      const targetPath = getPathForModule(nextModule);
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ module: nextModule }, '', targetPath);
      }
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveModuleState(resolveModuleFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleFocusMode = () => setFocusMode((prev) => !prev);

  // Listen to OS theme preference changes
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    setSystemDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    themeMode === 'system' ? (systemDark ? 'dark' : 'light') : themeMode;

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // ignore
    }
  }, [themeMode, resolvedTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
  };

  const makeActivity = (event: Omit<ActivityEvent, 'id' | 'timestamp'>): ActivityEvent => ({
    ...event,
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  });

  const addActivity = (event: Omit<ActivityEvent, 'id' | 'timestamp'>) => {
    setState((prev) => ({
      ...prev,
      activities: [makeActivity(event), ...prev.activities].slice(0, 40),
    }));
  };

  const openWithDraft = (nextDraft: CrossModuleDraft) => {
    setDraft(nextDraft);
    setActiveModule(nextDraft.targetModule);
  };

  const clearDraft = () => setDraft(null);

  const updateProfile = (patch: Partial<UserProfile>) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...patch },
    }));
  };

  const addSubject = (subjectName: string) => {
    const clean = subjectName.trim();
    if (!clean) return;
    setState((prev) => {
      if (prev.subjects.some((s) => s.toLowerCase() === clean.toLowerCase())) {
        return prev;
      }
      return { ...prev, subjects: [...prev.subjects, clean] };
    });
  };

  const removeSubject = (subjectName: string) => {
    setState((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subjectName),
    }));
  };

  const createTag = (input: {
    name: string;
    color: TagColorId;
    category: TagCategory;
  }): StudyTag => {
    const cleanName = input.name.trim();
    const existing = state.tags.find(
      (t) =>
        t.name.toLowerCase() === cleanName.toLowerCase() &&
        t.category === input.category
    );
    if (existing) {
      return existing;
    }
    const created: StudyTag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: cleanName || 'Untitled Tag',
      color: input.color,
      category: input.category,
    };
    setState((prev) => ({
      ...prev,
      tags: [...prev.tags, created],
    }));
    return created;
  };

  const updateTag = (tag: StudyTag) => {
    const cleanName = tag.name.trim();
    if (!cleanName) return;
    setState((prev) => ({
      ...prev,
      tags: prev.tags.map((t) => (t.id === tag.id ? { ...tag, name: cleanName } : t)),
    }));
  };

  const deleteTag = (tagId: string) => {
    const stripTag = (ids?: string[]) => (ids ? ids.filter((id) => id !== tagId) : ids);
    setState((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t.id !== tagId),
      documents: prev.documents.map((d) => ({ ...d, tagIds: stripTag(d.tagIds) })),
      summaries: prev.summaries.map((s) => ({ ...s, tagIds: stripTag(s.tagIds) })),
      quizzes: prev.quizzes.map((q) => ({ ...q, tagIds: stripTag(q.tagIds) })),
      decks: prev.decks.map((d) => ({ ...d, tagIds: stripTag(d.tagIds) })),
      readLater: prev.readLater.map((r) => ({ ...r, tagIds: stripTag(r.tagIds) })),
    }));
  };

  const setItemTags = (collection: TaggableCollection, itemId: string, tagIds: string[]) => {
    const validIds = Array.from(new Set(tagIds));
    setState((prev) => ({
      ...prev,
      [collection]: prev[collection].map((item) =>
        item.id === itemId ? { ...item, tagIds: validIds } : item
      ),
    }));
  };

  const addThread = (thread: ChatThread) => {
    setState((prev) => ({ ...prev, threads: [thread, ...prev.threads] }));
  };

  const updateThread = (thread: ChatThread) => {
    setState((prev) => ({
      ...prev,
      threads: prev.threads.map((t) => (t.id === thread.id ? thread : t)),
    }));
  };

  const deleteThread = (id: string) => {
    setState((prev) => ({ ...prev, threads: prev.threads.filter((t) => t.id !== id) }));
  };

  const addSummary = (summary: StudyNoteSummary) => {
    setState((prev) => ({
      ...prev,
      summaries: [summary, ...prev.summaries],
      activities: [
        makeActivity({
          module: 'summarizer',
          action: summary.source === 'gemini' ? 'Generated AI study summary' : 'Saved study summary',
          detail: summary.title,
          subject: summary.subject,
          source: summary.source,
        }),
        ...prev.activities,
      ].slice(0, 40),
    }));
  };

  const updateSummary = (summary: StudyNoteSummary) => {
    setState((prev) => ({
      ...prev,
      summaries: prev.summaries.map((s) => (s.id === summary.id ? summary : s)),
    }));
  };

  const deleteSummary = (id: string) => {
    setState((prev) => ({ ...prev, summaries: prev.summaries.filter((s) => s.id !== id) }));
  };

  const addDocument = (
    doc: Omit<StudyDocument, 'id' | 'createdAt' | 'updatedAt'>
  ): StudyDocument => {
    const now = new Date().toISOString();
    const created: StudyDocument = {
      ...doc,
      id: `doc-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    };
    setState((prev) => ({
      ...prev,
      documents: [created, ...prev.documents],
      activities: [
        makeActivity({
          module: 'materials',
          action: 'Saved study document',
          detail: created.title,
          subject: created.subject,
          source: created.source,
        }),
        ...prev.activities,
      ].slice(0, 40),
    }));
    return created;
  };

  const updateDocument = (doc: StudyDocument) => {
    setState((prev) => ({
      ...prev,
      documents: prev.documents.map((d) =>
        d.id === doc.id ? { ...doc, updatedAt: new Date().toISOString() } : d
      ),
    }));
  };

  const deleteDocument = (id: string) => {
    setState((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.id !== id) }));
  };

  const addQuiz = (quiz: Quiz) => {
    setState((prev) => ({
      ...prev,
      quizzes: [quiz, ...prev.quizzes],
      activities: [
        makeActivity({
          module: 'quiz',
          action: 'Generated AI quiz',
          detail: `${quiz.title} (${quiz.questions.length} questions)`,
          subject: quiz.subject,
          source: quiz.source,
        }),
        ...prev.activities,
      ].slice(0, 40),
    }));
  };

  const deleteQuiz = (id: string) => {
    setState((prev) => ({ ...prev, quizzes: prev.quizzes.filter((q) => q.id !== id) }));
  };

  const recordQuizAttempt = (attempt: QuizAttempt) => {
    setState((prev) => ({
      ...prev,
      quizAttempts: [attempt, ...prev.quizAttempts],
      activities: [
        makeActivity({
          module: 'quiz',
          action: `Scored ${attempt.percentage}% on quiz`,
          detail: `${attempt.quizTitle} (${attempt.score}/${attempt.total})`,
          subject: attempt.subject,
          source: 'user',
        }),
        ...prev.activities,
      ].slice(0, 40),
    }));
  };

  const addDeck = (deck: FlashcardDeck) => {
    setState((prev) => ({
      ...prev,
      decks: [deck, ...prev.decks],
      activities: [
        makeActivity({
          module: 'flashcards',
          action: deck.source === 'gemini' ? 'Generated AI flashcard deck' : 'Created flashcard deck',
          detail: `${deck.title} (${deck.cards.length} cards)`,
          subject: deck.subject,
          source: deck.source,
        }),
        ...prev.activities,
      ].slice(0, 40),
    }));
  };

  const updateDeck = (deck: FlashcardDeck) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) => (d.id === deck.id ? deck : d)),
    }));
  };

  const deleteDeck = (id: string) => {
    setState((prev) => ({ ...prev, decks: prev.decks.filter((d) => d.id !== id) }));
  };

  const updateCardMastery = (deckId: string, cardId: string, mastery: CardMastery) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: deck.cards.map((card) => (card.id === cardId ? { ...card, mastery } : card)),
            }
          : deck
      ),
    }));
  };

  const addCardToDeck = (deckId: string, front: string, back: string, hint: string) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((deck) =>
        deck.id === deckId
          ? {
              ...deck,
              cards: [
                ...deck.cards,
                {
                  id: `fc-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
                  front,
                  back,
                  hint,
                  mastery: 'new',
                },
              ],
            }
          : deck
      ),
    }));
  };

  const addTask = (task: Omit<StudyTask, 'id'>) => {
    const newTask: StudyTask = {
      ...task,
      id: `task-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
      activities: [
        makeActivity({
          module: 'planner',
          action: 'Scheduled study session',
          detail: `${newTask.title} (${newTask.day} · ${newTask.durationMinutes} min)`,
          subject: newTask.subject,
          source: 'user',
        }),
        ...prev.activities,
      ].slice(0, 40),
    }));
  };

  const toggleTaskCompletion = (taskId: string) => {
    setState((prev) => {
      const target = prev.tasks.find((t) => t.id === taskId);
      if (!target) return prev;
      const nextCompleted = !target.completed;
      const nextTasks = prev.tasks.map((t) =>
        t.id === taskId ? { ...t, completed: nextCompleted } : t
      );
      const nextActivities = nextCompleted
        ? [
            makeActivity({
              module: 'planner',
              action: 'Completed scheduled task',
              detail: `${target.title} (${target.durationMinutes} min)`,
              subject: target.subject,
              source: 'user',
            }),
            ...prev.activities,
          ].slice(0, 40)
        : prev.activities;

      return {
        ...prev,
        tasks: nextTasks,
        activities: nextActivities,
      };
    });
  };

  const deleteTask = (taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const logStudySession = (
    session: Omit<StudySessionLog, 'id' | 'source'> & { source?: ContentSource }
  ) => {
    const todayIso = session.date || new Date().toISOString().slice(0, 10);
    const resolvedDay = session.day || getDayFromDate(todayIso);
    const created: StudySessionLog = {
      ...session,
      date: todayIso,
      day: resolvedDay,
      source: session.source ?? 'user',
      id: `ses-${Date.now()}`,
    };
    setState((prev) => ({
      ...prev,
      sessions: [created, ...prev.sessions],
      activities: [
        makeActivity({
          module: 'progress',
          action: `Logged ${created.minutes} min study session`,
          detail: created.topic,
          subject: created.subject,
          source: created.source,
        }),
        ...prev.activities,
      ].slice(0, 40),
    }));
  };

  const addToReadLater = (item: {
    title: string;
    subject: string;
    origin: ReadLaterItem['origin'];
    originId?: string;
    content: string;
    source: ContentSource;
    tagIds?: string[];
  }): ReadLaterItem => {
    if (item.originId) {
      const existing = state.readLater.find((r) => r.originId === item.originId);
      if (existing) return existing;
    }

    const inheritedTags =
      item.tagIds ??
      (item.originId
        ? state.documents.find((d) => d.id === item.originId)?.tagIds ??
          state.summaries.find((s) => s.id === item.originId)?.tagIds
        : undefined);

    const created: ReadLaterItem = {
      id: `rl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: item.title.trim() || 'Untitled Study Reading',
      subject: item.subject,
      origin: item.origin,
      originId: item.originId,
      content: item.content,
      estimatedMinutes: estimateReadingMinutes(item.content),
      status: 'unread',
      savedAt: new Date().toISOString(),
      source: item.source,
      tagIds: inheritedTags,
    };

    setState((prev) => {
      if (item.originId && prev.readLater.some((r) => r.originId === item.originId)) {
        return prev;
      }
      return {
        ...prev,
        readLater: [created, ...prev.readLater],
        activities: [
          makeActivity({
            module: 'materials',
            action: 'Bookmarked for Read Later',
            detail: created.title,
            subject: created.subject,
            source: created.source,
          }),
          ...prev.activities,
        ].slice(0, 40),
      };
    });

    return created;
  };

  const toggleReadLaterStatus = (id: string) => {
    setState((prev) => {
      const target = prev.readLater.find((r) => r.id === id);
      if (!target) return prev;
      const nextStatus: ReadLaterItem['status'] =
        target.status === 'unread' ? 'completed' : 'unread';
      const nextList = prev.readLater.map((r) =>
        r.id === id ? { ...r, status: nextStatus } : r
      );
      const nextActivities =
        nextStatus === 'completed'
          ? [
              makeActivity({
                module: 'materials',
                action: 'Finished Read Later item',
                detail: target.title,
                subject: target.subject,
                source: 'user',
              }),
              ...prev.activities,
            ].slice(0, 40)
          : prev.activities;

      return {
        ...prev,
        readLater: nextList,
        activities: nextActivities,
      };
    });
  };

  const removeFromReadLater = (id: string) => {
    setState((prev) => ({
      ...prev,
      readLater: prev.readLater.filter((r) => r.id !== id),
    }));
    setActiveReadLaterId((prev) => (prev === id ? null : prev));
  };

  const openReadLaterInFocus = (id: string) => {
    setMaterialsInitialTab('readLater');
    setActiveReadLaterId(id);
    setActiveModule('materials');
    setFocusMode(true);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const openReadLaterQueue = () => {
    setActiveReadLaterId(null);
    setMaterialsInitialTab('readLater');
    setActiveModule('materials');
  };

  const markNotificationsRead = (ids: string[]) => {
    setState((prev) => ({
      ...prev,
      readNotificationIds: Array.from(new Set([...prev.readNotificationIds, ...ids])),
    }));
  };

  const importWorkspaceJson = (rawJson: string) => {
    const parsed = JSON.parse(rawJson) as Partial<StudyStoreState>;
    if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
      throw new Error('Invalid STUDIQ AI backup file.');
    }
    setState({
      ...INITIAL_STUDY_STATE,
      ...parsed,
      profile: {
        ...INITIAL_STUDY_STATE.profile,
        ...parsed.profile,
      },
      tags: Array.isArray(parsed.tags) ? parsed.tags : INITIAL_STUDY_STATE.tags,
      readLater: Array.isArray(parsed.readLater) ? parsed.readLater : [],
    });
    setActiveReadLaterId(null);
  };

  const clearUserHistory = () => {
    setState((prev) => ({
      ...prev,
      threads: [],
      summaries: [],
      documents: [],
      quizzes: [],
      quizAttempts: [],
      decks: [],
      tasks: [],
      sessions: [],
      activities: [],
      readLater: [],
      readNotificationIds: [],
    }));
    setActiveReadLaterId(null);
  };

  const resetToSampleData = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(INITIAL_STUDY_STATE);
    setActiveReadLaterId(null);
  };

  // Persist Pomodoro state
  useEffect(() => {
    try {
      localStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(pomodoro));
    } catch {
      // ignore storage quota errors
    }
  }, [pomodoro]);

  // Keep Pomodoro subject valid if subjects list changes
  useEffect(() => {
    if (state.subjects.length > 0 && !state.subjects.includes(pomodoro.subject)) {
      setPomodoro((prev) => ({ ...prev, subject: state.subjects[0] }));
    }
  }, [state.subjects, pomodoro.subject]);

  // Global Pomodoro Tick
  useEffect(() => {
    if (!pomodoro.isRunning || !pomodoro.targetEndAt) return;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((pomodoro.targetEndAt! - now) / 1000));

      if (left > 0) {
        setPomodoro((prev) =>
          prev.remainingSeconds === left ? prev : { ...prev, remainingSeconds: left }
        );
        return;
      }

      // Timer completed
      if (pomodoro.soundEnabled) {
        playPomodoroCompleteChime();
      }

      if (pomodoro.mode === 'focus') {
        const nextCompleted = pomodoro.completedPomodoros + 1;
        const nextMode: PomodoroMode =
          nextCompleted % 4 === 0 ? 'longBreak' : 'shortBreak';
        const loggedMinutes = pomodoro.focusMinutes;

        if (pomodoro.autoLogSession) {
          const todayIso = new Date().toISOString().slice(0, 10);
          logStudySession({
            subject: pomodoro.subject,
            topic: 'Pomodoro Focus Session',
            minutes: loggedMinutes,
            date: todayIso,
            day: getDayFromDate(todayIso),
            notes: 'Completed via global Pomodoro timer',
            source: 'user',
          });
          setPomodoroNotice(
            `Focus sprint complete (${loggedMinutes} min logged to ${pomodoro.subject}).`
          );
        } else {
          setPomodoroNotice(`Focus sprint complete! Take a break.`);
        }

        setPomodoro((prev) => ({
          ...prev,
          mode: nextMode,
          completedPomodoros: nextCompleted,
          isRunning: false,
          targetEndAt: null,
          remainingSeconds: getModeSeconds(nextMode, prev),
        }));
      } else {
        setPomodoroNotice('Break finished — ready for your next focus sprint.');
        setPomodoro((prev) => ({
          ...prev,
          mode: 'focus',
          isRunning: false,
          targetEndAt: null,
          remainingSeconds: getModeSeconds('focus', prev),
        }));
      }
    };

    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [
    pomodoro.isRunning,
    pomodoro.targetEndAt,
    pomodoro.mode,
    pomodoro.focusMinutes,
    pomodoro.shortBreakMinutes,
    pomodoro.longBreakMinutes,
    pomodoro.completedPomodoros,
    pomodoro.subject,
    pomodoro.autoLogSession,
    pomodoro.soundEnabled,
  ]);

  const togglePomodoro = () => {
    setPomodoroNotice(null);
    setPomodoro((prev) => {
      if (prev.isRunning) {
        const left = prev.targetEndAt
          ? Math.max(1, Math.ceil((prev.targetEndAt - Date.now()) / 1000))
          : prev.remainingSeconds;
        return {
          ...prev,
          isRunning: false,
          targetEndAt: null,
          remainingSeconds: left,
        };
      }
      const safeRemaining =
        prev.remainingSeconds > 0 ? prev.remainingSeconds : getModeSeconds(prev.mode, prev);
      return {
        ...prev,
        isRunning: true,
        remainingSeconds: safeRemaining,
        targetEndAt: Date.now() + safeRemaining * 1000,
      };
    });
  };

  const resetPomodoro = () => {
    setPomodoroNotice(null);
    setPomodoro((prev) => ({
      ...prev,
      isRunning: false,
      targetEndAt: null,
      remainingSeconds: getModeSeconds(prev.mode, prev),
    }));
  };

  const setPomodoroMode = (mode: PomodoroMode) => {
    setPomodoroNotice(null);
    setPomodoro((prev) => ({
      ...prev,
      mode,
      isRunning: false,
      targetEndAt: null,
      remainingSeconds: getModeSeconds(mode, prev),
    }));
  };

  const updatePomodoroConfig = (
    patch: Partial<
      Pick<
        PomodoroState,
        | 'focusMinutes'
        | 'shortBreakMinutes'
        | 'longBreakMinutes'
        | 'subject'
        | 'autoLogSession'
        | 'soundEnabled'
      >
    >
  ) => {
    setPomodoro((prev) => {
      const next = { ...prev, ...patch };
      if (!prev.isRunning) {
        const targetFieldChanged =
          (prev.mode === 'focus' && patch.focusMinutes !== undefined) ||
          (prev.mode === 'shortBreak' && patch.shortBreakMinutes !== undefined) ||
          (prev.mode === 'longBreak' && patch.longBreakMinutes !== undefined);
        if (targetFieldChanged) {
          next.remainingSeconds = getModeSeconds(next.mode, next);
        }
      }
      return next;
    });
  };

  const completePomodoroEarly = () => {
    const totalFocusSeconds = pomodoro.focusMinutes * 60;
    const elapsedMinutes = Math.max(
      1,
      Math.round((totalFocusSeconds - pomodoro.remainingSeconds) / 60)
    );

    if (pomodoro.mode === 'focus' && pomodoro.remainingSeconds < totalFocusSeconds) {
      const todayIso = new Date().toISOString().slice(0, 10);
      logStudySession({
        subject: pomodoro.subject,
        topic: 'Pomodoro Focus Session',
        minutes: elapsedMinutes,
        date: todayIso,
        day: getDayFromDate(todayIso),
        notes: 'Logged early from global Pomodoro timer',
        source: 'user',
      });
      if (pomodoro.soundEnabled) {
        playPomodoroCompleteChime();
      }
      setPomodoroNotice(
        `Logged ${elapsedMinutes} min focus session to ${pomodoro.subject}.`
      );
      setPomodoro((prev) => {
        const nextCompleted = prev.completedPomodoros + 1;
        const nextMode: PomodoroMode = nextCompleted % 4 === 0 ? 'longBreak' : 'shortBreak';
        return {
          ...prev,
          mode: nextMode,
          completedPomodoros: nextCompleted,
          isRunning: false,
          targetEndAt: null,
          remainingSeconds: getModeSeconds(nextMode, prev),
        };
      });
      return;
    }

    resetPomodoro();
  };

  return (
    <StudyContext.Provider
      value={{
        state,
        activeModule,
        setActiveModule,
        themeMode,
        resolvedTheme,
        setThemeMode,
        focusMode,
        setFocusMode,
        toggleFocusMode,
        pomodoro,
        pomodoroNotice,
        clearPomodoroNotice: () => setPomodoroNotice(null),
        togglePomodoro,
        resetPomodoro,
        setPomodoroMode,
        updatePomodoroConfig,
        completePomodoroEarly,
        activeReadLaterId,
        setActiveReadLaterId,
        materialsInitialTab,
        setMaterialsInitialTab,
        addToReadLater,
        toggleReadLaterStatus,
        removeFromReadLater,
        openReadLaterInFocus,
        openReadLaterQueue,
        draft,
        clearDraft,
        openWithDraft,
        isSessionModalOpen,
        setIsSessionModalOpen,
        updateProfile,
        addSubject,
        removeSubject,
        createTag,
        updateTag,
        deleteTag,
        setItemTags,
        addThread,
        updateThread,
        deleteThread,
        addSummary,
        updateSummary,
        deleteSummary,
        addDocument,
        updateDocument,
        deleteDocument,
        addQuiz,
        deleteQuiz,
        recordQuizAttempt,
        addDeck,
        updateDeck,
        deleteDeck,
        updateCardMastery,
        addCardToDeck,
        addTask,
        toggleTaskCompletion,
        deleteTask,
        logStudySession,
        markNotificationsRead,
        addActivity,
        importWorkspaceJson,
        clearUserHistory,
        resetToSampleData,
      }}
    >
      {children}
    </StudyContext.Provider>
  );
};

export function useStudy() {
  const ctx = useContext(StudyContext);
  if (!ctx) throw new Error('useStudy must be used within StudyProvider');
  return ctx;
}

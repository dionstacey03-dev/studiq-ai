export type ModuleId =
  | 'dashboard'
  | 'assistant'
  | 'summarizer'
  | 'quiz'
  | 'flashcards'
  | 'planner'
  | 'materials'
  | 'progress'
  | 'settings';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ContentSource = 'sample' | 'gemini' | 'user';

export type TagColorId = 'teal' | 'amber' | 'sky' | 'emerald' | 'violet' | 'rose' | 'slate';

export type TagCategory = 'subject' | 'project';

export interface StudyTag {
  id: string;
  name: string;
  color: TagColorId;
  category: TagCategory;
}

export type TaggableCollection = 'documents' | 'summaries' | 'quizzes' | 'decks' | 'readLater';

export interface UserProfile {
  name: string;
  major: string;
  institution: string;
  academicLevel: 'High School' | 'Undergraduate' | 'Graduate';
  dailyGoalMinutes: number;
  weeklyGoalHours: number;
  studyStreakDays: number;
  enableReminders: boolean;
  enableGoalAlerts: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  source?: ContentSource;
}

export interface ChatThread {
  id: string;
  title: string;
  subject: string;
  level: 'Beginner' | 'Undergraduate' | 'Advanced';
  style: 'Clear Overview' | 'Step-by-Step' | 'Practical Examples' | 'Concept Summary';
  updatedAt: string;
  messages: ChatMessage[];
}

export interface NoteSection {
  heading: string;
  points: string[];
}

export interface NoteKeyTerm {
  term: string;
  definition: string;
}

export type SummaryTemplateId = 'cornell' | 'outline' | 'summary' | 'revision' | 'compare';

export interface CornellCuePair {
  cue: string;
  notes: string;
}

export interface StudyNoteSummary {
  id: string;
  title: string;
  subject: string;
  format: 'Concise Summary' | 'Detailed Summary' | 'Revision Notes';
  templateId?: SummaryTemplateId;
  tldr: string;
  keyConcepts: string[];
  sections: NoteSection[];
  cuePairs?: CornellCuePair[];
  keyTerms: NoteKeyTerm[];
  reviewQuestions: string[];
  rawSourcePreview?: string;
  createdAt: string;
  source: ContentSource;
  tagIds?: string[];
}

export interface StudyDocument {
  id: string;
  title: string;
  subject: string;
  content: string;
  docType: 'Lecture Note' | 'Study Guide' | 'Formula Sheet';
  createdAt: string;
  updatedAt: string;
  source: ContentSource;
  tagIds?: string[];
}

export interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  concept: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  questionType: 'multiple-choice' | 'true-false' | 'mixed';
  createdAt: string;
  source: ContentSource;
  questions: QuizQuestion[];
  tagIds?: string[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  score: number;
  total: number;
  percentage: number;
  completedAt: string;
}

export type CardMastery = 'new' | 'learning' | 'difficult' | 'mastered';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint: string;
  mastery: CardMastery;
}

export interface FlashcardDeck {
  id: string;
  title: string;
  subject: string;
  createdAt: string;
  source: ContentSource;
  cards: Flashcard[];
  tagIds?: string[];
}

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  day: DayOfWeek;
  dateLabel: string;
  dueDate: string; // YYYY-MM-DD
  startTime: string;
  durationMinutes: number;
  priority: 'High' | 'Medium' | 'Low';
  reminderEnabled: boolean;
  completed: boolean;
}

export interface StudySessionLog {
  id: string;
  subject: string;
  topic: string;
  minutes: number;
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  notes?: string;
  source: ContentSource;
}

export interface ActivityEvent {
  id: string;
  module: ModuleId;
  action: string;
  detail: string;
  subject: string;
  timestamp: string;
  source: ContentSource;
}

export interface CrossModuleDraft {
  targetModule: 'quiz' | 'flashcards' | 'assistant' | 'summarizer';
  topic: string;
  subject: string;
  notes?: string;
}

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface PomodoroState {
  mode: PomodoroMode;
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  remainingSeconds: number;
  isRunning: boolean;
  targetEndAt: number | null;
  completedPomodoros: number;
  subject: string;
  autoLogSession: boolean;
  soundEnabled: boolean;
}

export interface ReadLaterItem {
  id: string;
  title: string;
  subject: string;
  origin: 'assistant' | 'summarizer' | 'materials';
  originId?: string;
  content: string;
  estimatedMinutes: number;
  status: 'unread' | 'completed';
  savedAt: string;
  source: ContentSource;
  tagIds?: string[];
}

export interface StudyStoreState {
  profile: UserProfile;
  subjects: string[];
  tags: StudyTag[];
  threads: ChatThread[];
  summaries: StudyNoteSummary[];
  documents: StudyDocument[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  decks: FlashcardDeck[];
  tasks: StudyTask[];
  sessions: StudySessionLog[];
  activities: ActivityEvent[];
  readLater: ReadLaterItem[];
  readNotificationIds: string[];
}

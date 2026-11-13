import { StudyNoteSummary, SummaryTemplateId, CornellCuePair, QuizQuestion, Flashcard } from '../types/study';

interface ApiErrorResponse {
  error?: string;
}

const AI_REQUEST_TIMEOUT_MS = 28000;

async function postJson<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.status === 413) {
      throw new Error(
        'Upload or study note payload exceeds the serverless request size limit (4.5 MB). Please shorten the text or upload a smaller file.'
      );
    }

    const payload = (await response.json().catch(() => ({}))) as T & ApiErrorResponse;
    if (!response.ok) {
      throw new Error(payload.error || `Request failed with status ${response.status}`);
    }
    return payload;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('The AI request timed out. Please try again with a shorter prompt or passage.');
    }
    if (err instanceof TypeError) {
      throw new Error('Network error reaching the STUDIQ AI server. Check your connection and try again.');
    }
    throw err;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export async function requestTopicExplanation(params: {
  prompt: string;
  subject: string;
  level: string;
  style: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}): Promise<string> {
  const data = await postJson<{ answer: string }>('/api/ai/explain', params);
  return data.answer;
}

export interface GeneratedSummaryPayload {
  title: string;
  subject: string;
  tldr: string;
  keyConcepts: string[];
  sections: Array<{ heading: string; points: string[] }>;
  cuePairs?: CornellCuePair[];
  keyTerms: Array<{ term: string; definition: string }>;
  reviewQuestions: string[];
}

export async function requestNotesSummary(params: {
  content: string;
  fileName?: string;
  fileMimeType?: string;
  fileBase64?: string;
  subject: string;
  format: StudyNoteSummary['format'];
  templateId?: SummaryTemplateId;
}): Promise<GeneratedSummaryPayload> {
  const data = await postJson<{ summary: GeneratedSummaryPayload }>('/api/ai/summarize', params);
  return data.summary;
}

export interface GeneratedQuizPayload {
  title: string;
  subject: string;
  questions: Array<Omit<QuizQuestion, 'id'>>;
}

export async function requestQuizGeneration(params: {
  topic: string;
  sourceNotes: string;
  subject: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Advanced';
  questionCount: number;
  questionType: 'multiple-choice' | 'true-false' | 'mixed';
}): Promise<GeneratedQuizPayload> {
  const data = await postJson<{ quiz: GeneratedQuizPayload }>('/api/ai/quiz', params);
  return data.quiz;
}

export interface GeneratedDeckPayload {
  deckTitle: string;
  subject: string;
  cards: Array<Pick<Flashcard, 'front' | 'back' | 'hint'>>;
}

export async function requestFlashcardsGeneration(params: {
  topic: string;
  sourceNotes: string;
  subject: string;
  cardCount: number;
}): Promise<GeneratedDeckPayload> {
  const data = await postJson<{ deck: GeneratedDeckPayload }>('/api/ai/flashcards', params);
  return data.deck;
}

export type TtsVoiceName = 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';

export interface GeneratedSpeechPayload {
  audioBase64: string;
  mimeType: string;
  voiceName: TtsVoiceName;
}

export async function requestSpeechAudio(params: {
  text: string;
  voiceName?: TtsVoiceName;
  contextLabel?: string;
}): Promise<GeneratedSpeechPayload> {
  return postJson<GeneratedSpeechPayload>('/api/ai/tts', params);
}


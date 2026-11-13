import { GoogleGenAI, Type } from '@google/genai';

export const MODEL_NAME = 'gemini-4-hydrogen';
export const TTS_MODEL_NAME = 'gemini-3.8-flash-lite-tts';
export const ALLOWED_TTS_VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'] as const;
export type TtsVoiceName = (typeof ALLOWED_TTS_VOICES)[number];

export class ApiServiceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function parseRequestBody<T extends Record<string, unknown>>(rawBody: unknown): T {
  if (rawBody === undefined || rawBody === null || rawBody === '') {
    return {} as T;
  }
  if (typeof rawBody === 'string') {
    try {
      const parsed = JSON.parse(rawBody);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as T;
      }
      throw new ApiServiceError(400, 'Request body must be a valid JSON object.');
    } catch (err) {
      if (err instanceof ApiServiceError) throw err;
      throw new ApiServiceError(400, 'Malformed JSON request body.');
    }
  }
  if (typeof rawBody === 'object' && !Array.isArray(rawBody)) {
    return rawBody as T;
  }
  throw new ApiServiceError(400, 'Request body must be a JSON object.');
}

function parseAiJson<T>(rawText: string | undefined, fallbackMessage: string): T {
  const clean = (rawText ?? '').trim();
  if (!clean) {
    throw new ApiServiceError(502, fallbackMessage);
  }
  try {
    return JSON.parse(clean) as T;
  } catch {
    throw new ApiServiceError(502, fallbackMessage);
  }
}

export function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'your_gemini_api_key_here') {
    throw new ApiServiceError(
      503,
      'Gemini API key is not configured. Set the GEMINI_API_KEY environment variable on the server.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function normalizeGeminiError(err: unknown, fallbackMessage: string): ApiServiceError {
  if (err instanceof ApiServiceError) return err;
  const message = err instanceof Error ? err.message : fallbackMessage;
  if (
    message.includes('API_KEY_INVALID') ||
    message.includes('PERMISSION_DENIED') ||
    message.includes('403')
  ) {
    return new ApiServiceError(
      403,
      'Gemini API access was denied. Verify your server GEMINI_API_KEY environment variable.'
    );
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return new ApiServiceError(
      429,
      'Rate limit reached on the Gemini API. Please wait a few seconds and try again.'
    );
  }
  if (
    message.includes('DEADLINE_EXCEEDED') ||
    message.includes('ETIMEDOUT') ||
    message.includes('ECONNABORTED') ||
    message.includes('AbortError') ||
    message.includes('504') ||
    /timeout/i.test(message)
  ) {
    return new ApiServiceError(
      504,
      'The AI provider timed out before completing the request. Please try again.'
    );
  }
  if (message.includes('UNAVAILABLE') || message.includes('503')) {
    return new ApiServiceError(
      503,
      'The AI service is temporarily unavailable. Please retry in a moment.'
    );
  }
  if (message.includes('INVALID_ARGUMENT') || message.includes('400')) {
    return new ApiServiceError(
      400,
      'The AI request could not be processed with the provided input. Please check your text or file.'
    );
  }
  return new ApiServiceError(500, message || fallbackMessage);
}

export async function explainTopic(input: {
  prompt?: string;
  subject?: string;
  level?: string;
  style?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}) {
  const prompt = (input.prompt ?? '').trim();
  if (!prompt) {
    throw new ApiServiceError(400, 'Please enter an academic question or topic.');
  }
  if (prompt.length > 6000) {
    throw new ApiServiceError(400, 'Prompt exceeds the 6,000-character limit.');
  }

  const subject = input.subject || 'General Studies';
  const level = input.level || 'Undergraduate';
  const style = input.style || 'Clear Overview';

  const styleGuidance: Record<string, string> = {
    'Clear Overview':
      'Provide a clear intuitive explanation in accessible language, structured key principles, a practical example, and a quick comprehension check.',
    'Step-by-Step':
      'Break down the derivation, proof, or mechanism into numbered sequential steps, explaining the reason behind each transition.',
    'Practical Examples':
      'Anchor the concept in concrete real-world examples and worked scenarios before generalizing the formal theory.',
    'Concept Summary':
      'Deliver a tight, high-yield synthesis highlighting core definitions, relationships, and common pitfalls.',
  };

  const systemInstruction = [
    'You are STUDIQ AI, an academic study assistant.',
    `Subject focus: ${subject}.`,
    `Target academic depth: ${level}.`,
    `Pedagogical approach: ${styleGuidance[style] || styleGuidance['Clear Overview']}`,
    'Format responses in clean Markdown with headings, bullet lists, code blocks or equations where helpful, and bolded key terms.',
    'Keep explanations accurate, clear, and focused. Conclude with one concise follow-up question.',
  ].join(' ');

  const history = Array.isArray(input.history) ? input.history.slice(-10) : [];
  const contents = [
    ...history.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(turn.content || '').slice(0, 6000) }],
    })),
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents,
      config: { systemInstruction },
    });

    const answer = response.text?.trim();
    if (!answer) {
      throw new ApiServiceError(502, 'Gemini returned an empty response. Please rephrase and try again.');
    }
    return { answer };
  } catch (err) {
    throw normalizeGeminiError(err, 'Failed to generate explanation.');
  }
}

export async function summarizeNotes(input: {
  content?: string;
  fileName?: string;
  fileMimeType?: string;
  fileBase64?: string;
  subject?: string;
  format?: string;
  templateId?: string;
}) {
  const content = (input.content ?? '').trim();
  const fileBase64 = input.fileBase64;
  const fileMimeType = input.fileMimeType;
  const fileName = input.fileName;
  const subject = input.subject || 'General Studies';
  const format = input.format || 'Concise Summary';
  const templateId = input.templateId || '';

  if (!content && !fileBase64) {
    throw new ApiServiceError(400, 'Please paste study text or upload a supported document.');
  }
  if (content.length > 40000) {
    throw new ApiServiceError(400, 'Study notes exceed the 40,000-character limit.');
  }

  const formatInstructions: Record<string, string> = {
    'Concise Summary': 'Produce a tight executive synthesis with 3-4 crisp key points and essential definitions.',
    'Detailed Summary': 'Produce a thorough breakdown with multiple well-organized thematic sections, detailed points, definitions, and review questions.',
    'Revision Notes': 'Organize the material into exam-ready revision notes highlighting core definitions, relationships, formulas, and self-check prompts.',
  };

  const templateInstructions: Record<string, string> = {
    cornell:
      'Use the Cornell Note-Taking Method. Populate "cuePairs" with 4-7 concise recall cue questions or keywords paired with thorough explanatory notes in the right-hand "notes" field, synthesize the page in "tldr" as a bottom summary, and also populate concise "sections", "keyConcepts", "keyTerms", and "reviewQuestions".',
    outline:
      'Use a formal Hierarchical Outline layout. Prefix each entry in "sections" with Roman numerals (e.g. "I. Major Topic", "II. Next Topic"), put clear nested supporting points inside "points", include core takeaways in "keyConcepts", and provide key terms and review questions.',
    summary:
      'Use an Executive Summary layout. Keep "tldr" tight (2-3 sentences), extract 4-5 high-yield "keyConcepts", keep "sections" crisp and scannable, and list essential "keyTerms" and review questions.',
    revision:
      'Use an Exam Revision Sheet layout. Focus "sections" and "keyConcepts" on exam-critical principles, equations, edge cases, and common pitfalls, with sharp "keyTerms" definitions and self-test "reviewQuestions".',
    compare:
      'Use a Concept Comparison layout. Structure "sections" around shared comparison criteria (e.g. Mechanism, Conditions, Outcomes, Exceptions) so concepts or theories are contrasted clearly side by side.',
  };

  const activeGuidance =
    templateInstructions[templateId] ||
    formatInstructions[format] ||
    formatInstructions['Concise Summary'];

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  if (fileBase64 && fileMimeType) {
    parts.push({
      inlineData: {
        mimeType: fileMimeType,
        data: fileBase64,
      },
    });
  }

  parts.push({
    text: [
      `Summarize the provided study material${fileName ? ` (source file: ${fileName})` : ''} for subject "${subject}" using the "${templateId || format}" layout.`,
      activeGuidance,
      content ? `\n\nStudy Material:\n${content}` : '',
    ].join(''),
  });

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts },
      config: {
        systemInstruction:
          'You are STUDIQ AI’s academic synthesizer. Summarize strictly from the provided text or document without fabricating facts.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            tldr: { type: Type.STRING, description: 'Clear 2-3 sentence summary overview.' },
            keyConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key bullet points extracted from the material.',
            },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  heading: { type: Type.STRING },
                  points: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ['heading', 'points'],
              },
            },
            cuePairs: {
              type: Type.ARRAY,
              description: 'Cornell cue-question and corresponding notes pairs when Cornell template is selected.',
              items: {
                type: Type.OBJECT,
                properties: {
                  cue: { type: Type.STRING },
                  notes: { type: Type.STRING },
                },
                required: ['cue', 'notes'],
              },
            },
            keyTerms: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  term: { type: Type.STRING },
                  definition: { type: Type.STRING },
                },
                required: ['term', 'definition'],
              },
            },
            reviewQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['title', 'subject', 'tldr', 'keyConcepts', 'sections', 'keyTerms', 'reviewQuestions'],
        },
      },
    });

    const summary = parseAiJson(
      response.text,
      'Gemini returned an invalid summary structure. Please try summarizing again.'
    );
    return { summary };
  } catch (err) {
    throw normalizeGeminiError(err, 'Failed to summarize study material.');
  }
}

export async function generateQuiz(input: {
  topic?: string;
  sourceNotes?: string;
  subject?: string;
  difficulty?: string;
  questionCount?: number;
  questionType?: 'multiple-choice' | 'true-false' | 'mixed';
}) {
  const topic = (input.topic ?? '').trim();
  const sourceNotes = (input.sourceNotes ?? '').trim();
  const subject = input.subject || 'General Studies';
  const difficulty = input.difficulty || 'Intermediate';
  const questionType = input.questionType || 'multiple-choice';
  const clampedCount = Math.min(Math.max(Number(input.questionCount) || 5, 3), 10);

  if (!topic && !sourceNotes) {
    throw new ApiServiceError(400, 'Please enter a topic or paste study material to generate a quiz.');
  }

  const typeInstruction =
    questionType === 'true-false'
      ? 'Every question must be a True/False statement with options strictly equal to ["True", "False"] and correctIndex 0 or 1.'
      : questionType === 'mixed'
      ? 'Include a mix of 4-option multiple-choice questions and True/False questions (where True/False options are strictly ["True", "False"]).'
      : 'Every question must be a 4-option multiple-choice question with correctIndex 0-3.';

  const prompt = [
    `Create a ${clampedCount}-question "${difficulty}" difficulty quiz for subject "${subject}".`,
    typeInstruction,
    topic ? `Topic: ${topic}.` : '',
    sourceNotes ? `\nSource Material:\n${sourceNotes.slice(0, 20000)}` : '',
    'Provide a concise explanation for the correct answer and a brief concept tag for every question.',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction:
          'You are STUDIQ AI’s assessment designer. Create conceptually rigorous, unambiguous questions with clear explanations.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: 'multiple-choice or true-false' },
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING },
                  concept: { type: Type.STRING },
                },
                required: ['type', 'question', 'options', 'correctIndex', 'explanation', 'concept'],
              },
            },
          },
          required: ['title', 'subject', 'questions'],
        },
      },
    });

    const quiz = parseAiJson(
      response.text,
      'Gemini returned an invalid quiz structure. Please try again.'
    );
    return { quiz };
  } catch (err) {
    throw normalizeGeminiError(err, 'Failed to generate quiz.');
  }
}

export async function generateFlashcards(input: {
  topic?: string;
  sourceNotes?: string;
  subject?: string;
  cardCount?: number;
}) {
  const topic = (input.topic ?? '').trim();
  const sourceNotes = (input.sourceNotes ?? '').trim();
  const subject = input.subject || 'General Studies';
  const clampedCount = Math.min(Math.max(Number(input.cardCount) || 8, 3), 15);

  if (!topic && !sourceNotes) {
    throw new ApiServiceError(400, 'Please enter a topic or paste study notes to generate flashcards.');
  }

  const prompt = [
    `Generate ${clampedCount} atomic active-recall flashcards for subject "${subject}".`,
    topic ? `Topic: ${topic}.` : '',
    sourceNotes ? `\nSource Material:\n${sourceNotes.slice(0, 20000)}` : '',
    'Each card should test one clear concept with a concise front prompt, an accurate back answer, and a brief memory hint.',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction:
          'You are STUDIQ AI’s spaced-repetition curator. Write clear, high-retention flashcards.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            deckTitle: { type: Type.STRING },
            subject: { type: Type.STRING },
            cards: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  front: { type: Type.STRING },
                  back: { type: Type.STRING },
                  hint: { type: Type.STRING },
                },
                required: ['front', 'back', 'hint'],
              },
            },
          },
          required: ['deckTitle', 'subject', 'cards'],
        },
      },
    });

    const deck = parseAiJson(
      response.text,
      'Gemini returned an invalid flashcard deck structure. Please try again.'
    );
    return { deck };
  } catch (err) {
    throw normalizeGeminiError(err, 'Failed to generate flashcards.');
  }
}

function sanitizeTextForTts(raw: string): string {
  return raw
    .replace(/```[\s\S]*?```/g, ' Code example omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\$\$([\s\S]*?)\$\$/g, ' $1 ')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\|\s*[-:\s|]+\|\s*$/gm, '')
    .replace(/\|/g, ', ')
    .replace(/[*_~>#]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export async function generateSpeech(input: {
  text?: string;
  voiceName?: string;
  contextLabel?: string;
}) {
  const rawText = (input.text ?? '').trim();
  const cleaned = sanitizeTextForTts(rawText);
  if (!cleaned) {
    throw new ApiServiceError(400, 'Please provide study text to read aloud.');
  }

  const spokenText = cleaned.slice(0, 5000);
  const requestedVoice = input.voiceName || 'Kore';
  const voiceName: TtsVoiceName = (ALLOWED_TTS_VOICES as readonly string[]).includes(
    requestedVoice
  )
    ? (requestedVoice as TtsVoiceName)
    : 'Kore';

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: TTS_MODEL_NAME,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: spokenText,
              speechMetadata: {
                style: input.contextLabel
                  ? `Clear, warm academic tutor reading ${input.contextLabel} at a natural study pace`
                  : 'Clear, warm academic tutor reading study notes at a natural study pace',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const audioPart = parts.find((p) => p.inlineData?.data);
    const audioBase64 = audioPart?.inlineData?.data;
    const mimeType = audioPart?.inlineData?.mimeType || 'audio/wav';

    if (!audioBase64) {
      throw new ApiServiceError(
        502,
        'Gemini TTS did not return audio data. Please try again.'
      );
    }

    return {
      audioBase64,
      mimeType,
      voiceName,
    };
  } catch (err) {
    throw normalizeGeminiError(err, 'Failed to generate study audio.');
  }
}

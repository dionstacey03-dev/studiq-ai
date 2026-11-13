# STUDIQ AI

**Think Deeper. Learn Faster.**

STUDIQ AI is an academic study workspace and AI learning platform built with React, TypeScript, Tailwind CSS v4, Express, and server-side Vercel Functions powered by Google Gemini. It unifies concept tutoring, structured notes summarization, adaptive quizzing, spaced-repetition flashcards, study planning, focus sessions, and progress analytics in a persistent browser workspace with Arctic Aurora light and dark themes.

---

## Features

- **Workspace Dashboard (`/`)**: Study streak tracking, daily goal ring, upcoming study tasks, recent saved notes/decks, and quick session logging.
- **AI Assistant (`/assistant`)**: Multi-turn academic tutor with subject/depth/style controls, browser Web Speech dictation, Text-to-Speech (TTS) audio playback, Read Later bookmarking, and print-friendly layout.
- **Notes Summarizer (`/summarizer`)**: Convert pasted notes or uploaded `.txt`/`.md`/PDF/image materials into structured summaries using a **Templates Library** (*Cornell Notes*, *Hierarchical Outline*, *Executive Summary*, *Exam Revision Sheet*, *Concept Comparison*), with TTS playback, color-coded tags, Read Later bookmarking, and print stylesheet (`@media print`).
- **Adaptive Quiz Generator (`/quiz`)**: Generate Multiple Choice, True/False, or Mixed assessments with instant explanations, optional sound/animation feedback on correct answers, and concept-level scoring.
- **Spaced-Repetition Flashcards (`/flashcards`)**: AI-generated or custom card decks with hint toggles, card mastery states (*New*, *Learning*, *Mastered*), and shuffle/focus modes.
- **Study Planner (`/planner`)**: Weekly task scheduling, subject prioritization, completion tracking, and study session time logs.
- **Materials Library & Read Later (`/materials`)**: Centralized filterable repository across documents, summaries, quizzes, flashcard decks, and Read Later bookmarks using custom **color-coded Subject & Project tags**.
- **Progress & Analytics (`/progress`)**: Subject mastery distribution, quiz accuracy trends, weekly study hours, and one-click structured **CSV & PDF export**.
- **Global Pomodoro Timer & Focus Mode**: Persistent top-bar Pomodoro countdown across every module, customizable focus/break intervals, auto-session logging, distraction-free Focus Mode (`Esc`), and Arctic Aurora **Light / Dark / System** themes persisted in `localStorage`.

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| UI & Motion | Lucide React, Motion (`motion/react`), React Markdown |
| PDF Export | `jspdf` |
| Backend / API | Vercel Functions (`api/*.ts`), Express (`server.ts` for local dev & Node hosting) |
| AI SDK | `@google/genai` (strictly server-side via `process.env.GEMINI_API_KEY`) |
| Persistence | Browser `localStorage` with JSON workspace export/import |

---

## Installation

### Prerequisites

- **Node.js** `>= 20`
- **npm** `>= 10`
- A valid Google **Gemini API key**

### Local Setup

```bash
git clone https://github.com/<your-username>/studiq-ai.git
cd studiq-ai
npm install
```

---

## Environment Variable Setup

Create a `.env.local` or `.env` file in the project root by copying `.env.example`:

```bash
cp .env.example .env.local
```

Configure the required environment variable:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Security Note:** Never prefix `GEMINI_API_KEY` with `VITE_` and never commit `.env` or `.env.local` files. All calls to Google Gemini are executed exclusively on the server (`server/geminiService.ts` via `/api/ai/*`).

---

## Local Development Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the unified Express + Vite development server on port `3000` |
| `npm run lint` | Runs TypeScript type-checking (`tsc --noEmit`) |
| `npm run build` | Builds the production frontend bundle into `dist/` |
| `npm run preview` | Previews the built `dist/` frontend bundle locally |
| `npm start` | Starts the Node production server (`server.ts`) |

---

## Vercel Deployment Instructions

Connect the GitHub repository (`studiq-ai`) to Vercel for automatic builds and serverless API deployment:

1. **Push to GitHub**:
   Ensure all changes are committed and pushed to your `main` branch in a GitHub repository named `studiq-ai`.
2. **Import Project in Vercel**:
   In the Vercel dashboard, click **Add New → Project** and select the `studiq-ai` repository.
3. **Verify Project Settings**:
   - **Project Name**: `studiq-ai`
   - **Framework Preset**: `Vite` (auto-detected via `vercel.json`)
   - **Production Branch**: `main`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Configure Production Environment Variables**:
   Under **Settings → Environment Variables**, add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: your Google Gemini API key
   - **Environments**: Production (and Preview/Development if desired)
5. **Deploy**:
   Click **Deploy**. Vercel builds the Vite SPA into `dist/` and deploys `/api/health` plus `/api/ai/*` as serverless functions (30s `maxDuration`) with SPA fallback rewrites and security headers configured in `vercel.json`.

---

## Screenshots

Add screenshots in `docs/screenshots/` after capturing your deployed preview:

| View | Description |
| --- | --- |
| **Workspace Dashboard** | Overview of streaks, goal progress, daily focus time, and active study tasks (Light & Dark Arctic Aurora themes) |
| **AI Assistant & Voice Dictation** | Multi-turn concept tutoring with voice dictation input, TTS playback, and Read Later bookmarking |
| **Notes Summarizer & Templates** | Structured Cornell, Outline, and Comparison study sheets with print-ready preview |
| **Materials Library & Tags** | Color-coded Subject and Project tag filtering alongside the Read Later queue |
| **Progress & Analytics Export** | Performance charts with one-click structured CSV and PDF report generation |

---

## Project Structure

```text
studiq-ai/
├── api/                         # Vercel Serverless Functions
│   ├── health.ts                # GET /api/health endpoint
│   └── ai/
│       ├── explain.ts           # POST /api/ai/explain
│       ├── flashcards.ts        # POST /api/ai/flashcards
│       ├── quiz.ts              # POST /api/ai/quiz
│       ├── summarize.ts         # POST /api/ai/summarize
│       └── tts.ts               # POST /api/ai/tts
├── public/
│   └── favicon.svg              # Vector app icon
├── server/
│   └── geminiService.ts         # Server-only @google/genai client & prompt/schema handlers
├── src/
│   ├── components/
│   │   ├── modules/             # Dashboard, Assistant, Summarizer, Quiz, Flashcards, Planner, Materials, Progress, Settings
│   │   ├── ui/                  # Shared UI cards, badges, tag manager, summary template & read-later modals
│   │   ├── ErrorBoundary.tsx
│   │   ├── LogSessionModal.tsx
│   │   ├── PomodoroWidget.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StudiqLogo.tsx
│   │   └── TopBar.tsx
│   ├── context/
│   │   └── StudyContext.tsx     # Global workspace state, localStorage persistence, theme, Pomodoro & SPA route sync
│   ├── data/
│   │   └── seedData.ts          # Initial sample workspace data
│   ├── hooks/
│   │   └── useSpeechDictation.ts # Browser SpeechRecognition dictation hook
│   ├── services/
│   │   └── aiClient.ts          # Typed frontend client calling /api/ai/*
│   ├── types/
│   │   └── study.ts             # Shared TypeScript domain interfaces
│   ├── utils/                   # CSV/PDF export, formatters, sound effects, templates, tag colors
│   ├── App.tsx                  # Workspace shell & Focus Mode layout
│   ├── index.css                # Tailwind v4 & Arctic Aurora design tokens
│   ├── main.tsx
│   └── print.css                # Print-friendly stylesheet for summaries & AI answers
├── .env.example                 # Required environment variable template
├── .gitignore
├── index.html                   # App metadata & FOUC-free theme bootstrap
├── package.json
├── server.ts                    # Local Express + Vite dev/production entry point
├── tsconfig.json
├── vercel.json                  # Vercel framework, serverless duration, security headers & SPA rewrites
└── vite.config.ts

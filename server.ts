import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  ApiServiceError,
  MODEL_NAME,
  explainTopic,
  generateFlashcards,
  generateQuiz,
  generateSpeech,
  summarizeNotes,
} from './server/geminiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sendError(res: Response, err: unknown, fallback: string) {
  if (err instanceof ApiServiceError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error('Unhandled AI route error:', err);
  return res.status(500).json({ error: fallback });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Protect paid AI-provider routes from accidental or abusive request bursts.
  // This in-memory limiter is per server process; use a shared store for
  // consistent limits when deploying multiple instances.
  const AI_RATE_WINDOW_MS = 15 * 60 * 1000;
  const AI_RATE_MAX_REQUESTS = 20;
  const aiRequestCounts = new Map<string, { count: number; resetAt: number }>();

  app.use('/api/ai', (req: Request, res: Response, next) => {
    const now = Date.now();
    const clientKey = req.ip || req.socket.remoteAddress || 'unknown';
    let entry = aiRequestCounts.get(clientKey);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + AI_RATE_WINDOW_MS };
      aiRequestCounts.set(clientKey, entry);
    }

    entry.count += 1;
    res.setHeader('RateLimit-Limit', AI_RATE_MAX_REQUESTS);
    res.setHeader('RateLimit-Remaining', Math.max(0, AI_RATE_MAX_REQUESTS - entry.count));
    res.setHeader('RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > AI_RATE_MAX_REQUESTS) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({
        error: 'Too many AI requests. Please wait before trying again.',
      });
    }

    if (aiRequestCounts.size > 1000) {
      for (const [key, value] of aiRequestCounts) {
        if (now >= value.resetAt) aiRequestCounts.delete(key);
      }
    }

    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', app: 'STUDIQ AI', model: MODEL_NAME });
  });

  app.post('/api/ai/explain', async (req: Request, res: Response) => {
    try {
      const result = await explainTopic(req.body ?? {});
      return res.json(result);
    } catch (err) {
      return sendError(res, err, 'Failed to generate explanation.');
    }
  });

  app.post('/api/ai/summarize', async (req: Request, res: Response) => {
    try {
      const result = await summarizeNotes(req.body ?? {});
      return res.json(result);
    } catch (err) {
      return sendError(res, err, 'Failed to summarize study material.');
    }
  });

  app.post('/api/ai/quiz', async (req: Request, res: Response) => {
    try {
      const result = await generateQuiz(req.body ?? {});
      return res.json(result);
    } catch (err) {
      return sendError(res, err, 'Failed to generate quiz.');
    }
  });

  app.post('/api/ai/flashcards', async (req: Request, res: Response) => {
    try {
      const result = await generateFlashcards(req.body ?? {});
      return res.json(result);
    } catch (err) {
      return sendError(res, err, 'Failed to generate flashcards.');
    }
  });

  app.post('/api/ai/tts', async (req: Request, res: Response) => {
    try {
      const result = await generateSpeech(req.body ?? {});
      return res.json(result);
    } catch (err) {
      return sendError(res, err, 'Failed to generate study audio.');
    }
  });

  app.all('/api/*', (_req: Request, res: Response) => {
    return res.status(404).json({ error: 'API endpoint or HTTP method not found.' });
  });

  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`STUDIQ AI server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start STUDIQ AI server:', err);
  process.exit(1);
});

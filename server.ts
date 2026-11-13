import 'dotenv/config';
import express, { Request, Response } from 'express';
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

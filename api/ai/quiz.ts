import { ApiServiceError, generateQuiz, parseRequestBody } from '../../server/geminiService.js';

interface VercelReq {
  method?: string;
  body?: unknown;
}
interface VercelRes {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

export default async function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const body = parseRequestBody<Parameters<typeof generateQuiz>[0]>(req.body);
    const result = await generateQuiz(body);
    return res.status(200).json(result);
  } catch (err) {
    if (err instanceof ApiServiceError) {
      return res.status(err.status).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Failed to generate quiz.' });
  }
}

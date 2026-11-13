import { MODEL_NAME } from '../server/geminiService.js';

interface VercelReq {
  method?: string;
}
interface VercelRes {
  status: (code: number) => VercelRes;
  json: (data: unknown) => void;
}

export default function handler(req: VercelReq, res: VercelRes) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  return res.status(200).json({ status: 'ok', app: 'STUDIQ AI', model: MODEL_NAME });
}

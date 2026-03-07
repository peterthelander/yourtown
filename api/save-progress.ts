import { kv } from '@vercel/kv';

interface SaveProgressRequest {
  username: string;
  score: number;
  level: number;
  buildings: Array<{ type: string; x: number; y: number }>;
  money?: number;
  population?: number;
  incomePerSecond?: number;
  populationGrowthRate?: number;
}

const LEADERBOARD_KEY = 'leaderboard:global';
const ACTIVITY_KEY = 'activity:lastSeen';

function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

function getPlayerKey(username: string): string {
  return `player:${normalizeUsername(username)}`;
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const username = req.query?.username;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'username query param is required' });
    }

    const progress = await kv.get<SaveProgressRequest>(getPlayerKey(username));
    return res.status(200).json({ progress: progress ?? null });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body as SaveProgressRequest;

  if (!body?.username || typeof body.username !== 'string') {
    return res.status(400).json({ error: 'username is required' });
  }

  if (typeof body.score !== 'number' || Number.isNaN(body.score)) {
    return res.status(400).json({ error: 'score must be a valid number' });
  }

  if (typeof body.level !== 'number' || Number.isNaN(body.level)) {
    return res.status(400).json({ error: 'level must be a valid number' });
  }

  if (!Array.isArray(body.buildings)) {
    return res.status(400).json({ error: 'buildings must be an array' });
  }

  const username = normalizeUsername(body.username);
  const lastSeen = Date.now();

  const payload = {
    ...body,
    username,
    lastSeen,
  };

  await kv.set(getPlayerKey(username), payload);
  await kv.zadd(LEADERBOARD_KEY, { score: body.score, member: username });
  await kv.zadd(ACTIVITY_KEY, { score: lastSeen, member: username });

  return res.status(200).json({ ok: true, savedAt: lastSeen });
}

import { kv } from '@vercel/kv';

const ACTIVITY_KEY = 'activity:lastSeen';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const recentEntries = await kv.zrange<string>(ACTIVITY_KEY, 0, 19, {
    rev: true,
    withScores: true,
  });

  const recent = recentEntries as Array<{ member: string; score: number }>;

  const playerKeys = recent.map((entry) => `player:${entry.member}`);
  const playerData = playerKeys.length ? await kv.mget<Record<string, unknown>[]>(...playerKeys) : [];

  return res.status(200).json({
    activity: recent.map((entry, index) => ({
      rank: index + 1,
      username: entry.member,
      lastSeen: entry.score,
      profile: playerData[index] ?? null,
    })),
  });
}

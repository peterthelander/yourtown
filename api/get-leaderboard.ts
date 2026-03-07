import { kv } from '@vercel/kv';

const LEADERBOARD_KEY = 'leaderboard:global';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const leaderboard = await kv.zrange<string>(LEADERBOARD_KEY, 0, 49, {
    rev: true,
    withScores: true,
  });

  const players = leaderboard as Array<{ member: string; score: number }>;

  return res.status(200).json({
    leaderboard: players.map((entry, index) => ({
      rank: index + 1,
      username: entry.member,
      score: entry.score,
    })),
  });
}

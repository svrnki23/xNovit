/**
 * Rewards: points balance, earn/redeem (stub for now).
 */

import { Router } from 'express';

export const rewardsRouter = Router();

// In-memory points (use userId + DB in production)
let pointsBalance = 420;

/**
 * GET /api/rewards/balance
 * Returns: { pointsBalance: number }
 */
rewardsRouter.get('/balance', (req, res) => {
  res.json({ pointsBalance });
});

/**
 * POST /api/rewards/earn
 * Body: { points: number, reason: string }
 */
rewardsRouter.post('/earn', (req, res) => {
  const { points = 0 } = req.body || {};
  pointsBalance += Math.max(0, points);
  res.json({ pointsBalance });
});

/**
 * POST /api/rewards/redeem
 * Body: { points: number, type: string }
 */
rewardsRouter.post('/redeem', (req, res) => {
  const { points = 0 } = req.body || {};
  if (points > pointsBalance) {
    return res.status(400).json({ error: 'Insufficient points', pointsBalance });
  }
  pointsBalance -= points;
  res.json({ pointsBalance });
});

/**
 * Rewards: points balance, earn/redeem.
 * Real per-user data in Supabase — every request must be logged in.
 */

import { Router } from 'express';
import { supabase } from '../lib/supabaseClient.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const rewardsRouter = Router();

// Get this user's points, creating their row (starting at 0) if it doesn't exist yet.
async function getOrCreateBalance(userId) {
  const { data, error } = await supabase
    .from('rewards')
    .select('points_balance')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.points_balance;

  const { error: insertError } = await supabase
    .from('rewards')
    .insert({ user_id: userId, points_balance: 0 });
  if (insertError) throw insertError;
  return 0;
}

async function setBalance(userId, pointsBalance) {
  const { error } = await supabase
    .from('rewards')
    .update({ points_balance: pointsBalance, updated_at: new Date().toISOString() })
    .eq('user_id', userId);
  if (error) throw error;
}

/**
 * GET /api/rewards/balance
 * Requires: Authorization: Bearer <token>
 */
rewardsRouter.get('/balance', requireAuth, async (req, res) => {
  try {
    const pointsBalance = await getOrCreateBalance(req.user.id);
    res.json({ pointsBalance });
  } catch (err) {
    console.error('GET /api/rewards/balance', err);
    res.status(500).json({ error: 'Failed to get rewards balance' });
  }
});

/**
 * POST /api/rewards/earn
 * Body: { points: number, reason: string }
 */
rewardsRouter.post('/earn', requireAuth, async (req, res) => {
  try {
    const points = Number(req.body?.points);
    if (!Number.isFinite(points) || points < 0) {
      return res.status(400).json({ error: 'points must be a non-negative number' });
    }

    const current = await getOrCreateBalance(req.user.id);
    const pointsBalance = current + points;
    await setBalance(req.user.id, pointsBalance);

    res.json({ pointsBalance });
  } catch (err) {
    console.error('POST /api/rewards/earn', err);
    res.status(500).json({ error: 'Failed to earn points' });
  }
});

/**
 * POST /api/rewards/redeem
 * Body: { points: number, type: string }
 */
rewardsRouter.post('/redeem', requireAuth, async (req, res) => {
  try {
    const points = Number(req.body?.points);
    if (!Number.isFinite(points) || points < 0) {
      return res.status(400).json({ error: 'points must be a non-negative number' });
    }

    const current = await getOrCreateBalance(req.user.id);
    if (points > current) {
      return res.status(400).json({ error: 'Insufficient points', pointsBalance: current });
    }

    const pointsBalance = current - points;
    await setBalance(req.user.id, pointsBalance);

    res.json({ pointsBalance });
  } catch (err) {
    console.error('POST /api/rewards/redeem', err);
    res.status(500).json({ error: 'Failed to redeem points' });
  }
});

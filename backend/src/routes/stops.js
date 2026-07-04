/**
 * Stops routes: nearest rest ("I'm tired"), emergency nearby.
 */

import { Router } from 'express';
import { getNearestRestStops, getEmergencyNearby } from '../services/aiService.js';

export const stopsRouter = Router();

/**
 * POST /api/stops/nearest-rest
 * Body: { near: "current" } or { latitude: number, longitude: number }
 * Returns: { stops: Stop[] }
 */
stopsRouter.post('/nearest-rest', async (req, res) => {
  try {
    const { near, latitude, longitude } = req.body || {};
    const param = latitude != null && longitude != null ? { latitude, longitude } : (near || 'current');
    const stops = await getNearestRestStops(param);
    res.json({ stops });
  } catch (err) {
    console.error('POST /api/stops/nearest-rest', err);
    res.status(500).json({ error: 'Failed to get nearest rest stops', message: err.message });
  }
});

/**
 * GET /api/stops/nearest-rest?near=current
 * Alternative for iOS GET request.
 */
stopsRouter.get('/nearest-rest', async (req, res) => {
  try {
    const near = req.query.near || 'current';
    const stops = await getNearestRestStops(near);
    res.json({ stops });
  } catch (err) {
    console.error('GET /api/stops/nearest-rest', err);
    res.status(500).json({ error: 'Failed to get nearest rest stops' });
  }
});

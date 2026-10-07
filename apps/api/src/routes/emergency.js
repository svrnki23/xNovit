/**
 * Emergency route: nearest hospital, tow, police.
 */

import { Router } from 'express';
import { getEmergencyNearby } from '../services/aiService.js';

export const emergencyRouter = Router();

/**
 * POST /api/emergency/nearby
 * Body: { latitude: number, longitude: number }
 * Returns: { hospitals: [], tows: [], police: [] }
 */
emergencyRouter.post('/nearby', async (req, res) => {
  try {
    const { latitude, longitude } = req.body || {};
    const lat = latitude ?? 39.5;
    const lon = longitude ?? -98.5;
    const result = await getEmergencyNearby(lat, lon);
    res.json(result);
  } catch (err) {
    console.error('POST /api/emergency/nearby', err);
    res.status(500).json({ error: 'Failed to get emergency nearby' });
  }
});

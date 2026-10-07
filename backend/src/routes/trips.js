/**
 * Trip routes: calculate a trip, save a trip, list/get saved trips.
 * Saved trips are real, per-user data in Supabase — not shared, not temporary.
 */

import { Router } from 'express';
import { calculateTripWithAI } from '../services/aiService.js';
import { newUuid } from '../lib/schemas.js';
import { supabase } from '../lib/supabaseClient.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const tripsRouter = Router();

/**
 * POST /api/trips/calculate
 * No login needed — this only calculates a trip, it doesn't save anything.
 */
tripsRouter.post('/calculate', async (req, res) => {
  try {
    const draft = req.body;
    if (!draft?.origin?.name || !draft?.destination?.name) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }
    const trip = await calculateTripWithAI(draft);
    res.json(trip);
  } catch (err) {
    console.error('POST /api/trips/calculate', err);
    res.status(500).json({ error: 'Failed to calculate trip', message: err.message });
  }
});

/**
 * POST /api/trips
 * Requires: Authorization: Bearer <token>
 * Body: Trip (full trip to save)
 * Saves the trip under the logged-in user's own account.
 */
tripsRouter.post('/', requireAuth, async (req, res) => {
  try {
    const trip = req.body;
    const id = trip?.id || newUuid();

    // Whole trip is stored as one JSON blob (trip_data), tagged with who owns it.
    const { error } = await supabase
      .from('trips')
      .insert({ id, user_id: req.user.id, trip_data: { ...trip, id } });
    if (error) throw error;

    res.status(201).json({ id });
  } catch (err) {
    console.error('POST /api/trips', err);
    res.status(500).json({ error: 'Failed to save trip' });
  }
});

/**
 * GET /api/trips
 * Requires: Authorization: Bearer <token>
 * Returns only the logged-in user's own trips — never anyone else's.
 */
tripsRouter.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('trip_data')
      .eq('user_id', req.user.id);
    if (error) throw error;

    // Unwrap each row's trip_data into a plain list of trips.
    res.json(data.map((row) => row.trip_data));
  } catch (err) {
    console.error('GET /api/trips', err);
    res.status(500).json({ error: 'Failed to list trips' });
  }
});

/**
 * GET /api/trips/:id
 * Requires: Authorization: Bearer <token>
 * Only returns the trip if it belongs to the logged-in user.
 */
tripsRouter.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .select('trip_data')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id) // blocks reading someone else's trip by guessing its id
      .maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Trip not found' });

    res.json(data.trip_data);
  } catch (err) {
    console.error('GET /api/trips/:id', err);
    res.status(500).json({ error: 'Failed to get trip' });
  }
});

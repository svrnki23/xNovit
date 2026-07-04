/**
 * Trip routes: calculate trip (AI), list saved trips, save trip.
 */

import { Router } from 'express';
import { calculateTripWithAI } from '../services/aiService.js';
import { newUuid } from '../lib/schemas.js';

export const tripsRouter = Router();

// In-memory store for saved trips (replace with DB in production)
const savedTrips = new Map();

/**
 * POST /api/trips/calculate
 * Body: DraftTrip (origin, destination, waypoints, tripType, startTime, leaveNow, vehicle, preferences, userType, measurementSystem)
 * Returns: Trip (full plan with route, restStops, gasStops, mealStops, hotelStops, weather, funActivities, estimatedCost)
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
 * Body: Trip (full trip to save)
 * Returns: { id } saved trip id
 */
tripsRouter.post('/', (req, res) => {
  try {
    const trip = req.body;
    const id = trip?.id || newUuid();
    savedTrips.set(id, { ...trip, id });
    res.status(201).json({ id });
  } catch (err) {
    console.error('POST /api/trips', err);
    res.status(500).json({ error: 'Failed to save trip' });
  }
});

/**
 * GET /api/trips
 * Returns: [ Trip ] list of saved trips
 */
tripsRouter.get('/', (req, res) => {
  const list = Array.from(savedTrips.values());
  res.json(list);
});

/**
 * GET /api/trips/:id
 */
tripsRouter.get('/:id', (req, res) => {
  const trip = savedTrips.get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

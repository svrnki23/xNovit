/**
 * AI service: uses OpenAI to generate trip plans, nearest rest stops, and emergency options.
 * Falls back to deterministic mock data if OPENAI_API_KEY is missing.
 */

import OpenAI from 'openai';
import { normalizeTripForSwift } from '../lib/iosTripCodec.js';
import { newUuid, stopPayload, weatherSegmentPayload } from '../lib/schemas.js';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Build a full Trip object from draft using AI or fallback logic.
 * Returns JSON matching iOS Trip model (dates as ISO strings, UUIDs as strings).
 */
export async function calculateTripWithAI(draft) {
  const startTime = draft.leaveNow
    ? new Date()
    : new Date(draft.startTime);
  const originName = draft.origin?.name || 'Origin';
  const destName = draft.destination?.name || 'Destination';
  const userType = draft.userType || 'passenger';
  const prefs = draft.preferences || {};
  const vehicle = draft.vehicle;

  let trip = null;
  if (openai) {
    try {
      trip = await generateTripWithOpenAI(draft, startTime, originName, destName, userType, prefs, vehicle);
    } catch (err) {
      console.warn('AI trip generation failed, using fallback:', err.message);
    }
  }
  if (!trip) trip = buildFallbackTrip(draft, startTime, originName, destName, userType, prefs, vehicle);
  return normalizeTripForSwift(trip, draft);
}

/**
 * Generate trip using OpenAI structured output.
 */
async function generateTripWithOpenAI(draft, startTime, originName, destName, userType, prefs, vehicle) {
  const systemPrompt = `You are a trip-planning assistant for xNovit. Given a trip request, return a valid JSON object that represents the full trip plan. Rules:
- Return ONLY valid JSON, no markdown or extra text.
- Use this exact structure: { "origin": {"id":"uuid","name":"string","address":null,"coordinate":null}, "destination": {...}, "waypoints": [], "tripType": "oneWay"|"roundTrip", "startTime": "ISO8601", "vehicle": null or {...}, "preferences": {...}, "userType": "passenger"|"trucker", "route": {"distanceMiles": number, "durationMinutes": number, "polyline": null, "legs": null}, "restStops": [...], "gasStops": [...], "mealStops": [...], "hotelStops": [...], "weather": [...], "funActivities": null or [...], "estimatedCost": number, "pointsEarned": null }
- For each stop use: {"id":"uuid","type":"restArea"|"gas"|"meal"|"hotel"|"funActivity","name":"string","address":null,"coordinate":null,"etaFromStart":"ISO8601" or null,"distanceFromStartMiles":number,"detourMinutes":number,"metadata":{...}}
- Stop types: restArea, gas, meal, hotel, funActivity. For meal stops include metadata.mealType (breakfast/lunch/dinner), metadata.rating, metadata.priceRange.
- Weather segments: {"id":"uuid","startMile":number,"endMile":number,"condition":"clear"|"rain"|"wind"|"snow"|"lightning","severity":null|"light"|"moderate"|"heavy","expectedAt":"ISO8601"|null}
- Generate realistic rest areas (e.g. "Rest Area - Exit 42"), gas (e.g. "Shell", "Chevron"), meals (IHOP, Cracker Barrel, etc.), and 1 hotel if duration > 8 hours.
- If userType is "trucker", set funActivities to null. Otherwise include 1-2 fun activities (scenic overlook, state park).
- estimatedCost: realistic total for gas + food + lodging (e.g. 65 to 120).
- All dates as ISO 8601 strings. Generate UUIDs for id fields (use format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx).`;

  const userPrompt = `Plan a trip:
Origin: ${originName}
Destination: ${destName}
Leave: ${startTime.toISOString()}
User type: ${userType}
Route preference: ${prefs.routePreference || 'fastest'}
Meal: ${prefs.mealType || 'both'}, Diet: ${prefs.diet || 'any'}, Price: ${prefs.priceRange || 'any'}
Pet-friendly: ${prefs.petFriendly || false}
${vehicle ? `Vehicle: ${vehicle.year} ${vehicle.make} ${vehicle.model}, ${vehicle.fuelType}, highway MPG ${vehicle.highwayMPG}` : 'No vehicle (exploring)'}
Return the complete trip JSON.`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.4
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty AI response');

  const parsed = JSON.parse(raw);
  // Ensure required fields and IDs
  parsed.id = parsed.id || newUuid();
  parsed.origin = { ...parsed.origin, id: parsed.origin?.id || newUuid(), name: parsed.origin?.name || originName };
  parsed.destination = { ...parsed.destination, id: parsed.destination?.id || newUuid(), name: parsed.destination?.name || destName };
  parsed.waypoints = draft.waypoints || [];
  parsed.startTime = parsed.startTime || startTime.toISOString();
  parsed.tripType = draft.tripType || 'oneWay';
  parsed.userType = userType;
  parsed.preferences = draft.preferences || {};
  parsed.vehicle = draft.vehicle ?? null;
  [parsed.restStops, parsed.gasStops, parsed.mealStops, parsed.hotelStops].forEach(arr => {
    if (Array.isArray(arr)) arr.forEach(s => { s.id = s.id || newUuid(); });
  });
  if (Array.isArray(parsed.weather)) parsed.weather.forEach(w => { w.id = w.id || newUuid(); });
  if (Array.isArray(parsed.funActivities)) parsed.funActivities.forEach(s => { s.id = s.id || newUuid(); });
  return parsed;
}

function buildFallbackTrip(draft, startTime, originName, destName, userType, prefs, vehicle) {
  const tripId = newUuid();
  const origin = { id: newUuid(), name: originName, address: null, coordinate: null };
  const destination = { id: newUuid(), name: destName, address: null, coordinate: null };
  const distanceMiles = 280;
  const durationMinutes = 270;

  const route = {
    distanceMiles,
    durationMinutes,
    polyline: null,
    legs: null
  };

  const baseTime = (mins) => new Date(startTime.getTime() + mins * 60 * 1000).toISOString();

  const restStops = [1, 2, 3].map((i) => stopPayload('restArea', `Rest Area - Exit ${20 + i * 35}`, {
    address: `Highway Mile ${70 * i}`,
    etaFromStart: baseTime(90 * i),
    distanceFromStartMiles: 70 * i,
    detourMinutes: 0,
    metadata: { amenities: ['Restroom', 'Vending'], safeScore: 8, isPetFriendly: true }
  }));

  const gasStops = [1, 2].map((i) => stopPayload('gas', `Shell Station ${i}`, {
    address: `Exit ${25 + i * 100}`,
    etaFromStart: baseTime(90 + i * 120),
    distanceFromStartMiles: 120 + i * 90,
    detourMinutes: 3,
    metadata: { fuelPrice: 3.45 + i * 0.1 }
  }));

  const mealStops = [
    stopPayload('meal', 'IHOP', { address: 'Breakfast stop', etaFromStart: baseTime(120), distanceFromStartMiles: 95, detourMinutes: 5, metadata: { mealType: 'breakfast', rating: 4.2, priceRange: 'Budget' } }),
    stopPayload('meal', 'Cracker Barrel', { address: 'Lunch stop', etaFromStart: baseTime(360), distanceFromStartMiles: 210, detourMinutes: 8, metadata: { mealType: 'lunch', rating: 4.5, priceRange: 'Moderate' } })
  ];

  const hotelStops = durationMinutes > 480
    ? [stopPayload('hotel', 'Motel 6', { address: 'Overnight', etaFromStart: baseTime(600), distanceFromStartMiles: 250, detourMinutes: 2, metadata: { priceRange: 'Budget' } })]
    : [];

  const weather = [
    weatherSegmentPayload(0, 80, 'clear', null, baseTime(0)),
    weatherSegmentPayload(80, 150, 'rain', 'light', baseTime(180)),
    weatherSegmentPayload(150, distanceMiles, 'clear', null, baseTime(240))
  ];

  const isTrucker = String(userType || '').toLowerCase().includes('truck');
  let funActivities = null;
  if (!isTrucker) {
    funActivities = [
      stopPayload('funActivity', 'Scenic overlook', { distanceFromStartMiles: 120, detourMinutes: 10 }),
      stopPayload('funActivity', 'State park', { distanceFromStartMiles: 200, detourMinutes: 25 })
    ];
  }

  return {
    id: tripId,
    origin,
    destination,
    waypoints: draft.waypoints || [],
    tripType: draft.tripType || 'oneWay',
    startTime: startTime.toISOString(),
    vehicle: draft.vehicle ?? null,
    preferences: draft.preferences || {},
    userType,
    route,
    restStops,
    gasStops,
    mealStops,
    hotelStops,
    weather,
    funActivities,
    estimatedCost: 85.5,
    pointsEarned: null
  };
}

/**
 * Get nearest rest stops for "I'm tired" flow. Uses AI or fallback.
 */
export async function getNearestRestStops(near) {
  if (openai && (near?.latitude != null || near === 'current')) {
    try {
      const stops = await generateNearestRestWithOpenAI(near);
      return stops;
    } catch (err) {
      console.warn('AI nearest rest failed, using fallback:', err.message);
    }
  }
  return [
    stopPayload('restArea', 'Rest Area - 8 min', { address: 'Exit 42', detourMinutes: 0, metadata: { safeScore: 9 } }),
    stopPayload('restArea', 'Pilot Travel Center - 12 min', { address: 'Exit 45', detourMinutes: 2, metadata: { safeScore: 8 } })
  ];
}

async function generateNearestRestWithOpenAI(near) {
  const loc = typeof near === 'object' && near?.latitude != null
    ? `latitude ${near.latitude}, longitude ${near.longitude}`
    : 'current location (driver on highway)';
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You return a JSON array of 2-4 nearest safe rest stops. Each object: { "id": "uuid", "type": "restArea", "name": "string (include ETA e.g. 8 min)", "address": "string", "coordinate": null, "etaFromStart": null, "distanceFromStartMiles": null, "detourMinutes": number, "metadata": { "safeScore": number } }. Return only the JSON array.' },
      { role: 'user', content: `Nearest safe rest stops from ${loc}. Return JSON array of 2-4 stops.` }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });
  const raw = completion.choices[0]?.message?.content;
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : (parsed.stops || parsed.restStops || []);
  return arr.map((s) => stopPayload('restArea', s.name || 'Rest area', {
    address: s.address ?? null,
    detourMinutes: s.detourMinutes ?? 0,
    metadata: s.metadata || { safeScore: 8 }
  }));
}

/**
 * Emergency: nearest hospital, tow, police. AI or fallback.
 */
export async function getEmergencyNearby(lat, lon) {
  if (openai && lat != null && lon != null) {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Return JSON: { "hospitals": [{ "name", "address", "distanceMinutes" }], "tows": [{ "name", "address", "phone", "distanceMinutes" }], "police": [{ "name", "address", "phone" }] }. 2-3 items each. Realistic names.' },
            { role: 'user', content: `Nearest hospital, tow truck, and police at ${lat}, ${lon}. Return JSON only.` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });
      const raw = completion.choices[0]?.message?.content;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('AI emergency failed:', err.message);
    }
  }
  return {
    hospitals: [{ name: 'Nearest Hospital', address: 'Highway 45, 12 mi', distanceMinutes: 15 }],
    tows: [{ name: 'Roadside Assistance', address: '8 mi', phone: '1-800-XXX-XXXX', distanceMinutes: 12 }],
    police: [{ name: 'State Patrol', phone: '911' }]
  };
}

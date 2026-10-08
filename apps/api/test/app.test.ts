import type { TripRequestInput } from '@xnovit/core';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';

const app = createApp();

const tripRequest: TripRequestInput = {
  origin: { name: 'College Station, TX', lat: 30.628, lng: -96.3344 },
  destination: { name: 'Dallas, TX', lat: 32.7767, lng: -96.797 },
  departAt: '2026-11-25T10:00:00-06:00',
  vehicle: { fuel: 'gas' },
  party: { adults: 2, drivers: 2, children: [], dogs: 0, mealStyle: 'fast' },
  hotelBreakfastCountsAsBreakfast: false,
};

describe('GET /api/v1/health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'xnovit-api', apiVersion: 'v1' });
  });

  it('does not advertise Express', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

describe('removed routes that served invented data', () => {
  it.each([
    ['post', '/api/trips/calculate'],
    ['get', '/api/trips'],
    ['post', '/api/stops/nearest-rest'],
    ['get', '/api/stops/nearest-rest'],
    ['post', '/api/emergency/nearby'],
    ['get', '/api/rewards/balance'],
    ['post', '/api/auth/login'],
    ['get', '/health'],
  ] as const)('%s %s is gone', async (method, path) => {
    const res = await request(app)[method](path);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found', message: expect.any(String) });
  });
});

describe('POST /api/v1/plans', () => {
  it('rejects an invalid request with the issues listed', async () => {
    const res = await request(app)
      .post('/api/v1/plans')
      .send({ ...tripRequest, departAt: 'tomorrow' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
    expect(res.body.issues).toEqual([{ path: 'departAt', message: expect.any(String) }]);
  });

  it('rejects a missing body', async () => {
    const res = await request(app).post('/api/v1/plans');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_request');
  });

  it('rejects malformed JSON', async () => {
    const res = await request(app)
      .post('/api/v1/plans')
      .set('content-type', 'application/json')
      .send('{"origin":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_json', message: expect.any(String) });
  });

  it('answers 501 with no plan until the scheduler exists (M1)', async () => {
    const res = await request(app).post('/api/v1/plans').send(tripRequest);
    expect(res.status).toBe(501);
    expect(res.body).toEqual({ error: 'not_implemented', message: expect.stringContaining('M1') });
  });
});

describe('endpoints not built yet answer 501 after validating input', () => {
  const at = '2026-11-25T15:30:00-06:00';
  const { departAt: _omitted, ...suggestionRequest } = tripRequest;

  it.each([
    [
      'post',
      '/api/v1/plans/departure-options',
      {
        request: suggestionRequest,
        window: { from: '2026-11-25T04:00:00-06:00', to: '2026-11-25T09:00:00-06:00' },
      },
    ],
    ['get', '/api/v1/plans/trip-1', undefined],
    ['post', '/api/v1/plans/trip-1/replan', { location: { lat: 31, lng: -97 }, at }],
    ['post', '/api/v1/plans/trip-1/items/item-1', { status: 'done' }],
    ['post', '/api/v1/plans/trip-1/events', { events: [{ type: 'plan_viewed', at }] }],
    ['post', '/api/v1/plans/trip-1/share', { action: 'create' }],
  ] as const)('%s %s', async (method, path, body) => {
    const res = await request(app)[method](path).send(body);
    expect(res.status).toBe(501);
    expect(res.body.error).toBe('not_implemented');
  });

  it.each([
    '/api/v1/plans/departure-options',
    '/api/v1/plans/trip-1/replan',
    '/api/v1/plans/trip-1/items/item-1',
    '/api/v1/plans/trip-1/events',
    '/api/v1/plans/trip-1/share',
  ])('POST %s rejects an empty body', async (path) => {
    const res = await request(app).post(path).send({});
    expect(res.status).toBe(400);
  });
});

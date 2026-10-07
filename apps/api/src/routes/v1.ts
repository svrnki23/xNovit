/**
 * The v1 API (build brief, section 6). An endpoint that isn't built yet answers 501 instead
 * of returning placeholder data. Its input is still validated against the core schemas, so
 * the shared contract is exercised end to end.
 */
import {
  CreatePlanRequestSchema,
  DepartureOptionsRequestSchema,
  LogEventsRequestSchema,
  ReplanRequestSchema,
  ShareRequestSchema,
  UpdateItemRequestSchema,
} from '@xnovit/core';
import { Router, type RequestHandler } from 'express';
import { sendError, validateBody } from '../lib/http';

function notBuiltYet(milestone: string): RequestHandler {
  return (_req, res) => {
    sendError(
      res,
      501,
      'not_implemented',
      `This endpoint is planned for ${milestone}. Until then it returns no data rather than made-up data.`,
    );
  };
}

export function v1Router(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'xnovit-api', apiVersion: 'v1' });
  });

  router.post('/plans', validateBody(CreatePlanRequestSchema), notBuiltYet('M1'));
  router.post(
    '/plans/departure-options',
    validateBody(DepartureOptionsRequestSchema),
    notBuiltYet('M1'),
  );
  router.get('/plans/:tripId', notBuiltYet('M3'));
  router.post('/plans/:tripId/replan', validateBody(ReplanRequestSchema), notBuiltYet('M4'));
  router.post(
    '/plans/:tripId/items/:itemId',
    validateBody(UpdateItemRequestSchema),
    notBuiltYet('M4'),
  );
  router.post('/plans/:tripId/events', validateBody(LogEventsRequestSchema), notBuiltYet('M4'));
  router.post('/plans/:tripId/share', validateBody(ShareRequestSchema), notBuiltYet('M3'));

  return router;
}

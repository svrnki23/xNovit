import cors from 'cors';
import express, { type ErrorRequestHandler, type Express } from 'express';
import { sendError } from './lib/http';
import { v1Router } from './routes/v1';

export function createApp(): Express {
  const app = express();
  app.disable('x-powered-by');

  // Open to any origin for now. Restrict to the share page's origin once it has a domain (M3).
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1', v1Router());

  app.use((req, res) => {
    sendError(res, 404, 'not_found', `No route for ${req.method} ${req.path}.`);
  });
  app.use(errorHandler);

  return app;
}

/** Errors raised by express.json() carry a `type` from the body-parser package. */
function bodyParserErrorType(error: unknown): string | undefined {
  if (typeof error === 'object' && error !== null && 'type' in error) {
    return typeof error.type === 'string' ? error.type : undefined;
  }
  return undefined;
}

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  switch (bodyParserErrorType(error)) {
    case 'entity.parse.failed':
      sendError(res, 400, 'invalid_json', 'The request body is not valid JSON.');
      return;
    case 'entity.too.large':
      sendError(res, 413, 'payload_too_large', 'The request body is too large.');
      return;
  }
  console.error(error);
  sendError(res, 500, 'internal_error', 'Something went wrong on our side.');
};

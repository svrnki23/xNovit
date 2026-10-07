import type { RequestHandler, Response } from 'express';
import type { z } from 'zod';

/** Every error response has this shape (build brief, section 6). Errors never come with fake data. */
export interface ApiError {
  error: string;
  message: string;
  issues?: { path: string; message: string }[];
}

export function sendError(
  res: Response,
  status: number,
  error: string,
  message: string,
  issues?: ApiError['issues'],
): void {
  const body: ApiError = issues ? { error, message, issues } : { error, message };
  res.status(status).json(body);
}

/** Validate the JSON body against a core schema. The parsed value is stored in `res.locals.body`. */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        path: issue.path.map(String).join('.'),
        message: issue.message,
      }));
      sendError(res, 400, 'invalid_request', 'The request body is invalid.', issues);
      return;
    }
    res.locals.body = result.data;
    next();
  };
}

import type { ErrorRequestHandler } from 'express';
import { ZodError, z } from 'zod';
import { HttpError } from '../lib/errors.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ message: 'Invalid request body', errors: z.flattenError(err).fieldErrors });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Internal Server Error' });
};

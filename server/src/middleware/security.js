import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { forbidden } from '../utils/httpError.js';

export const corsMiddleware = cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || env.clientOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    return callback(forbidden('Origin not allowed by CORS'));
  },
});

export function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please wait 15 minutes and try again.' },
  });
}

export function createApiLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many requests. Please slow down.' },
  });
}

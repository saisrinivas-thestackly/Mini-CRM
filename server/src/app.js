import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { requireAuth } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { corsMiddleware, createApiLimiter, createAuthLimiter, createRegisterLimiter } from './middleware/security.js';
import { activitiesRouter, dealActivitiesRouter } from './routes/activities.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { calendarRouter } from './routes/calendar.routes.js';
import { customersRouter } from './routes/customers.routes.js';
import { dashboardRouter } from './routes/dashboard.routes.js';
import { dealsRouter } from './routes/deals.routes.js';
import { tasksRouter } from './routes/tasks.routes.js';

morgan.token('path', (req) => req.originalUrl.split('?')[0]);
const LOG_FORMAT = ':remote-addr :method :path :status :res[content-length] - :response-time ms';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json({ limit: '2mb' }));
  app.use(cookieParser());
  if (!env.isTest) app.use(morgan(LOG_FORMAT));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  const authLimiter = createAuthLimiter();
  app.use('/api', createApiLimiter());
  app.use('/api/auth', authRouter({ authLimiter, registerLimiter: createRegisterLimiter() }));

  app.use('/api/customers', requireAuth, customersRouter);
  app.use('/api/deals/:id/activities', requireAuth, dealActivitiesRouter);
  app.use('/api/deals', requireAuth, dealsRouter);
  app.use('/api/activities', requireAuth, activitiesRouter);
  app.use('/api/tasks', requireAuth, tasksRouter);
  app.use('/api/dashboard', requireAuth, dashboardRouter);
  app.use('/api/calendar', requireAuth, calendarRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env, isTest } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import { createLimiter } from './middleware/rateLimit';
import { authRouter } from './modules/auth/auth.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { coursesRouter } from './modules/courses/courses.routes';
import { dashboardRouter } from './modules/dashboard/dashboard.routes';
import { enrollmentsRouter } from './modules/enrollments/enrollments.routes';
import { lessonsRouter } from './modules/lessons/lessons.routes';
import { usersRouter } from './modules/users/users.routes';

/**
 * Builds the Express app without starting a server, so tests can import it directly.
 * Middleware order matters: security/parsing first, routes, then 404, then the error handler last.
 */
export const createApp = () => {
  const app = express();

  if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN.split(','), credentials: true }));
  // Small body limit: every payload here is tiny JSON, so large bodies are rejected early.
  app.use(cookieParser()); // makes the session cookie available as req.cookies
  app.use(express.json({ limit: '100kb' }));
  if (!isTest) app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // All feature routers live under a versioned prefix so the contract can evolve (/api/v2) later.
  const api = express.Router();
  api.use(createLimiter(600)); // generous global ceiling against scraping and floods
  api.use('/auth', authRouter);
  api.use('/categories', categoriesRouter);
  api.use('/courses', coursesRouter);
  api.use('/lessons', lessonsRouter);
  api.use('/enrollments', enrollmentsRouter);
  api.use('/dashboard', dashboardRouter);
  api.use('/users', usersRouter);
  app.use('/api/v1', api);

  app.use(notFound);
  app.use(errorHandler);
  return app;
};

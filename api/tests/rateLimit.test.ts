import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createLimiter } from '../src/middleware/rateLimit';

/** A tiny app: /ok always succeeds, /wrong always fails like a wrong password. */
const makeApp = (limit: number, windowMs: number) => {
  const limiter = createLimiter(limit, windowMs, {
    failuresOnly: true,
    message: 'Too many failed attempts.',
    enforceInTests: true,
  });
  const app = express();
  app.post('/ok', limiter, (_req, res) => void res.status(200).json({ ok: true }));
  app.post('/wrong', limiter, (_req, res) => void res.status(401).json({ ok: false }));
  return app;
};

describe('failed-attempt limiter', () => {
  it('allows 5 wrong attempts, then blocks the 6th with a message that says how long to wait', async () => {
    const app = makeApp(5, 15 * 60_000);
    for (let i = 0; i < 5; i++) expect((await request(app).post('/wrong')).status).toBe(401);

    const blocked = await request(app).post('/wrong');
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.body.message ?? blocked.body.error.message).toMatch(
      /^Too many failed attempts\. Try again in 15 minutes\.$/,
    );
    // Even the right password is refused while blocked.
    expect((await request(app).post('/ok')).status).toBe(429);
  });

  it('only counts failures: successful requests never use up the allowance', async () => {
    const app = makeApp(5, 15 * 60_000);
    for (let i = 0; i < 12; i++) expect((await request(app).post('/ok')).status).toBe(200);
    for (let i = 0; i < 5; i++) expect((await request(app).post('/wrong')).status).toBe(401);
    expect((await request(app).post('/wrong')).status).toBe(429);
  });

  it('starts counting again once the time is up', async () => {
    const app = makeApp(2, 400);
    await request(app).post('/wrong');
    await request(app).post('/wrong');
    expect((await request(app).post('/wrong')).status).toBe(429);

    await new Promise((resolve) => setTimeout(resolve, 600));
    expect((await request(app).post('/wrong')).status).toBe(401);
    expect((await request(app).post('/ok')).status).toBe(200);
  });

  it('is off in the test suite unless a test turns it on', async () => {
    const off = createLimiter(1, 60_000, { failuresOnly: true });
    const app = express();
    app.post('/wrong', off, (_req, res) => void res.status(401).json({}));
    for (let i = 0; i < 4; i++) expect((await request(app).post('/wrong')).status).toBe(401);
  });
});

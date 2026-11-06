import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, cookieHeader, createUser } from './helpers';

const secret = process.env.JWT_SECRET!;

describe('token security', () => {
  it('rejects a token for a user that has been deleted', async () => {
    const { user, auth } = await createUser('LEARNER');
    expect((await api().get('/api/v1/auth/me').set(auth)).status).toBe(200);

    await prisma.user.delete({ where: { id: user.id } });

    expect((await api().get('/api/v1/auth/me').set(auth)).status).toBe(401);
    expect((await api().get('/api/v1/enrollments/me').set(auth)).status).toBe(401);
  });

  it('applies a role change immediately, without waiting for the token to expire', async () => {
    const { user, auth } = await createUser('ADMIN');
    expect((await api().get('/api/v1/dashboard/admin').set(auth)).status).toBe(200);

    await prisma.user.update({ where: { id: user.id }, data: { role: 'LEARNER' } });

    expect((await api().get('/api/v1/dashboard/admin').set(auth)).status).toBe(403);
  });

  it('rejects tokens signed with a different algorithm, a wrong secret, or no signature', async () => {
    const { user } = await createUser('LEARNER');

    const hs512 = jwt.sign({ sub: user.id, ver: 0 }, secret, { algorithm: 'HS512' });
    const wrongSecret = jwt.sign({ sub: user.id, ver: 0 }, 'x'.repeat(40));
    const unsigned = jwt.sign({ sub: user.id, ver: 0 }, '', { algorithm: 'none' });

    for (const token of [hs512, wrongSecret, unsigned]) {
      expect((await api().get('/api/v1/auth/me').set(cookieHeader(token))).status).toBe(401);
    }
  });

  it('rejects expired tokens and tokens without a subject', async () => {
    const { user } = await createUser('LEARNER');

    const expired = jwt.sign({ sub: user.id, ver: 0 }, secret, { algorithm: 'HS256', expiresIn: -10 });
    const noSubject = jwt.sign({ hello: 'world' }, secret, { algorithm: 'HS256' });

    expect((await api().get('/api/v1/auth/me').set(cookieHeader(expired))).status).toBe(401);
    expect((await api().get('/api/v1/auth/me').set(cookieHeader(noSubject))).status).toBe(401);
  });

  it('treats an invalid token on a public route as anonymous instead of failing', async () => {
    const res = await api().get('/api/v1/courses').set(cookieHeader('garbage'));
    expect(res.status).toBe(200);
  });

  it('sets standard security headers', async () => {
    const res = await api().get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

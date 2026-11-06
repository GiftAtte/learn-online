import { describe, expect, it } from 'vitest';
import { api, cookieHeader, createUser, PASSWORD } from './helpers';

const valid = { name: 'New Learner', email: 'New@Test.dev', password: PASSWORD };

describe('auth', () => {
  it('registers a learner, normalises email and never leaks the hash', async () => {
    const res = await api().post('/api/v1/auth/register').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ email: 'new@test.dev', role: 'LEARNER' });
    expect(res.body.data.user.passwordHash).toBeUndefined();
    // The token is never in the body; it travels in an httpOnly cookie JavaScript cannot read.
    expect(res.body.data.token).toBeUndefined();
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/^session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
  });

  it('ignores a client-supplied role (no privilege escalation)', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ ...valid, role: 'ADMIN' });
    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('LEARNER');
  });

  it('rejects duplicate emails with 409', async () => {
    await api().post('/api/v1/auth/register').send(valid);
    const res = await api().post('/api/v1/auth/register').send(valid);
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, error: { code: 'CONFLICT' } });
  });

  it('validates input and lists field errors', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ name: 'x', email: 'nope', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const paths = res.body.error.details.map((d: { path: string }) => d.path);
    expect(paths).toEqual(expect.arrayContaining(['name', 'email', 'password']));
  });

  it('logs in with correct credentials and rejects wrong ones identically', async () => {
    await createUser('LEARNER', 'a@test.dev');
    const good = await api().post('/api/v1/auth/login').send({ email: 'a@test.dev', password: PASSWORD });
    expect(good.status).toBe(200);

    const badPass = await api()
      .post('/api/v1/auth/login')
      .send({ email: 'a@test.dev', password: 'wrongpass1' });
    const badUser = await api().post('/api/v1/auth/login').send({ email: 'x@test.dev', password: PASSWORD });
    expect(badPass.status).toBe(401);
    expect(badUser.status).toBe(401);
    expect(badPass.body.error.message).toBe(badUser.body.error.message);
  });

  it('protects /me', async () => {
    expect((await api().get('/api/v1/auth/me')).status).toBe(401);
    expect((await api().get('/api/v1/auth/me').set(cookieHeader('garbage'))).status).toBe(401);

    const { auth } = await createUser();
    const res = await api().get('/api/v1/auth/me').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe('learner@test.dev');
  });

  it('returns the standard error shape for unknown routes and bad JSON', async () => {
    const missing = await api().get('/api/v1/nope');
    expect(missing.status).toBe(404);
    expect(missing.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });

    const bad = await api().post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{oops');
    expect(bad.status).toBe(400);
    expect(bad.body.success).toBe(false);
  });
});

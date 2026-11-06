import { describe, expect, it } from 'vitest';
import { api, cookieHeader, createUser, PASSWORD, tokenFrom } from './helpers';

const NEW_PASSWORD = 'Brandnew123';

describe('profile', () => {
  it('lets you change your own name, and nothing else', async () => {
    const { user, auth } = await createUser('LEARNER');
    const res = await api()
      .patch('/api/v1/auth/me')
      .set(auth)
      .send({ name: 'Renamed Person', role: 'ADMIN', email: 'other@test.dev' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ name: 'Renamed Person', role: 'LEARNER', email: user.email });
    expect((await api().patch('/api/v1/auth/me').send({ name: 'No Token' })).status).toBe(401);
    expect((await api().patch('/api/v1/auth/me').set(auth).send({ name: 'A' })).status).toBe(400);
  });
});

describe('change password', () => {
  it('needs the current password, signs other sessions out, and keeps this one', async () => {
    const { user, auth: other } = await createUser('LEARNER');
    const login = await api().post('/api/v1/auth/login').send({ email: user.email, password: PASSWORD });
    const here = cookieHeader(tokenFrom(login));

    const res = await api()
      .post('/api/v1/auth/change-password')
      .set(here)
      .send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
    expect(res.status).toBe(204);

    // This browser got a fresh token; the older session elsewhere no longer works.
    const fresh = cookieHeader(tokenFrom(res));
    expect((await api().get('/api/v1/auth/me').set(fresh)).status).toBe(200);
    expect((await api().get('/api/v1/auth/me').set(other)).status).toBe(401);

    // Sign-in now needs the new password.
    expect((await api().post('/api/v1/auth/login').send({ email: user.email, password: PASSWORD })).status).toBe(401);
    expect(
      (await api().post('/api/v1/auth/login').send({ email: user.email, password: NEW_PASSWORD })).status,
    ).toBe(200);
  });

  it('refuses a wrong current password with a 400 on that field (not a 401)', async () => {
    const { auth } = await createUser('LEARNER');
    const res = await api()
      .post('/api/v1/auth/change-password')
      .set(auth)
      .send({ currentPassword: 'Wrong12345', newPassword: NEW_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('currentPassword');
    // The session is still valid.
    expect((await api().get('/api/v1/auth/me').set(auth)).status).toBe(200);
  });

  it('applies the sign-up password rules and rejects an unchanged password', async () => {
    const { auth } = await createUser('LEARNER');
    const change = (newPassword: string) =>
      api().post('/api/v1/auth/change-password').set(auth).send({ currentPassword: PASSWORD, newPassword });
    expect((await change('short1')).status).toBe(400);
    expect((await change('nodigitshere')).status).toBe(400);
    expect((await change(PASSWORD)).status).toBe(400);
    expect(
      (await api().post('/api/v1/auth/change-password').send({ currentPassword: PASSWORD, newPassword: NEW_PASSWORD })).status,
    ).toBe(401);
  });
});

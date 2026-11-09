import { beforeEach, describe, expect, it } from 'vitest';
import { outbox } from '../src/modules/mail/mailer';
import { api, cookieHeader, createUser, PASSWORD, tokenFrom } from './helpers';

const NEW_PASSWORD = 'BrandNew123';

const cookiesOf = (res: { headers: Record<string, unknown> }) =>
  ([] as string[]).concat((res.headers['set-cookie'] as string[] | string | undefined) ?? []);
const refreshFrom = (res: { headers: Record<string, unknown> }) =>
  cookiesOf(res)
    .find((c) => c.startsWith('refresh='))
    ?.split(';')[0]
    ?.slice('refresh='.length) ?? '';
const refreshHeader = (value: string) => ({ Cookie: `refresh=${value}` });
/** The reset token inside the link of the last email sent. */
const lastResetToken = () =>
  decodeURIComponent(outbox.at(-1)?.text.match(/token=([^\s]+)/)?.[1] ?? '').replace(/[.]$/, '');

beforeEach(() => {
  outbox.length = 0;
});

describe('password reset', () => {
  it('emails a link, sets the new password once, and ends old sessions', async () => {
    const { user, auth } = await createUser('LEARNER', 'reset@test.dev');

    const asked = await api().post('/api/v1/auth/forgot-password').send({ email: 'reset@test.dev' });
    expect(asked.status).toBe(204);
    expect(outbox).toHaveLength(1);
    expect(outbox[0]!.to).toBe('reset@test.dev');
    const token = lastResetToken();
    expect(token.length).toBeGreaterThan(20);

    const done = await api().post('/api/v1/auth/reset-password').send({ token, password: NEW_PASSWORD });
    expect(done.status).toBe(204);

    // The old session is cut off, the old password no longer works, the new one does.
    expect((await api().get('/api/v1/auth/me').set(auth)).status).toBe(401);
    expect(
      (await api().post('/api/v1/auth/login').send({ email: user.email, password: PASSWORD })).status,
    ).toBe(401);
    expect(
      (await api().post('/api/v1/auth/login').send({ email: user.email, password: NEW_PASSWORD })).status,
    ).toBe(200);

    // The link works once.
    const again = await api().post('/api/v1/auth/reset-password').send({ token, password: 'Another123x' });
    expect(again.status).toBe(400);
  });

  it('answers the same for unknown emails and sends nothing', async () => {
    const res = await api().post('/api/v1/auth/forgot-password').send({ email: 'nobody@test.dev' });
    expect(res.status).toBe(204);
    expect(outbox).toHaveLength(0);
  });

  it('rejects a made-up token and a weak new password', async () => {
    const fake = await api()
      .post('/api/v1/auth/reset-password')
      .send({ token: 'a'.repeat(64), password: NEW_PASSWORD });
    expect(fake.status).toBe(400);

    await createUser('LEARNER', 'weak@test.dev');
    await api().post('/api/v1/auth/forgot-password').send({ email: 'weak@test.dev' });
    const weak = await api()
      .post('/api/v1/auth/reset-password')
      .send({ token: lastResetToken(), password: 'short' });
    expect(weak.status).toBe(400);
  });

  it('only the newest link works', async () => {
    await createUser('LEARNER', 'two@test.dev');
    await api().post('/api/v1/auth/forgot-password').send({ email: 'two@test.dev' });
    const first = lastResetToken();
    await api().post('/api/v1/auth/forgot-password').send({ email: 'two@test.dev' });
    const second = lastResetToken();

    expect(
      (await api().post('/api/v1/auth/reset-password').send({ token: first, password: NEW_PASSWORD })).status,
    ).toBe(400);
    expect(
      (await api().post('/api/v1/auth/reset-password').send({ token: second, password: NEW_PASSWORD }))
        .status,
    ).toBe(204);
  });
});

describe('refresh tokens', () => {
  const signIn = async () => {
    await createUser('LEARNER', 'r@test.dev');
    return api().post('/api/v1/auth/login').send({ email: 'r@test.dev', password: PASSWORD });
  };

  it('sets a refresh cookie that is httpOnly and limited to the auth endpoints', async () => {
    const res = await signIn();
    const cookie = cookiesOf(res).find((c) => c.startsWith('refresh='))!;
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Strict/i);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/i);
    expect(cookie).toMatch(/Max-Age=/i);
  });

  it('trades a refresh token for a new session, and the old one cannot be used again', async () => {
    const first = refreshFrom(await signIn());
    const res = await api().post('/api/v1/auth/refresh').set(refreshHeader(first));
    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('r@test.dev');
    const next = refreshFrom(res);
    expect(next).not.toBe('');
    expect(next).not.toBe(first);
    // The new access token works.
    expect(
      (
        await api()
          .get('/api/v1/auth/me')
          .set(cookieHeader(tokenFrom(res)))
      ).status,
    ).toBe(200);

    // Reusing the first one is treated as theft: it fails, and the new one is revoked too.
    expect((await api().post('/api/v1/auth/refresh').set(refreshHeader(first))).status).toBe(401);
    expect((await api().post('/api/v1/auth/refresh').set(refreshHeader(next))).status).toBe(401);
    expect(
      (
        await api()
          .get('/api/v1/auth/me')
          .set(cookieHeader(tokenFrom(res)))
      ).status,
    ).toBe(401);
  });

  it('rejects a missing or made-up refresh token', async () => {
    expect((await api().post('/api/v1/auth/refresh')).status).toBe(401);
    expect((await api().post('/api/v1/auth/refresh').set(refreshHeader('nope'))).status).toBe(401);
  });

  it('signing out ends the refresh token', async () => {
    const login = await signIn();
    const refresh = refreshFrom(login);
    const out = await api()
      .post('/api/v1/auth/logout')
      .set({ Cookie: `session=${tokenFrom(login)}; refresh=${refresh}` });
    expect(out.status).toBe(204);
    expect((await api().post('/api/v1/auth/refresh').set(refreshHeader(refresh))).status).toBe(401);
  });
});

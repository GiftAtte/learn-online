import { describe, expect, it } from 'vitest';
import { api, createUser } from './helpers';

const URL = '/api/v1/settings';

const valid = {
  appName: 'Brightpath',
  tagline: 'Learn daily',
  logoUrl: 'https://x.test/logo.png',
  supportEmail: 'help@x.test',
  imageMaxMegabytes: 5,
  videoMaxMegabytes: 50,
  imageFormats: ['png', 'webp'],
  videoFormats: ['mp4'],
  allowSignups: true,
};

describe('application settings', () => {
  it('are readable by anyone, with defaults before they are ever saved', async () => {
    const res = await api().get(URL);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      appName: 'LearnOnline',
      tagline: null,
      logoUrl: null,
      imageMaxMegabytes: 10,
      videoMaxMegabytes: 100,
      imageFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      videoFormats: ['mp4', 'webm', 'mov'],
      allowSignups: true,
    });
  });

  it('can be changed by an administrator, and blank optional fields clear', async () => {
    const admin = await createUser('ADMIN');
    const save = await api().put(URL).set(admin.auth).send(valid);
    expect(save.status).toBe(200);
    expect((await api().get(URL)).body.data).toMatchObject(valid);

    const cleared = await api()
      .put(URL)
      .set(admin.auth)
      .send({ ...valid, tagline: '', logoUrl: '', supportEmail: '' });
    expect(cleared.body.data).toMatchObject({ tagline: null, logoUrl: null, supportEmail: null });
  });

  it('rejects learners, guests and invalid values', async () => {
    const admin = await createUser('ADMIN');
    const learner = await createUser('LEARNER');
    expect((await api().put(URL).send(valid)).status).toBe(401);
    expect((await api().put(URL).set(learner.auth).send(valid)).status).toBe(403);
    const bad = (patch: object) =>
      api()
        .put(URL)
        .set(admin.auth)
        .send({ ...valid, ...patch });
    expect((await bad({ appName: 'A' })).status).toBe(400);
    expect((await bad({ logoUrl: 'javascript:alert(1)' })).status).toBe(400);
    expect((await bad({ imageMaxMegabytes: 0 })).status).toBe(400);
    expect((await bad({ videoMaxMegabytes: 5000 })).status).toBe(400);
    expect((await bad({ imageFormats: [] })).status).toBe(400);
    expect((await bad({ videoFormats: ['exe'] })).status).toBe(400);
  });
});

describe('closing sign-ups', () => {
  const account = { name: 'New Person', email: 'new.person@test.dev', password: 'Passw0rdTest' };

  it('stops new accounts, but not people who already have one', async () => {
    const admin = await createUser('ADMIN');
    await api()
      .put(URL)
      .set(admin.auth)
      .send({ ...valid, allowSignups: false });

    const blocked = await api().post('/api/v1/auth/register').send(account);
    expect(blocked.status).toBe(403);
    expect(blocked.body.error.message).toMatch(/closed/i);
    const signIn = await api()
      .post('/api/v1/auth/login')
      .send({ email: admin.user.email, password: 'Passw0rdTest' });
    expect(signIn.status).toBe(200);

    await api()
      .put(URL)
      .set(admin.auth)
      .send({ ...valid, allowSignups: true });
    expect((await api().post('/api/v1/auth/register').send(account)).status).toBe(201);
  });
});

import { describe, expect, it } from 'vitest';
import { api, cookieHeader, createCourse, createLesson, createUser, tokenFrom } from './helpers';

describe('sign out', () => {
  it('revokes the token that signed out, and every older one, but not a fresh sign-in', async () => {
    const { user, auth } = await createUser('LEARNER');
    expect((await api().get('/api/v1/auth/me').set(auth)).status).toBe(200);

    const out = await api().post('/api/v1/auth/logout').set(auth);
    expect(out.status).toBe(204);
    expect(String(out.headers['set-cookie'])).toMatch(/session=;/); // the browser is told to delete it

    expect((await api().get('/api/v1/auth/me').set(auth)).status).toBe(401);
    const again = await api()
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'Passw0rdTest' });
    const fresh = cookieHeader(tokenFrom(again));
    expect((await api().get('/api/v1/auth/me').set(fresh)).status).toBe(200);
  });

  it('requires a token to sign out', async () => {
    expect((await api().post('/api/v1/auth/logout')).status).toBe(401);
  });
});

describe('role management', () => {
  it('lets an admin promote and demote another user', async () => {
    const admin = await createUser('ADMIN');
    const learner = await createUser('LEARNER');
    const url = `/api/v1/users/${learner.user.id}/role`;

    const promoted = await api().patch(url).set(admin.auth).send({ role: 'ADMIN' });
    expect(promoted.status).toBe(200);
    expect(promoted.body.data.role).toBe('ADMIN');
    expect((await api().get('/api/v1/dashboard/admin').set(learner.auth)).status).toBe(200);

    const demoted = await api().patch(url).set(admin.auth).send({ role: 'LEARNER' });
    expect(demoted.body.data.role).toBe('LEARNER');
  });

  it('forbids learners, guests, self-changes and unknown roles or users', async () => {
    const admin = await createUser('ADMIN');
    const learner = await createUser('LEARNER');
    const url = (id: string) => `/api/v1/users/${id}/role`;

    expect((await api().patch(url(admin.user.id)).send({ role: 'LEARNER' })).status).toBe(401);
    expect((await api().patch(url(admin.user.id)).set(learner.auth).send({ role: 'LEARNER' })).status).toBe(
      403,
    );
    // Admins can't change their own role, so there is always at least one administrator.
    expect((await api().patch(url(admin.user.id)).set(admin.auth).send({ role: 'LEARNER' })).status).toBe(
      403,
    );
    expect((await api().patch(url(learner.user.id)).set(admin.auth).send({ role: 'OWNER' })).status).toBe(
      400,
    );
    expect(
      (await api().patch(url('00000000-0000-4000-8000-000000000000')).set(admin.auth).send({ role: 'ADMIN' }))
        .status,
    ).toBe(404);
  });
});

describe('admin learner detail', () => {
  it('shows lesson-by-lesson progress for each enrolled course', async () => {
    const admin = await createUser('ADMIN');
    const learner = await createUser('LEARNER');
    const course = await createCourse();
    const l1 = await createLesson(course.id, 1, 100);
    await createLesson(course.id, 2, 200);
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    await api()
      .put(`/api/v1/lessons/${l1.id}/progress`)
      .set(learner.auth)
      .send({ positionSeconds: 100, completed: true });

    const res = await api().get(`/api/v1/dashboard/admin/learners/${learner.user.id}`).set(admin.auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: learner.user.id,
      summary: { enrolledCourses: 1, completedLessons: 1 },
    });
    const [detail] = res.body.data.courses;
    expect(detail).toMatchObject({ lessonCount: 2, completedLessons: 1, progressPercent: 50 });
    expect(detail.lessons.map((l: { completed: boolean }) => l.completed)).toEqual([true, false]);
  });

  it('is admin-only and 404s for an unknown learner', async () => {
    const admin = await createUser('ADMIN');
    const learner = await createUser('LEARNER');
    const url = `/api/v1/dashboard/admin/learners/${learner.user.id}`;
    expect((await api().get(url).set(learner.auth)).status).toBe(403);
    expect((await api().get(url)).status).toBe(401);
    expect(
      (
        await api()
          .get('/api/v1/dashboard/admin/learners/00000000-0000-4000-8000-000000000000')
          .set(admin.auth)
      ).status,
    ).toBe(404);
    expect((await api().get('/api/v1/dashboard/admin/learners/not-a-uuid').set(admin.auth)).status).toBe(400);
  });
});

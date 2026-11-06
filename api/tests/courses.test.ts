import { describe, expect, it } from 'vitest';
import { api, createCategory, createCourse, createLesson, createUser } from './helpers';

/** A valid create-course payload; the category must exist, so it is created on demand. */
const validBody = async () => ({
  title: 'Intro to Testing',
  description: 'Learn how to test software properly.',
  categoryId: (await createCategory()).id,
});

describe('course management & access control', () => {
  it('lets only admins create, update and delete courses', async () => {
    const learner = await createUser('LEARNER');
    const admin = await createUser('ADMIN');
    const body = await validBody();

    expect((await api().post('/api/v1/courses').send(body)).status).toBe(401);
    expect((await api().post('/api/v1/courses').set(learner.auth).send(body)).status).toBe(403);

    const created = await api().post('/api/v1/courses').set(admin.auth).send(body);
    expect(created.status).toBe(201);
    const id = created.body.data.id;
    expect(created.body.data.published).toBe(false);
    expect(created.body.data.category).toMatchObject({ id: body.categoryId, name: 'Programming' });

    expect(
      (await api().patch(`/api/v1/courses/${id}`).set(learner.auth).send({ title: 'Hacked' })).status,
    ).toBe(403);
    const patched = await api()
      .patch(`/api/v1/courses/${id}`)
      .set(admin.auth)
      .send({ title: 'Renamed course' });
    expect(patched.body.data.title).toBe('Renamed course');

    expect((await api().delete(`/api/v1/courses/${id}`).set(learner.auth)).status).toBe(403);
    expect((await api().delete(`/api/v1/courses/${id}`).set(admin.auth)).status).toBe(204);
    expect((await api().get(`/api/v1/courses/${id}`).set(admin.auth)).status).toBe(404);
  });

  it('validates course input', async () => {
    const admin = await createUser('ADMIN');
    const res = await api()
      .post('/api/v1/courses')
      .set(admin.auth)
      .send({ ...(await validBody()), title: 'a', thumbnailUrl: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');

    // A well-formed id that doesn't match any category is rejected with a clear 400.
    const noCategory = await api()
      .post('/api/v1/courses')
      .set(admin.auth)
      .send({ ...(await validBody()), categoryId: '00000000-0000-4000-8000-000000000000' });
    expect(noCategory.status).toBe(400);
    expect(noCategory.body.error.message).toBe('Category does not exist');

    const empty = await api()
      .patch('/api/v1/courses/00000000-0000-4000-8000-000000000000')
      .set(admin.auth)
      .send({});
    expect(empty.status).toBe(400);
    expect((await api().get('/api/v1/courses/not-a-uuid')).status).toBe(400);
  });

  it('refuses to publish a course without lessons', async () => {
    const admin = await createUser('ADMIN');
    const course = await createCourse({ published: false });
    const res = await api().patch(`/api/v1/courses/${course.id}`).set(admin.auth).send({ published: true });
    expect(res.status).toBe(400);

    await createLesson(course.id);
    const ok = await api().patch(`/api/v1/courses/${course.id}`).set(admin.auth).send({ published: true });
    expect(ok.status).toBe(200);
  });

  it('does not change published state on an unrelated partial update', async () => {
    const admin = await createUser('ADMIN');
    const course = await createCourse({ published: true });
    const res = await api()
      .patch(`/api/v1/courses/${course.id}`)
      .set(admin.auth)
      .send({ title: 'Only the title' });
    expect(res.body.data).toMatchObject({ title: 'Only the title', published: true });
  });

  it('hides unpublished courses from the public catalog but not from admins', async () => {
    const admin = await createUser('ADMIN');
    await createCourse({ title: 'Public course' });
    await createCourse({ title: 'Draft course', published: false });

    const pub = await api().get('/api/v1/courses');
    expect(pub.body.data.map((c: { title: string }) => c.title)).toEqual(['Public course']);
    expect(pub.body.meta).toMatchObject({ total: 1, page: 1 });

    const adm = await api().get('/api/v1/courses').set(admin.auth);
    expect(adm.body.data).toHaveLength(2);
  });

  it('filters by search and category with pagination', async () => {
    await createCourse({ title: 'React basics', category: 'Programming' });
    await createCourse({ title: 'Color theory', category: 'Design' });
    const design = await createCategory('Design');

    const byQ = await api().get('/api/v1/courses?q=react');
    expect(byQ.body.data).toHaveLength(1);
    const byCat = await api().get(`/api/v1/courses?categoryId=${design.id}`);
    expect(byCat.body.data[0].title).toBe('Color theory');
    const paged = await api().get('/api/v1/courses?pageSize=1&page=2');
    expect(paged.body.meta).toMatchObject({ pageSize: 1, page: 2, total: 2, totalPages: 2 });
    expect((await api().get('/api/v1/courses?pageSize=999')).status).toBe(400);
  });

  it('only exposes video URLs to enrolled learners and admins', async () => {
    const learner = await createUser('LEARNER');
    const course = await createCourse();
    await createLesson(course.id);

    const anon = await api().get(`/api/v1/courses/${course.id}`);
    expect(anon.body.data.lessons[0].videoUrl).toBeUndefined();

    const notEnrolled = await api().get(`/api/v1/courses/${course.id}`).set(learner.auth);
    expect(notEnrolled.body.data.lessons[0].videoUrl).toBeUndefined();

    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    const enrolled = await api().get(`/api/v1/courses/${course.id}`).set(learner.auth);
    expect(enrolled.body.data.lessons[0].videoUrl).toEqual(expect.any(String));
    expect(enrolled.body.data.enrolled).toBe(true);
  });
});

describe('lesson management', () => {
  it('auto-orders lessons, rejects duplicate order, reorders and closes gaps on delete', async () => {
    const admin = await createUser('ADMIN');
    const course = await createCourse();
    const make = (title: string, extra = {}) =>
      api()
        .post(`/api/v1/courses/${course.id}/lessons`)
        .set(admin.auth)
        .send({
          title,
          description: 'desc',
          videoUrl: 'https://example.com/v.mp4',
          durationSeconds: 60,
          ...extra,
        });

    const a = (await make('Lesson A')).body.data;
    const b = (await make('Lesson B')).body.data;
    const c = (await make('Lesson C')).body.data;
    expect([a.order, b.order, c.order]).toEqual([1, 2, 3]);
    expect((await make('Clash', { order: 2 })).status).toBe(409);

    const reordered = await api()
      .put(`/api/v1/courses/${course.id}/lessons/reorder`)
      .set(admin.auth)
      .send({ lessonIds: [c.id, a.id, b.id] });
    expect(reordered.body.data.map((l: { title: string }) => l.title)).toEqual([
      'Lesson C',
      'Lesson A',
      'Lesson B',
    ]);

    const incomplete = await api()
      .put(`/api/v1/courses/${course.id}/lessons/reorder`)
      .set(admin.auth)
      .send({ lessonIds: [a.id, b.id] });
    expect(incomplete.status).toBe(400);

    expect((await api().delete(`/api/v1/lessons/${c.id}`).set(admin.auth)).status).toBe(204);
    const detail = await api().get(`/api/v1/courses/${course.id}`).set(admin.auth);
    expect(detail.body.data.lessons.map((l: { order: number }) => l.order)).toEqual([1, 2]);
  });

  it('rejects invalid lesson input and non-admin writes', async () => {
    const admin = await createUser('ADMIN');
    const learner = await createUser('LEARNER');
    const course = await createCourse();
    const url = `/api/v1/courses/${course.id}/lessons`;

    expect((await api().post(url).set(learner.auth).send({})).status).toBe(403);
    const bad = await api()
      .post(url)
      .set(admin.auth)
      .send({ title: 'x', videoUrl: 'ftp://x', durationSeconds: -5 });
    expect(bad.status).toBe(400);
  });
});

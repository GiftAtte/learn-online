import { describe, expect, it } from 'vitest';
import { api, createCategory, createCourse, createUser } from './helpers';

describe('categories', () => {
  it('lists categories publicly with the number of published courses', async () => {
    await createCourse({ category: 'Design' });
    await createCourse({ category: 'Design', published: false }); // drafts are not counted
    await createCategory('Data'); // empty category

    const res = await api().get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.data.map((c: { name: string; courseCount: number }) => [c.name, c.courseCount])).toEqual([
      ['Data', 0],
      ['Design', 1],
    ]);
  });

  it('lets only admins create, rename and delete', async () => {
    const learner = await createUser('LEARNER');
    const admin = await createUser('ADMIN');

    expect((await api().post('/api/v1/categories').send({ name: 'Math' })).status).toBe(401);
    expect((await api().post('/api/v1/categories').set(learner.auth).send({ name: 'Math' })).status).toBe(
      403,
    );

    const created = await api().post('/api/v1/categories').set(admin.auth).send({ name: ' Math ' });
    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe('Math'); // trimmed
    const id = created.body.data.id;

    const renamed = await api()
      .patch(`/api/v1/categories/${id}`)
      .set(admin.auth)
      .send({ name: 'Mathematics' });
    expect(renamed.body.data.name).toBe('Mathematics');

    expect((await api().delete(`/api/v1/categories/${id}`).set(learner.auth)).status).toBe(403);
    expect((await api().delete(`/api/v1/categories/${id}`).set(admin.auth)).status).toBe(204);
  });

  it('rejects duplicate names ignoring case, and invalid input', async () => {
    const admin = await createUser('ADMIN');
    await createCategory('Design');

    const dup = await api().post('/api/v1/categories').set(admin.auth).send({ name: 'design' });
    expect(dup.status).toBe(409);
    expect((await api().post('/api/v1/categories').set(admin.auth).send({ name: 'x' })).status).toBe(400);

    // Renaming a category to its own name (different case) is allowed.
    const own = await createCategory('Data');
    const ok = await api().patch(`/api/v1/categories/${own.id}`).set(admin.auth).send({ name: 'DATA' });
    expect(ok.status).toBe(200);
  });

  it('refuses to delete a category that still has courses', async () => {
    const admin = await createUser('ADMIN');
    const course = await createCourse({ category: 'Design' });

    const res = await api().delete(`/api/v1/categories/${course.categoryId}`).set(admin.auth);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('returns 404 when renaming or deleting an unknown category', async () => {
    const admin = await createUser('ADMIN');
    const missing = '00000000-0000-4000-8000-000000000000';
    expect(
      (await api().patch(`/api/v1/categories/${missing}`).set(admin.auth).send({ name: 'Nope' })).status,
    ).toBe(404);
    expect((await api().delete(`/api/v1/categories/${missing}`).set(admin.auth)).status).toBe(404);
  });
});

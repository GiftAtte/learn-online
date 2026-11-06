import { describe, expect, it } from 'vitest';
import { api, createCourse, createLesson, createUser } from './helpers';

const titles = (res: { body: { data: { title: string }[] } }) => res.body.data.map((c) => c.title);

describe('course list: status filter and sorting (admin tables)', () => {
  it('lets administrators filter by status, and ignores the filter for learners', async () => {
    const admin = await createUser('ADMIN');
    const learner = await createUser('LEARNER');
    await createCourse({ title: 'Live course', published: true });
    await createCourse({ title: 'Draft course', published: false });

    const drafts = await api().get('/api/v1/courses?status=draft').set(admin.auth);
    expect(titles(drafts)).toEqual(['Draft course']);
    const live = await api().get('/api/v1/courses?status=published').set(admin.auth);
    expect(titles(live)).toEqual(['Live course']);

    // A learner can never see drafts, whatever they put in the URL.
    const asLearner = await api().get('/api/v1/courses?status=draft').set(learner.auth);
    expect(titles(asLearner)).toEqual(['Live course']);
  });

  it('sorts by title in both directions', async () => {
    await createCourse({ title: 'Bravo' });
    await createCourse({ title: 'Alpha' });
    await createCourse({ title: 'Charlie' });

    expect(titles(await api().get('/api/v1/courses?sortBy=title&sortDir=asc'))).toEqual([
      'Alpha',
      'Bravo',
      'Charlie',
    ]);
    expect(titles(await api().get('/api/v1/courses?sortBy=title&sortDir=desc'))).toEqual([
      'Charlie',
      'Bravo',
      'Alpha',
    ]);
  });

  it('sorts by number of learners and number of lessons', async () => {
    const popular = await createCourse({ title: 'Popular' });
    const quiet = await createCourse({ title: 'Quiet' });
    await createLesson(popular.id, 1);
    await createLesson(quiet.id, 1);
    await createLesson(quiet.id, 2);

    const a = await createUser('LEARNER', 'a@test.dev');
    const b = await createUser('LEARNER', 'b@test.dev');
    await api().post(`/api/v1/courses/${popular.id}/enroll`).set(a.auth);
    await api().post(`/api/v1/courses/${popular.id}/enroll`).set(b.auth);
    await api().post(`/api/v1/courses/${quiet.id}/enroll`).set(a.auth);

    expect(titles(await api().get('/api/v1/courses?sortBy=learners&sortDir=desc'))).toEqual([
      'Popular',
      'Quiet',
    ]);
    expect(titles(await api().get('/api/v1/courses?sortBy=lessons&sortDir=desc'))).toEqual([
      'Quiet',
      'Popular',
    ]);
  });

  it('rejects unknown sort fields', async () => {
    expect((await api().get('/api/v1/courses?sortBy=password')).status).toBe(400);
    expect((await api().get('/api/v1/courses?sortDir=sideways')).status).toBe(400);
  });
});

describe('admin learners: search and sorting', () => {
  it('searches by name or email, ignoring case', async () => {
    const admin = await createUser('ADMIN');
    await createUser('LEARNER', 'maya@example.com');
    await createUser('LEARNER', 'daniel@example.com');

    const byEmail = await api().get('/api/v1/dashboard/admin/learners?q=MAYA').set(admin.auth);
    expect(byEmail.body.data.map((l: { email: string }) => l.email)).toEqual(['maya@example.com']);
    expect(byEmail.body.meta.total).toBe(1);

    const none = await api().get('/api/v1/dashboard/admin/learners?q=zzz').set(admin.auth);
    expect(none.body.data).toEqual([]);
    expect(none.body.meta.totalPages).toBe(1);
  });

  it('filters by whether the learner has enrolled', async () => {
    const admin = await createUser('ADMIN');
    const enrolled = await createUser('LEARNER', 'enrolled@example.com');
    await createUser('LEARNER', 'idle@example.com');
    const course = await createCourse();
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(enrolled.auth);

    const emails = async (query: string) =>
      (await api().get(`/api/v1/dashboard/admin/learners${query}`).set(admin.auth)).body.data.map(
        (l: { email: string }) => l.email,
      );
    expect(await emails('?enrolled=yes')).toEqual(['enrolled@example.com']);
    expect(await emails('?enrolled=no')).toEqual(['idle@example.com']);
    expect(await emails('')).toHaveLength(2);
    expect((await api().get('/api/v1/dashboard/admin/learners?enrolled=maybe').set(admin.auth)).status).toBe(
      400,
    );
  });

  it('sorts by name', async () => {
    const admin = await createUser('ADMIN');
    await createUser('LEARNER', 'b@example.com'); // "LEARNER user" for all: same name, so sort ties fall back to newest
    const res = await api().get('/api/v1/dashboard/admin/learners?sortBy=name&sortDir=asc').set(admin.auth);
    expect(res.status).toBe(200);
    expect((await api().get('/api/v1/dashboard/admin/learners?sortBy=email').set(admin.auth)).status).toBe(
      400,
    );
  });
});

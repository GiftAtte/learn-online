import { describe, expect, it } from 'vitest';
import { prisma } from '../src/db/prisma';
import { api, createCourse, createUser } from './helpers';

/** A lesson with a chosen title, description and length (the shared helper fixes those). */
const addLesson = (
  courseId: string,
  order: number,
  overrides: Partial<{ title: string; description: string; durationSeconds: number }> = {},
) =>
  prisma.lesson.create({
    data: {
      courseId,
      title: `Lesson ${order}`,
      description: 'Lesson description',
      videoUrl: 'https://example.com/video.mp4',
      durationSeconds: 100,
      order,
      ...overrides,
    },
  });

const LIST = '/api/v1/lessons';

describe('GET /lessons (administrators)', () => {
  it('is closed to visitors and learners', async () => {
    const { auth } = await createUser('LEARNER');
    expect((await api().get(LIST)).status).toBe(401);
    expect((await api().get(LIST).set(auth)).status).toBe(403);
  });

  it('lists lessons of every course, drafts included, with their course and video address', async () => {
    const { auth } = await createUser('ADMIN');
    const live = await createCourse({ title: 'Live Course', published: true });
    const draft = await createCourse({ title: 'Draft Course', published: false });
    await addLesson(live.id, 1);
    await addLesson(draft.id, 1);

    const res = await api().get(LIST).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toMatchObject({ page: 1, total: 2, totalPages: 1 });
    const courses = res.body.data.map((l: { course: { title: string } }) => l.course.title).sort();
    expect(courses).toEqual(['Draft Course', 'Live Course']);
    expect(res.body.data[0]).toMatchObject({
      videoUrl: 'https://example.com/video.mp4',
      course: { published: expect.any(Boolean) },
    });
  });

  it('searches lesson title, description and course title without regard to case', async () => {
    const { auth } = await createUser('ADMIN');
    const course = await createCourse({ title: 'Cooking Basics' });
    await addLesson(course.id, 1, { title: 'Sharpening knives' });
    await addLesson(course.id, 2, { title: 'Boiling', description: 'Water and heat' });
    const other = await createCourse({ title: 'Gardening' });
    await addLesson(other.id, 1, { title: 'Soil' });

    const names = async (q: string) =>
      (await api().get(LIST).query({ q }).set(auth)).body.data.map((l: { title: string }) => l.title);

    expect(await names('KNIVES')).toEqual(['Sharpening knives']);
    expect(await names('water')).toEqual(['Boiling']);
    expect((await names('cooking')).sort()).toEqual(['Boiling', 'Sharpening knives']);
    expect(await names('nothing matches this')).toEqual([]);
  });

  it('filters by course', async () => {
    const { auth } = await createUser('ADMIN');
    const a = await createCourse({ title: 'Course A' });
    const b = await createCourse({ title: 'Course B' });
    await addLesson(a.id, 1);
    await addLesson(a.id, 2);
    await addLesson(b.id, 1);

    const res = await api().get(LIST).query({ courseId: a.id }).set(auth);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta.total).toBe(2);
    expect(res.body.data.every((l: { courseId: string }) => l.courseId === a.id)).toBe(true);
  });

  it('sorts by length, and by course then lesson order', async () => {
    const { auth } = await createUser('ADMIN');
    const b = await createCourse({ title: 'B course' });
    const a = await createCourse({ title: 'A course' });
    await addLesson(b.id, 1, { durationSeconds: 300 });
    await addLesson(a.id, 2, { durationSeconds: 100 });
    await addLesson(a.id, 1, { durationSeconds: 200 });

    const byLength = await api().get(LIST).query({ sortBy: 'duration', sortDir: 'asc' }).set(auth);
    expect(byLength.body.data.map((l: { durationSeconds: number }) => l.durationSeconds)).toEqual([
      100, 200, 300,
    ]);

    const byCourse = await api().get(LIST).query({ sortBy: 'course', sortDir: 'asc' }).set(auth);
    expect(
      byCourse.body.data.map(
        (l: { course: { title: string }; order: number }) => `${l.course.title}#${l.order}`,
      ),
    ).toEqual(['A course#1', 'A course#2', 'B course#1']);
  });

  it('pages the results and reports the total', async () => {
    const { auth } = await createUser('ADMIN');
    const course = await createCourse();
    for (let order = 1; order <= 5; order += 1) await addLesson(course.id, order);

    const second = await api().get(LIST).query({ pageSize: 2, page: 2, sortBy: 'course' }).set(auth);
    expect(second.body.data.map((l: { order: number }) => l.order)).toEqual([3, 4]);
    expect(second.body.meta).toMatchObject({ page: 2, pageSize: 2, total: 5, totalPages: 3 });
  });

  it('rejects an invalid query', async () => {
    const { auth } = await createUser('ADMIN');
    expect((await api().get(LIST).query({ courseId: 'not-a-uuid' }).set(auth)).status).toBe(400);
    expect((await api().get(LIST).query({ pageSize: 500 }).set(auth)).status).toBe(400);
    expect((await api().get(LIST).query({ sortBy: 'password' }).set(auth)).status).toBe(400);
  });

  it('does not take over the single-lesson route', async () => {
    const { auth } = await createUser('ADMIN');
    const course = await createCourse();
    const lesson = await addLesson(course.id, 1);
    const res = await api().get(`${LIST}/${lesson.id}`).set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data.lesson.id).toBe(lesson.id);
  });
});

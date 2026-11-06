import { describe, expect, it } from 'vitest';
import { api, createCourse, createLesson, createUser } from './helpers';

const setup = async () => {
  const learner = await createUser('LEARNER');
  const course = await createCourse();
  const l1 = await createLesson(course.id, 1, 100);
  const l2 = await createLesson(course.id, 2, 200);
  return { learner, course, l1, l2 };
};
const put = (lessonId: string, auth: Record<string, string>, payload: object) =>
  api().put(`/api/v1/lessons/${lessonId}/progress`).set(auth).send(payload);

describe('enrollment', () => {
  it('enrolls idempotently and lists enrolled courses with progress', async () => {
    const { learner, course } = await setup();
    const first = await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    const second = await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    expect(first.status).toBe(201);
    expect(second.status).toBe(200);
    expect(second.body.data.id).toBe(first.body.data.id);

    const mine = await api().get('/api/v1/enrollments/me').set(learner.auth);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0]).toMatchObject({
      lessonCount: 2,
      totalDurationSeconds: 300,
      progressPercent: 0,
    });
  });

  it('requires auth, a published course and an existing enrollment to unenroll', async () => {
    const { learner, course } = await setup();
    const draft = await createCourse({ published: false });
    expect((await api().post(`/api/v1/courses/${course.id}/enroll`)).status).toBe(401);
    expect((await api().post(`/api/v1/courses/${draft.id}/enroll`).set(learner.auth)).status).toBe(404);
    expect((await api().delete(`/api/v1/courses/${course.id}/enroll`).set(learner.auth)).status).toBe(404);
  });
});

describe('lesson access and progress tracking', () => {
  it('blocks lesson access and progress writes until enrolled', async () => {
    const { learner, l1 } = await setup();
    expect((await api().get(`/api/v1/lessons/${l1.id}`).set(learner.auth)).status).toBe(403);
    expect((await put(l1.id, learner.auth, { positionSeconds: 10 })).status).toBe(403);
  });

  it('saves the resume position and returns it with the lesson', async () => {
    const { learner, course, l1 } = await setup();
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);

    const saved = await put(l1.id, learner.auth, { positionSeconds: 42.9 });
    expect(saved.body.data).toMatchObject({ lastPositionSeconds: 42, completed: false });

    const detail = await api().get(`/api/v1/lessons/${l1.id}`).set(learner.auth);
    expect(detail.body.data.lesson).toMatchObject({ lastPositionSeconds: 42, progressPercent: 42 });
    expect(detail.body.data.nextLessonId).toBeTruthy();
    expect(detail.body.data.previousLessonId).toBeNull();
  });

  it('completes on the ended event and clamps the position to the duration', async () => {
    const { learner, course, l1 } = await setup();
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    const res = await put(l1.id, learner.auth, { positionSeconds: 9999, completed: true });
    expect(res.body.data).toMatchObject({ completed: true, lastPositionSeconds: 100 });
    expect(res.body.data.completedAt).toBeTruthy();
  });

  it('auto-completes when 95% has been watched', async () => {
    const { learner, course, l2 } = await setup();
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    expect((await put(l2.id, learner.auth, { positionSeconds: 150 })).body.data.completed).toBe(false);
    expect((await put(l2.id, learner.auth, { positionSeconds: 195 })).body.data.completed).toBe(true);
  });

  it('keeps completion sticky when the learner re-watches', async () => {
    const { learner, course, l1 } = await setup();
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    await put(l1.id, learner.auth, { positionSeconds: 100, completed: true });
    const again = await put(l1.id, learner.auth, { positionSeconds: 5 });
    expect(again.body.data).toMatchObject({ completed: true, lastPositionSeconds: 5 });
  });

  it('validates progress payloads', async () => {
    const { learner, course, l1 } = await setup();
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    expect((await put(l1.id, learner.auth, { positionSeconds: -1 })).status).toBe(400);
    expect((await put(l1.id, learner.auth, { positionSeconds: 'abc' })).status).toBe(400);
  });

  it("never lets one learner affect another's progress", async () => {
    const { learner, course, l1 } = await setup();
    const other = await createUser('LEARNER', 'other@test.dev');
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(other.auth);
    await put(l1.id, learner.auth, { positionSeconds: 100, completed: true });

    const theirs = await api().get(`/api/v1/lessons/${l1.id}/progress`).set(other.auth);
    expect(theirs.body.data).toMatchObject({ completed: false, lastPositionSeconds: 0 });
  });
});

describe('dashboards', () => {
  it('summarises learner progress and the continue-learning lesson', async () => {
    const { learner, course, l1, l2 } = await setup();
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    await put(l1.id, learner.auth, { positionSeconds: 100, completed: true });
    await put(l2.id, learner.auth, { positionSeconds: 60 });

    const res = await api().get('/api/v1/dashboard/learner').set(learner.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.summary).toMatchObject({
      enrolledCourses: 1,
      inProgressCourses: 1,
      completedCourses: 0,
      completedLessons: 1,
      overallProgressPercent: 50,
    });
    expect(res.body.data.continueLearning).toMatchObject({ lessonId: l2.id, lastPositionSeconds: 60 });

    await put(l2.id, learner.auth, { positionSeconds: 200, completed: true });
    const done = await api().get('/api/v1/dashboard/learner').set(learner.auth);
    expect(done.body.data.summary.completedCourses).toBe(1);
    expect(done.body.data.continueLearning).toBeNull();
  });

  it('restricts the admin dashboard to admins and reports completion rates', async () => {
    const { learner, course, l1, l2 } = await setup();
    const admin = await createUser('ADMIN');
    await api().post(`/api/v1/courses/${course.id}/enroll`).set(learner.auth);
    await put(l1.id, learner.auth, { positionSeconds: 100, completed: true });
    await put(l2.id, learner.auth, { positionSeconds: 200, completed: true });

    expect((await api().get('/api/v1/dashboard/admin')).status).toBe(401);
    expect((await api().get('/api/v1/dashboard/admin').set(learner.auth)).status).toBe(403);
    expect((await api().get('/api/v1/dashboard/admin/learners').set(learner.auth)).status).toBe(403);

    const res = await api().get('/api/v1/dashboard/admin').set(admin.auth);
    expect(res.status).toBe(200);
    expect(res.body.data.summary).toMatchObject({
      learners: 1,
      courses: 1,
      enrollments: 1,
      completionRate: 100,
    });
    expect(res.body.data.courses[0]).toMatchObject({
      enrollmentCount: 1,
      completedLearners: 1,
      completionRate: 100,
    });

    const learners = await api().get('/api/v1/dashboard/admin/learners').set(admin.auth);
    expect(learners.body.meta.total).toBe(1);
    expect(learners.body.data[0].courses[0].progressPercent).toBe(100);
  });
});

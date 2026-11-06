import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/db/prisma';
import { hashPassword } from '../src/utils/password';

export const app = createApp();
export const api = () => request(app);

export const PASSWORD = 'Passw0rdTest';

/** The token inside the `session` cookie that a sign-in response set. */
export const tokenFrom = (res: request.Response) => {
  const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
  return (
    cookies
      .find((c) => c.startsWith('session='))
      ?.split(';')[0]
      ?.slice('session='.length) ?? ''
  );
};

/** The request header a browser would send once it holds that token. */
export const cookieHeader = (token: string) => ({ Cookie: `session=${token}` });

/** Creates a user directly in the DB, signs in, and returns the cookie header to send. */
export const createUser = async (
  role: 'LEARNER' | 'ADMIN' = 'LEARNER',
  email = `${role.toLowerCase()}@test.dev`,
) => {
  const user = await prisma.user.create({
    data: { name: `${role} user`, email, passwordHash: await hashPassword(PASSWORD), role },
  });
  const res = await api().post('/api/v1/auth/login').send({ email, password: PASSWORD });
  return { user, auth: cookieHeader(tokenFrom(res)) };
};

/** Finds or creates a category by name. */
export const createCategory = (name = 'Programming') =>
  prisma.category.upsert({ where: { name }, update: {}, create: { name } });

/** Pass `category` (a name) to put the course in a specific category; defaults to "Programming". */
export const createCourse = async (
  overrides: Partial<{ title: string; published: boolean; category: string }> = {},
) => {
  const { category, ...rest } = overrides;
  const { id: categoryId } = await createCategory(category);
  return prisma.course.create({
    data: {
      title: 'Test Course',
      description: 'A description long enough to be valid.',
      categoryId,
      published: true,
      ...rest,
    },
  });
};

export const createLesson = (courseId: string, order = 1, durationSeconds = 100) =>
  prisma.lesson.create({
    data: {
      courseId,
      title: `Lesson ${order}`,
      description: 'Lesson description',
      videoUrl: 'https://example.com/video.mp4',
      durationSeconds,
      order,
    },
  });

import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/db/prisma';

beforeEach(async () => {
  await prisma.$transaction([
    prisma.lessonProgress.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.lesson.deleteMany(),
    prisma.course.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

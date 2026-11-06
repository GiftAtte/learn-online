import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

// Public sample clips (checked reachable). Lengths are the real ones so that resume and completion
// tracking behave exactly as they would with full-length lessons. They are short on purpose: swap in
// your own video URLs from the admin area for real content.
const CLIPS = 'https://test-videos.co.uk/vids';
const VIDEOS = {
  bunny: { url: `${CLIPS}/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4`, seconds: 10 },
  bunnyHd: { url: `${CLIPS}/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4`, seconds: 10 },
  jellyfish: { url: `${CLIPS}/jellyfish/mp4/h264/360/Jellyfish_360_10s_1MB.mp4`, seconds: 10 },
  sintel: { url: `${CLIPS}/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4`, seconds: 10 },
  flower: { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', seconds: 5 },
} as const;

type VideoKey = keyof typeof VIDEOS;

const courses: {
  title: string;
  category: string;
  description: string;
  published: boolean;
  lessons: [title: string, description: string, video: VideoKey][];
}[] = [
  {
    title: 'TypeScript for Professionals',
    category: 'Programming',
    description:
      'Go from JavaScript to confident TypeScript: types, generics, narrowing and building maintainable codebases.',
    published: true,
    lessons: [
      ['Why TypeScript?', 'The case for static types and how the compiler helps you.', 'bunny'],
      ['Types and Interfaces', 'Modelling data with type aliases, interfaces and unions.', 'bunnyHd'],
      ['Generics in Practice', 'Writing reusable, type-safe functions and components.', 'jellyfish'],
      ['Type Narrowing', 'Discriminated unions, guards and exhaustive checks.', 'sintel'],
    ],
  },
  {
    title: 'Modern React Fundamentals',
    category: 'Programming',
    description:
      'Build interactive UIs with components, hooks and state management, following current best practices.',
    published: true,
    lessons: [
      ['Components and Props', 'Composing UIs from small, reusable pieces.', 'flower'],
      ['State and Effects', 'Managing local state and side effects with hooks.', 'bunnyHd'],
      ['Data Fetching', 'Caching and synchronising server state.', 'jellyfish'],
    ],
  },
  {
    title: 'Design Thinking Essentials',
    category: 'Design',
    description:
      'A practical introduction to empathising, defining, ideating and testing user-centred solutions.',
    published: true,
    lessons: [
      ['Empathise with Users', 'Interviewing and observing real people.', 'sintel'],
      ['Define the Problem', 'Turning research into a clear problem statement.', 'flower'],
    ],
  },
  {
    title: 'Data Storytelling (Draft)',
    category: 'Data',
    description: 'An unpublished draft course used to demonstrate admin-only visibility.',
    published: false,
    lessons: [['Choosing the Right Chart', 'Matching questions to chart types.', 'bunny']],
  },
];

async function main() {
  await prisma.lessonProgress.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.course.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const [adminHash, learnerHash] = await Promise.all([
    hashPassword('Admin123!'),
    hashPassword('Learner123!'),
  ]);
  await prisma.user.create({
    data: { name: 'Ada Admin', email: 'admin@learnonline.dev', passwordHash: adminHash, role: 'ADMIN' },
  });
  const learner = await prisma.user.create({
    data: { name: 'Leo Learner', email: 'learner@learnonline.dev', passwordHash: learnerHash },
  });

  // Categories are their own table; courses reference them by id.
  const categoryIds = new Map<string, string>();
  for (const name of new Set(courses.map((c) => c.category))) {
    categoryIds.set(name, (await prisma.category.create({ data: { name } })).id);
  }

  for (const [i, c] of courses.entries()) {
    await prisma.course.create({
      data: {
        title: c.title,
        categoryId: categoryIds.get(c.category)!,
        description: c.description,
        published: c.published,
        thumbnailUrl: `https://picsum.photos/seed/learnonline-${i + 1}/640/360`,
        lessons: {
          create: c.lessons.map(([title, description, video], idx) => ({
            title,
            description,
            videoUrl: VIDEOS[video].url,
            durationSeconds: VIDEOS[video].seconds,
            order: idx + 1,
          })),
        },
      },
    });
  }

  // Give the demo learner some realistic progress in the first course.
  const first = await prisma.course.findFirstOrThrow({
    where: { title: courses[0]!.title },
    include: { lessons: { orderBy: { order: 'asc' } } },
  });
  await prisma.enrollment.create({ data: { userId: learner.id, courseId: first.id } });
  const [l1, l2] = first.lessons;
  await prisma.lessonProgress.createMany({
    data: [
      {
        userId: learner.id,
        lessonId: l1!.id,
        lastPositionSeconds: 0,
        completed: true,
        completedAt: new Date(),
      },
      { userId: learner.id, lessonId: l2!.id, lastPositionSeconds: 4 },
    ],
  });

  console.log(
    'Seeded. Admin: admin@learnonline.dev / Admin123!  Learner: learner@learnonline.dev / Learner123!',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

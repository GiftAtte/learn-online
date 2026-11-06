import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

/**
 * Free sample videos. Every URL was checked to be reachable, and `seconds` was read from the file's
 * own header, so resume and completion tracking behave exactly as they would with real lessons.
 *
 *  - Blender open movies (Sintel, Elephants Dream, Tears of Steel, Big Buck Bunny): CC-BY, (c) Blender Foundation
 *  - MDN flower clip: CC0
 *  - the rest are public sample clips made for testing video players
 *
 * To use your own content, change the videos from the admin area; no code change is needed.
 */
const VIDEOS = {
  // Full-length films (several minutes): good for testing resume and the 95% completion rule.
  elephantsDream: { url: 'https://archive.org/download/ElephantsDream/ed_1024_512kb.mp4', seconds: 654 },
  tearsOfSteel: { url: 'https://archive.org/download/Tears-of-Steel/tears_of_steel_1080p.mp4', seconds: 734 },
  sintelFilm: { url: 'https://archive.org/download/Sintel/sintel-2048-surround_512kb.mp4', seconds: 888 },
  movie300: { url: 'https://media.w3.org/2010/05/video/movie_300.mp4', seconds: 300 },

  // Trailers and short clips (under a minute).
  sintelTrailer: { url: 'https://media.w3.org/2010/05/sintel/trailer.mp4', seconds: 52 },
  bunnyTrailer: { url: 'https://media.w3.org/2010/05/bunny/trailer.mp4', seconds: 33 },
  oceans: { url: 'https://vjs.zencdn.net/v/oceans.mp4', seconds: 47 },
  sample30: { url: 'https://samplelib.com/lib/preview/mp4/sample-30s.mp4', seconds: 30 },
  sample20: { url: 'https://samplelib.com/lib/preview/mp4/sample-20s.mp4', seconds: 20 },
  sample15: { url: 'https://samplelib.com/lib/preview/mp4/sample-15s.mp4', seconds: 16 },
  bear: { url: 'https://www.w3schools.com/html/movie.mp4', seconds: 13 },
  bunny: {
    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4',
    seconds: 10,
  },
  jellyfish: {
    url: 'https://test-videos.co.uk/vids/jellyfish/mp4/h264/720/Jellyfish_720_10s_5MB.mp4',
    seconds: 10,
  },
  sintel: { url: 'https://test-videos.co.uk/vids/sintel/mp4/h264/360/Sintel_360_10s_1MB.mp4', seconds: 10 },
  sample10: { url: 'https://samplelib.com/lib/preview/mp4/sample-10s.mp4', seconds: 10 },
  bunnyShort: { url: 'https://www.w3schools.com/html/mov_bbb.mp4', seconds: 10 },
  sample5: { url: 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4', seconds: 6 },
  flower: { url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', seconds: 5 },
} as const;

type VideoKey = keyof typeof VIDEOS;

/** Each lesson is [title, description, which video it plays]. */
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
      ['Why TypeScript?', 'The case for static types and how the compiler helps you.', 'elephantsDream'],
      ['Types and Interfaces', 'Modelling data with type aliases, interfaces and unions.', 'bunny'],
      ['Generics in Practice', 'Writing reusable, type-safe functions and components.', 'sample20'],
      ['Type Narrowing', 'Discriminated unions, guards and exhaustive checks.', 'sample30'],
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
      ['State and Effects', 'Managing local state and side effects with hooks.', 'bunnyTrailer'],
      ['Data Fetching', 'Caching and synchronising server state.', 'oceans'],
      ['Performance Basics', 'Memoisation, lazy loading and measuring before optimising.', 'sample15'],
    ],
  },
  {
    title: 'Building APIs with Node',
    category: 'Programming',
    description: 'Design a secure REST API: routing, validation, authentication and a clean service layer.',
    published: true,
    lessons: [
      ['REST Basics', 'Resources, verbs and status codes.', 'tearsOfSteel'],
      ['Authentication', 'Passwords, sessions and httpOnly cookies.', 'movie300'],
      ['Input Validation', 'Rejecting bad data at the edge.', 'sample10'],
    ],
  },
  {
    title: 'Design Thinking Essentials',
    category: 'Design',
    description:
      'A practical introduction to empathising, defining, ideating and testing user-centred solutions.',
    published: true,
    lessons: [
      ['Empathise with Users', 'Interviewing and observing real people.', 'sintelFilm'],
      ['Define the Problem', 'Turning research into a clear problem statement.', 'sintelTrailer'],
      ['Ideate and Prototype', 'Generating options quickly and testing the best ones.', 'sintel'],
    ],
  },
  {
    title: 'Visual Design Basics',
    category: 'Design',
    description: 'Colour, type and layout: the small decisions that make an interface feel professional.',
    published: true,
    lessons: [
      ['Colour and Contrast', 'Palettes that work and stay accessible.', 'jellyfish'],
      ['Typography', 'Choosing and pairing type for readability.', 'bear'],
      ['Layout and Spacing', 'Grids, rhythm and whitespace.', 'sample5'],
    ],
  },
  {
    title: 'Data Storytelling (Draft)',
    category: 'Data',
    description: 'An unpublished draft course used to demonstrate admin-only visibility.',
    published: false,
    lessons: [['Choosing the Right Chart', 'Matching questions to chart types.', 'bunnyShort']],
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

  const lessonCount = courses.reduce((n, c) => n + c.lessons.length, 0);
  console.log(
    `Seeded ${courses.length} courses with ${lessonCount} lessons from ${Object.keys(VIDEOS).length} videos.`,
  );
  console.log('Admin: admin@learnonline.dev / Admin123!  Learner: learner@learnonline.dev / Learner123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

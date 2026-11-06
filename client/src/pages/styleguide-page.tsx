import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { BookOpen, GraduationCap, Plus, Trash2, Users } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '@/components/feedback/alert';
import { useConfirm } from '@/components/feedback/confirm-dialog';
import { EmptyState } from '@/components/feedback/empty-state';
import { ErrorState } from '@/components/feedback/error-state';
import { DataTable } from '@/components/data-display/data-table';
import { FilterChips } from '@/components/data-display/filter-chips';
import { Pagination } from '@/components/data-display/pagination';
import { SearchInput } from '@/components/data-display/search-input';
import { StatTile } from '@/components/data-display/stat-tile';
import { PageHeader } from '@/components/layout/page-header';
import { VideoPlayer } from '@/components/media/video-player';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  FormField,
  Input,
  Modal,
  ProgressBar,
  ProgressRing,
  Select,
  Skeleton,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from '@/components/ui';
import { CourseCard } from '@/components/courses/course-card';
import { CourseCardSkeleton } from '@/components/courses/course-card-skeleton';
import { CourseGrid } from '@/components/courses/course-grid';
import { ProgressStatusBadge } from '@/components/courses/progress-status-badge';
import { LessonCard } from '@/components/lessons/lesson-card';
import { ApiError } from '@/core/api/error';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import type { CourseSummary } from '@/core/types/course.types';
import type { LessonSummary } from '@/core/types/lesson.types';
import type { LearnerRow } from '@/core/types/learner.types';
import type { StyleguideFormValues } from '@/core/types/styleguide.types';
import { link, PATHS } from '@/router/paths';

const courses: CourseSummary[] = [
  {
    id: '1',
    title: 'TypeScript for Professionals',
    description:
      'Go from JavaScript to confident TypeScript: types, generics, narrowing and maintainable codebases.',
    thumbnailUrl: 'https://picsum.photos/seed/learnonline-1/640/400',
    published: true,
    category: { id: 'c1', name: 'Programming' },
    lessonCount: 4,
    totalDurationSeconds: 2871,
    completedLessons: 1,
    progressPercent: 25,
    status: 'IN_PROGRESS',
    enrolled: true,
  },
  {
    id: '2',
    title: 'Design Thinking Essentials',
    description:
      'A practical introduction to empathising, defining, ideating and testing user-centred solutions.',
    thumbnailUrl: 'https://picsum.photos/seed/learnonline-3/640/400',
    published: true,
    category: { id: 'c2', name: 'Design' },
    lessonCount: 2,
    totalDurationSeconds: 75,
    completedLessons: 0,
    progressPercent: 0,
    status: 'NOT_STARTED',
    enrolled: false,
  },
  {
    id: '3',
    title: 'Data Storytelling',
    description: 'Match every question to the right chart and present findings people remember.',
    thumbnailUrl: null,
    published: false,
    category: { id: 'c3', name: 'Data' },
    lessonCount: 1,
    totalDurationSeconds: 15,
    completedLessons: 1,
    progressPercent: 100,
    status: 'COMPLETED',
    enrolled: true,
  },
];

const lessons: LessonSummary[] = [
  {
    id: 'l1',
    title: 'Why TypeScript?',
    order: 1,
    durationSeconds: 596,
    completed: true,
    lastPositionSeconds: 0,
    progressPercent: 100,
  },
  {
    id: 'l2',
    title: 'Types and interfaces',
    order: 2,
    durationSeconds: 653,
    completed: false,
    lastPositionSeconds: 210,
    progressPercent: 32,
  },
  {
    id: 'l3',
    title: 'Generics in practice',
    order: 3,
    durationSeconds: 888,
    completed: false,
    lastPositionSeconds: 0,
    progressPercent: 0,
  },
  {
    id: 'l4',
    title: 'Type narrowing',
    order: 4,
    durationSeconds: 734,
    completed: false,
    lastPositionSeconds: 0,
    progressPercent: 0,
  },
];

const learners: LearnerRow[] = [
  { id: '1', name: 'Leo Learner', email: 'learner@learnonline.dev', progress: 62 },
  { id: '2', name: 'Maya Okafor', email: 'maya@example.com', progress: 100 },
  { id: '3', name: 'Daniel Reyes', email: 'daniel@example.com', progress: 8 },
];

const columns: ColumnDef<LearnerRow>[] = [
  {
    id: 'name',
    header: 'Learner',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar name={row.original.name} size="sm" />
        <div className="min-w-0">
          <p className="font-medium">{row.original.name}</p>
          <p className="text-sm text-ink-faint">{row.original.email}</p>
        </div>
      </div>
    ),
  },
  {
    id: 'progress',
    header: 'Progress',
    cell: ({ row }) => (
      <div className="flex w-44 items-center gap-3">
        <ProgressBar
          value={row.original.progress}
          label={`${row.original.name} progress`}
          size="sm"
        />
        <span className="w-10 text-right text-sm tnum">{row.original.progress}%</span>
      </div>
    ),
  },
];

const schema = z.object({
  title: z.string().trim().min(3, 'Enter at least 3 characters'),
  category: z.string().min(1, 'Choose a category'),
  description: z.string().trim().min(10, 'Describe the course in at least 10 characters'),
  published: z.boolean(),
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 py-8">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function StyleguidePage() {
  const confirm = useConfirm();
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [chip, setChip] = useState('');
  const [page, setPage] = useState(2);

  const form = useForm<StyleguideFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', category: '', description: '', published: false },
  });

  const submit = form.handleSubmit(async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    notify.success(MESSAGES.course.created);
    form.reset();
  });

  return (
    <div className="divide-y divide-line">
      <PageHeader
        className="pb-8"
        title="Component library"
        description="Every building block of the platform, with its states. If it appears in the product, it is here."
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="size-4" aria-hidden />
            New course
          </Button>
        }
      />

      <Section title="Course cards">
        <CourseGrid>
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              to={link(PATHS.learner.course, { courseId: course.id })}
            />
          ))}
          <CourseCardSkeleton />
        </CourseGrid>
      </Section>

      <Section title="Lesson page">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <Card padding="none" className="overflow-hidden rounded-stage p-2 sm:p-3">
            <VideoPlayer
              src="https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4"
              title="Types and interfaces"
              startAt={0}
              onProgress={(s) => console.debug('progress', s)}
              onEnded={() => notify.success(MESSAGES.lesson.completed)}
            />
            <div className="flex flex-col gap-1 p-3 sm:p-4">
              <h3 className="text-xl font-semibold">Types and interfaces</h3>
              <p className="text-ink-soft">
                Modelling data with type aliases, interfaces and unions.
              </p>
            </div>
          </Card>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Up next</h3>
              <ProgressStatusBadge status="IN_PROGRESS" />
            </div>
            <ol>
              {lessons.map((lesson, i) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  to={link(PATHS.learner.lesson, { lessonId: lesson.id })}
                  current={lesson.id === 'l2'}
                  locked={false}
                  last={i === lessons.length - 1}
                />
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section title="Dashboard figures">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatTile label="Enrolled courses" value={3} icon={BookOpen} />
          <StatTile label="Completed lessons" value={12} hint="4 this week" icon={GraduationCap} />
          <StatTile label="Minutes watched" value="248" />
          <StatTile label="Learners" value={86} icon={Users} />
        </div>
        <Card className="flex items-center gap-5">
          <ProgressRing value={62} label="Overall progress" size={84} />
          <div>
            <p className="font-display text-lg font-semibold">Overall progress</p>
            <p className="text-ink-soft">You’ve finished 5 of 8 lessons across your courses.</p>
          </div>
        </Card>
      </Section>

      <Section title="Table (cards on phones)">
        <DataTable
          columns={columns}
          data={learners}
          getRowId={(r) => r.id}
          caption="Learners and their progress"
        />
        <Pagination page={page} pageSize={10} total={46} totalPages={5} onPageChange={setPage} />
      </Section>

      <Section title="Feedback">
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => notify.success(MESSAGES.course.published)}>
            Success toast
          </Button>
          <Button variant="secondary" onClick={() => notify.info(MESSAGES.auth.sessionExpired)}>
            Info toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              notify.warning('This course has no lessons yet', {
                description: 'Add one before publishing.',
              })
            }
          >
            Warning toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              notify.apiError(
                new ApiError(
                  'Category is used by 2 course(s); reassign them first',
                  409,
                  'CONFLICT',
                ),
              )
            }
          >
            Error toast
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              notify.promise(new Promise((resolve) => setTimeout(resolve, 1400)), {
                loading: 'Saving changes',
                success: MESSAGES.generic.saved,
              })
            }
          >
            Promise toast
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              if (await confirm({ ...MESSAGES.confirm.deleteCourse }))
                notify.success(MESSAGES.course.deleted);
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            Delete course
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Alert tone="info" title="Your progress is saved automatically">
            Pick up on any device, right where you stopped.
          </Alert>
          <Alert tone="success" title="Course published">
            Learners can find it in the catalog now.
          </Alert>
          <Alert tone="warning" title="3 lessons have no video">
            Learners can’t play them until a video link is added.
          </Alert>
          <Alert
            tone="danger"
            title="We couldn’t save your changes"
            action={
              <Button size="sm" variant="secondary">
                Try again
              </Button>
            }
          >
            Check your connection and try again.
          </Alert>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <EmptyState
            icon={BookOpen}
            title={MESSAGES.empty.myCourses.title}
            description={MESSAGES.empty.myCourses.description}
            action={<Button>Browse courses</Button>}
          />
          <ErrorState
            error={new ApiError(MESSAGES.generic.network, 0, 'NETWORK')}
            onRetry={() => notify.info('Retrying…')}
          />
        </div>
      </Section>

      <Section title="Form controls">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Card>
            <form onSubmit={submit} noValidate className="flex flex-col gap-5">
              <FormField label="Course title" required error={form.formState.errors.title?.message}>
                <Input placeholder="e.g. Modern React fundamentals" {...form.register('title')} />
              </FormField>
              <FormField label="Category" required error={form.formState.errors.category?.message}>
                <Select
                  value={form.watch('category')}
                  onValueChange={(v) => form.setValue('category', v, { shouldValidate: true })}
                  options={[
                    { value: 'programming', label: 'Programming' },
                    { value: 'design', label: 'Design' },
                    { value: 'data', label: 'Data' },
                  ]}
                  placeholder="Choose a category"
                />
              </FormField>
              <FormField
                label="Description"
                required
                hint="Shown on the course card."
                error={form.formState.errors.description?.message}
              >
                <Textarea {...form.register('description')} />
              </FormField>
              <Switch
                label="Published"
                description="Learners can see and enroll in published courses."
                checked={form.watch('published')}
                onCheckedChange={(v) => form.setValue('published', v)}
              />
              <Button type="submit" loading={form.formState.isSubmitting}>
                Create course
              </Button>
            </form>
          </Card>
          <div className="flex flex-col gap-5">
            <SearchInput value={search} onChange={setSearch} label="Search courses" />
            <FilterChips
              label="Categories"
              value={chip}
              onChange={setChip}
              options={[
                { value: 'programming', label: 'Programming' },
                { value: 'design', label: 'Design' },
                { value: 'data', label: 'Data' },
                { value: 'business', label: 'Business' },
              ]}
            />
            <FormField label="Filter by category">
              <Select
                value={category}
                onValueChange={setCategory}
                options={[
                  { value: 'all', label: 'All categories' },
                  { value: 'design', label: 'Design' },
                ]}
              />
            </FormField>
            <Checkbox label="Email me when new lessons are added" />
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button>
              <Button variant="accent">Continue learning</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button loading>Saving</Button>
              <Button disabled>Disabled</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone="neutral">Neutral</Badge>
              <Badge tone="brand">Brand</Badge>
              <Badge tone="progress">In progress</Badge>
              <Badge tone="success">Completed</Badge>
              <Badge tone="warning">Draft</Badge>
              <Badge tone="danger">Failed</Badge>
              <Badge tone="info">New</Badge>
            </div>
            <div className="flex flex-col gap-3">
              <ProgressBar value={35} label="In progress example" />
              <ProgressBar value={100} label="Complete example" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lessons">Lessons</TabsTrigger>
            <TabsTrigger value="learners">Learners</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Course details go here.</TabsContent>
          <TabsContent value="lessons">The lesson list goes here.</TabsContent>
          <TabsContent value="learners">Enrolled learners go here.</TabsContent>
        </Tabs>
      </Section>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="New course"
        description="Add the basics now. You can add lessons after."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setModalOpen(false);
                notify.success(MESSAGES.course.created);
              }}
            >
              Create course
            </Button>
          </>
        }
      >
        <FormField label="Course title" required>
          <Input placeholder="e.g. Modern React fundamentals" />
        </FormField>
      </Modal>
    </div>
  );
}

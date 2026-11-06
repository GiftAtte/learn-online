import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SearchInput, ToolbarSelect } from '@/components/data-display';
import { EmptyState, QueryBoundary } from '@/components/feedback';
import { NoResultsState } from '@/components/feedback/no-results-state';
import { Page } from '@/components/layout';
import { Button, Skeleton, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { ContinueCard } from '@/components/dashboard/continue-card';
import { LearningRow } from '@/components/courses/learning-row';
import { useGetLearnerDashboard } from '@/core/hooks/queries/use-dashboard';
import { useGetAllMyCourses } from '@/core/hooks/queries/use-enrollments';
import { useUrlParams } from '@/core/hooks/ui/use-url-params';
import { MESSAGES } from '@/core/lib/messages';
import type { CourseStatus, CourseSummary, MyCoursesFilter } from '@/core/types/course.types';
import { link, PATHS } from '@/router/paths';

const FILTERS: { value: MyCoursesFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'COMPLETED', label: 'Completed' },
];

const SORTS = [
  { value: 'next', label: 'Up next' },
  { value: 'progress', label: 'Most progress' },
  { value: 'title', label: 'Title A to Z' },
];
type Sort = 'next' | 'progress' | 'title';

/** "Up next" puts what you are in the middle of first, then what you have not begun, then what is done. */
const RANK: Record<CourseStatus, number> = { IN_PROGRESS: 0, NOT_STARTED: 1, COMPLETED: 2 };

const SORTERS: Record<Sort, (a: CourseSummary, b: CourseSummary) => number> = {
  next: (a, b) =>
    RANK[a.status] - RANK[b.status] ||
    b.progressPercent - a.progressPercent ||
    a.title.localeCompare(b.title),
  progress: (a, b) => b.progressPercent - a.progressPercent || a.title.localeCompare(b.title),
  title: (a, b) => a.title.localeCompare(b.title),
};

const isFilter = (value: string): value is MyCoursesFilter =>
  FILTERS.some((f) => f.value === value);
const isSort = (value: string): value is Sort => SORTS.some((s) => s.value === value);

/**
 * My learning: route "/learner/my-learning" (signed-in learners).
 * Starts with the lesson to pick up (if there is one), then every enrolled course as a wide row:
 * filter by progress, search by title, sort by what is next. The choices live in the address
 * (?status=IN_PROGRESS&q=design), so a view can be shared and the back button works.
 */
export default function MyLearningPage() {
  const courses = useGetAllMyCourses();
  // The resume lesson comes from the progress summary; if it is slow or fails, the page just goes without it.
  const resume = useGetLearnerDashboard().data?.continueLearning ?? null;
  const [params, setParams] = useUrlParams({ status: 'all', q: '', sort: 'next' });

  const status: MyCoursesFilter = isFilter(params.status) ? params.status : 'all';
  const sort: Sort = isSort(params.sort) ? params.sort : 'next';
  const query = params.q.trim().toLowerCase();
  const hasSearch = query !== '';

  return (
    <Page title="My learning" description="Everything you are enrolled in, and what to do next.">
      {resume && <ContinueCard resume={resume} />}

      <QueryBoundary
        query={courses}
        loading={
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-44 rounded-card" />
            ))}
          </div>
        }
        isEmpty={(data) => data.length === 0}
        empty={
          <EmptyState
            icon={GraduationCap}
            {...MESSAGES.empty.myCourses}
            action={
              <Button asChild>
                <Link to={PATHS.learner.catalog}>Browse courses</Link>
              </Button>
            }
          />
        }
      >
        {(data) => {
          const matchesSearch = (c: CourseSummary) =>
            !hasSearch || `${c.title} ${c.category.name}`.toLowerCase().includes(query);
          // The counts on the tabs follow the search, so they always add up to what you would see.
          const searched = data.filter(matchesSearch);
          const inFilter = (value: MyCoursesFilter) =>
            value === 'all' ? searched : searched.filter((c) => c.status === value);
          const visible = [...inFilter(status)].sort(SORTERS[sort]);
          const clear = () => setParams({ q: '', status: 'all' });

          return (
            <Tabs value={status} onValueChange={(value) => setParams({ status: value })}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <TabsList aria-label="Filter by progress" className="lg:flex-1">
                  {FILTERS.map(({ value, label }) => (
                    <TabsTrigger key={value} value={value}>
                      {label}
                      <span className="ml-1.5 text-ink-faint tnum">{inFilter(value).length}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <SearchInput
                    value={params.q}
                    onChange={(q) => setParams({ q })}
                    label="Search my courses"
                    className="sm:w-64"
                  />
                  <ToolbarSelect
                    label="Sort by"
                    value={sort}
                    onChange={(value) => setParams({ sort: value })}
                    options={SORTS}
                  />
                </div>
              </div>

              <TabsContent value={status} className="pt-5">
                {visible.length === 0 ? (
                  hasSearch ? (
                    <NoResultsState onClear={clear} clearLabel="Clear search" />
                  ) : (
                    <EmptyState
                      title="Nothing here yet"
                      description="Courses move here as your progress changes."
                    />
                  )
                ) : (
                  <ul className="flex flex-col gap-4">
                    {visible.map((course) => (
                      <li key={course.id}>
                        <LearningRow
                          course={course}
                          to={link(PATHS.learner.course, { courseId: course.id })}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>
            </Tabs>
          );
        }}
      </QueryBoundary>
    </Page>
  );
}

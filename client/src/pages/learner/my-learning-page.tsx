import { GraduationCap } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, QueryBoundary } from '@/components/feedback';
import { Page } from '@/components/layout';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { CourseCard } from '@/components/courses/course-card';
import { CourseGridSkeleton } from '@/components/courses/course-card-skeleton';
import { CourseGrid } from '@/components/courses/course-grid';
import { useGetAllMyCourses } from '@/core/hooks/queries/use-enrollments';
import { MESSAGES } from '@/core/lib/messages';
import type { MyCoursesFilter } from '@/core/types/course.types';
import { link, PATHS } from '@/router/paths';

const FILTERS: { value: MyCoursesFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'COMPLETED', label: 'Completed' },
];

/**
 * My learning: route "/learner/my-learning" (signed-in learners).
 * Every course the learner is enrolled in, filterable by progress.
 */
export default function MyLearningPage() {
  const courses = useGetAllMyCourses();
  const [filter, setFilter] = useState<MyCoursesFilter>('all');

  return (
    <Page title="My learning" description="Everything you’re enrolled in, with your progress.">
      <QueryBoundary
        query={courses}
        loading={
          <CourseGrid>
            <CourseGridSkeleton count={3} />
          </CourseGrid>
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
          const inFilter = (value: MyCoursesFilter) =>
            value === 'all' ? data : data.filter((course) => course.status === value);

          return (
            <Tabs value={filter} onValueChange={(value) => setFilter(value as MyCoursesFilter)}>
              <TabsList aria-label="Filter by progress">
                {FILTERS.map(({ value, label }) => (
                  <TabsTrigger key={value} value={value}>
                    {label}
                    <span className="ml-1.5 text-ink-faint tnum">{inFilter(value).length}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {FILTERS.map(({ value }) => (
                <TabsContent key={value} value={value}>
                  {inFilter(value).length === 0 ? (
                    <EmptyState
                      title="Nothing here yet"
                      description="Courses move here as your progress changes."
                    />
                  ) : (
                    <CourseGrid>
                      {inFilter(value).map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          to={link(PATHS.learner.course, { courseId: course.id })}
                        />
                      ))}
                    </CourseGrid>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          );
        }}
      </QueryBoundary>
    </Page>
  );
}

import { BookOpen, CheckCheck, Clock, Flame } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { StatGrid, StatTile } from '@/components/data-display';
import { EmptyState, QueryBoundary } from '@/components/feedback';
import { Page, Section } from '@/components/layout';
import { Button, Card, ProgressRing, Skeleton } from '@/components/ui';
import { useSession } from '@/core/hooks/queries/use-auth';
import { useGetLearnerDashboard } from '@/core/hooks/queries/use-dashboard';
import { ContinueCard } from '@/components/dashboard/continue-card';
import { InProgressLessons } from '@/components/dashboard/in-progress-lessons';
import { CourseProgressList } from '@/components/dashboard/course-progress-list';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { PATHS } from '@/router/paths';

/**
 * Progress: route "/learner/progress" (signed-in learners; administrators are sent to the admin overview).
 * Headline numbers, the lesson to resume, progress in every course, and recent activity.
 */
export default function ProgressPage() {
  const { isAdmin } = useSession();
  const dashboard = useGetLearnerDashboard(!isAdmin);

  if (isAdmin) return <Navigate to={PATHS.admin.overview} replace />;

  return (
    <Page title="Your progress" description="Where you stand across every course.">
      <QueryBoundary
        query={dashboard}
        loading={
          <>
            <Skeleton className="h-36 rounded-stage" />
            <StatGrid>
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-[5.5rem] rounded-card md:h-36" />
              ))}
            </StatGrid>
            <Skeleton className="h-64 rounded-card" />
          </>
        }
      >
        {({ summary, continueLearning, courses, recentActivity }) => (
          <>
            {continueLearning && (
              <>
                <ContinueCard resume={continueLearning} />
                <InProgressLessons resume={continueLearning} />
              </>
            )}

            <StatGrid>
              <StatTile label="Enrolled courses" value={summary.enrolledCourses} icon={BookOpen} />
              <StatTile
                label="In progress"
                value={summary.inProgressCourses}
                hint={`${summary.completedCourses} completed`}
                icon={Flame}
              />
              <StatTile
                label="Lessons completed"
                value={summary.completedLessons}
                icon={CheckCheck}
              />
              <StatTile label="Minutes watched" value={summary.minutesWatched} icon={Clock} />
            </StatGrid>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <Section title="Your courses">
                {courses.length === 0 ? (
                  <EmptyState
                    icon={BookOpen}
                    title="No courses yet"
                    description="Enroll in a course and your progress will show up here."
                    action={
                      <Button asChild>
                        <Link to={PATHS.learner.catalog}>Browse courses</Link>
                      </Button>
                    }
                  />
                ) : (
                  <CourseProgressList courses={courses} />
                )}
              </Section>

              <div className="flex flex-col gap-8">
                <Card className="flex items-center gap-5">
                  <ProgressRing
                    value={summary.overallProgressPercent}
                    label="Overall progress"
                    size={84}
                  />
                  <div>
                    <p className="font-display text-lg font-semibold">Overall</p>
                    <p className="text-sm text-ink-soft">Across all your courses</p>
                  </div>
                </Card>
                <Section title="Recent activity">
                  <RecentActivity items={recentActivity} />
                </Section>
              </div>
            </div>
          </>
        )}
      </QueryBoundary>
    </Page>
  );
}

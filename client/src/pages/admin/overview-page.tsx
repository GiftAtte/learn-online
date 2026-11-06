import type { ColumnDef } from '@tanstack/react-table';
import { ArrowRight, BookOpen, GraduationCap, Percent, Users } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DataTable,
  NumberCell,
  ProgressCell,
  StatGrid,
  StatTile,
  TableToolbar,
  TitleCell,
  ToolbarSelect,
} from '@/components/data-display';
import { QueryBoundary } from '@/components/feedback';
import { Page, Section, SectionCard } from '@/components/layout';
import { Button, Skeleton } from '@/components/ui';
import { EnrollmentsByCourse } from '@/components/admin/enrollments-by-course';
import { RecentEnrollments } from '@/components/admin/recent-enrollments';
import { CourseThumb } from '@/components/courses/course-thumb';
import { PublishedBadge } from '@/components/courses/published-badge';
import { useGetAdminDashboard } from '@/core/hooks/queries/use-dashboard';
import { pluralize } from '@/core/lib/format';
import type { AdminCourseRow } from '@/core/types/dashboard.types';
import { NoResultsState } from '@/components/feedback/no-results-state';
import { link, PATHS } from '@/router/paths';

/** How many of the newest courses the activity table shows. */
const LATEST_COURSES = 10;

const STATUS_OPTIONS = [
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
];

const columns: ColumnDef<AdminCourseRow>[] = [
  {
    id: 'title',
    header: 'Course',
    accessorFn: (course) => course.title,
    cell: ({ row }) => (
      <TitleCell
        leading={<CourseThumb src={row.original.thumbnailUrl} />}
        title={row.original.title}
        subtitle={row.original.category.name}
        to={link(PATHS.admin.course, { courseId: row.original.id })}
      />
    ),
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <PublishedBadge published={row.original.published} />,
  },
  {
    id: 'learners',
    header: 'Learners',
    accessorFn: (course) => course.enrollmentCount,
    sortDescFirst: true,
    cell: ({ row }) => <NumberCell value={row.original.enrollmentCount} />,
  },
  {
    id: 'progress',
    header: 'Average progress',
    accessorFn: (course) => course.averageProgressPercent,
    sortDescFirst: true,
    cell: ({ row }) => (
      <ProgressCell value={row.original.averageProgressPercent} label="Average progress" />
    ),
  },
  {
    id: 'completion',
    header: 'Completed',
    accessorFn: (course) => course.completionRate,
    sortDescFirst: true,
    cell: ({ row }) => (
      <NumberCell value={`${row.original.completedLearners} (${row.original.completionRate}%)`} />
    ),
  },
];

/**
 * Admin overview: route "/admin" (administrators only).
 * Headline numbers, enrollments per course, a data table of how each course is doing (search,
 * category and status filters, sortable columns), and the latest enrollments.
 */
export default function AdminOverviewPage() {
  const dashboard = useGetAdminDashboard();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const hasFilters = !!(search || status || categoryId);
  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setCategoryId('');
  };

  /** Applies the search box and both filters to the course rows. */
  const filterRows = (courses: AdminCourseRow[]) =>
    courses.filter(
      (course) =>
        course.title.toLowerCase().includes(search.trim().toLowerCase()) &&
        (status === '' || course.published === (status === 'published')) &&
        (categoryId === '' || course.category.id === categoryId),
    );

  return (
    <Page title="Overview" description="How courses and learners are doing.">
      <QueryBoundary
        query={dashboard}
        loading={
          <>
            <StatGrid>
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-card" />
              ))}
            </StatGrid>
            <Skeleton className="h-72 rounded-card" />
          </>
        }
      >
        {({ summary, courses, recentEnrollments }) => {
          // Courses arrive newest first; the overview only shows the latest few (search and
          // filters still look through all of them, the full list lives under Courses).
          const matches = filterRows(courses);
          const rows = matches.slice(0, LATEST_COURSES);
          // Category filter choices come from the courses themselves.
          const categoryOptions = [
            ...new Map(courses.map((c) => [c.category.id, c.category.name])),
          ].map(([value, label]) => ({ value, label }));

          return (
            <>
              <StatGrid>
                <StatTile label="Learners" value={summary.learners} icon={Users} />
                <StatTile
                  label="Courses"
                  value={summary.courses}
                  hint={`${summary.publishedCourses} published`}
                  icon={BookOpen}
                />
                <StatTile label="Enrollments" value={summary.enrollments} icon={GraduationCap} />
                <StatTile
                  label="Completion rate"
                  value={`${summary.completionRate}%`}
                  icon={Percent}
                />
              </StatGrid>

              {/* Two side-by-side summaries: where learners are, and who joined most recently */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <SectionCard title="Enrollments by course" description="Busiest courses first">
                  <EnrollmentsByCourse courses={courses} />
                </SectionCard>
                <SectionCard
                  title="Recent enrollments"
                  description="The latest sign-ups to a course"
                  flush
                >
                  <RecentEnrollments items={recentEnrollments} />
                </SectionCard>
              </div>

              <Section
                title="Course activity"
                description="Progress and completion for the latest courses"
              >
                <DataTable
                  caption="Course activity"
                  columns={columns}
                  data={rows}
                  getRowId={(row) => row.id}
                  numericColumns={['learners', 'completion']}
                  toolbar={
                    <TableToolbar
                      search={{ value: search, onChange: setSearch, label: 'Search courses' }}
                      filters={
                        <>
                          <ToolbarSelect
                            label="Filter by category"
                            value={categoryId}
                            onChange={setCategoryId}
                            allLabel="All categories"
                            options={categoryOptions}
                          />
                          <ToolbarSelect
                            label="Filter by status"
                            value={status}
                            onChange={setStatus}
                            allLabel="All statuses"
                            options={STATUS_OPTIONS}
                          />
                        </>
                      }
                      action={
                        <Button variant="secondary" size="sm" asChild>
                          <Link
                            to={PATHS.admin.courses}
                            aria-label={`View more: all ${pluralize(courses.length, 'course')}`}
                          >
                            View more
                            <ArrowRight className="size-4" aria-hidden />
                          </Link>
                        </Button>
                      }
                      onClear={hasFilters ? clearFilters : undefined}
                    />
                  }
                  empty={<NoResultsState onClear={clearFilters} />}
                />
              </Section>
            </>
          );
        }}
      </QueryBoundary>
    </Page>
  );
}

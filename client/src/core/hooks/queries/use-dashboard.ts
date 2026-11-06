import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as dashboardService from '@/core/services/dashboard.service';
import type { LearnerFilters } from '@/core/types/learner.types';
import { queryKeys } from './query-keys';

/** Loads the signed-in learner’s summary. Pass `false` to skip loading, for example for guests. */
export const useGetLearnerDashboard = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.learnerDashboard,
    enabled,
    queryFn: ({ signal }) => dashboardService.getLearnerDashboard(signal),
  });

/** Loads the platform summary for administrators. */
export const useGetAdminDashboard = () =>
  useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: ({ signal }) => dashboardService.getAdminDashboard(signal),
  });

/** Loads one page of learners for the admin table. The previous page stays visible while the next one loads. */
export const useGetAllLearners = (filters: LearnerFilters) =>
  useQuery({
    queryKey: queryKeys.adminLearners(filters),
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) => dashboardService.getAllLearners(filters, signal),
  });

/** Loads one learner with lesson-by-lesson progress (administrators only). */
export const useGetLearnerById = (learnerId: string) =>
  useQuery({
    queryKey: queryKeys.adminLearner(learnerId),
    queryFn: ({ signal }) => dashboardService.getLearnerById(learnerId, signal),
  });

/** Loads one course's full activity (administrators only). */
export const useGetCourseActivity = (courseId: string) =>
  useQuery({
    queryKey: queryKeys.adminCourseActivity(courseId),
    queryFn: ({ signal }) => dashboardService.getCourseActivity(courseId, signal),
  });

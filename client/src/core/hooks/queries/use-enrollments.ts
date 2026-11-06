import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import * as enrollmentsService from '@/core/services/enrollments.service';
import { invalidateLearningData } from './invalidate';
import { queryKeys } from './query-keys';

/** Loads the courses the signed-in learner is enrolled in, with their progress. */
export const useGetAllMyCourses = () =>
  useQuery({
    queryKey: queryKeys.myCourses,
    queryFn: ({ signal }) => enrollmentsService.getAllMyCourses(signal),
  });

/** Enrolls the signed-in learner in the course. Call `mutate()`. */
export const useCreateEnrollment = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => enrollmentsService.createEnrollment(courseId),
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.course.enrolled);
    },
  });
};

/** Removes the signed-in learner from the course (progress is kept). Call `mutate()`. */
export const useDeleteEnrollment = (courseId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => enrollmentsService.deleteEnrollment(courseId),
    onSuccess: async () => {
      await invalidateLearningData(queryClient);
      notify.success(MESSAGES.course.unenrolled);
    },
  });
};

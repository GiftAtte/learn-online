import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import * as usersService from '@/core/services/users.service';
import type { Role } from '@/core/types/user.types';
import { queryKeys } from './query-keys';

/** Promote a learner to administrator, or demote an administrator. */
export const useUpdateUserRole = (userId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (role: Role) => usersService.updateUserRole(userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardAll });
      notify.success(MESSAGES.auth.roleChanged);
    },
  });
};

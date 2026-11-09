import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionStatus, SignInValues, SignUpValues } from '@/core/types/auth.types';
import type { User } from '@/core/types/user.types';
import { MESSAGES } from '@/core/lib/messages';
import { notify } from '@/core/lib/notify';
import * as authService from '@/core/services/auth.service';
import { queryKeys } from './query-keys';

/**
 * Who is signed in? The token is in an httpOnly cookie that our code cannot read, so the only way to
 * know is to ask the server (GET /auth/me). The answer is kept in the query cache under `queryKeys.me`:
 * a User when signed in, null when not. That cache entry is the one source of truth for the session.
 */
const useMeQuery = () =>
  useQuery({
    queryKey: queryKeys.me,
    queryFn: ({ signal }) => authService.getCurrentUser(signal),
    staleTime: 60_000,
  });

/** Single source of truth for "who is using the app". */
export const useSession = () => {
  const me = useMeQuery();

  const status: SessionStatus = me.isError
    ? 'error' // the check failed (network, server): not the same as being signed out
    : me.isPending
      ? 'loading'
      : me.data
        ? 'authenticated'
        : 'guest';

  return {
    status,
    user: me.data ?? null,
    isAdmin: me.data?.role === 'ADMIN',
    error: me.error,
    retry: () => void me.refetch(),
  };
};

/** After a sign-in or sign-up the server has set the cookie; remember the user and refresh other data. */
const useStartSession = () => {
  const queryClient = useQueryClient();
  return (user: User) => {
    queryClient.setQueryData(queryKeys.me, user);
    // Data cached while signed out (such as the catalog) is now out of date.
    void queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] !== queryKeys.me[0] });
  };
};

export const useSignIn = () => {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (values: SignInValues) => authService.signIn(values),
    meta: { handlesOwnError: true },
    onSuccess: (user) => {
      startSession(user);
      notify.success(MESSAGES.auth.signedIn);
    },
  });
};

export const useSignUp = () => {
  const startSession = useStartSession();
  return useMutation({
    mutationFn: (values: SignUpValues) => authService.signUp(values),
    meta: { handlesOwnError: true },
    onSuccess: (user) => {
      startSession(user);
      notify.success(MESSAGES.auth.registered);
    },
  });
};

export const useSignOut = () => {
  const queryClient = useQueryClient();
  return async () => {
    // The server revokes the tokens and removes the cookie. If that call fails the person is
    // still signed out in the app, and the token stops working on its own when it expires.
    await authService.signOut().catch(() => undefined);
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== queryKeys.me[0] }); // never show one person's data to the next
    queryClient.setQueryData(queryKeys.me, null);
    notify.info(MESSAGES.auth.signedOut);
  };
};

/** Changes your own name and updates it everywhere it is shown. Form errors are left for the form to show. */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.updateProfile,
    meta: { handlesOwnError: true },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.me, user);
      notify.success(MESSAGES.auth.profileUpdated);
    },
  });
};

/** Changes your own password. Wrong-password errors are left for the form to show. */
export const useChangePassword = () =>
  useMutation({
    mutationFn: authService.changePassword,
    meta: { handlesOwnError: true },
    onSuccess: () => notify.success(MESSAGES.auth.passwordChanged),
  });

export const useForgotPassword = () =>
  useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
    meta: { handlesOwnError: true },
  });

export const useResetPassword = () =>
  useMutation({
    mutationFn: (values: { token: string; password: string }) => authService.resetPassword(values),
    meta: { handlesOwnError: true },
  });

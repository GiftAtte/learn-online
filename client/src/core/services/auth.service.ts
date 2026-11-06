/**
 * Auth service: the API calls for creating and ending a session.
 * Plain async functions, no React. The hooks in `hooks/queries/use-auth.ts` wrap them.
 */
import { api } from '@/core/api/client';
import { ApiError } from '@/core/api/error';
import type { SignInValues, SignUpValues } from '@/core/types/auth.types';
import type { User } from '@/core/types/user.types';

/**
 * Signs in with email and password.
 * POST /auth/login. Public.
 * The server answers with the user and sets the httpOnly session cookie.
 * @returns the signed-in user
 * @throws ApiError 401 when the email or password is wrong
 */
export const signIn = async (values: SignInValues) =>
  (await api.post<{ user: User }>('/auth/login', values)).data.user;

/**
 * Creates a learner account and signs it in. Public sign-up never creates administrators.
 * POST /auth/register. Public.
 * @returns the new user, who is signed in through the session cookie
 * @throws ApiError 409 when the email is already registered, 400 when the input is invalid
 */
export const signUp = async (values: SignUpValues) =>
  (await api.post<{ user: User }>('/auth/register', values)).data.user;

/**
 * Asks the server who is signed in, using the session cookie the browser sends.
 * GET /auth/me.
 * @returns the user, or null when nobody is signed in (no cookie, or it expired or was revoked)
 */
export const getCurrentUser = async (signal?: AbortSignal) => {
  try {
    return (await api.get<User>('/auth/me', { signal })).data;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
};

/**
 * Signs out everywhere: every token issued so far stops working and the server removes the cookie.
 * POST /auth/logout. Needs to be signed in.
 */
export const signOut = () => api.post('/auth/logout');

/**
 * Changes your own name.
 * PATCH /auth/me. Needs to be signed in.
 * @returns the updated user
 */
export const updateProfile = async (values: { name: string }) =>
  (await api.patch<User>('/auth/me', values)).data;

/**
 * Changes your own password. Every other signed-in device is signed out; this one stays signed in.
 * POST /auth/change-password. Needs to be signed in.
 * @throws ApiError 400 (on `currentPassword`) when the current password is wrong
 */
export const changePassword = (values: { currentPassword: string; newPassword: string }) =>
  api.post('/auth/change-password', values);

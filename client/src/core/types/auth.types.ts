/** Signing in, signing up and the state of the current session. */
import type { z } from 'zod';
import type { signInSchema, signUpSchema } from '@/core/schemas/auth.schemas';

/** What the sign-in form submits (derived from its validation rules). */
export type SignInValues = z.infer<typeof signInSchema>;

/** What the sign-up form submits (derived from its validation rules). */
export type SignUpValues = z.infer<typeof signUpSchema>;

/**
 * The state of the current session:
 *  - loading: asking the server who is signed in
 *  - authenticated: signed in
 *  - guest: nobody is signed in
 *  - error: the check failed for another reason (network, server); the person is NOT treated as
 *    signed out, they get a "Try again" instead
 */
export type SessionStatus = 'loading' | 'authenticated' | 'guest' | 'error';

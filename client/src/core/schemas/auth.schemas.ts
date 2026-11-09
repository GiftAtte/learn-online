import { z } from 'zod';

/** Mirrors the API's rules so people get feedback before the request is sent. */
export const signInSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name (at least 2 characters)').max(80),
  email: z.email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(72, 'Use at most 72 characters')
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
});

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Enter your name (at least 2 characters)')
    .max(80, 'Use 80 characters or fewer'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: signUpSchema.shape.password,
    confirmPassword: z.string().min(1, 'Type the new password again'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The two passwords don’t match',
  });

export const forgotPasswordSchema = z.object({
  email: z.email('Enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: signUpSchema.shape.password,
    confirmPassword: z.string().min(1, 'Type the new password again'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'The two passwords don’t match',
  });

import { Router } from 'express';
import { env } from '../../config/env';
import { authenticate } from '../../middleware/authenticate';
import { createLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import * as controller from './auth.controller';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './auth.schemas';

// Sign-up: stricter than the global limit, to slow down mass sign-ups.
const signUpLimiter = createLimiter(env.AUTH_RATE_LIMIT);

// Password guessing: only FAILED attempts count. After AUTH_MAX_FAILED_ATTEMPTS wrong tries the address
// is blocked for AUTH_LOCKOUT_MINUTES, then the count starts again. Signing in correctly never uses it up.
const passwordGuessLimiter = createLimiter(env.AUTH_MAX_FAILED_ATTEMPTS, env.AUTH_LOCKOUT_MINUTES * 60_000, {
  failuresOnly: true,
  message: 'Too many failed attempts.',
});

export const authRouter = Router();
authRouter.post('/register', signUpLimiter, validate({ body: registerSchema }), controller.register);
authRouter.post('/login', passwordGuessLimiter, validate({ body: loginSchema }), controller.login);
authRouter.post('/refresh', controller.refresh);
// Password reset by emailed link: limited like sign-up, so it cannot be used to flood someone's inbox.
authRouter.post(
  '/forgot-password',
  signUpLimiter,
  validate({ body: forgotPasswordSchema }),
  controller.forgotPassword,
);
authRouter.post(
  '/reset-password',
  passwordGuessLimiter,
  validate({ body: resetPasswordSchema }),
  controller.resetPassword,
);
authRouter.get('/me', authenticate, controller.me);
authRouter.post('/logout', authenticate, controller.logout);
authRouter.patch('/me', authenticate, validate({ body: updateProfileSchema }), controller.updateProfile);
authRouter.post(
  '/change-password',
  authenticate,
  passwordGuessLimiter, // guessing the current password of a stolen session is still guessing
  validate({ body: changePasswordSchema }),
  controller.changePassword,
);

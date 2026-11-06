import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { createLimiter } from '../../middleware/rateLimit';
import { validate } from '../../middleware/validate';
import * as controller from './auth.controller';
import { loginSchema, registerSchema } from './auth.schemas';

// Stricter than the global limit: slows down password guessing and mass sign-ups.
const authLimiter = createLimiter(20);

export const authRouter = Router();
authRouter.post('/register', authLimiter, validate({ body: registerSchema }), controller.register);
authRouter.post('/login', authLimiter, validate({ body: loginSchema }), controller.login);
authRouter.get('/me', authenticate, controller.me);
authRouter.post('/logout', authenticate, controller.logout);

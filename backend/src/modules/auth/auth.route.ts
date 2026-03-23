import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middlewares/validate';
import { authenticate } from '../../middlewares/auth';
import { authRateLimiter } from '../../middlewares/rateLimiter';
import { registerSchema, loginSchema, refreshTokenSchema } from './auth.validation';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/profile', authenticate, authController.getProfile);

export { router as authRoutes };
